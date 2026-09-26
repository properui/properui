/**
 * Builds the component registry consumed by the CLI and the docs variant gallery.
 * Spec: docs/spec/00-foundation/09-cli-and-distribution.md
 *
 * Walks packages/ui/src/components, derives internal deps (registryDependencies)
 * and external deps (dependencies) from imports, and writes:
 *   packages/registry/dist/index.json
 *   packages/registry/dist/<name>.json
 * Fails if a component imports a package not in the allow-list.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const UI_SRC = path.join(REPO, "packages", "ui", "src");
const SRC = path.join(UI_SRC, "components");
const CONTENT = path.join(REPO, "apps", "docs", "content");
const OUT = path.join(REPO, "packages", "registry", "dist");
const SCHEMA_FILE = path.join(REPO, "packages", "registry", "schema.json");
const MANIFEST_DIR = path.join(REPO, "packages", "registry", "manifest");
const THEME_FILE = path.join(UI_SRC, "styles", "theme.css");
const CHANGELOG_FILE = path.join(REPO, "packages", "ui", "CHANGELOG.md");

/** Layers walked by the build, in the order they appear in the index. */
const LAYERS = ["base", "application", "marketing", "app-examples", "marketing-examples", "foundations", "shared-assets"] as const;
type Layer = (typeof LAYERS)[number];

/** Layers whose per-variant files each become their own `example` entry (AGENT-BRIEF §5). */
const EXAMPLE_LAYERS = new Set<string>(["marketing", "marketing-examples", "app-examples"]);

/**
 * Allowed external imports: every runtime dependency of `packages/ui`, plus the React /
 * Next peers. Read from packages/ui/package.json so the two can never drift.
 */
const uiPackageJson = JSON.parse(readFileSync(path.join(REPO, "packages", "ui", "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
};
const ALLOWED = new Set<string>([...Object.keys(uiPackageJson.dependencies ?? {}), "react", "react-dom", "next"]);

type FileType = "component" | "util" | "hook" | "style";
type EntryType = "component" | "example" | "util" | "hook" | "style";

type RegistryFile = {
    path: string;
    target: string;
    type: FileType;
    content: string;
    /** npm packages this specific file imports (type-only imports included; see `fileExternalDependencies`). */
    dependencies: string[];
    /**
     * Set on fixture/placeholder-data files (`table-data.ts`, `utils/demo-assets.ts`, the
     * `data(.<letter>)?.ts` sibling files a few page examples use) so the CLI can tell a real
     * component file from one that only exists to carry demo content (feedback 2.10).
     */
    kind?: "demo";
};

/**
 * Semantic manifest fields (AGENT-BRIEF: registry metadata) — hand-authored for the base and
 * application layers in `packages/registry/manifest/<layer>/<name>.json`, all optional so
 * existing entries stay valid. `token_contract` is never hand-authored: it is always derived
 * from the entry's own source below. `composes_with` falls back to a derived value (from
 * `registryDependencies`) for every entry that has no manifest file.
 */
type SemanticManifest = {
    intent?: string;
    avoid_when?: string[];
    composes_with?: string[];
    a11y_contract?: string[];
    responsive_contract?: string[];
    requires_data?: string[];
};

/** One `packages/ui/CHANGELOG.md` release, filtered to the bullets that mention this entry. */
type ChangelogEntry = { version: string; changes: string[] };

type RegistryEntry = SemanticManifest & {
    name: string;
    layer: string;
    type: EntryType;
    title: string;
    description: string;
    files: RegistryFile[];
    registryDependencies: string[];
    /** Decorative/demo-only crossings split out of `registryDependencies` — see `OPTIONAL_DEPS`. */
    optionalRegistryDependencies: string[];
    dependencies: string[];
    cssVars: string[];
    examples: string[];
    docs?: string;
    token_contract?: string[];
    /**
     * `packages/ui/CHANGELOG.md` releases that mention this entry (by name or by its folder),
     * newest-topmost order preserved from the file. Always present — `[]` when nothing in the
     * changelog mentions it. Populated by `withChangelog` after every entry exists, same as
     * `token_contract`/`composes_with` above, so it is optional here and guaranteed non-optional
     * by the time entries are validated and written.
     */
    changelog?: ChangelogEntry[];
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const isDir = (target: string) => existsSync(target) && statSync(target).isDirectory();

const listDir = (dir: string) => (isDir(dir) ? readdirSync(dir).sort() : []);

/** Every file under `dir`, depth-first, as absolute paths. */
const walkFiles = (dir: string): string[] =>
    listDir(dir).flatMap((name) => {
        const full = path.join(dir, name);
        return statSync(full).isDirectory() ? walkFiles(full) : [full];
    });

const isDemoOrTest = (file: string) => /\.(demo|story|stories|test|spec)\.[jt]sx?$/.test(path.basename(file));

const stripExtension = (value: string) => value.replace(/\.[jt]sx?$/, "");

/** `packages/ui/src/components/base/badges/badges.tsx` → `components/base/badges/badges.tsx`. */
const uiRelative = (absolute: string) => path.relative(UI_SRC, absolute).split(path.sep).join("/");

const fileTypeFor = (relative: string): FileType => {
    if (relative.startsWith("hooks/")) return "hook";
    if (relative.startsWith("utils/")) return "util";
    if (relative.startsWith("styles/")) return "style";
    return "component";
};

/** `PillColor` → `pill-color`, `WithCloseXBadgeColor` → `with-close-x-badge-color`. */
const kebab = (value: string) =>
    value
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();

/** `badge-groups` → `Badge groups`. Only used when no MDX page supplies a title. */
const titleize = (value: string) => {
    const words = value.split("-");
    const [first = "", ...rest] = words;
    return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
};

const unique = (values: string[]) => [...new Set(values)].sort();

// ---------------------------------------------------------------------------
// Import parsing
// ---------------------------------------------------------------------------

type ParsedImport = { source: string; typeOnly: boolean };

/**
 * Extracts every module specifier a file references. Type-only imports are flagged so they
 * can be excluded from the runtime `dependencies` list (they erase at compile time).
 */
const parseImports = (rawCode: string): ParsedImport[] => {
    const found: ParsedImport[] = [];

    // Blank out template literals before scanning. Several demos embed sample source in a
    // template literal (e.g. a code-snippet panel), and those lines are not real imports.
    // Newlines are preserved so the `^`/`\n` anchors below still behave.
    const code = rawCode.replace(/`(?:\\[\s\S]|[^`\\])*`/g, (literal) => literal.replace(/[^\n]/g, " "));

    // `import … from "x"` / `export … from "x"` — the clause never contains ; " or '.
    const fromRe = /(?:^|[\n;}])[ \t]*(?:import|export)\s+([^;"']*?)\s*from\s*["']([^"']+)["']/g;
    for (let match = fromRe.exec(code); match; match = fromRe.exec(code)) {
        const clause = (match[1] ?? "").trim();
        const source = match[2];
        if (source) found.push({ source, typeOnly: clause === "type" || clause.startsWith("type ") || clause.startsWith("type{") });
    }

    // Side-effect imports: `import "./x.css"`.
    const bareRe = /(?:^|[\n;])[ \t]*import\s*["']([^"']+)["']/g;
    for (let match = bareRe.exec(code); match; match = bareRe.exec(code)) {
        if (match[1]) found.push({ source: match[1], typeOnly: false });
    }

    // Dynamic imports.
    const dynamicRe = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
    for (let match = dynamicRe.exec(code); match; match = dynamicRe.exec(code)) {
        if (match[1]) found.push({ source: match[1], typeOnly: false });
    }

    return found;
};

/** `motion/react` → `motion`, `@react-aria/utils/x` → `@react-aria/utils`. */
const packageRootOf = (specifier: string) => {
    const segments = specifier.split("/");
    return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : (segments[0] ?? specifier);
};

/**
 * Resolves an internal specifier (`@/…` or `./…`) to a file inside packages/ui/src.
 * Returns undefined when nothing on disk matches, which the caller reports as a warning.
 */
const resolveInternal = (specifier: string, fromFile: string): string | undefined => {
    const base = specifier.startsWith("@/") ? path.join(UI_SRC, specifier.slice(2)) : path.resolve(path.dirname(fromFile), specifier);

    const candidates = [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")];
    return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
};

/**
 * The registry entry a resolved file belongs to: the group folder (or single file) under
 * `components/<layer>/`, or the file basename for `utils/` and `hooks/`.
 */
const entryNameForFile = (absolute: string): string | undefined => {
    const relative = uiRelative(absolute);
    const segments = relative.split("/");
    if (segments[0] === "components") return segments[2] ? stripExtension(segments[2]) : undefined;
    if (segments[0] === "utils" || segments[0] === "hooks") return segments[1] ? stripExtension(segments[1]) : undefined;
    return undefined;
};

// ---------------------------------------------------------------------------
// Docs front-matter
// ---------------------------------------------------------------------------

type DocsPage = { title: string; description: string; docs: string };

/** MDX front-matter keyed by both the `install` slug and the file slug (spec 09 / AGENT-BRIEF §5). */
const readDocsPages = (): Map<string, DocsPage> => {
    const parsed: { slug: string; install?: string; sourceFolder?: string; page: DocsPage }[] = [];

    for (const area of ["components", "marketing"] as const) {
        for (const file of listDir(path.join(CONTENT, area))) {
            if (!file.endsWith(".mdx")) continue;
            const slug = file.replace(/\.mdx$/, "");
            const block = readFileSync(path.join(CONTENT, area, file), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
            const raw: Record<string, string> = {};
            for (const line of block?.[1]?.split(/\r?\n/) ?? []) {
                const separator = line.indexOf(":");
                if (separator === -1 || !line.trim() || line.trimStart().startsWith("#")) continue;
                const key = line.slice(0, separator).trim();
                const value = line
                    .slice(separator + 1)
                    .trim()
                    .replace(/^["']|["']$/g, "")
                    .trim();
                if (key && value) raw[key] = value;
            }

            parsed.push({
                slug,
                install: raw.install,
                // `source: packages/ui/src/components/base/badges` is the only front-matter key that
                // always names the group folder, so it catches pages whose slug is pluralised.
                sourceFolder: raw.source?.split("/").filter(Boolean).pop(),
                page: {
                    title: raw.title ?? titleize(slug),
                    description: raw.description ?? "",
                    docs: `/${area}/${slug}`,
                },
            });
        }
    }

    // Exact keys win over the folder fallback, so a page is never claimed by a sibling's `source`.
    const pages = new Map<string, DocsPage>();
    for (const { slug, page } of parsed) if (!pages.has(slug)) pages.set(slug, page);
    for (const { install, page } of parsed) if (install && !pages.has(install)) pages.set(install, page);
    for (const { sourceFolder, page } of parsed) if (sourceFolder && !pages.has(sourceFolder)) pages.set(sourceFolder, page);
    return pages;
};

// ---------------------------------------------------------------------------
// Semantic manifests (hand-authored intent/avoid_when/composes_with/a11y_contract/
// responsive_contract/requires_data) + derived token_contract.
// ---------------------------------------------------------------------------

/** `packages/registry/manifest/<layer>/<name>.json`, keyed by `<layer>/<name>`. */
const readManifests = (): Map<string, SemanticManifest> => {
    const manifests = new Map<string, SemanticManifest>();
    for (const layer of listDir(MANIFEST_DIR)) {
        const layerDir = path.join(MANIFEST_DIR, layer);
        if (!isDir(layerDir)) continue;
        for (const file of listDir(layerDir)) {
            if (!file.endsWith(".json")) continue;
            const manifest = JSON.parse(readFileSync(path.join(layerDir, file), "utf8")) as SemanticManifest;
            manifests.set(`${layer}/${file.replace(/\.json$/, "")}`, manifest);
        }
    }
    return manifests;
};

/**
 * The exact `bg-*`/`text-*`/`border-*` class names the design system recognises as semantic
 * tokens, read from `packages/ui/src/styles/theme.css` — never guessed. Tailwind v4 resolves
 * `bg-<x>` first against the `--background-color-<x>` namespace and falls back to the generic
 * `--color-<x>` namespace (same for `text-color`/`border-color`); this mirrors that lookup order
 * so a class only counts as a token here if it would actually resolve to one at runtime.
 *
 * The generic `--color-*` namespace also holds the raw palette scale (`--color-brand-500`, etc.)
 * that components can reach directly, bypassing the semantic layer — `bg-brand-700` is valid CSS
 * but not a semantic token, so those raw-palette entries are excluded from the fallback.
 */
type TokenNamespaces = { bg: Set<string>; text: Set<string>; border: Set<string> };

const RAW_PALETTE_SHADE =
    /^(brand|neutral|gray|grey|red|orange|yellow|green|blue|indigo|purple|pink|sky|slate|teal|cyan|lime|rose|fuchsia|violet|amber|emerald)-\d{2,3}(_alt)?$/;
const BARE_PALETTE_KEYWORD = new Set(["white", "black", "transparent", "current", "inherit", "alpha-white", "alpha-black"]);

const readTokenNamespaces = (): TokenNamespaces => {
    const css = existsSync(THEME_FILE) ? readFileSync(THEME_FILE, "utf8") : "";

    const keysIn = (namespace: string) =>
        [...css.matchAll(new RegExp(`--${namespace}-([a-zA-Z0-9_-]+):`, "g"))].flatMap((match) => (match[1] ? [match[1]] : []));

    const genericColor = keysIn("color").filter((key) => !RAW_PALETTE_SHADE.test(key) && !BARE_PALETTE_KEYWORD.has(key));

    return {
        bg: new Set([...keysIn("background-color"), ...genericColor]),
        text: new Set([...keysIn("text-color"), ...genericColor]),
        border: new Set([...keysIn("border-color"), ...genericColor]),
    };
};

/** Every semantic `bg-*`/`text-*`/`border-*` class actually referenced in the entry's own files. */
const deriveTokenContract = (files: RegistryFile[], tokens: TokenNamespaces): string[] => {
    const found = new Set<string>();
    for (const file of files) {
        for (const match of file.content.matchAll(/\b(bg|text|border)-([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
            const prefix = match[1];
            const suffix = match[2];
            if (!prefix || !suffix) continue;
            const namespace = prefix === "bg" ? tokens.bg : prefix === "text" ? tokens.text : tokens.border;
            if (namespace.has(suffix)) found.add(`${prefix}-${suffix}`);
        }
    }
    return unique([...found]);
};

/**
 * Merges the hand-authored manifest (when one exists for `layer/name`) and the derived
 * `token_contract` into an entry. Entries without a manifest still get a `composes_with`,
 * derived from `registryDependencies`, so every entry reports what it's typically used with.
 */
const withSemantics = (entry: RegistryEntry, manifests: Map<string, SemanticManifest>, tokens: TokenNamespaces): RegistryEntry => {
    const manifest = manifests.get(`${entry.layer}/${entry.name}`);
    const tokenContract = deriveTokenContract(entry.files, tokens);
    const composesWith = manifest?.composes_with ?? (entry.registryDependencies.length > 0 ? entry.registryDependencies : undefined);

    return {
        ...entry,
        ...(manifest?.intent ? { intent: manifest.intent } : {}),
        ...(manifest?.avoid_when?.length ? { avoid_when: manifest.avoid_when } : {}),
        ...(composesWith?.length ? { composes_with: composesWith } : {}),
        ...(manifest?.a11y_contract?.length ? { a11y_contract: manifest.a11y_contract } : {}),
        ...(manifest?.responsive_contract?.length ? { responsive_contract: manifest.responsive_contract } : {}),
        ...(manifest?.requires_data?.length ? { requires_data: manifest.requires_data } : {}),
        ...(tokenContract.length > 0 ? { token_contract: tokenContract } : {}),
    };
};

// ---------------------------------------------------------------------------
// Per-entry changelog, derived from packages/ui/CHANGELOG.md — never hand-authored.
// ---------------------------------------------------------------------------

type ChangelogRelease = { version: string; bullets: string[] };

/**
 * Parses `## x.y.z` release headings and their top-level bullets (changesets always emits one
 * `- <hash>: <summary>` bullet per changeset, at column 0) out of `packages/ui/CHANGELOG.md`.
 * A bullet's own continuation lines (wrapped prose, up to the first blank line) are folded into
 * its text; further-indented sub-bullets are that changeset's own elaboration, not a new entry,
 * and are intentionally left out of the derived `changes` text. Returns `[]` when the file is
 * missing (a fresh checkout that hasn't cut a release yet).
 */
const parseChangelogReleases = (): ChangelogRelease[] => {
    if (!existsSync(CHANGELOG_FILE)) return [];

    const releases: ChangelogRelease[] = [];
    let current: ChangelogRelease | null = null;
    let bullet: string[] | null = null;
    let bulletOpen = false;

    const flush = () => {
        if (current && bullet) {
            const text = bullet
                .join(" ")
                .replace(/\s+/g, " ")
                .replace(/^[0-9a-f]{7,40}:\s*/, "") // the changeset commit hash changesets prefixes each bullet with
                .trim();
            if (text) current.bullets.push(text);
        }
        bullet = null;
        bulletOpen = false;
    };

    for (const line of readFileSync(CHANGELOG_FILE, "utf8").split(/\r?\n/)) {
        const heading = /^##\s+(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\s*$/.exec(line);
        if (heading?.[1]) {
            flush();
            current = { version: heading[1], bullets: [] };
            releases.push(current);
            continue;
        }
        const topLevelBullet = /^-\s+(.*)$/.exec(line);
        if (topLevelBullet) {
            flush();
            bullet = [topLevelBullet[1] ?? ""];
            bulletOpen = true;
            continue;
        }
        if (!bullet || !bulletOpen) continue;
        if (!line.trim()) {
            bulletOpen = false; // blank line ends this bullet's summary; further lines are elaboration
            continue;
        }
        bullet.push(line.trim());
    }
    flush();

    return releases;
};

/** `close-button` → `CloseButton` — how a changelog bullet names a component in prose, not by its folder. */
const pascalOf = (kebabName: string): string =>
    kebabName
        .split("-")
        .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : ""))
        .join("");

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The group folder an entry's first file lives in, when it differs from the entry's own name (an `example` entry's slug). */
const folderOfEntry = (entry: Pick<RegistryEntry, "name" | "files">): string | undefined => {
    const segments = entry.files[0]?.path.split("/");
    const folder =
        segments?.[0] === "components" ? segments[2] : segments?.[0] === "utils" || segments?.[0] === "hooks" ? stripExtension(segments[1] ?? "") : undefined;
    return folder && folder !== entry.name ? folder : undefined;
};

/** Whether a changelog bullet's text names this entry — by its own kebab name, its folder, or either's PascalCase component-name form. */
const bulletMentionsEntry = (text: string, name: string, folder: string | undefined): boolean => {
    const candidates = unique([name, pascalOf(name), ...(folder ? [folder, pascalOf(folder)] : [])]);
    return candidates.some((candidate) => candidate.length > 1 && new RegExp(`\\b${escapeRegExp(candidate)}\\b`, "i").test(text));
};

/** This entry's changelog: every release with at least one bullet that mentions it, `[]` otherwise. */
const changelogFor = (entry: Pick<RegistryEntry, "name" | "files">, releases: ChangelogRelease[]): ChangelogEntry[] => {
    const folder = folderOfEntry(entry);
    return releases
        .map((release) => ({ version: release.version, changes: release.bullets.filter((bullet) => bulletMentionsEntry(bullet, entry.name, folder)) }))
        .filter((release) => release.changes.length > 0);
};

// ---------------------------------------------------------------------------
// Entry discovery
// ---------------------------------------------------------------------------

type Group = { name: string; layer: Layer; dir: string; files: string[]; demoFiles: string[] };

const discoverGroups = (): Group[] => {
    const groups: Group[] = [];

    for (const layer of LAYERS) {
        const layerDir = path.join(SRC, layer);
        for (const name of listDir(layerDir)) {
            const full = path.join(layerDir, name);
            const directory = statSync(full).isDirectory();
            if (!directory && !/\.[jt]sx?$/.test(name)) continue;

            const all = directory ? walkFiles(full) : [full];
            groups.push({
                name: stripExtension(name),
                layer,
                dir: directory ? full : layerDir,
                files: all.filter((file) => !isDemoOrTest(file)),
                demoFiles: all.filter((file) => /\.demo\.[jt]sx?$/.test(path.basename(file))),
            });
        }
    }

    return groups;
};

/**
 * Variant slugs for an example group. `variants*.ts` (generated by `pnpm gen:variant-parts`)
 * is authoritative when present; otherwise every non-shared root-level `.tsx` counts.
 */
const variantSlugsFor = (group: Group): string[] => {
    const variantFiles = group.files.filter((file) => /^variants(\.[a-z0-9]+)?\.ts$/.test(path.basename(file)));
    if (variantFiles.length > 0) {
        const slugs = variantFiles.flatMap((file) => {
            const code = readFileSync(file, "utf8");
            const body = code.slice(code.indexOf("= {"));
            return [...body.matchAll(/["']([a-z0-9][a-z0-9-]*)["']\s*:/g)].flatMap((match) => (match[1] ? [match[1]] : []));
        });
        return unique(slugs);
    }

    // Fallback: plain kebab-cased root files. `charts.a.tsx` / `settings-shell.tsx` style part and
    // shell files are shared building blocks, not variants, so they stay out of the slug list.
    return unique(
        group.files
            .filter((file) => path.dirname(file) === group.dir && /^[a-z0-9][a-z0-9-]*\.tsx$/.test(path.basename(file)))
            .map((file) => stripExtension(path.basename(file)))
            .filter((slug) => slug !== group.name && slug !== "index" && !slug.includes("shared") && !slug.includes("shell") && !slug.startsWith("variants")),
    );
};

type ExampleCandidate = { slug: string; group: Group; entryFile: string; siblings: number };

const commonPrefixLength = (a: string, b: string) => {
    let length = 0;
    while (length < a.length && length < b.length && a[length] === b[length]) length += 1;
    return length;
};

/**
 * Two sibling groups occasionally ship the same variant slug while the library is being built in
 * parallel. Prefer the group whose name best matches the slug, then the more complete set, then
 * alphabetical order — deterministic, and the loser is reported rather than silently dropped.
 */
const preferredExample = (a: ExampleCandidate, b: ExampleCandidate): [ExampleCandidate, ExampleCandidate] => {
    const byPrefix = commonPrefixLength(b.group.name, b.slug) - commonPrefixLength(a.group.name, a.slug);
    if (byPrefix !== 0) return byPrefix < 0 ? [a, b] : [b, a];
    if (a.siblings !== b.siblings) return a.siblings > b.siblings ? [a, b] : [b, a];
    return a.group.name.localeCompare(b.group.name) <= 0 ? [a, b] : [b, a];
};

/** The variant file plus every file it pulls in relatively from the same group folder. */
const exampleFileSet = (entryFile: string, group: Group): string[] => {
    const seen = new Set<string>([entryFile]);
    const queue = [entryFile];

    while (queue.length > 0) {
        const current = queue.pop();
        if (!current) break;
        for (const { source } of parseImports(readFileSync(current, "utf8"))) {
            if (!source.startsWith(".")) continue;
            const resolved = resolveInternal(source, current);
            if (!resolved || seen.has(resolved) || !resolved.startsWith(`${group.dir}${path.sep}`)) continue;
            if (isDemoOrTest(resolved)) continue;
            seen.add(resolved);
            queue.push(resolved);
        }
    }

    return [...seen].sort();
};

// ---------------------------------------------------------------------------
// Dependency derivation
// ---------------------------------------------------------------------------

type Disallowed = { file: string; specifier: string };

type Derived = { registryDependencies: string[]; dependencies: string[]; disallowed: Disallowed[]; unresolved: string[] };

const deriveDependencies = (files: string[], selfName: string, knownEntries: Set<string>): Derived => {
    const registryDependencies = new Set<string>();
    const dependencies = new Set<string>();
    const disallowed: Disallowed[] = [];
    const unresolved: string[] = [];

    for (const file of files) {
        if (!/\.[jt]sx?$/.test(file)) continue;
        for (const { source, typeOnly } of parseImports(readFileSync(file, "utf8"))) {
            if (source.startsWith("@/") || source.startsWith(".")) {
                const resolved = resolveInternal(source, file);
                if (!resolved) {
                    unresolved.push(`${uiRelative(file)} → ${source}`);
                    continue;
                }
                const name = entryNameForFile(resolved);
                if (!name || name === selfName) continue;
                if (knownEntries.has(name)) registryDependencies.add(name);
                else unresolved.push(`${uiRelative(file)} → ${source} (no registry entry)`);
                continue;
            }

            const root = packageRootOf(source);
            // Type-only imports (including type-position `import("pkg")`) erase at compile
            // time, so they never reach the runtime bundle — but the CLI still wants to tell a
            // consumer they need the package for full type support, so these are recorded
            // without the runtime allow-list gate (fixes the @react-types/shared miss in
            // hooks/use-resize-observer.ts, feedback 2.13).
            if (typeOnly) {
                dependencies.add(root);
                continue;
            }
            if (!ALLOWED.has(root)) {
                disallowed.push({ file: uiRelative(file), specifier: source });
                continue;
            }
            dependencies.add(root);
        }
    }

    return {
        registryDependencies: [...registryDependencies].sort(),
        dependencies: [...dependencies].sort(),
        disallowed,
        unresolved,
    };
};

/**
 * The same external-dependency rule as `deriveDependencies` above, scoped to one file, so the
 * CLI can print "need recharts (metrics-chart.tsx)" instead of only an entry-level union.
 * Silently drops a disallowed root rather than re-reporting it — `deriveDependencies` already
 * fails the build for that case before this list is ever written out.
 */
const fileExternalDependencies = (rawCode: string): string[] => {
    const found = new Set<string>();
    for (const { source, typeOnly } of parseImports(rawCode)) {
        if (source.startsWith("@/") || source.startsWith(".")) continue;
        const root = packageRootOf(source);
        if (typeOnly || ALLOWED.has(root)) found.add(root);
    }
    return [...found].sort();
};

/**
 * Fixture/placeholder-data files that exist only to carry demo content, never real component
 * logic: `utils/demo-assets.ts` itself, `table-data.ts`, and the `data(.<letter>)?.ts` sibling
 * files a few page examples use (e.g. `dashboards-02/data.a.ts`). Flagged per-file as
 * `kind: "demo"` (feedback 2.10) rather than guessed from directory location, since fixture
 * files live right alongside the real component files they feed.
 */
const isDemoFixtureFile = (relativePath: string): boolean => {
    const base = path.basename(relativePath);
    return base === "demo-assets.ts" || /^(?:[a-z0-9]+-)*data(?:\.[a-z0-9]+)?\.ts$/.test(base);
};

/**
 * Strips lint-directive comments from emitted `content` so a copied file doesn't hard-error in a
 * consumer's ESLint 9 flat config over a plugin/rule it doesn't have installed (feedback 2.5).
 * Three shapes, in order:
 *   1. Any eslint-disable or eslint-enable block comment, single- or multi-line, however it's
 *      wrapped (a bare statement comment, or a JSX comment-expression container). Matched
 *      non-greedy up to the first block-comment close, which is always that comment's own end.
 *   2. An eslint-disable or eslint-enable line comment (any suffix) that is the entire line.
 *   3. A trailing eslint-disable-line / eslint-disable-next-line comment appended after real
 *      code on the same line.
 * `@ts-expect-error` is untouched — it's load-bearing, not a lint directive — and every other
 * comment survives.
 */
const stripLintDirectives = (content: string): string =>
    content
        .replace(/\/\*\s*eslint-(?:disable|enable)\b[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((line) => !/^\/\/\s*eslint-(?:disable|enable)\b.*$/.test(line.trim()))
        .map((line) => line.replace(/\s*\/\/\s*eslint-disable-(?:next-)?line\b.*$/, ""))
        .join("\n");

/**
 * `packages/ui/src` itself uses only relative specifiers for its internal imports (no `@/`) —
 * but the CLI's `rewriteImports` (packages/cli/src/files.ts) only recognizes the `@/` form, and
 * `resolveTarget` there relocates `components/**` under `--path <dir>` while `utils/**` and
 * `hooks/**` stay put at the alias base. A relative specifier that stays inside `components/**`
 * survives that move — the whole tree relocates together, preserving relative structure — but one
 * that crosses from `components/**` into `utils/**` or `hooks/**` (or vice versa) does not, so
 * those must ship in the registry as `@/…`, the only form that resolves correctly regardless of
 * `--path`. This reuses `resolveInternal` for resolution rather than writing a second resolver.
 */
const REWRITE_SPECIFIER = /((?:\bfrom\s+)|(?:\bimport\s+)|(?:\bimport\s*\(\s*)|(?:\brequire\s*\(\s*))(["'])(\.[^"']*)\2/g;

const topSegmentOf = (relative: string) => relative.split("/")[0];

const rewriteInternalSpecifiers = (content: string, fromFile: string): string =>
    content.replace(REWRITE_SPECIFIER, (match, lead: string, quote: string, specifier: string) => {
        const resolved = resolveInternal(specifier, fromFile);
        if (!resolved) return match;
        if (topSegmentOf(uiRelative(fromFile)) === topSegmentOf(uiRelative(resolved))) return match;

        let target = stripExtension(uiRelative(resolved));
        if (target.endsWith("/index")) target = target.slice(0, -"/index".length);
        return `${lead}${quote}@/${target}${quote}`;
    });

const toRegistryFiles = (files: string[]): RegistryFile[] =>
    files.map((file) => {
        const relative = uiRelative(file);
        const raw = readFileSync(file, "utf8");
        const isCode = /\.[jt]sx?$/.test(file);
        const content = isCode ? stripLintDirectives(rewriteInternalSpecifiers(raw, file)) : raw;
        const dependencies = isCode ? fileExternalDependencies(raw) : [];
        const kind = isDemoFixtureFile(relative) ? ("demo" as const) : undefined;
        return { path: relative, target: relative, type: fileTypeFor(relative), content, dependencies, ...(kind ? { kind } : {}) };
    });

/** Every `export const X` in the group's `.demo.tsx` files, kebab-cased into example ids. */
const exampleIdsFor = (group: Group): string[] =>
    unique(
        group.demoFiles.flatMap((file) =>
            [...readFileSync(file, "utf8").matchAll(/^export\s+const\s+([A-Za-z0-9_]+)/gm)].flatMap((match) => (match[1] ? [kebab(match[1])] : [])),
        ),
    );

// ---------------------------------------------------------------------------
// Optional (decorative/demo-only) registryDependencies — dist/exports.json + dist/icons.json
// ---------------------------------------------------------------------------

type EntryRef = { name: string; layer: string; type: EntryType };

/**
 * Decorative or demo-only registryDependencies, split out into `optionalRegistryDependencies` so
 * the CLI can install a component without them and say so (feedback map 2.10). Two mechanisms
 * feed this classification:
 *   1. Automatic — an import reachable only through a `*.demo.tsx`/`.story.tsx`/`.test.tsx` file
 *      never becomes a registryDependency in the first place: `discoverGroups` already excludes
 *      those files from `group.files` before `deriveDependencies` ever sees them.
 *   2. Hand-maintained — the crossings below come from real component files but are still known,
 *      by inspection, to be decorative: a swappable brand asset, placeholder fixture data, or
 *      page chrome rendered "alongside" the thing an entry actually teaches. Every rule below
 *      carries the reason it's here.
 */
const OPTIONAL_DEPS: { dependency: string; reason: string; isOptionalFor: (entry: EntryRef) => boolean }[] = [
    {
        dependency: "payment-icons",
        reason: "Only the input-payment variant inside the `input` group renders card-brand icons; every other input in the group compiles and renders without the set.",
        isOptionalFor: (entry) => entry.name === "input",
    },
    {
        dependency: "logo",
        reason: "The wordmark is a swappable brand placeholder in every nav, footer, page template and email that pulls it — never required for the surrounding layout to compile or render.",
        isOptionalFor: () => true,
    },
    {
        dependency: "integration-icons",
        reason: "Decorative row of third-party logos used as nav/section dressing (e.g. app-navigation). Left required only for the features-integrations-icons-* examples, whose entire point is the icon set itself.",
        isOptionalFor: (entry) => !entry.name.startsWith("features-integrations-icons-"),
    },
    {
        dependency: "demo-assets",
        reason: "Placeholder fixture data everywhere it is pulled, except `app-navigation`: its nav-account-card renders real account data with it, so that one crossing stays required (feedback 2.10 exception).",
        isOptionalFor: (entry) => entry.name !== "app-navigation",
    },
    {
        dependency: "header-navigations",
        reason: "Every current consumer (hero/cta sections, marketing page templates) renders a full nav bar alongside its own content — the nav is page chrome, not the thing being taught.",
        isOptionalFor: () => true,
    },
    {
        dependency: "tags",
        reason: "Decorative only when pulled purely for a badges demo composition; the Badge primitive itself never needs the Tag component.",
        isOptionalFor: (entry) => entry.name === "badges",
    },
    {
        dependency: "avatar",
        reason: "Same reasoning as `tags` above: decorative only when badges pulls it for a demo, never for the primitive itself.",
        isOptionalFor: (entry) => entry.name === "badges",
    },
];

/**
 * `registryDependencies` pointing at the `shared-assets` layer (background-patterns, credit-card,
 * illustrations, mockups, qr-code) are visual dressing by construction — every one of those groups
 * exists to decorate a page example, never to make one compile — so they're always optional
 * regardless of which entry pulls them in. Unlike `OPTIONAL_DEPS`, this is a layer-wide rule
 * rather than a per-dependency one, so it lives directly in `splitOptionalDependencies` below.
 */

/**
 * Registry entries imported by this entry's required (non-demo) files, resolved the same way
 * `deriveDependencies` resolves them. Used to veto the optional split above.
 */
const registryImportsOfRequiredFiles = (entry: { name: string; files: { path: string; kind?: string }[] }): Set<string> => {
    const names = new Set<string>();
    for (const file of entry.files) {
        if (file.kind === "demo") continue;
        const abs = path.isAbsolute(file.path) ? file.path : path.join(UI_SRC, file.path);
        if (!/\.[jt]sx?$/.test(abs) || !existsSync(abs)) continue;
        for (const { source } of parseImports(readFileSync(abs, "utf8"))) {
            if (!(source.startsWith("@/") || source.startsWith("."))) continue;
            const resolved = resolveInternal(source, abs);
            const name = resolved ? entryNameForFile(resolved) : undefined;
            if (name && name !== entry.name) names.add(name);
        }
    }
    return names;
};

/** Splits `registryDependencies` into required-vs-optional using `OPTIONAL_DEPS` + the shared-assets rule above. */
const splitOptionalDependencies = (
    entry: EntryRef,
    registryDependencies: string[],
    layerOf: (name: string) => string | undefined,
    importedByRequiredFiles: Set<string>,
): { registryDependencies: string[]; optionalRegistryDependencies: string[] } => {
    const optional = new Set<string>();
    const required: string[] = [];
    for (const dependency of registryDependencies) {
        const rule = OPTIONAL_DEPS.find((candidate) => candidate.dependency === dependency);
        // A dependency can only be optional if no required file of this entry imports it.
        // 88 marketing sections import `header-navigations/base-components/header` for real, and
        // `sidebar-simple.tsx` imports `logo`; skipping those with `--no-optional` would write a
        // file whose import cannot resolve. The rule tables express intent; this guard keeps
        // every install compilable regardless of what the tables say.
        const decorative = layerOf(dependency) === "shared-assets" || rule?.isOptionalFor(entry);
        if (decorative && !importedByRequiredFiles.has(dependency)) optional.add(dependency);
        else required.push(dependency);
    }
    return { registryDependencies: required, optionalRegistryDependencies: [...optional].sort() };
};

// ---------------------------------------------------------------------------
// dist/exports.json — named exports per entry, parsed with the TS compiler API so `search`
// can index export names (e.g. `ComboBox`) rather than only entry names.
// ---------------------------------------------------------------------------

/** Every top-level named export in one file's already-emitted `content` (default exports excluded — not name-searchable). */
const namedExportsOf = (fileName: string, content: string): string[] => {
    const names = new Set<string>();
    const source = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

    const isExported = (node: ts.Node) =>
        ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

    for (const statement of source.statements) {
        if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
            for (const element of statement.exportClause.elements) names.add(element.name.text);
            continue;
        }
        if (!isExported(statement)) continue;
        if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
        } else if (
            (ts.isFunctionDeclaration(statement) ||
                ts.isClassDeclaration(statement) ||
                ts.isInterfaceDeclaration(statement) ||
                ts.isTypeAliasDeclaration(statement) ||
                ts.isEnumDeclaration(statement)) &&
            statement.name
        ) {
            names.add(statement.name.text);
        }
    }
    return [...names];
};

/** Named exports across every component-type file of an entry, unioned and sorted. */
const namedExportsForEntry = (entry: RegistryEntry): string[] =>
    unique(entry.files.filter((file) => file.type === "component" && /\.[jt]sx?$/.test(file.path)).flatMap((file) => namedExportsOf(file.path, file.content)));

// ---------------------------------------------------------------------------
// dist/icons.json — the icon package's export names, for the CLI's icon search.
// ---------------------------------------------------------------------------

/** `@properui/icons` is an npm alias (`"npm:@untitledui/icons@^0.0.22"`) — resolve the real package name from it rather than hard-coding. */
const iconsPackageNameFrom = (spec: string | undefined): string => /^npm:(@[^/]+\/[^@]+|[^@]+)@/.exec(spec ?? "")?.[1] ?? "@untitledui/icons";

/** Reads the installed icon package's own `.d.ts` barrel (`export { Name } from "./Name.js"` per line) — never guessed, always the exact installed set. */
const readIconNames = (): { package: string; alias: string; names: string[] } => {
    const alias = "@properui/icons";
    const packageName = iconsPackageNameFrom(uiPackageJson.dependencies?.[alias]);
    const requireFromUi = createRequire(path.join(REPO, "packages", "ui", "package.json"));
    const entryFile = requireFromUi.resolve(alias);
    const dtsFile = path.join(path.dirname(entryFile), "index.d.ts");
    const dts = existsSync(dtsFile) ? readFileSync(dtsFile, "utf8") : "";
    const names = unique([...dts.matchAll(/^export\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from/gm)].flatMap((match) => (match[1] ? [match[1]] : [])));
    return { package: packageName, alias, names };
};

// ---------------------------------------------------------------------------
// JSON schema + minimal validator (no new dependencies)
// ---------------------------------------------------------------------------

type Schema = {
    type?: string;
    enum?: string[];
    pattern?: string;
    required?: string[];
    properties?: Record<string, Schema>;
    additionalProperties?: boolean;
    items?: Schema;
};

const SCHEMA: Schema & { $schema: string; $id: string; title: string; description: string } = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://properui.dev/schema.json",
    title: "Proper UI registry entry",
    description: "One component, example, util, hook or stylesheet as served from /r/<name>.json.",
    type: "object",
    required: [
        "name",
        "layer",
        "type",
        "title",
        "files",
        "registryDependencies",
        "optionalRegistryDependencies",
        "dependencies",
        "cssVars",
        "examples",
        "changelog",
    ],
    additionalProperties: false,
    properties: {
        name: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
        layer: { type: "string", enum: [...LAYERS, "utils", "hooks", "styles"] },
        type: { type: "string", enum: ["component", "example", "util", "hook", "style"] },
        title: { type: "string" },
        description: { type: "string" },
        docs: { type: "string" },
        files: {
            type: "array",
            items: {
                type: "object",
                required: ["path", "target", "type", "content", "dependencies"],
                additionalProperties: false,
                properties: {
                    path: { type: "string" },
                    target: { type: "string" },
                    type: { type: "string", enum: ["component", "util", "hook", "style"] },
                    content: { type: "string" },
                    dependencies: { type: "array", items: { type: "string" } },
                    kind: { type: "string", enum: ["demo"] },
                },
            },
        },
        registryDependencies: { type: "array", items: { type: "string" } },
        optionalRegistryDependencies: { type: "array", items: { type: "string" } },
        dependencies: { type: "array", items: { type: "string" } },
        cssVars: { type: "array", items: { type: "string" } },
        examples: { type: "array", items: { type: "string" } },
        // Semantic manifest (AGENT-BRIEF: registry metadata) — all optional, so existing entries
        // stay valid. `intent`/`avoid_when`/`a11y_contract`/`responsive_contract`/`requires_data`
        // are hand-authored (base + application layers only); `composes_with` is hand-authored
        // where a manifest exists and otherwise derived from `registryDependencies`;
        // `token_contract` is always derived from the entry's own source.
        intent: { type: "string" },
        avoid_when: { type: "array", items: { type: "string" } },
        composes_with: { type: "array", items: { type: "string" } },
        a11y_contract: { type: "array", items: { type: "string" } },
        responsive_contract: { type: "array", items: { type: "string" } },
        token_contract: { type: "array", items: { type: "string" } },
        requires_data: { type: "array", items: { type: "string" } },
        // Derived from packages/ui/CHANGELOG.md (never hand-authored) — see `changelogFor` above.
        // Always present, `[]` when no release's bullets mention this entry.
        changelog: {
            type: "array",
            items: {
                type: "object",
                required: ["version", "changes"],
                additionalProperties: false,
                properties: {
                    version: { type: "string" },
                    changes: { type: "array", items: { type: "string" } },
                },
            },
        },
    },
};

/** Tiny draft-07 subset validator: type / required / properties / additionalProperties / items / enum / pattern. */
const validate = (value: unknown, schema: Schema, at = "$"): string[] => {
    const errors: string[] = [];

    if (schema.type === "array") {
        if (!Array.isArray(value)) return [`${at}: expected array`];
        if (schema.items) value.forEach((item, index) => errors.push(...validate(item, schema.items as Schema, `${at}[${index}]`)));
        return errors;
    }

    if (schema.type === "object") {
        if (typeof value !== "object" || value === null || Array.isArray(value)) return [`${at}: expected object`];
        const record = value as Record<string, unknown>;
        for (const key of schema.required ?? []) if (!(key in record)) errors.push(`${at}: missing required property "${key}"`);
        for (const [key, item] of Object.entries(record)) {
            const property = schema.properties?.[key];
            if (!property) {
                if (schema.additionalProperties === false) errors.push(`${at}: unexpected property "${key}"`);
                continue;
            }
            if (item !== undefined) errors.push(...validate(item, property, `${at}.${key}`));
        }
        return errors;
    }

    if (schema.type === "string") {
        if (typeof value !== "string") return [`${at}: expected string`];
        if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: "${value}" is not one of ${schema.enum.join(", ")}`);
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: "${value}" does not match ${schema.pattern}`);
        return errors;
    }

    return errors;
};

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const build = () => {
    if (!isDir(SRC)) {
        console.error(`registry:build — no component source at ${SRC}`);
        process.exit(1);
    }

    const docsPages = readDocsPages();
    const groups = discoverGroups();

    // Pass 1 — the set of names that can legally appear in registryDependencies.
    const knownEntries = new Set<string>(["styles", "providers"]);
    for (const group of groups) knownEntries.add(group.name);
    for (const directory of ["utils", "hooks"] as const) {
        for (const file of listDir(path.join(UI_SRC, directory))) {
            if (/\.[jt]sx?$/.test(file)) knownEntries.add(stripExtension(file));
        }
    }
    for (const group of groups) {
        if (!EXAMPLE_LAYERS.has(group.layer)) continue;
        for (const slug of variantSlugsFor(group)) knownEntries.add(slug);
    }

    // Which layer a registryDependency's target entry lives in — used by `splitOptionalDependencies`
    // to spot the shared-assets layer (pure visual dressing) regardless of which entry pulls it in.
    const nameToLayer = new Map<string, string>();
    for (const group of groups) nameToLayer.set(group.name, group.layer);

    const entries: RegistryEntry[] = [];
    const disallowed: Disallowed[] = [];
    const unresolved: string[] = [];

    const push = (entry: Omit<RegistryEntry, "docs"> & { docs?: string }, derived: Derived) => {
        disallowed.push(...derived.disallowed);
        unresolved.push(...derived.unresolved);
        entries.push(entry);
    };

    // Utils and hooks — referenced through `@/utils/*` and `@/hooks/*`, so they need entries
    // of their own for `registryDependencies` to resolve.
    for (const directory of ["utils", "hooks"] as const) {
        for (const file of listDir(path.join(UI_SRC, directory))) {
            if (!/\.[jt]sx?$/.test(file) || isDemoOrTest(file)) continue;
            const absolute = path.join(UI_SRC, directory, file);
            const name = stripExtension(file);
            const derived = deriveDependencies([absolute], name, knownEntries);
            push(
                {
                    name,
                    layer: directory,
                    type: directory === "utils" ? "util" : "hook",
                    title: titleize(name),
                    description: `Shared ${directory === "utils" ? "utility" : "hook"} used by Proper UI components.`,
                    files: toRegistryFiles([absolute]),
                    registryDependencies: derived.registryDependencies,
                    optionalRegistryDependencies: [],
                    dependencies: derived.dependencies,
                    cssVars: [],
                    examples: [],
                },
                derived,
            );
        }
    }

    // Stylesheets — what `properui init` writes into a consuming project.
    const styleFiles = listDir(path.join(UI_SRC, "styles"))
        .filter((file) => file.endsWith(".css"))
        .map((file) => path.join(UI_SRC, "styles", file));
    if (styleFiles.length > 0) {
        entries.push({
            name: "styles",
            layer: "styles",
            type: "style",
            title: "Styles",
            description: "Theme tokens, globals and typography for Proper UI.",
            files: toRegistryFiles(styleFiles),
            registryDependencies: [],
            optionalRegistryDependencies: [],
            dependencies: [],
            cssVars: [],
            examples: [],
        });
    }

    // Providers — `properui init` wires these into the consuming app's root layout.
    const providerFiles = listDir(path.join(UI_SRC, "providers"))
        .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
        .map((file) => path.join(UI_SRC, "providers", file));
    if (providerFiles.length > 0) {
        const derivedProviders = deriveDependencies(providerFiles, "providers", knownEntries);
        entries.push({
            name: "providers",
            layer: "utils",
            type: "component",
            title: "Providers",
            description: "ThemeProvider and RouterProvider — the two providers a Proper UI app wraps its root in.",
            files: toRegistryFiles(providerFiles),
            registryDependencies: derivedProviders.registryDependencies,
            optionalRegistryDependencies: [],
            dependencies: derivedProviders.dependencies,
            cssVars: [],
            examples: [],
        });
    }

    // One entry per group folder. A group with no installable file (only a `.demo.tsx`, e.g.
    // `foundations/typography` — its CSS already ships inside the `styles` entry) is skipped
    // entirely rather than emitted as an empty entry, so `search`/`list` never show a 0-file
    // result (feedback 2.13).
    const emptyGroups: string[] = [];
    for (const group of groups) {
        if (group.files.length === 0) {
            emptyGroups.push(`${group.layer}/${group.name}`);
            continue;
        }
        const derived = deriveDependencies(group.files, group.name, knownEntries);
        const page = docsPages.get(group.name);
        push(
            {
                name: group.name,
                layer: group.layer,
                type: "component",
                title: page?.title ?? titleize(group.name),
                description: page?.description ?? "",
                files: toRegistryFiles(group.files),
                registryDependencies: derived.registryDependencies,
                optionalRegistryDependencies: [],
                dependencies: derived.dependencies,
                cssVars: [],
                examples: exampleIdsFor(group),
                ...(page ? { docs: page.docs } : {}),
            },
            derived,
        );
    }

    // One entry per marketing / page-example variant file. Sibling groups sometimes declare the
    // same slug (see the collision report below), so candidates are resolved before they are written.
    const candidates: ExampleCandidate[] = [];
    for (const group of groups) {
        if (!EXAMPLE_LAYERS.has(group.layer)) continue;
        const slugs = variantSlugsFor(group);
        for (const slug of slugs) {
            const entryFile = group.files.find((file) => path.dirname(file) === group.dir && stripExtension(path.basename(file)) === slug);
            if (!entryFile) {
                unresolved.push(`${group.layer}/${group.name} → variant "${slug}" has no matching file`);
                continue;
            }
            candidates.push({ slug, group, entryFile, siblings: slugs.length });
        }
    }

    const taken = new Set(entries.map((entry) => entry.name));
    const winners = new Map<string, ExampleCandidate>();
    const shadowed: string[] = [];

    for (const candidate of candidates) {
        if (taken.has(candidate.slug)) {
            shadowed.push(`${candidate.group.layer}/${candidate.group.name}/${candidate.slug} (name already used by a component entry)`);
            continue;
        }
        const held = winners.get(candidate.slug);
        if (!held) {
            winners.set(candidate.slug, candidate);
            continue;
        }
        const [winner, loser] = preferredExample(held, candidate);
        winners.set(candidate.slug, winner);
        shadowed.push(`${loser.group.layer}/${loser.group.name}/${loser.slug} (shadowed by ${winner.group.layer}/${winner.group.name})`);
    }

    for (const { slug, group, entryFile } of [...winners.values()].sort((a, b) => a.slug.localeCompare(b.slug))) {
        const page = docsPages.get(group.name);
        const files = exampleFileSet(entryFile, group);
        const derived = deriveDependencies(files, slug, knownEntries);
        push(
            {
                name: slug,
                layer: group.layer,
                type: "example",
                title: titleize(slug),
                description: page ? `${page.title} — ${titleize(slug)} variant.` : "",
                files: toRegistryFiles(files),
                registryDependencies: derived.registryDependencies.filter((dependency) => dependency !== group.name),
                optionalRegistryDependencies: [],
                dependencies: derived.dependencies,
                cssVars: [],
                examples: [],
                ...(page ? { docs: `${page.docs}/${slug}` } : {}),
            },
            derived,
        );
    }

    // ---- Semantic manifest merge --------------------------------------------
    // Hand-authored intent/avoid_when/composes_with/a11y_contract/responsive_contract/requires_data
    // for the base and application layers, plus a derived token_contract (every entry) and a
    // derived composes_with fallback (every entry without its own manifest).

    const manifests = readManifests();
    const tokenNamespaces = readTokenNamespaces();
    const withMetadata = entries.map((entry) => withSemantics(entry, manifests, tokenNamespaces));
    entries.length = 0;
    entries.push(...withMetadata);

    // ---- Optional (decorative/demo-only) registryDependencies --------------
    // Runs after the semantic merge above so `composes_with`'s derived fallback still sees the
    // full original registryDependencies (a decorative crossing like `app-navigation` → `logo`
    // is still a real "composes with" hint, even once `logo` itself is optional to install).

    const requiredImports = new Map(entries.map((entry) => [entry.name, registryImportsOfRequiredFiles(entry)] as const));
    const withOptionalDeps = entries.map((entry) => {
        const split = splitOptionalDependencies(
            entry,
            entry.registryDependencies,
            (name) => nameToLayer.get(name),
            requiredImports.get(entry.name) ?? new Set(),
        );
        return { ...entry, ...split };
    });
    entries.length = 0;
    entries.push(...withOptionalDeps);

    // ---- Demo-kind veto ----------------------------------------------------
    // `kind: "demo"` tells the CLI it may skip a file. That is only safe when nothing required
    // imports it. `utils/demo-assets.ts` is imported by nav-account-card, sidebar-slim and the
    // social-proof sections for real, and a data file next to a component may be imported by
    // that component; skipping either leaves a dangling import. Clear the tag in both cases.
    // File-level and cross-entry: dashboards-06/07 and four informational pages import
    // `application/table/table-data.ts` from another entry, so an entry-level check misses them.
    // Collect every file path any required file anywhere imports, then untag those files.
    const filesImportedByRequired = new Set<string>();
    for (const entry of entries) {
        for (const file of entry.files) {
            if (file.kind === "demo") continue;
            const abs = path.join(UI_SRC, file.path);
            if (!/\.[jt]sx?$/.test(abs) || !existsSync(abs)) continue;
            for (const { source } of parseImports(readFileSync(abs, "utf8"))) {
                if (!(source.startsWith("@/") || source.startsWith("."))) continue;
                const resolved = resolveInternal(source, abs);
                if (resolved) filesImportedByRequired.add(path.relative(UI_SRC, resolved));
            }
        }
    }
    let untagged = 0;
    for (const entry of entries) {
        for (const file of entry.files) {
            if (file.kind === "demo" && filesImportedByRequired.has(file.path)) {
                delete file.kind;
                untagged += 1;
            }
        }
    }
    if (untagged > 0) console.log(`registry:build — ${untagged} fixture file(s) kept required because a component imports them`);

    // ---- Per-entry changelog ------------------------------------------------
    // Derived from packages/ui/CHANGELOG.md, never hand-authored — see `changelogFor` above.

    const changelogReleases = parseChangelogReleases();
    const withChangelog = entries.map((entry) => ({ ...entry, changelog: changelogFor(entry, changelogReleases) }));
    entries.length = 0;
    entries.push(...withChangelog);

    // ---- Validation -------------------------------------------------------

    if (disallowed.length > 0) {
        console.error(`\nregistry:build — ${disallowed.length} disallowed import(s):\n`);
        for (const { file, specifier } of disallowed) console.error(`  ${file} → ${specifier}`);
        console.error(`\nAllowed: ${[...ALLOWED].sort().join(", ")}\n`);
        process.exit(1);
    }

    const duplicates = entries.map((entry) => entry.name).filter((name, index, all) => all.indexOf(name) !== index);
    if (duplicates.length > 0) {
        console.error(`registry:build — duplicate registry names: ${unique(duplicates).join(", ")}`);
        process.exit(1);
    }

    const schemaErrors = entries.flatMap((entry) => validate(entry, SCHEMA, entry.name));
    if (schemaErrors.length > 0) {
        console.error(`\nregistry:build — ${schemaErrors.length} schema violation(s):\n`);
        for (const error of schemaErrors.slice(0, 40)) console.error(`  ${error}`);
        process.exit(1);
    }

    // ---- Write ------------------------------------------------------------

    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
    writeFileSync(SCHEMA_FILE, `${JSON.stringify(SCHEMA, null, 4)}\n`);

    for (const entry of entries) writeFileSync(path.join(OUT, `${entry.name}.json`), `${JSON.stringify(entry, null, 2)}\n`);

    const index = {
        $schema: "../schema.json",
        components: entries.map(({ files, ...rest }) => ({ ...rest, fileCount: files.length })),
    };
    writeFileSync(path.join(OUT, "index.json"), `${JSON.stringify(index, null, 2)}\n`);

    // ---- dist/icons.json — installed @properui/icons export names, for the CLI's icon search.
    writeFileSync(path.join(OUT, "icons.json"), `${JSON.stringify(readIconNames(), null, 2)}\n`);

    // ---- dist/exports.json — named exports per entry, so `search` can index export names too.
    const exportsByEntry = Object.fromEntries(
        entries.map((entry): [string, string[]] => [entry.name, namedExportsForEntry(entry)]).filter(([, names]) => names.length > 0),
    );
    writeFileSync(path.join(OUT, "exports.json"), `${JSON.stringify(exportsByEntry, null, 2)}\n`);

    // ---- Stats --------------------------------------------------------------
    // Single generated source for every count quoted in the README and the landing page
    // (see apps/docs/components/landing/stats.ts and README.md's `<!-- stats:start -->` block).
    // The four terms below are the only vocabulary those consumers are allowed to use.

    const groupCountByLayer = Object.fromEntries(
        LAYERS.map((layer) => [layer, entries.filter((entry) => entry.type === "component" && entry.layer === layer).length]),
    ) as Record<Layer, number>;

    const publishedGroups = groupCountByLayer.base + groupCountByLayer.application + groupCountByLayer.marketing;
    const allGroups = LAYERS.reduce((total, layer) => total + groupCountByLayer[layer], 0);

    const variantCount = entries.filter((entry) => entry.type === "example" && entry.layer === "marketing").length;
    const marketingPageExamples = entries.filter((entry) => entry.type === "example" && entry.layer === "marketing-examples").length;
    const appPageExamples = entries.filter((entry) => entry.type === "example" && entry.layer === "app-examples").length;

    const testSuiteFiles = walkFiles(SRC).filter((file) => /\.test\.tsx$/.test(file));
    const axeSuiteCount = testSuiteFiles.filter((file) => /toHaveNoViolations/.test(readFileSync(file, "utf8"))).length;

    const stats = {
        definitions: {
            entry: "One registry item of any type — component, example, hook, util or style. Every file written to packages/registry/dist/*.json.",
            group: 'One registry item of type "component": one folder under packages/ui/src/components/<layer>. `groups.published` counts the base, application and marketing layers only; `groups.all` counts every layer, including foundations, shared-assets, app-examples and marketing-examples.',
            variant: 'An "example" entry in the "marketing" layer — a single section variant.',
            example: 'An "example" entry in the "marketing-examples" or "app-examples" layer — a complete page.',
        },
        entries: entries.length,
        groups: {
            published: publishedGroups,
            all: allGroups,
            byLayer: {
                base: groupCountByLayer.base,
                application: groupCountByLayer.application,
                marketing: groupCountByLayer.marketing,
                appExamples: groupCountByLayer["app-examples"],
                marketingExamples: groupCountByLayer["marketing-examples"],
                foundations: groupCountByLayer.foundations,
                sharedAssets: groupCountByLayer["shared-assets"],
            },
        },
        variants: variantCount,
        examples: {
            marketing: marketingPageExamples,
            app: appPageExamples,
            total: marketingPageExamples + appPageExamples,
        },
        testSuites: testSuiteFiles.length,
        axeSuites: axeSuiteCount,
        // Every entry has at least one file except a component group that resolves to nothing
        // installable (see `emptyGroups` below) — which is now skipped entirely, so today this
        // equals `entries`. Kept as its own field so a future empty group shows up as a gap here
        // instead of silently changing what `entries` means.
        entriesWithFiles: entries.filter((entry) => entry.files.length > 0).length,
    };
    writeFileSync(path.join(OUT, "stats.json"), `${JSON.stringify(stats, null, 4)}\n`);

    // ---- Report -----------------------------------------------------------

    const components = entries.filter((entry) => entry.type === "component").length;
    const examples = entries.filter((entry) => entry.type === "example").length;
    const support = entries.length - components - examples;
    const fileCount = entries.reduce((total, entry) => total + entry.files.length, 0);

    if (unresolved.length > 0) {
        console.warn(`registry:build — ${unresolved.length} unresolved import(s):`);
        for (const item of unique(unresolved).slice(0, 20)) console.warn(`  ${item}`);
    }

    if (shadowed.length > 0) {
        console.warn(`registry:build — ${shadowed.length} duplicate variant slug(s) across sibling groups; kept one entry each:`);
        for (const item of unique(shadowed)) console.warn(`  ${item}`);
    }

    if (emptyGroups.length > 0) {
        console.warn(`registry:build — ${emptyGroups.length} group(s) with no installable file skipped (docs-only or covered by another entry):`);
        for (const item of unique(emptyGroups)) console.warn(`  ${item}`);
    }

    const out = path.relative(REPO, OUT).split(path.sep).join("/");
    console.log(
        `registry:build — ${entries.length} entries (${components} components, ${examples} examples, ${support} utils/hooks/styles), ${fileCount} files → ${out}`,
    );
};

build();
