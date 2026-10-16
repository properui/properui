/**
 * Clean-room release test for the properui CLI.
 *
 * Proves a stranger can go from nothing to a building app using only the documented path:
 * scaffold a blank Next.js/Vite app with the framework's own official CLI, run
 * `properui init` and `properui add` against the *built* registry (no shortcuts, no
 * fixtures), let real `npm install`s happen for the components' dependencies, and run the
 * app's own `npm run build`.
 *
 * Unlike packages/cli/scripts/smoke.ts (which passes `--yes` in a sense that never installs
 * anything, by design, to stay fast), this script performs real npm installs end to end so a
 * dependency that resolves in components.json/registry metadata but does not actually exist
 * on npm — like the bug fixed in packages/cli/src/deps.ts, where component source imports the
 * bare specifier `@properui/icons` but the package published to npm is `@untitledui/icons`
 * — gets caught before it reaches a real user.
 *
 * Usage: pnpm test:clean-room   (builds packages/registry first if their dist/ is missing)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(REPO, "packages", "cli", "dist", "index.js");
const REGISTRY = path.join(REPO, "packages", "registry", "dist");
const RUN_ROOT = path.join(tmpdir(), `properui-clean-room-${Date.now()}`);

/**
 * The registry entries this run adds, chosen to touch every layer the task asked for plus a
 * hook: `badges` (base), `alerts` (application), `social-proof-sections` (marketing) and
 * `use-clipboard` (hook) via one `add`, then `settings-17` (app-examples) via `add example`.
 * `badges` and `settings-17` both pull in `@properui/icons`, so the npm-alias install path
 * gets exercised twice, once per framework.
 */
const COMPONENTS = ["badges", "alerts", "social-proof-sections", "use-clipboard"];
const EXAMPLE = "settings-17";

let currentStep = "startup";

function section(title: string): void {
    console.log(`\n${"=".repeat(3)} ${title} ${"=".repeat(3)}`);
}

/** Runs a command to completion, printing what it did and failing loudly with full output. */
function run(cwd: string, cmd: string, args: string[], options: { timeout?: number; env?: NodeJS.ProcessEnv } = {}): string {
    currentStep = `${cmd} ${args.join(" ")} (in ${cwd})`;
    console.log(`\n$ ${cmd} ${args.join(" ")}\n  (cwd: ${cwd})`);
    try {
        const output = execFileSync(cmd, args, {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            timeout: options.timeout ?? 8 * 60 * 1000,
            maxBuffer: 1024 * 1024 * 128,
            env: { ...process.env, CI: "1", NO_COLOR: "1", FORCE_COLOR: "0", ...options.env },
        });
        console.log(output.trimEnd());
        return output;
    } catch (error) {
        const failure = error as { stdout?: string; stderr?: string; message: string };
        console.error(`\n!!! FAILED: ${cmd} ${args.join(" ")}`);
        if (failure.stdout) console.error(`--- stdout ---\n${failure.stdout}`);
        if (failure.stderr) console.error(`--- stderr ---\n${failure.stderr}`);
        throw new Error(`Clean-room failed at: ${cmd} ${args.join(" ")}\n${failure.message}`);
    }
}

/** Builds packages/registry dist output when it is missing, exactly like CI does from scratch. */
function ensureBuilt(): void {
    if (existsSync(CLI) && existsSync(path.join(REGISTRY, "index.json"))) {
        console.log(`Using existing build: ${CLI}\nUsing existing registry: ${REGISTRY}`);
        return;
    }
    section("Prereq — building packages and registry (dist missing)");
    run(REPO, "pnpm", ["build:packages"]);
    run(REPO, "pnpm", ["registry:build"]);
    if (!existsSync(CLI)) throw new Error(`${CLI} still missing after build:packages.`);
    if (!existsSync(path.join(REGISTRY, "index.json"))) throw new Error(`${REGISTRY}/index.json still missing after registry:build.`);
}

function readJson<T>(file: string): T {
    return JSON.parse(readFileSync(file, "utf8")) as T;
}

function walk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((name) => {
        if (name === "node_modules" || name === ".git") return [];
        const full = path.join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

/**
 * Strips `//` and `/* *\/` comments while leaving string/template literals alone, so a
 * comment that happens to *mention* an import specifier (e.g. a "not ported yet" TODO) is
 * not mistaken for a real one.
 */
function stripComments(source: string): string {
    return source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|(\/\/.*)|(\/\*[\s\S]*?\*\/)/g, (match, lineComment, blockComment) =>
        lineComment || blockComment ? "" : match,
    );
}

/**
 * Every `from "@/something"` import found under `srcRoot` must resolve to a real file.
 * This is what actually proves the CLI's alias rewriting/registry copy left no dangling
 * import behind — `npm run build`/`tsc` would also catch this, but the assertion is cheap,
 * explicit and independent of whichever build tool a given framework uses.
 */
function findDanglingAliasImports(appDir: string, srcRoot: string): string[] {
    const problems: string[] = [];
    const importRe = /from\s+["'](@\/[^"']+)["']/g;
    for (const file of walk(path.join(appDir, srcRoot))) {
        if (!/\.(tsx?|jsx?)$/.test(file)) continue;
        const content = stripComments(readFileSync(file, "utf8"));
        for (const match of content.matchAll(importRe)) {
            const specifier = match[1];
            if (!specifier) continue;
            const target = path.join(appDir, srcRoot, specifier.slice(2));
            const candidates = [
                target,
                `${target}.ts`,
                `${target}.tsx`,
                `${target}.js`,
                `${target}.jsx`,
                path.join(target, "index.ts"),
                path.join(target, "index.tsx"),
            ];
            if (!candidates.some((candidate) => existsSync(candidate))) {
                problems.push(`${path.relative(appDir, file)}: "${specifier}" does not resolve (looked for ${path.relative(appDir, target)}.*)`);
            }
        }
    }
    return problems;
}

/** `@properui/icons` must resolve to real installed code, via the `npm:@untitledui/icons@...` alias. */
function assertIconsAliasInstalled(appDir: string): void {
    const pkg = readJson<{ dependencies?: Record<string, string> }>(path.join(appDir, "package.json"));
    const aliasSpec = pkg.dependencies?.["@properui/icons"];
    if (!aliasSpec || !aliasSpec.startsWith("npm:@untitledui/icons")) {
        throw new Error(`package.json is missing the @properui/icons npm alias (found: ${aliasSpec ?? "nothing"}).`);
    }
    const resolved = execFileSync(process.execPath, ["-e", "console.log(require.resolve('@properui/icons'))"], {
        cwd: appDir,
        encoding: "utf8",
    }).trim();
    if (!resolved.includes(`${path.sep}node_modules${path.sep}@properui${path.sep}icons${path.sep}`)) {
        throw new Error(`require.resolve('@properui/icons') resolved somewhere unexpected: ${resolved}`);
    }
    console.log(`  ok   @properui/icons installed via alias, resolves to ${resolved}`);
}

interface Target {
    name: "vite" | "next";
    /** Scaffolds the blank app at `appDir` using the framework's own official CLI. */
    scaffold: (appDir: string) => void;
    initFlag: "--vite" | "--nextjs";
    srcRoot: string;
}

const VITE: Target = {
    name: "vite",
    initFlag: "--vite",
    srcRoot: "src",
    scaffold(appDir: string) {
        const parent = path.dirname(appDir);
        console.log(`npm ${run(parent, "npm", ["--version"]).trim()}`);
        run(parent, "npm", ["create", "vite@latest", path.basename(appDir), "--", "--template", "react-ts"]);
        try {
            run(appDir, "npm", ["install"]);
        } catch (error) {
            // npm 10.8.x (bundled with Node 20) dies inside arborist on the current create-vite
            // template graph before any Proper UI code runs. That is npm's bug, not the scaffold's
            // or ours (npm 12 and --legacy-peer-deps both install it), so retry once with the
            // flag and say so, instead of failing the gate on a package manager defect.
            if (!String(error).includes("edgesOut")) throw error;
            console.warn("npm install hit the arborist 'edgesOut' crash (npm 10.8.x); retrying with --legacy-peer-deps.");
            run(appDir, "npm", ["install", "--legacy-peer-deps"]);
        }

        // A bare `npm create vite@latest` scaffold has no Tailwind pipeline at all: no
        // `tailwindcss`/`@tailwindcss/vite` installed, no plugin registered in vite.config.ts,
        // and (checked below) no `@/*` alias in tsconfig or vite.config either. All three are
        // now `properui init --vite`'s job (2.2/F2/F3) — nothing is done by hand here anymore,
        // which is exactly the gap this clean-room run exists to prove the CLI closes on its
        // own. `init --install` (below) performs the real npm installs.

        // As of the current `create-vite` templates, `react-ts` ships with *no* ESLint config
        // at all (older templates used to). The 2.5 gate this clean-room run exists to enforce
        // — copied source failing a strict consumer ESLint 9 flat config — needs a real one to
        // run against, so one is added by hand here (this is scaffold setup, not something
        // `properui init` is expected to provide): a minimal flat config with TypeScript
        // parsing, which is also exactly the shape `properui init`'s `--no-tooling-ignores`
        // toggle and its ESLint `ignores`-appending logic are meant to find and extend.
        section("vite — adding a flat ESLint config (react-ts ships none) so the lint gate below has something to run against");
        run(appDir, "npm", ["install", "-D", "eslint", "@eslint/js", "typescript-eslint"]);
        writeFileSync(
            path.join(appDir, "eslint.config.js"),
            [
                'import js from "@eslint/js";',
                'import tseslint from "typescript-eslint";',
                "",
                "export default tseslint.config(",
                "    js.configs.recommended,",
                "    ...tseslint.configs.recommended,",
                "    {",
                '        files: ["**/*.{ts,tsx}"],',
                "        rules: {},",
                "    },",
                ");",
                "",
            ].join("\n"),
        );
    },
};

const NEXT: Target = {
    name: "next",
    initFlag: "--nextjs",
    srcRoot: "src",
    scaffold(appDir: string) {
        const parent = path.dirname(appDir);
        // Flags verified against `npx create-next-app@latest --help` on 2026-09-10: there is
        // no `--no-eslint`, only an opt-in `--eslint` (ESLint is scaffolded by default either
        // way and does not affect the build we care about, so it is left alone).
        run(parent, "npx", [
            "--yes",
            "create-next-app@latest",
            path.basename(appDir),
            "--ts",
            "--app",
            "--tailwind",
            "--src-dir",
            "--import-alias",
            "@/*",
            "--use-npm",
            "--yes",
            "--disable-git",
        ]);
        // create-next-app already installs dependencies, wires the `@/*` alias in tsconfig.json
        // and ships Tailwind v4 pre-configured — nothing to do by hand for this framework.
    },
};

function assertPackageJsonAlias(appDir: string): void {
    const pkg = readJson<{ dependencies?: Record<string, string> }>(path.join(appDir, "package.json"));
    if (!pkg.dependencies?.["@properui/icons"]) throw new Error("package.json never gained a @properui/icons dependency.");
}

function runTarget(target: Target): void {
    section(`Target: ${target.name}`);
    const appDir = path.join(RUN_ROOT, target.name, "app");
    mkdirSync(path.dirname(appDir), { recursive: true });

    section(`${target.name} — scaffold`);
    target.scaffold(appDir);

    section(`${target.name} — properui init`);
    // `--install` makes `init` actually run the npm install for the theme-plugin/provider
    // packages it now reports (tailwind-merge, next-themes, react-aria-components, the three
    // `@plugin` packages, and — for Vite — tailwindcss + @tailwindcss/vite) instead of only
    // printing the command, which this clean-room run needs for real so `npm run build` below
    // has something to compile against.
    const initOutput = run(appDir, "node", [CLI, "init", target.initFlag, "--yes", "--install", "--registry", REGISTRY]);
    if (!existsSync(path.join(appDir, "components.json"))) throw new Error("init did not write components.json.");
    if (/Install to finish:/.test(initOutput)) throw new Error("`init --install` fell back to printing the install command instead of running it.");

    section(`${target.name} — properui add (${COMPONENTS.join(", ")})`);
    // `--yes` does NOT skip the install like it might for other tools — packages/cli/src/commands/add.ts
    // resolves the dependency-install confirmation with `fallback: Boolean(options.yes)`, and
    // confirm() only prompts when both stdin/stdout are TTYs, which a spawned child process
    // never is. So `--yes` here means "yes, install for real", which is exactly what this test
    // needs — no separate flag or manual install-command run required.
    const addOutput = run(appDir, "node", [CLI, "add", ...COMPONENTS, "--yes", "--registry", REGISTRY]);
    if (!addOutput.includes("Installed with `npm")) throw new Error("`add` did not report a real npm install for the new dependencies.");

    section(`${target.name} — properui add example ${EXAMPLE}`);
    const exampleOutput = run(appDir, "node", [CLI, "add", "example", EXAMPLE, "--yes", "--registry", REGISTRY]);
    if (!existsSync(path.join(appDir, target.srcRoot, "components", "app-examples", "settings-pages", `${EXAMPLE}.tsx`))) {
        throw new Error(`add example ${EXAMPLE} did not write the expected file.`);
    }
    void exampleOutput;

    // 2.5's gate: the copied source (plus whatever init/add wired) must pass a real consumer
    // ESLint 9 flat config, not just tsc — the class of bug that shipped `eslint-disable`
    // comments naming plugins the consumer lacks, and `_`-prefixed "unused" params that are a
    // hard error under a default (non-`^_`-ignoring) config. The Vite scaffold step above adds
    // the flat config to run this against, since `react-ts` no longer ships one. Next's own
    // default scaffold lint setup is not exercised here — nothing new is installed for it, and
    // its `tsc --noEmit` below already covers the alias-rewrite/type-safety half of the gate.
    if (target.name === "vite") {
        section(`${target.name} — eslint src`);
        run(appDir, "npx", ["eslint", "src"], { timeout: 3 * 60 * 1000 });
    }

    section(`${target.name} — assertions`);
    currentStep = "assertPackageJsonAlias";
    assertPackageJsonAlias(appDir);
    currentStep = "assertIconsAliasInstalled";
    assertIconsAliasInstalled(appDir);
    currentStep = "findDanglingAliasImports";
    const dangling = findDanglingAliasImports(appDir, target.srcRoot);
    if (dangling.length > 0) throw new Error(`Dangling @/ imports found:\n  ${dangling.join("\n  ")}`);
    console.log(`  ok   no dangling @/ imports under ${target.srcRoot}/`);

    section(`${target.name} — npm run build`);
    run(appDir, "npm", ["run", "build"], { timeout: 10 * 60 * 1000 });

    if (existsSync(path.join(appDir, "tsconfig.json"))) {
        section(`${target.name} — tsc --noEmit (strict)`);
        run(appDir, "npx", ["tsc", "--noEmit"], { timeout: 5 * 60 * 1000 });
    }

    console.log(`\nPASS — ${target.name} clean-room run succeeded (${appDir}).`);
}

function main(): void {
    console.log(`Clean-room run: ${RUN_ROOT}`);
    mkdirSync(RUN_ROOT, { recursive: true });
    ensureBuilt();

    const targets = [VITE, NEXT];
    for (const target of targets) {
        try {
            runTarget(target);
        } catch (error) {
            console.error(`\nFAIL — clean-room failed for target "${target.name}" during: ${currentStep}`);
            console.error((error as Error).message);
            console.error(`\nScratch directory kept for inspection: ${RUN_ROOT}`);
            process.exitCode = 1;
            return;
        }
    }

    rmSync(RUN_ROOT, { recursive: true, force: true });
    console.log(`\nPASS — all ${targets.length} clean-room targets (${targets.map((target) => target.name).join(", ")}) succeeded.`);
}

main();
