/**
 * `properui add <component...>` and `properui add example <name>`.
 *
 * Resolves each component plus its `registryDependencies` (and, by default,
 * `optionalRegistryDependencies` — skip with `--no-optional`) recursively, copies the files to
 * the targets from components.json, rewrites `@/` imports to the project alias, records what
 * was installed in components.json's `installed` manifest (2.10), installs missing npm
 * dependencies and prints what changed. A second run without `--overwrite` reports no changes.
 *
 * Platform-aware: on a project whose components.json says `"platform": "html"`, `add <name>`
 * installs the `<name>-html` snippet entry instead and refuses a React-only entry with a
 * one-line message naming the html alternative (see `resolveForPlatform` in ../platform.ts).
 *
 * Output order matters (2.6): files, then the dependency/install block, always last. When
 * dependencies are unsatisfied and neither `--yes` nor a TTY is available, the command exits
 * non-zero with `Install to finish: <cmd>` as its final line instead of silently skipping.
 *
 * Spec: docs/cli.md
 */
import path from "node:path";
import { type ComponentsConfig, aliasBaseDir, aliasPrefixOf, configPath, configPlatform, readConfig, writeConfig } from "../config.js";
import { installCommand, installDependencies, missingDependencies } from "../deps.js";
import { detectPackageManager } from "../detect.js";
import { type WriteResult, prepareFile, writeSourceFile } from "../files.js";
import { nearestNames } from "../fuzzy.js";
import { isHtmlEntry, resolveForPlatform } from "../platform.js";
import { canPrompt, confirm } from "../prompt.js";
import { Registry, type RegistryEntry, RegistryError, type RegistryFile, entryVersion, resolveRegistrySource } from "../registry.js";
import { kleur, log, spinner } from "../ui.js";

export interface AddOptions {
    all?: boolean;
    overwrite?: boolean;
    path?: string;
    dryRun?: boolean;
    yes?: boolean;
    registry?: string;
    cwd?: string;
    /** `--no-optional` sets this to `false` via commander's negation; absent/true installs optionalRegistryDependencies. */
    optional?: boolean;
    /** `--with-demos` also writes files marked `kind: "demo"`. */
    withDemos?: boolean;
}

const STATUS_ORDER: WriteResult["status"][] = ["created", "updated", "skipped", "unchanged"];

const statusLabel = (status: WriteResult["status"]): string => {
    if (status === "created") return kleur.green("added ");
    if (status === "updated") return kleur.yellow("update");
    if (status === "skipped") return kleur.dim("skip  ");
    return kleur.dim("same  ");
};

/** Files an entry actually contributes for this run: demo files are opt-in via `--with-demos`. */
function filesForEntry(entry: RegistryEntry, withDemos: boolean): RegistryFile[] {
    return entry.files.filter((file) => withDemos || file.kind !== "demo");
}

export async function runAdd(names: string[], options: AddOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const config = readConfig(cwd);
    if (!config) {
        log.error(`No ${path.relative(cwd, configPath(cwd)) || "components.json"} found. Run \`properui init\` first.`);
        process.exitCode = 1;
        return;
    }

    // `add example <name>` — the example entry already lists the components it uses as
    // registryDependencies, so resolution is identical from here on.
    const exampleMode = names[0] === "example";
    const requested = exampleMode ? names.slice(1) : names;

    const registry = new Registry(resolveRegistrySource(options.registry, config.registry));

    if (!options.all && requested.length === 0) {
        log.error(exampleMode ? "Which example? e.g. `properui add example settings-01`" : "Nothing to add. Pass component names or --all.");
        process.exitCode = 1;
        return;
    }

    const platform = configPlatform(config);

    let targets: string[];
    try {
        const index = await registry.index();
        if (options.all) {
            targets = index
                .filter((entry) => (platform === "html" ? isHtmlEntry(entry) && entry.fileCount > 0 : entry.type === "component"))
                .map((entry) => entry.name);
        } else {
            const known = new Set(index.map((entry) => entry.name));
            const unknown: string[] = [];
            const refused: string[] = [];
            targets = [];
            for (const name of requested) {
                const resolution = resolveForPlatform(name, index, platform);
                if (resolution.ok) {
                    targets.push(resolution.name);
                    if (resolution.resolvedFrom) log.info(`${resolution.resolvedFrom} -> ${resolution.name} (components.json platform is "html")`);
                } else if (resolution.reason === "unknown") unknown.push(name);
                else refused.push(resolution.message);
            }
            if (unknown.length > 0 || refused.length > 0) {
                for (const name of unknown) {
                    const hints = nearestNames([...known], name);
                    log.error(`Unknown component "${name}".${hints.length > 0 ? ` Did you mean: ${hints.join(", ")}?` : ""}`);
                }
                for (const message of refused) log.error(message);
                process.exitCode = 1;
                return;
            }
            if (exampleMode) {
                const notExamples = requested.filter((name) => index.find((entry) => entry.name === name)?.type !== "example");
                for (const name of notExamples) log.warn(`"${name}" is not a page example. Adding it as a component.`);
            }
        }
    } catch (error) {
        log.error(error instanceof RegistryError ? error.message : (error as Error).message);
        process.exitCode = 1;
        return;
    }

    const includeOptional = options.optional !== false;
    const withDemos = Boolean(options.withDemos);

    const resolveSpinner = spinner(`Resolving ${targets.length} component${targets.length === 1 ? "" : "s"} from ${registry.describe()}`);
    let entries: RegistryEntry[];
    let optional: Set<string>;
    try {
        const resolved = await registry.resolveTree(targets, includeOptional);
        entries = resolved.entries;
        optional = resolved.optional;
        resolveSpinner.succeed(`Resolved ${entries.length} registry item${entries.length === 1 ? "" : "s"} (including dependencies).`);
    } catch (error) {
        resolveSpinner.fail(error instanceof RegistryError ? error.message : (error as Error).message);
        process.exitCode = 1;
        return;
    }

    const aliasBase = aliasBaseDir(cwd, config);
    const resolveOptions = { cwd, aliasBase, pathOverride: options.path };
    const writeOptions = { cwd, overwrite: Boolean(options.overwrite), dryRun: Boolean(options.dryRun) };

    let demoFilesAvailable = false;
    const results: { entry: RegistryEntry; writes: WriteResult[] }[] = [];
    for (const entry of entries) {
        if (entry.files.some((file) => file.kind === "demo")) demoFilesAvailable = true;
        const writes = filesForEntry(entry, withDemos).map((file) => {
            const { target, content } = prepareFile(file, config, resolveOptions);
            return writeSourceFile(target, content, writeOptions);
        });
        results.push({ entry, writes });
    }

    if (withDemos && !demoFilesAvailable) {
        log.warn("Demo files are not available from this registry yet.");
    }

    reportWrites(results, config, optional, options);

    // Records what landed on disk so `diff`, `info`, `remove` and `why` don't have to re-derive
    // it by scanning the filesystem. Skipped in --dry-run since nothing was actually written.
    if (!options.dryRun) {
        const installedAt = new Date().toISOString();
        const installed = { ...(config.installed ?? {}) };
        for (const { entry, writes } of results) {
            installed[entry.name] = {
                version: entryVersion(entry),
                files: writes.map((write) => path.relative(cwd, write.file).split(path.sep).join("/")),
                installedAt,
            };
        }
        const updatedConfig: ComponentsConfig = { ...config, installed };
        writeConfig(cwd, updatedConfig);
    }

    const npmDependencies = missingDependencies(
        cwd,
        entries.flatMap((entry) => [...entry.dependencies, ...filesForEntry(entry, withDemos).flatMap((file) => file.dependencies ?? [])]),
    );
    if (npmDependencies.length === 0) return;

    const manager = detectPackageManager(cwd);
    log.plain();
    log.title("Dependencies");
    for (const dependency of npmDependencies) {
        const attribution = filesNeeding(dependency, entries, withDemos);
        log.step(`${kleur.cyan("need  ")} ${dependency}${attribution.length > 0 ? kleur.dim(` (${attribution.join(", ")})`) : ""}`);
    }

    if (options.dryRun) {
        log.info(`Dry run: would run: ${kleur.bold(installCommand(manager, npmDependencies))}`);
        return;
    }

    if (options.yes) {
        const { ok, command } = installDependencies(cwd, manager, npmDependencies);
        if (ok) log.success(`Installed with \`${command}\`.`);
        else {
            log.error(`\`${command}\` failed. Install the packages above manually.`);
            process.exitCode = 1;
        }
        return;
    }

    if (!canPrompt()) {
        // No one to ask and no --yes: fail loudly instead of the old silent "Skipped install"
        // (2.6) — this line must stay the last thing `add` prints.
        log.plain();
        log.plain(`Install to finish: ${kleur.bold(installCommand(manager, npmDependencies))}`);
        process.exitCode = 1;
        return;
    }

    const shouldInstall = await confirm(`Install ${npmDependencies.length} missing package${npmDependencies.length === 1 ? "" : "s"} with ${manager}?`, {
        yes: options.yes,
        fallback: false,
    });
    if (shouldInstall) {
        const { ok, command } = installDependencies(cwd, manager, npmDependencies);
        if (ok) log.success(`Installed with \`${command}\`.`);
        else log.error(`\`${command}\` failed. Install the packages above manually.`);
    } else {
        log.info(`Skipped install. Run: ${kleur.bold(installCommand(manager, npmDependencies))}`);
    }
}

/** Which of the resolved entries' files declare `dependency`, for the `need x (file.tsx)` line. */
function filesNeeding(dependency: string, entries: RegistryEntry[], withDemos: boolean): string[] {
    const files = new Set<string>();
    for (const entry of entries) {
        for (const file of filesForEntry(entry, withDemos)) {
            if (file.dependencies?.includes(dependency)) files.add(path.basename(file.target));
        }
    }
    return [...files];
}

function reportWrites(results: { entry: RegistryEntry; writes: WriteResult[] }[], config: ComponentsConfig, optional: Set<string>, options: AddOptions): void {
    const all = results.flatMap((result) => result.writes);
    const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, all.filter((write) => write.status === status).length])) as Record<
        WriteResult["status"],
        number
    >;

    log.plain();
    log.title(options.dryRun ? "Files (dry run: nothing was written)" : "Files");
    for (const { entry, writes } of results) {
        const changed = writes.some((write) => write.status === "created" || write.status === "updated");
        const label = changed ? kleur.bold(entry.name) : kleur.dim(entry.name);
        const optionalTag = optional.has(entry.name) ? kleur.dim(" (optional)") : "";
        log.plain(`  ${label}${optionalTag}`);
        for (const write of writes) log.plain(`    ${statusLabel(write.status)} ${write.relative}`);
    }

    const aliasPrefix = aliasPrefixOf(config.aliases.components);
    log.plain();
    if (aliasPrefix !== "@/" && results.some(({ entry }) => !isHtmlEntry(entry))) log.info(`Rewrote \`@/\` imports to \`${aliasPrefix}\`.`);
    if (options.path) log.info(`Component files were placed under \`${options.path}\`. Check the imports if that folder is outside your alias.`);
    if (results.some(({ entry }) => isHtmlEntry(entry))) {
        log.info("HTML snippets are copy-paste markup: move them into your templates. Their classes come from @properui/html (see `properui init`).");
    }

    if (counts.created + counts.updated === 0) {
        log.success(
            counts.skipped > 0
                ? `No changes: ${counts.skipped} file${counts.skipped === 1 ? "" : "s"} already exist. Pass --overwrite to replace them.`
                : "No changes: everything is already up to date.",
        );
        return;
    }

    const parts = [`${counts.created} added`, `${counts.updated} updated`, `${counts.skipped} skipped`, `${counts.unchanged} unchanged`];
    log.success(options.dryRun ? `Would apply: ${parts.join(", ")}.` : parts.join(", ") + ".");
}
