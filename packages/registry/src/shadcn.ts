/**
 * Emits the native registry (packages/registry/dist/*.json, written by build.ts) as
 * shadcn-format registry files, so `npx shadcn@latest add @properui/<name>` works and
 * shadcn's own MCP server / Skill can discover this catalog.
 *
 * Field mapping is verified against (2026-09):
 *   https://ui.shadcn.com/docs/registry/registry-json
 *   https://ui.shadcn.com/docs/registry/registry-item-json
 *   https://ui.shadcn.com/docs/registry/namespace
 *   https://ui.shadcn.com/docs/registry/mcp
 *   https://ui.shadcn.com/schema/registry.json
 *   https://ui.shadcn.com/schema/registry-item.json
 *
 * The native registry stays the source of truth — it carries fields (layer, examples,
 * cssVars, per-file `type`) that shadcn's format has no room for. This script only
 * *translates*; it never changes packages/registry/dist/*.json themselves.
 *
 * Writes:
 *   packages/registry/dist/shadcn/registry.json   — shadcn registry.json index (name/type
 *                                                    summaries, no file content — this is the
 *                                                    file shadcn's MCP server reads to discover
 *                                                    what a namespace has to offer)
 *   packages/registry/dist/shadcn/<name>.json      — one shadcn registry-item.json per entry,
 *                                                     files inlined with content
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DIST = path.join(REPO, "packages", "registry", "dist");
const OUT = path.join(DIST, "shadcn");
const UI_PACKAGE_JSON = path.join(REPO, "packages", "ui", "package.json");

const REGISTRY_NAME = "properui";
const REGISTRY_HOMEPAGE = "https://properui.dev";
/** Matches apps/docs/app/r/shadcn/[name]/route.ts. */
const REGISTRY_URL_TEMPLATE = `${REGISTRY_HOMEPAGE}/r/shadcn/{name}.json`;

// ---------------------------------------------------------------------------
// Native registry shapes (as written by build.ts — kept in sync by hand since
// build.ts is owned by another workstream and must not be imported from here).
// ---------------------------------------------------------------------------

type NativeFileType = "component" | "util" | "hook" | "style";
/** The React entry types. build.ts also emits `type: "html"` snippet entries, which `build` below skips before they reach these maps. */
type NativeEntryType = "component" | "example" | "util" | "hook" | "style";

type NativeFile = {
    path: string;
    target: string;
    type: NativeFileType;
    content: string;
};

type NativeEntry = {
    name: string;
    layer: string;
    type: NativeEntryType;
    title: string;
    description: string;
    files: NativeFile[];
    registryDependencies: string[];
    dependencies: string[];
    cssVars: string[];
    examples: string[];
    docs?: string;
};

type NativeIndex = {
    components: (Omit<NativeEntry, "files" | "type"> & { type: NativeEntryType | "html"; fileCount: number })[];
};

// ---------------------------------------------------------------------------
// shadcn registry shapes (the subset this build emits)
// ---------------------------------------------------------------------------

/** https://ui.shadcn.com/schema/registry-item.json — the `type` values this registry maps to. */
type ShadcnType = "registry:ui" | "registry:block" | "registry:hook" | "registry:lib" | "registry:style";

type ShadcnFile = {
    path: string;
    type: ShadcnType;
    target?: string;
    content: string;
};

type ShadcnItem = {
    $schema: string;
    name: string;
    type: ShadcnType;
    title: string;
    description: string;
    dependencies?: string[];
    registryDependencies?: string[];
    files?: ShadcnFile[];
    meta?: Record<string, unknown>;
};

/** `entry.type` (component/example/util/hook/style) → shadcn's `registry:*` type. */
const TYPE_MAP: Record<NativeEntryType, ShadcnType> = {
    component: "registry:ui",
    example: "registry:block",
    hook: "registry:hook",
    util: "registry:lib",
    style: "registry:style",
};

/** Per-file `type` (a `registry:block` entry's files are a mix, so this maps independently. */
const FILE_TYPE_MAP: Record<NativeFileType, ShadcnType> = {
    component: "registry:ui",
    util: "registry:lib",
    hook: "registry:hook",
    style: "registry:style",
};

/**
 * shadcn's documented `target` placeholders (`@components/`, `@ui/`, `@lib/`, `@hooks/`) resolve
 * against the *consumer's own* `components.json` aliases, independent of our internal folder
 * layout — so files are re-targeted flat (by basename) under the matching alias instead of
 * reproducing `components/base/buttons/...`, which is Proper UI's own tiering, not shadcn's.
 * There's no `@styles` placeholder, so style files fall back to their native `path` (see the
 * "Limits" section on the integration page).
 */
const TARGET_PREFIX: Partial<Record<ShadcnType, string>> = {
    "registry:ui": "@ui/",
    "registry:lib": "@lib/",
    "registry:hook": "@hooks/",
};

// ---------------------------------------------------------------------------
// Dependency translation
// ---------------------------------------------------------------------------

/**
 * `packages/ui/package.json` pins `@properui/icons` to `npm:@untitledui/icons@^0.0.22` (an
 * npm/pnpm alias install). shadcn's `dependencies` field passes each string straight through to
 * the consumer's package manager `add`/`install` command, and both npm and pnpm accept an alias
 * spec as a single argument, so the full spec — not the bare name — is what has to travel.
 * Read from packages/ui/package.json rather than hard-coded so the two can't drift.
 */
const uiPackageJson = JSON.parse(readFileSync(UI_PACKAGE_JSON, "utf8")) as { dependencies?: Record<string, string> };
const ALIAS_SPECS = new Map<string, string>();
for (const [name, spec] of Object.entries(uiPackageJson.dependencies ?? {})) {
    if (spec.startsWith("npm:")) ALIAS_SPECS.set(name, `${name}@${spec}`);
}

const toShadcnDependency = (name: string): string => ALIAS_SPECS.get(name) ?? name;

/** `cx` → `@properui/cx` — how a namespaced consumer (`components.json` → `@properui`) resolves internal names. */
const toShadcnRegistryDependency = (name: string): string => `@${REGISTRY_NAME}/${name}`;

// ---------------------------------------------------------------------------
// Minimal draft-07 validator — mirrors the one in build.ts, scoped to the fields this
// build actually emits (name/type/title/description required; files/dependencies/
// registryDependencies/meta optional; files require path+type, content optional).
// ---------------------------------------------------------------------------

const SHADCN_TYPES: ShadcnType[] = ["registry:ui", "registry:block", "registry:hook", "registry:lib", "registry:style"];
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const validateItem = (item: ShadcnItem): string[] => {
    const errors: string[] = [];
    if (!NAME_PATTERN.test(item.name)) errors.push(`${item.name}: "name" does not match ${NAME_PATTERN}`);
    if (!SHADCN_TYPES.includes(item.type)) errors.push(`${item.name}: "type" ${item.type} is not one of ${SHADCN_TYPES.join(", ")}`);
    if (typeof item.title !== "string" || item.title.length === 0) errors.push(`${item.name}: "title" is required`);
    if (typeof item.description !== "string") errors.push(`${item.name}: "description" must be a string`);
    for (const [index, file] of (item.files ?? []).entries()) {
        if (typeof file.path !== "string" || file.path.length === 0) errors.push(`${item.name}: files[${index}].path is required`);
        if (!SHADCN_TYPES.includes(file.type)) errors.push(`${item.name}: files[${index}].type ${file.type} is not one of ${SHADCN_TYPES.join(", ")}`);
        if (typeof file.content !== "string") errors.push(`${item.name}: files[${index}].content must be a string`);
    }
    return errors;
};

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const readNativeIndex = (): NativeIndex => {
    const file = path.join(DIST, "index.json");
    if (!existsSync(file)) {
        console.error(`registry:shadcn — no ${file}. Run \`tsx src/build.ts\` first.`);
        process.exit(1);
    }
    return JSON.parse(readFileSync(file, "utf8")) as NativeIndex;
};

const readNativeEntry = (name: string): NativeEntry => {
    const file = path.join(DIST, `${name}.json`);
    return JSON.parse(readFileSync(file, "utf8")) as NativeEntry;
};

const toShadcnFile = (file: NativeFile): ShadcnFile => {
    const type = FILE_TYPE_MAP[file.type];
    const prefix = TARGET_PREFIX[type];
    return {
        path: file.path,
        type,
        ...(prefix ? { target: `${prefix}${path.basename(file.path)}` } : {}),
        content: file.content,
    };
};

const toShadcnItem = (entry: NativeEntry): ShadcnItem => ({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: entry.name,
    type: TYPE_MAP[entry.type],
    title: entry.title,
    description: entry.description,
    ...(entry.dependencies.length > 0 ? { dependencies: entry.dependencies.map(toShadcnDependency) } : {}),
    ...(entry.registryDependencies.length > 0 ? { registryDependencies: entry.registryDependencies.map(toShadcnRegistryDependency) } : {}),
    ...(entry.files.length > 0 ? { files: entry.files.map(toShadcnFile) } : {}),
    meta: {
        layer: entry.layer,
        ...(entry.docs ? { docsUrl: `${REGISTRY_HOMEPAGE}${entry.docs}` } : {}),
    },
});

const build = () => {
    const index = readNativeIndex();

    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });

    const items: ShadcnItem[] = [];
    let skippedHtml = 0;
    for (const summary of index.components) {
        // shadcn's registry is React-only: the html snippet entries stay on the native registry.
        if (summary.type === "html") {
            skippedHtml += 1;
            continue;
        }
        const entry = readNativeEntry(summary.name);
        items.push(toShadcnItem(entry));
    }

    const errors = items.flatMap(validateItem);
    if (errors.length > 0) {
        console.error(`\nregistry:shadcn — ${errors.length} schema violation(s):\n`);
        for (const error of errors.slice(0, 40)) console.error(`  ${error}`);
        process.exit(1);
    }

    for (const item of items) writeFileSync(path.join(OUT, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);

    // The index has no `files` — shadcn's registry.json is a catalogue, not a payload — which
    // is also what shadcn's MCP server reads at the registry root to discover what's here
    // (https://ui.shadcn.com/docs/registry/mcp): "a registry item file at the root of your
    // registry named `registry`", i.e. `<namespace root>/registry.json`.
    const registryJson = {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: REGISTRY_NAME,
        homepage: REGISTRY_HOMEPAGE,
        items: items.map(({ $schema: _schema, files: _files, ...rest }) => rest),
    };
    writeFileSync(path.join(OUT, "registry.json"), `${JSON.stringify(registryJson, null, 2)}\n`);

    console.log(
        `registry:shadcn — wrote ${items.length} item(s) + registry.json to ${path.relative(REPO, OUT)}${skippedHtml > 0 ? ` (skipped ${skippedHtml} html entries)` : ""}`,
    );
    console.log(`registry:shadcn — namespace URL template: ${REGISTRY_URL_TEMPLATE}`);

    // Sanity check: every file this build wrote should be discoverable by generateStaticParams
    // in apps/docs/app/r/shadcn/[name]/route.ts (same FILE_NAME slug pattern it uses).
    const FILE_NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.json$/;
    const stray = readdirSync(OUT).filter((name) => !FILE_NAME.test(name));
    if (stray.length > 0) {
        console.error(`registry:shadcn — file name(s) the docs route cannot serve: ${stray.join(", ")}`);
        process.exit(1);
    }
};

build();
