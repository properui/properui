/**
 * What each MCP tool actually does, as plain async functions that return JSON-able values.
 * `server.ts` only wires these to tool names and schemas, which keeps them testable without a
 * transport and keeps every write on the same code path as `properui add`.
 *
 * Nothing in here may write to stdout: on the stdio transport stdout is the protocol channel.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
    type Finding,
    type ProjectSnapshot,
    type RegistryEntry,
    RegistryError,
    type RegistryFile,
    type RegistryIndexEntry,
    type WriteResult,
    aliasBaseDir,
    collectSnapshot,
    configPath,
    configPlatform,
    detectPackageManager,
    entryPlatforms,
    entryVersion,
    installCommand,
    installSpec,
    isHtmlEntry,
    matchesPlatform,
    missingDependencies,
    nearestNames,
    prepareFile,
    readConfig,
    resolveForPlatform,
    scanForViolations,
    scoreEntry,
    writeConfig,
    writeSourceFile,
} from "./cli.js";
import type { ServerContext } from "./context.js";

/** An expected failure the tool reports as `isError` with this message, not a crash. */
export class ToolError extends Error {}

/** Same cut-off `properui search` uses: below it, a hit is more likely noise than an answer. */
const SEARCH_THRESHOLD = 0.32;

/** Compact row returned by `list_components` and `search_components`. */
export interface ComponentSummary {
    name: string;
    layer: string;
    type: string;
    title: string;
    description: string;
    /** Where it runs: `["react","next"]` for TSX entries, `["html","vue","angular","svelte","astro","vanilla"]` for html entries. */
    platforms: string[];
}

const summarize = (entry: RegistryIndexEntry): ComponentSummary => ({
    name: entry.name,
    layer: entry.layer,
    type: entry.type,
    title: entry.title,
    description: entry.description,
    platforms: entryPlatforms(entry),
});

/** Did-you-mean hint for a name that is not in the index. */
function unknownName(name: string, index: RegistryIndexEntry[]): ToolError {
    const hints = nearestNames(
        index.map((entry) => entry.name),
        name,
    );
    return new ToolError(
        `Unknown component "${name}".${hints.length > 0 ? ` Did you mean: ${hints.join(", ")}?` : ""} Call search_components to find the right name.`,
    );
}

// ---------------------------------------------------------------------------- list

export interface ListInput {
    layer?: string;
    type?: string;
    /** Only entries that run on this platform: react, next, html, vue, angular, svelte, astro, vanilla. */
    platform?: string;
    limit?: number;
    offset?: number;
    cwd?: string;
}

export async function listComponents(ctx: ServerContext, input: ListInput) {
    const registry = ctx.registry(input.cwd);
    let entries = await registry.index();
    if (input.layer) entries = entries.filter((entry) => entry.layer === input.layer);
    if (input.type) entries = entries.filter((entry) => entry.type === input.type);
    if (input.platform) entries = entries.filter((entry) => matchesPlatform(entry, input.platform));
    // A 0-file entry is a docs-only stub: there is nothing add_component could install for it.
    entries = entries.filter((entry) => entry.fileCount > 0);

    const offset = Math.max(0, input.offset ?? 0);
    const limit = Math.max(1, input.limit ?? 100);
    const page = entries.slice(offset, offset + limit);
    return {
        registry: registry.describe(),
        total: entries.length,
        offset,
        returned: page.length,
        ...(offset + page.length < entries.length ? { nextOffset: offset + page.length } : {}),
        components: page.map(summarize),
    };
}

// ---------------------------------------------------------------------------- search

export interface SearchInput {
    query: string;
    limit?: number;
    type?: string;
    /** Only entries that run on this platform: react, next, html, vue, angular, svelte, astro, vanilla. */
    platform?: string;
    cwd?: string;
}

export async function searchComponents(ctx: ServerContext, input: SearchInput) {
    const registry = ctx.registry(input.cwd);
    const index = await registry.index();
    const exportsIndex = await registry.exportsIndex();
    const limit = Math.max(1, input.limit ?? 10);

    const matches = index
        .filter((entry) => entry.fileCount > 0 && (!input.type || entry.type === input.type) && matchesPlatform(entry, input.platform))
        .map((entry) => scoreEntry(entry, input.query, exportsIndex?.[entry.name]))
        .filter((match) => match.score >= SEARCH_THRESHOLD)
        .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
        .slice(0, limit);

    return {
        registry: registry.describe(),
        query: input.query,
        matches: matches.map(({ entry, score, matchedExport }) => ({
            ...summarize(entry),
            score: Math.round(score * 1000) / 1000,
            ...(matchedExport ? { matchedExport: matchedExport.name } : {}),
        })),
        ...(matches.length === 0
            ? {
                  note: `No match for "${input.query}". Fuzzy search can miss a component filed under a different word: try a synonym, or list_components with a layer filter, before writing markup by hand.`,
              }
            : {}),
    };
}

// ---------------------------------------------------------------------------- get

export interface GetInput {
    name: string;
    /** Include `kind: "demo"` files (fixtures and demo content). Defaults to false. */
    includeDemoFiles?: boolean;
    cwd?: string;
}

export async function getComponent(ctx: ServerContext, input: GetInput) {
    const registry = ctx.registry(input.cwd);
    const index = await registry.index();
    if (!index.some((entry) => entry.name === input.name)) throw unknownName(input.name, index);

    const entry = await registry.item(input.name);
    const files = entry.files.filter((file) => input.includeDemoFiles || file.kind !== "demo");
    const omitted = entry.files.length - files.length;
    return {
        ...entry,
        files,
        ...(omitted > 0 ? { omittedDemoFiles: omitted } : {}),
        docsUrl: entry.docs ? `${ctx.siteUrl(registry)}${entry.docs}` : null,
        platforms: entryPlatforms(entry),
        install: `npx @properui/cli@latest add ${entry.type === "example" ? `example ${entry.name}` : entry.name}`,
    };
}

// ---------------------------------------------------------------------------- docs

export interface DocsInput {
    name: string;
    cwd?: string;
}

/** `apps/docs/content` of the checkout a local registry directory lives in, if there is one. */
function findDocsContent(from: string): string | null {
    let dir = from;
    for (let depth = 0; depth < 6; depth += 1) {
        const candidate = path.join(dir, "apps", "docs", "content");
        if (existsSync(candidate) && statSync(candidate).isDirectory()) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

/** `/marketing/pricing/pricing-01` → the route itself, then each shorter parent route. */
function routeCandidates(route: string): string[] {
    const segments = route.split("/").filter(Boolean);
    const candidates: string[] = [];
    for (let length = segments.length; length >= 2; length -= 1) candidates.push(segments.slice(0, length).join("/"));
    return candidates;
}

export async function getComponentDocs(ctx: ServerContext, input: DocsInput) {
    const registry = ctx.registry(input.cwd);
    const index = await registry.index();
    const meta = index.find((entry) => entry.name === input.name);
    if (!meta) throw unknownName(input.name, index);

    const route = meta.docs ?? (await registry.item(input.name)).docs;
    if (!route) {
        throw new ToolError(`"${input.name}" has no docs page. Call get_component for its source, props and examples.`);
    }

    const site = ctx.siteUrl(registry);
    const url = `${site}${route}`;

    if (!registry.remote) {
        const content = findDocsContent(registry.source);
        if (!content) {
            throw new ToolError(`The registry is a local directory with no apps/docs/content above it. The published page is ${url} (markdown: ${url}.md).`);
        }
        for (const candidate of routeCandidates(route)) {
            const file = path.join(content, `${candidate}.mdx`);
            if (existsSync(file)) {
                return {
                    name: input.name,
                    url,
                    source: path.relative(path.resolve(content, "..", "..", ".."), file),
                    format: "mdx",
                    markdown: readFileSync(file, "utf8"),
                };
            }
        }
        throw new ToolError(`No MDX page for ${route} under ${content}. The published page is ${url}.`);
    }

    const errors: string[] = [];
    for (const candidate of routeCandidates(route)) {
        const markdownUrl = `${site}/${candidate}.md`;
        try {
            const response = await fetch(markdownUrl);
            if (response.ok) return { name: input.name, url: `${site}/${candidate}`, source: markdownUrl, format: "markdown", markdown: await response.text() };
            errors.push(`${markdownUrl} responded ${response.status}`);
        } catch (error) {
            errors.push(`${markdownUrl}: ${(error as Error).message}`);
        }
    }
    throw new ToolError(
        `Could not fetch the docs for "${input.name}" (${errors.join("; ")}). The page is ${url}; https://properui.dev/llms.txt indexes every page.`,
    );
}

// ---------------------------------------------------------------------------- add

export interface AddInput {
    names: string[];
    cwd?: string;
    overwrite?: boolean;
    dryRun?: boolean;
    /** False skips `optionalRegistryDependencies`, like `--no-optional`. */
    optional?: boolean;
    withDemos?: boolean;
    /** Like `--path`: where `components/**` files land, relative to cwd. */
    path?: string;
    /** Run the package manager for missing npm packages instead of only returning the command. */
    install?: boolean;
}

function filesForEntry(entry: RegistryEntry, withDemos: boolean): RegistryFile[] {
    return entry.files.filter((file) => withDemos || file.kind !== "demo");
}

/**
 * `properui add`, minus the terminal: same resolution (`registryDependencies`, optional ones by
 * default, and on an html-platform project `<name>` -> `<name>-html` with React-only entries
 * refused), same target paths and `@/` rewriting, same skip-unless-overwrite rule, same
 * `installed` manifest in components.json. Returns what happened instead of printing it.
 */
export async function addComponents(ctx: ServerContext, input: AddInput) {
    const cwd = ctx.cwd(input.cwd);
    const config = readConfig(cwd);
    if (!config) {
        throw new ToolError(
            `No components.json in ${cwd}. Run \`npx @properui/cli@latest init -y\` in that directory first; it writes components.json, the theme tokens, the cx util and the ThemeProvider for the detected framework.`,
        );
    }

    const exampleMode = input.names[0] === "example";
    const requested = exampleMode ? input.names.slice(1) : input.names;
    if (requested.length === 0) throw new ToolError("Nothing to add. Pass one or more registry names.");

    const registry = ctx.registry(cwd);
    const index = await registry.index();
    const platform = configPlatform(config);
    const targets: string[] = [];
    const problems: string[] = [];
    const resolvedFrom: Record<string, string> = {};
    for (const name of requested) {
        const resolution = resolveForPlatform(name, index, platform);
        if (resolution.ok) {
            targets.push(resolution.name);
            if (resolution.resolvedFrom) resolvedFrom[resolution.resolvedFrom] = resolution.name;
        } else problems.push(resolution.reason === "unknown" ? unknownName(name, index).message : resolution.message);
    }
    if (problems.length > 0) throw new ToolError(problems.join("\n"));

    const withDemos = Boolean(input.withDemos);
    const { entries, optional } = await registry.resolveTree(targets, input.optional !== false);

    const resolveOptions = { cwd, aliasBase: aliasBaseDir(cwd, config), pathOverride: input.path };
    const writeOptions = { cwd, overwrite: Boolean(input.overwrite), dryRun: Boolean(input.dryRun) };

    const results: { entry: RegistryEntry; writes: WriteResult[] }[] = entries.map((entry) => ({
        entry,
        writes: filesForEntry(entry, withDemos).map((file) => {
            const { target, content } = prepareFile(file, config, resolveOptions);
            return writeSourceFile(target, content, writeOptions);
        }),
    }));

    const toPosix = (file: string) => path.relative(cwd, file).split(path.sep).join("/");

    if (!input.dryRun) {
        const installedAt = new Date().toISOString();
        const installed = { ...(config.installed ?? {}) };
        for (const { entry, writes } of results) {
            installed[entry.name] = { version: entryVersion(entry), files: writes.map((write) => toPosix(write.file)), installedAt };
        }
        writeConfig(cwd, { ...config, installed });
    }

    const all = results.flatMap((result) => result.writes);
    const count = (status: WriteResult["status"]) => all.filter((write) => write.status === status).length;

    const dependencies = missingDependencies(
        cwd,
        entries.flatMap((entry) => [...entry.dependencies, ...filesForEntry(entry, withDemos).flatMap((file) => file.dependencies ?? [])]),
    );
    const manager = detectPackageManager(cwd);
    const command = dependencies.length > 0 ? installCommand(manager, dependencies) : null;

    let installResult: { ok: boolean; output: string } | null = null;
    if (command && input.install && !input.dryRun) {
        const verb = manager === "npm" ? "install" : "add";
        const child = spawnSync(manager, [verb, ...dependencies.map(installSpec)], {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            shell: process.platform === "win32",
        });
        const output = `${child.stdout ?? ""}${child.stderr ?? ""}`.trim();
        installResult = { ok: child.status === 0, output: output.length > 4000 ? `…${output.slice(-4000)}` : output };
    }

    const changed = count("created") + count("updated");
    const summary = [
        input.dryRun ? "Dry run: nothing was written." : null,
        changed === 0
            ? count("skipped") > 0
                ? `No changes: ${count("skipped")} file(s) already exist. Pass overwrite: true to replace them (check with the CLI's \`diff\` first if a human may have edited them).`
                : "No changes: everything is already up to date."
            : `${count("created")} added, ${count("updated")} updated, ${count("skipped")} skipped, ${count("unchanged")} unchanged.`,
        command
            ? installResult
                ? installResult.ok
                    ? `Installed missing packages with \`${command}\`.`
                    : `\`${command}\` failed; see installOutput.`
                : `Install to finish: ${command}`
            : "No npm packages missing.",
    ]
        .filter(Boolean)
        .join(" ");

    return {
        cwd,
        registry: registry.describe(),
        config: path.relative(cwd, configPath(cwd)) || "components.json",
        platform,
        ...(Object.keys(resolvedFrom).length > 0 ? { resolvedFrom } : {}),
        dryRun: Boolean(input.dryRun),
        summary,
        entries: results.map(({ entry, writes }) => ({
            name: entry.name,
            ...(isHtmlEntry(entry) ? { html: true } : {}),
            optional: optional.has(entry.name),
            files: writes.map((write) => ({ path: toPosix(write.file), status: write.status })),
        })),
        filesWritten: all.filter((write) => write.status === "created" || write.status === "updated").map((write) => toPosix(write.file)),
        missingDependencies: dependencies,
        installCommand: command,
        ...(installResult ? { installed: installResult.ok, installOutput: installResult.output } : {}),
    };
}

// ---------------------------------------------------------------------------- info

export async function projectInfo(ctx: ServerContext, input: { cwd?: string }): Promise<ProjectSnapshot> {
    return collectSnapshot({ cwd: ctx.cwd(input.cwd), registry: ctx.override });
}

// ---------------------------------------------------------------------------- check

export interface CheckInput {
    /** File or directory to scan, relative to cwd. Defaults to the whole project. */
    path?: string;
    cwd?: string;
}

export async function checkTokens(ctx: ServerContext, input: CheckInput) {
    const cwd = ctx.cwd(input.cwd);
    const target = path.resolve(cwd, input.path ?? ".");
    if (!existsSync(target)) throw new ToolError(`${target} does not exist.`);
    const findings: Finding[] = scanForViolations(target, cwd);
    return {
        scanned: path.relative(cwd, target) || ".",
        ok: findings.length === 0,
        count: findings.length,
        findings,
        ...(findings.length > 0
            ? {
                  note: "These bypass the token system. Replace each with the matching semantic token (bg-primary, text-tertiary, border-secondary, …) and drop dark: variants.",
              }
            : {}),
    };
}

export { RegistryError };
