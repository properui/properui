/**
 * End-to-end smoke test for the properui CLI.
 *
 * Builds throwaway Vite + React + TypeScript projects, runs the CLI against two registries:
 *   - the real built registry (`packages/registry/dist`), for the commands whose behaviour
 *     only needs what's on disk today — init, add, diff, list, search, info, agent init;
 *   - a small synthetic registry generated below, for the fields the registry rebuild hasn't
 *     shipped yet (`optionalRegistryDependencies`, per-file `dependencies`/`kind: "demo"`,
 *     `icons.json`, `exports.json`) — this is the only way to exercise that code before the
 *     registry agent's contract lands, and it also proves the on-disk-registry path degrades
 *     gracefully when those fields are absent (search/icons against the real registry, below).
 *
 * Usage: pnpm -F properui smoke   (run `pnpm -F properui build` first)
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(CLI_DIR, "..", "..");
const CLI = path.join(CLI_DIR, "dist", "index.js");
const REGISTRY = path.join(REPO, "packages", "registry", "dist");
const SCRATCH = process.env.SMOKE_DIR ?? path.join(tmpdir(), "properui-cli-smoke");

let failures = 0;
let checks = 0;
/** Exit code of the most recent `run()` call — read immediately after when a check cares. */
let lastStatus = 0;

function check(label: string, condition: boolean, detail = ""): void {
    checks += 1;
    if (condition) {
        console.log(`  ok   ${label}`);
    } else {
        failures += 1;
        console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ""}`);
    }
}

function section(title: string): void {
    console.log(`\n=== ${title} ===`);
}

/**
 * Runs the CLI and returns combined stdout+stderr. Never throws on a non-zero exit — several
 * commands are now *supposed* to exit non-zero (2.6's "fail loudly" contract for `add`, `check`'s
 * lint-style exit code), so callers that care about the exit code read `lastStatus` right after.
 */
function run(cwd: string, args: string[]): string {
    console.log(`\n$ properui ${args.join(" ")}`);
    const result = spawnSync(process.execPath, [CLI, ...args], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, CI: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
    });
    lastStatus = result.status ?? 1;
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    console.log(
        output
            .trimEnd()
            .split("\n")
            .map((line) => `| ${line}`)
            .join("\n"),
    );
    return output;
}

/** Minimal Vite + React project skeleton: package.json, tsconfig paths, src entry, stylesheet. */
function scaffold(dir: string, aliasPrefix: string): void {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(path.join(dir, "src"), { recursive: true });

    writeFileSync(
        path.join(dir, "package.json"),
        `${JSON.stringify(
            {
                name: path.basename(dir),
                private: true,
                type: "module",
                dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
                devDependencies: { typescript: "^5.9.3", vite: "^6.0.0", tailwindcss: "^4.3.3" },
            },
            null,
            2,
        )}\n`,
    );
    writeFileSync(
        path.join(dir, "tsconfig.json"),
        `${JSON.stringify(
            {
                compilerOptions: {
                    target: "ES2022",
                    jsx: "react-jsx",
                    module: "ESNext",
                    moduleResolution: "Bundler",
                    strict: true,
                    baseUrl: ".",
                    paths: { [`${aliasPrefix}*`]: ["./src/*"] },
                },
                include: ["src"],
            },
            null,
            2,
        )}\n`,
    );
    writeFileSync(path.join(dir, "vite.config.ts"), 'import { defineConfig } from "vite";\n\nexport default defineConfig({});\n');
    writeFileSync(path.join(dir, "package-lock.json"), '{ "lockfileVersion": 3 }\n');
    writeFileSync(path.join(dir, "src", "index.css"), "body {\n    margin: 0;\n}\n");
    writeFileSync(path.join(dir, "src", "App.tsx"), 'export const App = () => <div className="bg-primary text-primary">Hello</div>;\n');
    writeFileSync(
        path.join(dir, "src", "main.tsx"),
        [
            'import { StrictMode } from "react";',
            'import { createRoot } from "react-dom/client";',
            'import { App } from "./App";',
            'import "./index.css";',
            "",
            'createRoot(document.getElementById("root")).render(',
            "    <StrictMode>",
            "        <App />",
            "    </StrictMode>,",
            ");",
            "",
        ].join("\n"),
    );
}

interface RegistryEntryShape {
    files: { target: string; content: string; kind?: string; dependencies?: string[] }[];
    registryDependencies: string[];
    optionalRegistryDependencies?: string[];
    dependencies: string[];
}

const readEntry = (name: string): RegistryEntryShape => JSON.parse(readFileSync(path.join(REGISTRY, `${name}.json`), "utf8"));

/**
 * Writes a small hand-authored registry to `dir` exercising the fields the real on-disk
 * registry doesn't have yet: `optionalRegistryDependencies`, per-file `dependencies`,
 * `kind: "demo"` files, `icons.json` and `exports.json`.
 *
 * Shape: widget-util (shared required dep) <- widget-box (needs "left-pad", has a demo file,
 * optionally depends on widget-extra) and widget-extra (also needs widget-util). widget-empty
 * has 0 files, for the "hide empty entries" checks. "SuperCombo" is exported from widget-box
 * but doesn't appear in its name/title/description — only `exports.json` can find it, mirroring
 * 2.8's "search finds ComboBox inside select" case.
 */
function writeMiniRegistry(dir: string): void {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });

    const write = (name: string, data: unknown) => writeFileSync(path.join(dir, name), `${JSON.stringify(data, null, 2)}\n`);

    const indexRow = (over: Record<string, unknown>) => ({
        layer: "base",
        type: "component",
        registryDependencies: [],
        dependencies: [],
        cssVars: [],
        examples: [],
        fileCount: 0,
        ...over,
    });

    write("index.json", {
        $schema: "../schema.json",
        components: [
            indexRow({ name: "widget-util", title: "Widget Util", description: "Shared helper.", fileCount: 1 }),
            indexRow({
                name: "widget-box",
                title: "Widget Box",
                description: "A box for widgets.",
                examples: ["widget-box-example"],
                fileCount: 2,
            }),
            indexRow({ name: "widget-extra", title: "Widget Extra", description: "Optional extra for a widget box.", fileCount: 1 }),
            indexRow({ name: "widget-empty", title: "Widget Empty", description: "Not installable yet.", fileCount: 0 }),
        ],
    });

    write("widget-util.json", {
        name: "widget-util",
        layer: "base",
        type: "component",
        title: "Widget Util",
        description: "Shared helper.",
        registryDependencies: [],
        dependencies: [],
        cssVars: [],
        examples: [],
        files: [
            {
                path: "components/base/widget-util/util.ts",
                target: "components/base/widget-util/util.ts",
                type: "util",
                content: "export const widgetUtil = () => true;\n",
            },
        ],
    });

    write("widget-box.json", {
        name: "widget-box",
        layer: "base",
        type: "component",
        title: "Widget Box",
        description: "A box for widgets.",
        registryDependencies: ["widget-util"],
        optionalRegistryDependencies: ["widget-extra"],
        dependencies: [],
        cssVars: [],
        examples: ["widget-box-example"],
        files: [
            {
                path: "components/base/widget-box/widget-box.tsx",
                target: "components/base/widget-box/widget-box.tsx",
                type: "component",
                content:
                    'import { widgetUtil } from "@/components/base/widget-util/util";\n\n' +
                    "export const WidgetBox = () => (widgetUtil() ? null : null);\n\n" +
                    "// Same component, alternate name — exports.json lists it, but it never appears in the\n" +
                    "// entry's name/title/description, mirroring 2.8's ComboBox-inside-select case.\n" +
                    "export const SuperCombo = WidgetBox;\n",
                dependencies: ["left-pad"],
            },
            {
                path: "components/base/widget-box/widget-box.demo.tsx",
                target: "components/base/widget-box/widget-box.demo.tsx",
                type: "component",
                kind: "demo",
                content: "export const WidgetBoxDemo = () => null;\n",
            },
        ],
    });

    write("widget-extra.json", {
        name: "widget-extra",
        layer: "base",
        type: "component",
        title: "Widget Extra",
        description: "Optional extra for a widget box.",
        registryDependencies: ["widget-util"],
        dependencies: [],
        cssVars: [],
        examples: [],
        files: [
            {
                path: "components/base/widget-extra/widget-extra.tsx",
                target: "components/base/widget-extra/widget-extra.tsx",
                type: "component",
                content: "export const WidgetExtra = () => null;\n",
            },
        ],
    });

    write("widget-empty.json", {
        name: "widget-empty",
        layer: "base",
        type: "component",
        title: "Widget Empty",
        description: "Not installable yet.",
        registryDependencies: [],
        dependencies: [],
        cssVars: [],
        examples: [],
        files: [],
    });

    write("icons.json", { package: "@fancy/icons", alias: "@fancy/icons", names: ["ArrowRight", "ArrowLeft", "SuperSparkle"] });
    write("exports.json", { "widget-box": { "components/base/widget-box/widget-box.tsx": ["WidgetBox", "SuperCombo"] } });
}

/** Same registry as `writeMiniRegistry`, minus icons.json/exports.json — for the "index fields
 *  the registry doesn't publish yet" degrade-gracefully checks. */
function writeBareRegistry(source: string, dest: string): void {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(source)) {
        if (name === "icons.json" || name === "exports.json") continue;
        writeFileSync(path.join(dest, name), readFileSync(path.join(source, name)));
    }
}

function main(): void {
    if (!existsSync(CLI)) throw new Error(`${CLI} not found — run \`pnpm -F properui build\` first.`);
    if (!existsSync(REGISTRY)) throw new Error(`${REGISTRY} not found — the registry has to be built first.`);

    mkdirSync(SCRATCH, { recursive: true });
    console.log(`scratch: ${SCRATCH}`);

    const MINI_REGISTRY = path.join(SCRATCH, "mini-registry");
    writeMiniRegistry(MINI_REGISTRY);
    const BARE_REGISTRY = path.join(SCRATCH, "mini-registry-bare");
    writeBareRegistry(MINI_REGISTRY, BARE_REGISTRY);

    // -------------------------------------------------------------- scenario 1
    section("Scenario 1 — Vite + TS project on the default @/ alias");
    const app = path.join(SCRATCH, "vite-app");
    scaffold(app, "@/");

    const initOutput = run(app, ["init", "--manual", "--yes"]);
    check("init detects Vite", initOutput.includes("Vite"));
    check("init detects TypeScript", initOutput.includes("TypeScript"));
    check("init detects the @/ alias", initOutput.includes("Import alias    @/"));
    check("init detects Tailwind v4", initOutput.includes("Tailwind        v4"));
    check("init detects the npm lockfile", initOutput.includes("Package manager npm"));

    const config = JSON.parse(readFileSync(path.join(app, "components.json"), "utf8"));
    check("components.json aliases", config.aliases.components === "@/components" && config.aliases.ui === "@/components/base", JSON.stringify(config.aliases));
    check("components.json tsx: true", config.tsx === true);
    check("components.json theme path", config.tailwind.theme === "src/styles/theme.css", String(config.tailwind.theme));
    check("components.json css path", config.tailwind.css === "src/index.css", String(config.tailwind.css));
    check("theme.css written", existsSync(path.join(app, "src", "styles", "theme.css")));
    check("utils/cx.ts created", existsSync(path.join(app, "src", "utils", "cx.ts")));
    check("ThemeProvider created", existsSync(path.join(app, "src", "providers", "theme-provider.tsx")));

    const css = readFileSync(path.join(app, "src", "index.css"), "utf8");
    check("stylesheet imports tailwind", css.includes('@import "tailwindcss";'));
    check("stylesheet imports theme tokens", css.includes('@import "./styles/theme.css";'));
    check("stylesheet has the @source scan line", css.includes('@source "./components/**/*.{ts,tsx,js,jsx}";'), css.split("\n").slice(0, 4).join(" / "));
    check("stylesheet keeps existing rules", css.includes("body {"));
    check("--manual left main.tsx alone", !readFileSync(path.join(app, "src", "main.tsx"), "utf8").includes("ThemeProvider"));

    // -------------------------------------------------------------- info: fresh project, no components.json
    section("info — reachability probe runs with no components.json (2.7)");
    const freshDir = path.join(SCRATCH, "fresh-no-config");
    scaffold(freshDir, "@/");
    const freshInfo = JSON.parse(run(freshDir, ["info", "--json", "--registry", REGISTRY]).trim());
    check("info reports no config present", freshInfo.config.present === false);
    check("info still probes the registry with no components.json", freshInfo.registryReachable === true, JSON.stringify(freshInfo.registryReachable));
    check("info reports no installed entries with no config", Object.keys(freshInfo.installed).length === 0);

    const freshInfoBadRegistry = JSON.parse(run(freshDir, ["info", "--json", "--registry", path.join(SCRATCH, "no-such-registry")]).trim());
    check("info reports registryReachable: false for a bad registry source", freshInfoBadRegistry.registryReachable === false);

    // -------------------------------------------------------------- dry run
    section("add badges --dry-run");
    const badges = readEntry("badges");
    const dryRun = run(app, ["add", "badges", "--registry", REGISTRY, "--dry-run"]);
    check("dry run says nothing was written", dryRun.includes("dry run"));
    check(
        "dry run resolved registryDependencies",
        badges.registryDependencies.every((name) => dryRun.includes(name)),
        badges.registryDependencies.join(", "),
    );
    check(
        "dry run created no files",
        badges.files.every((file) => !existsSync(path.join(app, "src", file.target))),
    );

    // -------------------------------------------------------------- real run
    section("add badges");
    const added = run(app, ["add", "badges", "--registry", REGISTRY]);
    for (const file of badges.files) {
        const target = path.join(app, "src", file.target);
        check(`copied src/${file.target}`, existsSync(target));
        if (!existsSync(target)) continue;
        const local = readFileSync(target, "utf8");
        check(`src/${file.target} content matches the registry`, local === file.content);
        const specifiers = [...local.matchAll(/from "([^"]+)"/g)].map((match) => match[1] ?? "");
        check(
            `src/${file.target} internal imports use the project alias`,
            specifiers.filter((value) => value.startsWith("@/")).every((value) => value.startsWith(config.aliases.components.slice(0, 2))),
            specifiers.join(", "),
        );
    }
    for (const dependency of badges.registryDependencies) {
        const entry = readEntry(dependency);
        for (const file of entry.files) check(`dependency ${dependency}: src/${file.target}`, existsSync(path.join(app, "src", file.target)));
    }
    check("npm dependencies reported", added.includes("@properui/icons"));
    check(
        "add with no --yes and no TTY exits non-zero and fails loudly instead of silently skipping install (2.6)",
        lastStatus !== 0 && added.includes("Install to finish:"),
        `status=${lastStatus}`,
    );

    const addedConfig = JSON.parse(readFileSync(path.join(app, "components.json"), "utf8"));
    check("add records badges in the installed manifest (2.10)", Boolean(addedConfig.installed?.badges), JSON.stringify(addedConfig.installed?.badges));
    check(
        "installed manifest lists badges' files",
        badges.files.every((file) => addedConfig.installed.badges.files.includes(`src/${file.target}`)),
        JSON.stringify(addedConfig.installed?.badges?.files),
    );
    check(
        "installed manifest has a version and installedAt",
        Boolean(addedConfig.installed.badges.version) && Boolean(addedConfig.installed.badges.installedAt),
    );

    // -------------------------------------------------------------- idempotency
    section("add badges (second run — must be a no-op)");
    const second = run(app, ["add", "badges", "--registry", REGISTRY]);
    check("second run reports no changes", second.includes("No changes"));
    check("second run added nothing", !second.includes("added  src/"));

    // -------------------------------------------------------------- diff/list/search
    section("diff / list / search");
    const diffClean = run(app, ["diff", "badges", "--registry", REGISTRY]);
    check("diff is clean right after add", diffClean.includes("No local modifications"));

    const diffAll = run(app, ["diff", "--registry", REGISTRY]);
    check(
        "diff with no argument uses the installed manifest (badges + its 2 registryDependencies) instead of rescanning the whole index",
        diffAll.includes("Comparing 3 components"),
        diffAll,
    );

    const firstBadgeFile = badges.files[0];
    if (!firstBadgeFile) throw new Error("badges.json has no files");
    const badgeFile = path.join(app, "src", firstBadgeFile.target);
    writeFileSync(badgeFile, `${readFileSync(badgeFile, "utf8")}\n// local tweak\n`);
    const diffDirty = run(app, ["diff", "badges", "--registry", REGISTRY]);
    check("diff detects a local modification", diffDirty.includes("differ from the registry") && diffDirty.includes("local tweak"));

    const list = run(app, ["list", "--layer", "base", "--registry", REGISTRY]);
    check("list --layer base filters by layer", list.includes("badges") && !list.includes("about-page-01"));
    check("list hides 0-file entries (typography)", !list.includes("typography"));
    check("list shows a file count", /\d+ files?/.test(list));

    const search = run(app, ["search", "badge", "--registry", REGISTRY]);
    check("search finds badges", search.includes("badges"));
    check("search labels counts honestly as docs examples and files", /\d+ docs examples/.test(search) && /\d+ files?/.test(search));

    const searchNoMatch = run(app, ["search", "zzz-not-a-real-thing-qqq", "--registry", REGISTRY]);
    check('search prints "no match" for a real threshold miss', searchNoMatch.includes(`no match for "zzz-not-a-real-thing-qqq"`));

    const searchTypography = run(app, ["search", "typography", "--registry", REGISTRY]);
    check("search never surfaces a 0-file entry even on an exact name hit", !searchTypography.split("\n").some((line) => /^\s*typography\s/.test(line)));

    // -------------------------------------------------------------- scenario 2
    section("Scenario 2 — project on a ~/ alias (import rewriting)");
    const aliased = path.join(SCRATCH, "vite-app-tilde");
    scaffold(aliased, "~/");
    run(aliased, ["init", "--manual", "--yes", "--registry", REGISTRY]);

    const tildeConfig = JSON.parse(readFileSync(path.join(aliased, "components.json"), "utf8"));
    check("init picks up the ~/ alias", tildeConfig.aliases.components === "~/components", String(tildeConfig.aliases.components));
    check(
        "init pulled the real theme.css from the registry",
        readFileSync(path.join(aliased, "src", "styles", "theme.css"), "utf8").includes("--color-brand-600"),
    );

    run(aliased, ["add", "badges", "--registry", REGISTRY]);
    const rewritten = readFileSync(path.join(aliased, "src", "components", "base", "badges", "badges.tsx"), "utf8");
    check("imports rewritten to ~/", rewritten.includes('from "~/utils/cx"'), rewritten.split("\n").slice(0, 8).join(" / "));
    check("no @/ imports remain", !rewritten.includes('from "@/'));

    // -------------------------------------------------------------- scenario 3
    section("Scenario 3 — add example");
    const example = run(aliased, ["add", "example", "settings-01", "--registry", REGISTRY]);
    const settings = readEntry("settings-01");
    check(
        "example files copied",
        settings.files.every((file) => existsSync(path.join(aliased, "src", file.target))),
    );
    check(
        "example pulled in the components it uses",
        settings.registryDependencies.every((name) => example.includes(name)),
        settings.registryDependencies.join(", "),
    );

    // -------------------------------------------------------------- scenario 3b: optional deps, demos, per-file attribution
    section("Scenario 3b — mini registry: optional deps, demo files, per-file dependency attribution");
    const miniApp = path.join(SCRATCH, "mini-app");
    scaffold(miniApp, "@/");
    run(miniApp, ["init", "--manual", "--yes", "--registry", MINI_REGISTRY]);

    const withOptional = run(miniApp, ["add", "widget-box", "--registry", MINI_REGISTRY]);
    check("optional dependency is installed by default", existsSync(path.join(miniApp, "src", "components", "base", "widget-extra", "widget-extra.tsx")));
    check("Files section labels the optional entry", withOptional.includes("widget-extra") && withOptional.includes("(optional)"));
    check("demo file is not written without --with-demos", !existsSync(path.join(miniApp, "src", "components", "base", "widget-box", "widget-box.demo.tsx")));
    check(
        "npm dependency is attributed to the file that needs it (2.10)",
        withOptional.includes("left-pad") && withOptional.includes("widget-box.tsx"),
        withOptional,
    );

    const miniConfig = JSON.parse(readFileSync(path.join(miniApp, "components.json"), "utf8"));
    check("installed manifest recorded the required dep (widget-util)", Boolean(miniConfig.installed?.["widget-util"]));
    check("installed manifest recorded the optional dep (widget-extra)", Boolean(miniConfig.installed?.["widget-extra"]));

    run(miniApp, ["add", "widget-box", "--with-demos", "--overwrite", "--registry", MINI_REGISTRY]);
    check("--with-demos writes the demo file", existsSync(path.join(miniApp, "src", "components", "base", "widget-box", "widget-box.demo.tsx")));

    const miniAppNoOptional = path.join(SCRATCH, "mini-app-no-optional");
    scaffold(miniAppNoOptional, "@/");
    run(miniAppNoOptional, ["init", "--manual", "--yes", "--registry", MINI_REGISTRY]);
    const withoutOptional = run(miniAppNoOptional, ["add", "widget-box", "--no-optional", "--registry", MINI_REGISTRY]);
    check("--no-optional skips the optional dependency's files", !existsSync(path.join(miniAppNoOptional, "src", "components", "base", "widget-extra")));
    check("--no-optional keeps the required dependency", existsSync(path.join(miniAppNoOptional, "src", "components", "base", "widget-util", "util.ts")));
    check("--no-optional's Files section has no (optional) entries", !withoutOptional.includes("(optional)"));

    const registryWithoutDemos = run(miniApp, ["add", "widget-util", "--with-demos", "--registry", REGISTRY]);
    void registryWithoutDemos; // not asserted further — the real registry publishes no demo files at all yet

    // -------------------------------------------------------------- remove / why
    section("remove / why (2.10)");
    const whyDirect = run(miniApp, ["why", "widget-box", "--registry", MINI_REGISTRY]);
    check("why reports a directly-installed root", whyDirect.includes("installed directly"));

    const whyOptional = run(miniApp, ["why", "widget-extra", "--registry", MINI_REGISTRY]);
    check("why traces an optional dependency back to its root", whyOptional.includes("widget-box") && whyOptional.includes("widget-extra"), whyOptional);

    const whyByFile = run(miniApp, ["why", "components/base/widget-util/util.ts", "--registry", MINI_REGISTRY]);
    check("why resolves a file path to its owning entry", whyByFile.includes("widget-box") && whyByFile.includes("widget-util"), whyByFile);

    const removeExtra = run(miniApp, ["remove", "widget-extra", "--registry", MINI_REGISTRY]);
    check(
        "remove deletes the removed entry's file",
        removeExtra.includes("remove") && !existsSync(path.join(miniApp, "src", "components", "base", "widget-extra", "widget-extra.tsx")),
    );
    check(
        "remove does not touch a file still needed by another installed entry",
        existsSync(path.join(miniApp, "src", "components", "base", "widget-util", "util.ts")),
    );

    const miniConfigAfterRemove = JSON.parse(readFileSync(path.join(miniApp, "components.json"), "utf8"));
    check("remove drops the entry from the installed manifest", !("widget-extra" in (miniConfigAfterRemove.installed ?? {})));

    const removeUnknown = run(miniApp, ["remove", "not-a-real-entry", "--registry", MINI_REGISTRY]);
    check("remove warns about an entry that was never installed", removeUnknown.includes("not-a-real-entry"));

    // -------------------------------------------------------------- icons / search --icons
    section("icons (2.8)");
    const iconsHit = run(miniApp, ["icons", "arrow", "--registry", MINI_REGISTRY]);
    check("icons finds a fuzzy match", iconsHit.includes("ArrowRight") && iconsHit.includes("ArrowLeft"));
    check("icons prints the import line", iconsHit.includes('import { ArrowRight } from "@fancy/icons";'));

    const iconsViaSearch = run(miniApp, ["search", "arrow", "--icons", "--registry", MINI_REGISTRY]);
    check("search --icons delegates to the icon index", iconsViaSearch.includes("ArrowRight"));

    const iconsNotAvailable = run(miniApp, ["icons", "arrow", "--registry", BARE_REGISTRY]);
    check("icons degrades gracefully when the registry has no icons.json (index field absent)", iconsNotAvailable.toLowerCase().includes("not available"));

    const searchIconsNotAvailable = run(miniApp, ["search", "arrow", "--icons", "--registry", BARE_REGISTRY]);
    check("search --icons degrades the same way through the delegation path", searchIconsNotAvailable.toLowerCase().includes("not available"));

    const exportSearch = run(miniApp, ["search", "supercombo", "--registry", MINI_REGISTRY]);
    check(
        "search indexes exports.json (nested-by-file shape) and finds a symbol not in the entry's own name/title (2.8)",
        exportSearch.includes("widget-box") && exportSearch.includes("SuperCombo"),
        exportSearch,
    );
    check("search resolves the export back to the file that actually declares it", exportSearch.includes("widget-box.tsx"), exportSearch);

    const noExportsSearch = run(miniApp, ["search", "supercombo", "--registry", BARE_REGISTRY]);
    check("search degrades gracefully with no exports.json: no crash, just no match", noExportsSearch.includes(`no match for "supercombo"`), noExportsSearch);

    // Same scenario against the real shipped registry, whose exports.json is a flat
    // `entry -> names[]` list (no per-file breakdown) — "select" exports ComboBox but neither
    // word appears in its name/title/description (2.8's literal reported case).
    const comboboxSearch = run(app, ["search", "combobox", "--registry", REGISTRY]);
    check(
        'search finds "select" via a flat exports.json entry and reports the actual file (2.8)',
        comboboxSearch.includes("select") && comboboxSearch.includes("ComboBox") && comboboxSearch.includes("combobox.tsx"),
        comboboxSearch,
    );

    const miniList = run(miniApp, ["list", "--registry", MINI_REGISTRY]);
    check("list hides the mini registry's 0-file entry", !miniList.includes("widget-empty"));

    // -------------------------------------------------------------- check (2.21)
    section("check (2.21)");
    const checkDir = path.join(SCRATCH, "check-project");
    mkdirSync(path.join(checkDir, "src"), { recursive: true });
    writeFileSync(
        path.join(checkDir, "src", "bad.tsx"),
        'export const Bad = () => <div className="bg-red-500 dark:bg-black">bad</div>;\n' +
            'export const AlsoBad = () => <span className="text-[#ff0000]">arbitrary</span>;\n',
    );
    writeFileSync(path.join(checkDir, "src", "good.tsx"), 'export const Good = () => <div className="bg-primary outline-utility-blue-500">good</div>;\n');
    mkdirSync(path.join(checkDir, "node_modules", "somedep"), { recursive: true });
    writeFileSync(path.join(checkDir, "node_modules", "somedep", "index.tsx"), 'export const X = () => <div className="bg-red-500" />;\n');

    const badCheck = run(checkDir, ["check"]);
    check("check catches a raw palette class", badCheck.includes("bad.tsx") && badCheck.includes("bg-red-500"));
    check("check catches a hardcoded dark: variant", badCheck.includes("dark:bg-black"));
    check("check catches an arbitrary colour value", badCheck.includes("text-[#ff0000]") || badCheck.includes("#ff0000"));
    check("check ignores the kit's -utility- tokens", !badCheck.includes("outline-utility-blue-500"));
    check("check skips node_modules", !badCheck.includes("somedep"));
    check("check exits non-zero on findings", lastStatus !== 0);

    const cleanDir = path.join(SCRATCH, "check-project-clean");
    mkdirSync(path.join(cleanDir, "src"), { recursive: true });
    writeFileSync(path.join(cleanDir, "src", "good.tsx"), 'export const Good = () => <div className="bg-primary text-primary">good</div>;\n');
    run(cleanDir, ["check"]);
    check("check exits 0 with no findings", lastStatus === 0);

    const checkHelp = run(checkDir, ["check", "--help"]);
    check("check --help documents the regexes it uses", checkHelp.includes("bg|text|border") && checkHelp.includes("dark:") && checkHelp.includes("utility-"));

    const pkgVersion = (JSON.parse(readFileSync(path.join(CLI_DIR, "package.json"), "utf8")) as { version: string }).version;
    check(`--version prints the package.json version (${pkgVersion})`, run(checkDir, ["--version"]).trim() === pkgVersion);

    // -------------------------------------------------------------- scenario 4
    section("Scenario 4 — ThemeProvider wiring without --manual");
    const wired = path.join(SCRATCH, "vite-app-wired");
    scaffold(wired, "@/");
    run(wired, ["init", "--vite", "--yes", "--registry", REGISTRY]);
    const mainTsx = readFileSync(path.join(wired, "src", "main.tsx"), "utf8");
    check("Vite entry imports the provider", mainTsx.includes('import { ThemeProvider } from "@/providers/theme-provider";'));
    check("Vite entry is wrapped", mainTsx.includes("<ThemeProvider>") && mainTsx.includes("</ThemeProvider>"));

    const nextApp = path.join(SCRATCH, "next-app");
    scaffold(nextApp, "@/");
    mkdirSync(path.join(nextApp, "src", "app"), { recursive: true });
    writeFileSync(
        path.join(nextApp, "src", "app", "layout.tsx"),
        [
            'import "./globals.css";',
            "",
            "export default function RootLayout({ children }: { children: React.ReactNode }) {",
            "    return (",
            '        <html lang="en">',
            "            <body>{children}</body>",
            "        </html>",
            "    );",
            "}",
            "",
        ].join("\n"),
    );
    writeFileSync(path.join(nextApp, "src", "app", "globals.css"), "");
    run(nextApp, ["init", "--nextjs", "--yes", "--registry", REGISTRY]);
    const layout = readFileSync(path.join(nextApp, "src", "app", "layout.tsx"), "utf8");
    check("Next.js App Router layout is wrapped", layout.includes("<ThemeProvider>") && layout.includes("</ThemeProvider>"));
    check("Next.js theme import added", layout.includes('import { ThemeProvider } from "@/providers/theme-provider";'));

    // -------------------------------------------------------------- scenario 5
    section("Scenario 5 — info --json");
    const infoJson = run(app, ["info", "--json", "--registry", REGISTRY]);
    const info = JSON.parse(infoJson.slice(infoJson.indexOf("{")));
    check("info reports the detected framework", info.framework === "vite", String(info.framework));
    check("info reports Tailwind v4", info.tailwindVersion === 4, String(info.tailwindVersion));
    check("info reports the components.json aliases", info.config.aliases?.components === "@/components", JSON.stringify(info.config.aliases));
    check("info reports the theme CSS path", info.config.theme === "src/styles/theme.css", String(info.config.theme));
    check("info reports registryReachable: true with components.json and network", info.registryReachable === true);
    check("info lists badges as an installed entry (from the manifest)", "badges" in info.installed, JSON.stringify(Object.keys(info.installed)));
    check("info's installed record carries a version", Boolean(info.installed.badges?.version));

    const infoHuman = run(app, ["info", "--registry", REGISTRY]);
    check("info (human) reports the framework", infoHuman.includes("Framework"));
    check("info (human) lists installed entries", infoHuman.includes("badges"));

    // -------------------------------------------------------------- scenario 6
    section("Scenario 6 — agent init");
    const agentAll = run(app, ["agent", "init", "--client", "all", "--yes"]);
    check("agent init installs for claude", existsSync(path.join(app, ".claude", "skills", "properui", "SKILL.md")));
    check("agent init installs for codex", existsSync(path.join(app, ".agents", "skills", "properui", "SKILL.md")));
    check("agent init installs for cursor", existsSync(path.join(app, ".cursor", "rules", "properui.mdc")));
    check("agent init prints the Lovable import URL", agentAll.includes("github.com/properui/properui/blob/main/skills/properui/SKILL.md"));

    const claudeSkill = readFileSync(path.join(app, ".claude", "skills", "properui", "SKILL.md"), "utf8");
    check("claude Skill has name frontmatter", claudeSkill.includes("name: properui"));
    const codexSkill = readFileSync(path.join(app, ".agents", "skills", "properui", "SKILL.md"), "utf8");
    check("codex Skill matches the claude Skill byte-for-byte", codexSkill === claudeSkill);

    const claudeMd = readFileSync(path.join(app, "CLAUDE.md"), "utf8");
    check("CLAUDE.md got a Proper UI pointer", claudeMd.includes("properui:skill:start") && claudeMd.includes(".claude/skills/properui/SKILL.md"));
    const agentsMd = readFileSync(path.join(app, "AGENTS.md"), "utf8");
    check("AGENTS.md got a Proper UI rules block", agentsMd.includes("properui:agents:start") && agentsMd.includes(".agents/skills/properui/SKILL.md"));
    const cursorRule = readFileSync(path.join(app, ".cursor", "rules", "properui.mdc"), "utf8");
    check("cursor rule has alwaysApply: true", cursorRule.includes("alwaysApply: true"));

    // MCP server registration: project-level JSON configs for claude and cursor, a printed TOML
    // block for codex (its config lives in ~/.codex, outside the project).
    type McpConfig = { mcpServers?: Record<string, { command?: string; args?: string[] }> };
    const readMcp = (file: string) => JSON.parse(readFileSync(file, "utf8")) as McpConfig;
    const claudeMcp = existsSync(path.join(app, ".mcp.json")) ? readMcp(path.join(app, ".mcp.json")) : {};
    check("agent init registers the MCP server in .mcp.json", claudeMcp.mcpServers?.properui?.args?.includes("@properui/mcp") === true);
    const cursorMcp = existsSync(path.join(app, ".cursor", "mcp.json")) ? readMcp(path.join(app, ".cursor", "mcp.json")) : {};
    check("agent init registers the MCP server in .cursor/mcp.json", cursorMcp.mcpServers?.properui?.command === "npx");
    check("agent init prints the Codex MCP TOML block", agentAll.includes("[mcp_servers.properui]"));

    writeFileSync(path.join(app, ".mcp.json"), JSON.stringify({ mcpServers: { other: { command: "other-server" } } }, null, 2));
    run(app, ["agent", "init", "--client", "claude", "--yes"]);
    const mergedMcp = readMcp(path.join(app, ".mcp.json"));
    check("agent init merges into an existing .mcp.json", Boolean(mergedMcp.mcpServers?.other) && Boolean(mergedMcp.mcpServers?.properui));

    const noMcpApp = path.join(SCRATCH, "no-mcp-app");
    rmSync(noMcpApp, { recursive: true, force: true });
    mkdirSync(noMcpApp, { recursive: true });
    run(noMcpApp, ["agent", "init", "--client", "claude", "--no-mcp", "--yes"]);
    check(
        "agent init --no-mcp writes the Skill but no .mcp.json",
        existsSync(path.join(noMcpApp, ".claude", "skills", "properui", "SKILL.md")) && !existsSync(path.join(noMcpApp, ".mcp.json")),
    );

    // Idempotency: re-running with a pre-existing CLAUDE.md/AGENTS.md must update the marked
    // block in place, not duplicate it, and must never touch content outside the markers.
    writeFileSync(path.join(app, "CLAUDE.md"), `# My project\n\nSome existing notes.\n\n${claudeMd}`);
    run(app, ["agent", "init", "--client", "claude", "--yes"]);
    const claudeMdAgain = readFileSync(path.join(app, "CLAUDE.md"), "utf8");
    check("re-running agent init keeps pre-existing CLAUDE.md content", claudeMdAgain.includes("Some existing notes."));
    check("re-running agent init does not duplicate the marked block", claudeMdAgain.split("properui:skill:start").length === 2);

    const agentLovable = run(app, ["agent", "init", "--client", "lovable", "--yes"]);
    check("agent init --client lovable writes no local skill file for lovable itself", !agentLovable.includes(".claude/skills"));
    check("agent init --client lovable points at the SKILL.md source", agentLovable.includes("skills/properui/SKILL.md"));

    section("Skill source of truth");

    // The published CLI cannot read the monorepo, so agent-templates.ts carries a copy of
    // skills/properui/SKILL.md. Nothing stops an edit to one from missing the other.
    const authored = readFileSync(path.join(REPO, "skills", "properui", "SKILL.md"), "utf8").trim();
    const skillWritten = readFileSync(path.join(app, ".claude", "skills", "properui", "SKILL.md"), "utf8").trim();
    check(
        "the Skill `agent init` writes matches skills/properui/SKILL.md",
        skillWritten === authored,
        `authored ${authored.length} chars, written ${skillWritten.length}`,
    );

    // -------------------------------------------------------------- theme presets
    section("Theme presets — init --preset, theme list, theme apply");
    const themed = path.join(SCRATCH, "theme-app");
    scaffold(themed, "@/");
    run(themed, ["init", "--vite", "--yes", "--registry", REGISTRY, "--preset", "teal"]);
    const themedCssFile = path.join(themed, "src", "index.css");
    const themedCss = readFileSync(themedCssFile, "utf8");
    const presetBlocks = (css: string) => css.split("/* properui:theme-preset */").length - 1;
    check("init --preset writes one marked preset block", presetBlocks(themedCss) === 1);
    check("init --preset writes the teal brand ramp", themedCss.includes("--color-brand-600: rgb(13 148 136);"));
    check(
        "the preset block comes after the theme import",
        themedCss.indexOf("/* properui:theme-preset */") > themedCss.indexOf('@import "./styles/theme.css";'),
    );
    check("init --preset keeps the pre-existing stylesheet content", themedCss.includes("margin: 0;"));

    const badPreset = path.join(SCRATCH, "theme-app-bad");
    scaffold(badPreset, "@/");
    run(badPreset, ["init", "--vite", "--yes", "--registry", REGISTRY, "--preset", "not-a-preset"]);
    check("init --preset with an unknown preset exits non-zero", lastStatus !== 0);
    check("init --preset with an unknown preset writes nothing", !existsSync(path.join(badPreset, "components.json")));

    const themeListJson = run(themed, ["theme", "list", "--json"]);
    const themeList = JSON.parse(themeListJson.slice(themeListJson.indexOf("["))) as { name: string; code: string }[];
    check("theme list --json lists at least 8 presets", themeList.length >= 8, String(themeList.length));
    check(
        "theme list --json includes codes",
        themeList.every((entry) => /^[A-Za-z0-9_-]+$/.test(entry.code)),
    );
    const themeListHuman = run(themed, ["theme", "list"]);
    check("theme list marks the applied preset", /teal.*\(applied\)/.test(themeListHuman));

    run(themed, ["theme", "apply", "rose"]);
    const roseCss = readFileSync(themedCssFile, "utf8");
    check("theme apply replaces the block in place", presetBlocks(roseCss) === 1 && roseCss.includes("--color-brand-600: rgb(225 29 72);"));
    check("theme apply removed the previous preset", !roseCss.includes("rgb(13 148 136)"));

    const roseAgain = run(themed, ["theme", "apply", "rose"]);
    check("theme apply is idempotent", readFileSync(themedCssFile, "utf8") === roseCss && roseAgain.includes("already applied"));

    const roseCode = themeList.find((entry) => entry.name === "rose")?.code ?? "";
    const indigoCode = themeList.find((entry) => entry.name === "indigo")?.code ?? "";
    run(themed, ["theme", "apply", indigoCode]);
    check("theme apply accepts a preset code", readFileSync(themedCssFile, "utf8").includes("--color-brand-600: rgb(79 70 229);"));
    check("preset codes differ per preset", roseCode !== indigoCode && roseCode.length > 0);

    run(themed, ["theme", "apply", "green", "--css", "src/other.css"]);
    check("theme apply --css writes to the named file", readFileSync(path.join(themed, "src", "other.css"), "utf8").includes("/* properui:theme-preset */"));

    const beforeDry = readFileSync(themedCssFile, "utf8");
    const dry = run(themed, ["theme", "apply", "blue", "--dry-run"]);
    check("theme apply --dry-run writes nothing", readFileSync(themedCssFile, "utf8") === beforeDry && dry.includes("would write"));

    run(themed, ["theme", "apply", "definitely-not-a-code"]);
    check("theme apply with garbage exits non-zero", lastStatus !== 0);

    // -------------------------------------------------------------- create
    section("create — scaffold a new project from an embedded template");

    const created = path.join(SCRATCH, "created-app");
    rmSync(created, { recursive: true, force: true });
    run(SCRATCH, ["create", "created-app", "--template", "vite", "--registry", REGISTRY]);

    check("create writes package.json", existsSync(path.join(created, "package.json")));
    check("create writes tsconfig.json with the @/* alias", readFileSync(path.join(created, "tsconfig.json"), "utf8").includes('"@/*"'));
    check("create writes vite.config.ts", existsSync(path.join(created, "vite.config.ts")));
    check("create writes a stylesheet importing tailwind", readFileSync(path.join(created, "src", "index.css"), "utf8").includes('@import "tailwindcss";'));
    const createdHome = readFileSync(path.join(created, "src", "App.tsx"), "utf8");
    check("create writes a home page rendering Button and Badge", createdHome.includes("<Button") && createdHome.includes("<Badge"));

    const createdConfig = existsSync(path.join(created, "components.json"))
        ? (JSON.parse(readFileSync(path.join(created, "components.json"), "utf8")) as { aliases?: { components?: string } })
        : null;
    check("create ran `init`: components.json written", Boolean(createdConfig?.aliases?.components));
    check("create ran `add buttons badges`: buttons installed", existsSync(path.join(created, "src", "components", "base", "buttons", "button.tsx")));
    check("create ran `add buttons badges`: badges installed", existsSync(path.join(created, "src", "components", "base", "badges", "badges.tsx")));
    check(
        "create wrote real theme tokens (registry was reachable, even as a local directory)",
        readFileSync(path.join(created, "src", "styles", "theme.css"), "utf8").includes("--color-brand-600"),
    );

    // No --install was passed and the smoke harness runs non-interactively (stdin isn't a TTY),
    // so nothing here should ever shell out to a package manager against the network: `add`'s own
    // "no --yes, no TTY" contract (2.6) fails loudly instead, which is exactly what should happen.
    check("create never ran an actual install: no node_modules written", !existsSync(path.join(created, "node_modules")));
    check("create's `add` step reports the pending install instead of silently skipping it", lastStatus !== 0);

    // Refuses a non-empty directory without --overwrite.
    const occupied = path.join(SCRATCH, "occupied");
    rmSync(occupied, { recursive: true, force: true });
    mkdirSync(occupied, { recursive: true });
    writeFileSync(path.join(occupied, "keep.txt"), "pre-existing file\n");

    run(SCRATCH, ["create", "occupied", "--registry", REGISTRY]);
    check("create refuses a non-empty directory without --overwrite", lastStatus !== 0 && !existsSync(path.join(occupied, "package.json")));
    check("create left the pre-existing file alone after refusing", existsSync(path.join(occupied, "keep.txt")));

    run(SCRATCH, ["create", "occupied", "--template", "next", "--overwrite", "--registry", REGISTRY]);
    check("create --overwrite scaffolds a Next.js project into a non-empty directory", existsSync(path.join(occupied, "next.config.ts")));
    check("create --overwrite writes the Next.js App Router home page", existsSync(path.join(occupied, "app", "page.tsx")));
    check("create --overwrite keeps the pre-existing, unrelated file", existsSync(path.join(occupied, "keep.txt")));

    const unknownTemplate = run(SCRATCH, ["create", "bad-template-app", "--template", "sveltekit", "--registry", REGISTRY]);
    check("create rejects an unknown --template", lastStatus !== 0 && unknownTemplate.toLowerCase().includes("template"));

    console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${checks - failures}/${checks} checks passed.`);
    if (failures > 0) process.exitCode = 1;
}

main();
