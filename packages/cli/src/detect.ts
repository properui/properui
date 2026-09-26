/**
 * Auto-detection for `init`: framework, platform, TypeScript, `src/`, the `@/` alias from
 * tsconfig paths, Tailwind version and the package manager.
 *
 * Spec: docs/cli.md ("Auto-detection rules").
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type Framework = "next-app" | "next-pages" | "vite" | "remix" | "react" | "vue" | "nuxt" | "angular" | "svelte" | "sveltekit" | "astro" | "html";

/**
 * Which registry layer a project consumes. `react` gets the TSX components; `html` gets the
 * `@properui/html` snippets (plus `@properui/tokens` and, in a framework, `@properui/elements`).
 */
export type Platform = "react" | "html";
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface ProjectInfo {
    cwd: string;
    framework: Framework;
    /** `react` for the React frameworks, `html` for everything else (see `platformFor`). */
    platform: Platform;
    typescript: boolean;
    /** True when application source lives under `src/`. */
    srcDir: boolean;
    /** Import prefix the project already uses, e.g. `@/`. Always ends with `/`. */
    aliasPrefix: string;
    /** Absolute directory `aliasPrefix` maps to. */
    aliasBase: string;
    /** False when no tsconfig/jsconfig `paths` entry backs `aliasPrefix`. */
    aliasDeclared: boolean;
    /** Tailwind major version, or null when Tailwind is not installed yet. */
    tailwindVersion: number | null;
    /** Existing global stylesheet, relative to cwd, or null when none was found. */
    cssFile: string | null;
    packageManager: PackageManager;
}

export const FRAMEWORK_LABEL: Record<Framework, string> = {
    "next-app": "Next.js (App Router)",
    "next-pages": "Next.js (Pages Router)",
    vite: "Vite",
    remix: "Remix",
    react: "React",
    vue: "Vue",
    nuxt: "Nuxt",
    angular: "Angular",
    svelte: "Svelte",
    sveltekit: "SvelteKit",
    astro: "Astro",
    html: "Plain HTML (no framework detected)",
};

const REACT_FRAMEWORKS = new Set<Framework>(["next-app", "next-pages", "vite", "remix", "react"]);

/** `react` for the five React frameworks, `html` for every other one. */
export function platformFor(framework: Framework): Platform {
    return REACT_FRAMEWORKS.has(framework) ? "react" : "html";
}

const isFile = (target: string) => existsSync(target) && statSync(target).isFile();
const isDir = (target: string) => existsSync(target) && statSync(target).isDirectory();

/** Strips `//` and block comments plus trailing commas so tsconfig.json parses as JSON. */
export function parseJsonc<T>(source: string): T | null {
    const withoutComments = source
        .replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm, (match, lineComment, blockComment) => (lineComment || blockComment ? "" : match))
        .replace(/,(\s*[}\]])/g, "$1");
    try {
        return JSON.parse(withoutComments) as T;
    } catch {
        return null;
    }
}

function readJsonc<T>(file: string): T | null {
    if (!isFile(file)) return null;
    return parseJsonc<T>(readFileSync(file, "utf8"));
}

export interface PackageJson {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
}

export function readPackageJson(cwd: string): PackageJson | null {
    return readJsonc<PackageJson>(path.join(cwd, "package.json"));
}

export function allDependencies(pkg: PackageJson | null): Record<string, string> {
    return { ...pkg?.dependencies, ...pkg?.devDependencies, ...pkg?.peerDependencies };
}

interface TsConfig {
    extends?: string;
    compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
    references?: { path: string }[];
}

/**
 * Collects tsconfig-like files worth inspecting: the root config, anything it extends
 * or references (Vite's `tsconfig.app.json` split), and jsconfig.json.
 */
function tsConfigChain(cwd: string): { file: string; config: TsConfig }[] {
    const found: { file: string; config: TsConfig }[] = [];
    const seen = new Set<string>();

    const visit = (file: string, depth: number) => {
        const resolved = path.resolve(file);
        if (depth > 4 || seen.has(resolved)) return;
        seen.add(resolved);
        const config = readJsonc<TsConfig>(resolved);
        if (!config) return;
        found.push({ file: resolved, config });
        const dir = path.dirname(resolved);
        if (config.extends && config.extends.startsWith(".")) {
            const target = config.extends.endsWith(".json") ? config.extends : `${config.extends}.json`;
            visit(path.join(dir, target), depth + 1);
        }
        for (const reference of config.references ?? []) {
            const target = path.join(dir, reference.path);
            visit(isDir(target) ? path.join(target, "tsconfig.json") : target, depth + 1);
        }
    };

    visit(path.join(cwd, "tsconfig.json"), 0);
    visit(path.join(cwd, "tsconfig.app.json"), 0);
    visit(path.join(cwd, "jsconfig.json"), 0);
    return found;
}

export interface DetectedAlias {
    prefix: string;
    base: string;
    declared: boolean;
}

/**
 * Reads the first wildcard `paths` entry (preferring `@/*`) and turns it into an import
 * prefix plus the absolute directory it points at.
 */
export function detectAlias(cwd: string, srcDir: boolean): DetectedAlias {
    const candidates: { prefix: string; base: string }[] = [];

    for (const { file, config } of tsConfigChain(cwd)) {
        const paths = config.compilerOptions?.paths;
        if (!paths) continue;
        const configDir = path.dirname(file);
        const baseUrl = config.compilerOptions?.baseUrl ?? ".";
        for (const [pattern, targets] of Object.entries(paths)) {
            const target = targets[0];
            if (!pattern.endsWith("/*") || !target || !target.endsWith("/*")) continue;
            candidates.push({
                prefix: `${pattern.slice(0, -1)}`,
                base: path.resolve(configDir, baseUrl, target.slice(0, -2)),
            });
        }
    }

    const preferred = candidates.find((candidate) => candidate.prefix === "@/") ?? candidates[0];
    if (preferred) return { ...preferred, declared: true };

    return { prefix: "@/", base: path.join(cwd, srcDir ? "src" : "."), declared: false };
}

const hasConfig = (cwd: string, base: string, extensions: string[]) => extensions.some((extension) => isFile(path.join(cwd, `${base}.${extension}`)));

const VITE_CONFIG_FILES = ["vite.config.ts", "vite.config.js", "vite.config.mts", "vite.config.mjs"];

/** Contents of the project's vite.config.*, or "" when there is none. */
function viteConfigSource(cwd: string): string {
    const file = VITE_CONFIG_FILES.map((name) => path.join(cwd, name)).find(isFile);
    return file ? readFileSync(file, "utf8") : "";
}

/**
 * React frameworks are checked first, in the same order as before non-React detection existed,
 * so a React project detects exactly as it used to. The non-React frameworks are only considered
 * when React is absent; a Vite config wired to the Vue or Svelte plugin is that framework.
 */
function detectFramework(cwd: string, deps: Record<string, string>, hasPackageJson: boolean): Framework {
    if (deps["@remix-run/react"] || deps["@react-router/dev"]) return "remix";
    if (deps.next || isFile(path.join(cwd, "next.config.ts")) || isFile(path.join(cwd, "next.config.js")) || isFile(path.join(cwd, "next.config.mjs"))) {
        if (isDir(path.join(cwd, "app")) || isDir(path.join(cwd, "src", "app"))) return "next-app";
        if (isDir(path.join(cwd, "pages")) || isDir(path.join(cwd, "src", "pages"))) return "next-pages";
        return "next-app";
    }

    const hasReact = Boolean(deps.react || deps["react-dom"] || deps["@vitejs/plugin-react"] || deps["@vitejs/plugin-react-swc"]);
    const viteSource = viteConfigSource(cwd);
    const viteConfig = viteSource.length > 0 || VITE_CONFIG_FILES.some((name) => isFile(path.join(cwd, name)));

    if (!hasReact) {
        if (deps.nuxt || hasConfig(cwd, "nuxt.config", ["ts", "js", "mjs"])) return "nuxt";
        if (deps["@sveltejs/kit"]) return "sveltekit";
        if (deps.astro || hasConfig(cwd, "astro.config", ["mjs", "ts", "js", "mts"])) return "astro";
        if (deps["@angular/core"] || isFile(path.join(cwd, "angular.json"))) return "angular";
        if (deps.vue || /@vitejs\/plugin-vue/.test(viteSource)) return "vue";
        if (deps.svelte || /@sveltejs\/vite-plugin-svelte/.test(viteSource)) {
            return isFile(path.join(cwd, "svelte.config.js")) && /@sveltejs\/kit/.test(readFileSync(path.join(cwd, "svelte.config.js"), "utf8"))
                ? "sveltekit"
                : "svelte";
        }
        if (isFile(path.join(cwd, "svelte.config.js"))) return "svelte";
    }

    if (hasReact && (deps.vite || viteConfig)) return "vite";
    if (hasReact) return "react";
    // A Vite config next to a package.json that declares nothing yet is ambiguous; it keeps the
    // React `vite` result it always had. Anything else with no React and no known framework is a
    // plain HTML/vanilla project, including a vanilla Vite app.
    if (hasPackageJson && viteConfig && Object.keys(deps).length === 0) return "vite";
    return "html";
}

/** First integer in a semver range, ignoring `^`, `~`, `>=` and friends. */
export function majorVersion(range: string | undefined): number | null {
    if (!range) return null;
    const match = /(\d+)\./.exec(range) ?? /(\d+)/.exec(range);
    return match?.[1] ? Number(match[1]) : null;
}

function detectTailwindVersion(cwd: string, deps: Record<string, string>): number | null {
    const installed = readJsonc<{ version?: string }>(path.join(cwd, "node_modules", "tailwindcss", "package.json"));
    return majorVersion(installed?.version) ?? majorVersion(deps.tailwindcss);
}

const CSS_CANDIDATES = [
    "app/globals.css",
    "src/app/globals.css",
    "src/styles/globals.css",
    "styles/globals.css",
    "src/index.css",
    "src/main.css",
    "src/App.css",
    "src/global.css",
    "app/global.css",
];

/** Where the non-React frameworks keep their global stylesheet, tried after the React list. */
const HTML_CSS_CANDIDATES = [
    "src/style.css",
    "src/styles.css",
    "src/app.css",
    "src/assets/main.css",
    "src/assets/base.css",
    "src/styles/global.css",
    "assets/css/main.css",
    "css/style.css",
    "css/styles.css",
    "styles.css",
    "style.css",
];

function detectCssFile(cwd: string, platform: Platform = "react"): string | null {
    const candidates = platform === "html" ? [...CSS_CANDIDATES, ...HTML_CSS_CANDIDATES] : CSS_CANDIDATES;
    return candidates.find((candidate) => isFile(path.join(cwd, candidate))) ?? null;
}

/** Default stylesheet location when the project has none yet. */
export function defaultCssFile(framework: Framework, srcDir: boolean): string {
    if (framework === "angular") return "src/styles.css";
    if (framework === "sveltekit") return "src/app.css";
    if (framework === "astro") return "src/styles/global.css";
    if (framework === "nuxt") return "assets/css/main.css";
    if (framework === "vue" || framework === "svelte") return "src/style.css";
    if (framework === "html") return srcDir ? "src/style.css" : "style.css";
    if (framework === "next-app") return srcDir ? "src/app/globals.css" : "app/globals.css";
    if (framework === "next-pages") return srcDir ? "src/styles/globals.css" : "styles/globals.css";
    return "src/index.css";
}

const LOCKFILES: [string, PackageManager][] = [
    ["pnpm-lock.yaml", "pnpm"],
    ["bun.lockb", "bun"],
    ["bun.lock", "bun"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
];

/** Walks up from `cwd` so workspace packages inherit the root lockfile's manager. */
export function detectPackageManager(cwd: string): PackageManager {
    let dir = path.resolve(cwd);
    for (;;) {
        for (const [lockfile, manager] of LOCKFILES) {
            if (isFile(path.join(dir, lockfile))) return manager;
        }
        const parent = path.dirname(dir);
        if (parent === dir) return "npm";
        dir = parent;
    }
}

export function detectProject(cwd: string, frameworkOverride?: Framework, platformOverride?: Platform): ProjectInfo {
    const pkg = readPackageJson(cwd);
    const deps = allDependencies(pkg);
    const srcDir = isDir(path.join(cwd, "src"));
    const alias = detectAlias(cwd, srcDir);
    const framework = frameworkOverride ?? detectFramework(cwd, deps, pkg !== null);
    const platform = platformOverride ?? platformFor(framework);

    return {
        cwd,
        framework,
        platform,
        typescript: isFile(path.join(cwd, "tsconfig.json")) || Boolean(deps.typescript),
        srcDir,
        aliasPrefix: alias.prefix,
        aliasBase: alias.base,
        aliasDeclared: alias.declared,
        tailwindVersion: detectTailwindVersion(cwd, deps),
        cssFile: detectCssFile(cwd, platform),
        packageManager: detectPackageManager(cwd),
    };
}
