/**
 * `properui init` — configure an existing project.
 *
 * Detects framework / TypeScript / `src` / alias / Tailwind version / package manager,
 * writes components.json, copies styles/theme.css + styles/typography.css, wires the full
 * `@source`/plugin/`@custom-variant`/`@utility` stylesheet block, copies the ThemeProvider
 * (and, on Next's App Router, the RouterProvider) from the registry, wires them into the app
 * root, creates utils/cx.ts, adds consumer lint/format ignore entries for the vendored
 * directories, and reports (or runs) the npm install the written files need.
 *
 * On an html-platform project (Vue, Angular, Svelte, Astro, plain HTML, or `--platform html`)
 * none of that runs: `runInitHtml` in ./init-html.ts takes over.
 *
 * Spec: docs/cli.md
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolvePreset } from "../../../ui/src/styles/presets.js";
import { CONFIG_SCHEMA_URL, type ComponentsConfig, configPath, readConfig, writeConfig } from "../config.js";
import { installCommand, installDependencies, missingDependencies } from "../deps.js";
import { FRAMEWORK_LABEL, type Framework, type Platform, type ProjectInfo, defaultCssFile, detectProject } from "../detect.js";
import { type WriteResult, writeSourceFile } from "../files.js";
import { ask, confirm } from "../prompt.js";
import { DEFAULT_REGISTRY_URL, Registry, resolveRegistrySource } from "../registry.js";
import {
    CX_TS_FALLBACK,
    ROUTER_PROVIDER_FALLBACK,
    STYLESHEET_CUSTOM_VARIANTS,
    STYLESHEET_INCLUDES_ANIMATE_PLUGIN,
    STYLESHEET_PLUGIN_LINES,
    STYLESHEET_UTILITIES,
    TAILWIND_IMPORT,
    THEME_CSS_PLACEHOLDER,
    THEME_PROVIDER_JSX,
    THEME_PROVIDER_TSX,
    TYPOGRAPHY_CSS_PLACEHOLDER,
} from "../templates.js";
import { kleur, log, spinner } from "../ui.js";
import { runInitHtml } from "./init-html.js";
import { applyPresetToFile } from "./theme.js";

export interface InitOptions {
    nextjs?: boolean;
    vite?: boolean;
    manual?: boolean;
    yes?: boolean;
    overwrite?: boolean;
    registry?: string;
    cwd?: string;
    /** `--no-providers`: skip copying/writing ThemeProvider + RouterProvider and wiring them into the app root. */
    providers?: boolean;
    /** `--install`: run the install command instead of only printing it. */
    install?: boolean;
    /** `--no-tooling-ignores`: skip appending ESLint/Prettier ignore entries for vendored directories. */
    toolingIgnores?: boolean;
    /** `--preset <name|code>`: apply a theme preset block to the global stylesheet (see `properui theme`). */
    preset?: string;
    /** `--platform react|html`: override the detected platform (react for React frameworks, html for the rest). */
    platform?: string;
}

/** Tailwind v3 is not supported — the token layer is written entirely in v4 `@theme` syntax. */
const TAILWIND_V3_MESSAGE = [
    "Proper UI requires Tailwind CSS v4. This project is on v3.",
    "",
    "  1. npx @tailwindcss/upgrade@latest",
    "  2. Replace tailwind.config.js content with the v4 CSS-first setup:",
    '       @import "tailwindcss";',
    "  3. Re-run: npx @properui/cli init",
    "",
    "Upgrade guide: https://tailwindcss.com/docs/upgrade-guide",
].join("\n");

function frameworkOverride(options: InitOptions): Framework | undefined {
    if (options.nextjs) return "next-app";
    if (options.vite) return "vite";
    return undefined;
}

/** POSIX-style relative import path, always prefixed with `./` when it stays inside `from`. */
function relativeCssPath(from: string, to: string): string {
    const relative = path.relative(path.dirname(from), to).split(path.sep).join("/");
    return relative.startsWith(".") ? relative : `./${relative}`;
}

/** POSIX-style relative *directory* path from `from` to `to`. `.` for the same directory, always `./`-prefixed otherwise. */
function relativeDirPath(from: string, to: string): string {
    const relative = path.relative(from, to).split(path.sep).join("/");
    if (relative === "") return ".";
    return relative.startsWith(".") ? relative : `./${relative}`;
}

/** Index of the `}` that closes the `{` at `openIndex`, or -1 if the braces never balance. */
function matchBalancedBrace(source: string, openIndex: number): number {
    let depth = 0;
    for (let i = openIndex; i < source.length; i++) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/** Same as `matchBalancedBrace`, generalised to any open/close pair (used for `[` / `]`). */
function matchBalanced(source: string, openIndex: number, open: string, close: string): number {
    let depth = 0;
    for (let i = openIndex; i < source.length; i++) {
        if (source[i] === open) depth++;
        else if (source[i] === close) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

interface TsconfigAliasResult {
    file: string | null;
    status: "written" | "already-declared" | "unsupported" | "skipped";
    snippet: string;
}

/**
 * Vite has no built-in tsconfig-paths support: the `@/*` (or whatever prefix the project
 * uses) alias needs a `paths` entry in tsconfig *and* a matching `resolve.alias` in
 * vite.config — this writes the tsconfig half. Prefers the split `tsconfig.app.json` that
 * `npm create vite@latest` scaffolds (the root `tsconfig.json` there only holds
 * `references`), falls back to `tsconfig.json`, then `jsconfig.json` for JS-only projects.
 */
function wireViteTsconfigPaths(project: ProjectInfo, dryRun: boolean): TsconfigAliasResult {
    const file = ["tsconfig.app.json", "tsconfig.json", "jsconfig.json"].map((name) => path.join(project.cwd, name)).find((candidate) => existsSync(candidate));

    const target = `${relativeDirPath(path.dirname(file ?? project.cwd), project.aliasBase)}/*`;
    const snippet = `"paths": { "${project.aliasPrefix}*": ["${target}"] }`;

    if (project.aliasDeclared) return { file: file ?? null, status: "already-declared", snippet };
    if (!file) return { file: null, status: "skipped", snippet };

    const raw = readFileSync(file, "utf8");
    const match = /"compilerOptions"\s*:\s*\{/.exec(raw);
    if (!match) return { file, status: "unsupported", snippet };

    const afterBrace = match.index + match[0].length;
    const indent = /\n([ \t]*)\S/.exec(raw.slice(afterBrace))?.[1] ?? "    ";
    const next = `${raw.slice(0, afterBrace)}\n${indent}${snippet},${raw.slice(afterBrace)}`;

    if (!dryRun) writeFileSync(file, next, "utf8");
    return { file, status: "written", snippet };
}

const VITE_CONFIG_NAMES = ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"];

interface ViteConfigAliasResult {
    file: string | null;
    aliasKey: string;
    status: "written" | "already-present" | "unsupported" | "skipped";
    snippet: string;
}

/**
 * Writes the bundler half of the alias: `resolve.alias` in vite.config, merged into the
 * existing config non-destructively. Handles the config shapes `npm create vite@latest`
 * (and hand-edited variants of it) produce — `defineConfig({ ... })`, an existing `resolve:`
 * block with or without `alias`, or `export default { ... }` without `defineConfig` at all.
 * Anything else (a functional `defineConfig((env) => ({ ... }))`, an array-form `alias: [...]`)
 * is left untouched — the caller prints `snippet` and reports failure instead of guessing.
 */
function wireViteConfigAlias(project: ProjectInfo, dryRun: boolean): ViteConfigAliasResult {
    const file = VITE_CONFIG_NAMES.map((name) => path.join(project.cwd, name)).find((candidate) => existsSync(candidate));
    const aliasKey = project.aliasPrefix.replace(/\/$/, "");
    const srcPath = relativeDirPath(project.cwd, project.aliasBase);
    const raw = file ? readFileSync(file, "utf8") : "";
    const isEsm = raw ? /^\s*(?:import\s|export\s+default\b)/m.test(raw) : true;

    const aliasExpr = isEsm ? `fileURLToPath(new URL("${srcPath}", import.meta.url))` : `path.resolve(__dirname, "${srcPath}")`;
    const hasUrlImport = /fileURLToPath/.test(raw) && /from\s+["'](?:node:)?url["']/.test(raw);
    const hasPathImport = /require\(\s*["'](?:node:)?path["']\s*\)/.test(raw) || /from\s+["'](?:node:)?path["']/.test(raw);
    const needsImport = isEsm ? !hasUrlImport : !hasPathImport;
    const importLine = isEsm ? 'import { fileURLToPath } from "node:url";' : 'const path = require("node:path");';

    const snippet = [...(needsImport ? [importLine, ""] : []), "resolve: {", `    alias: { "${aliasKey}": ${aliasExpr} },`, "},"].join("\n");

    if (!file) return { file: null, aliasKey, status: "skipped", snippet };

    const aliasKeyPattern = aliasKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`alias\\s*:\\s*\\{[^]*?["']${aliasKeyPattern}["']\\s*:`, "").test(raw)) {
        return { file, aliasKey, status: "already-present", snippet };
    }

    let next: string | null = null;
    const resolveMatch = /resolve\s*:\s*\{/.exec(raw);
    if (resolveMatch) {
        const openIndex = resolveMatch.index + resolveMatch[0].length - 1;
        const closeIndex = matchBalancedBrace(raw, openIndex);
        if (closeIndex === -1) return { file, aliasKey, status: "unsupported", snippet };
        const body = raw.slice(openIndex + 1, closeIndex);
        const aliasMatch = /alias\s*:\s*(\{|\[)/.exec(body);
        if (aliasMatch?.[1] === "[") return { file, aliasKey, status: "unsupported", snippet };
        if (aliasMatch) {
            const aliasOpenIndex = openIndex + 1 + aliasMatch.index + aliasMatch[0].length;
            next = `${raw.slice(0, aliasOpenIndex)} "${aliasKey}": ${aliasExpr},${raw.slice(aliasOpenIndex)}`;
        } else {
            const indent = /\n([ \t]*)\S/.exec(body)?.[1] ?? "    ";
            next = `${raw.slice(0, openIndex + 1)}\n${indent}alias: { "${aliasKey}": ${aliasExpr} },${raw.slice(openIndex + 1)}`;
        }
    } else {
        const defineConfigMatch = /(?:defineConfig\s*\(\s*|export\s+default\s*)\{/.exec(raw);
        if (!defineConfigMatch) return { file, aliasKey, status: "unsupported", snippet };
        const afterBrace = defineConfigMatch.index + defineConfigMatch[0].length;
        const indent = /\n([ \t]*)\S/.exec(raw.slice(afterBrace))?.[1] ?? "    ";
        next = `${raw.slice(0, afterBrace)}\n${indent}resolve: {\n${indent}    alias: { "${aliasKey}": ${aliasExpr} },\n${indent}},${raw.slice(afterBrace)}`;
    }

    if (needsImport) {
        const importLines = [...next.matchAll(/^import .+;$/gm)];
        const last = importLines[importLines.length - 1];
        next = last ? `${next.slice(0, last.index! + last[0].length)}\n${importLine}${next.slice(last.index! + last[0].length)}` : `${importLine}\n${next}`;
    }

    if (!dryRun) writeFileSync(file, next, "utf8");
    return { file, aliasKey, status: "written", snippet };
}

interface ViteTailwindPluginResult {
    file: string | null;
    status: "written" | "already-present" | "unsupported" | "skipped";
}

/**
 * Registers `tailwindcss()` (from `@tailwindcss/vite`) in `vite.config.ts`'s `plugins` array
 * when it is not already configured (Miraveli F2: a bare `npm create vite@latest` scaffold
 * has no Tailwind pipeline at all, so the CSS `init` writes never actually compiles).
 * Deliberately conservative like `wireViteConfigAlias` — an unrecognised shape is reported,
 * not guessed at.
 */
function wireViteTailwindPlugin(project: ProjectInfo, dryRun: boolean): ViteTailwindPluginResult {
    const file = VITE_CONFIG_NAMES.map((name) => path.join(project.cwd, name)).find((candidate) => existsSync(candidate));
    if (!file) return { file: null, status: "skipped" };

    const raw = readFileSync(file, "utf8");
    if (/@tailwindcss\/vite/.test(raw)) return { file, status: "already-present" };

    const isEsm = /^\s*(?:import\s|export\s+default\b)/m.test(raw);
    const importLine = isEsm ? 'import tailwindcss from "@tailwindcss/vite";' : 'const tailwindcss = require("@tailwindcss/vite");';

    let next: string | null = null;
    const pluginsMatch = /plugins\s*:\s*\[/.exec(raw);
    if (pluginsMatch) {
        const insertAt = pluginsMatch.index + pluginsMatch[0].length;
        next = `${raw.slice(0, insertAt)}tailwindcss(), ${raw.slice(insertAt)}`;
    } else {
        const defineConfigMatch = /(?:defineConfig\s*\(\s*|export\s+default\s*)\{/.exec(raw);
        if (!defineConfigMatch) return { file, status: "unsupported" };
        const afterBrace = defineConfigMatch.index + defineConfigMatch[0].length;
        const indent = /\n([ \t]*)\S/.exec(raw.slice(afterBrace))?.[1] ?? "    ";
        next = `${raw.slice(0, afterBrace)}\n${indent}plugins: [tailwindcss()],${raw.slice(afterBrace)}`;
    }

    const importLines = [...next.matchAll(/^import .+;$/gm)];
    const last = importLines[importLines.length - 1];
    next = last ? `${next.slice(0, last.index! + last[0].length)}\n${importLine}${next.slice(last.index! + last[0].length)}` : `${importLine}\n${next}`;

    if (!dryRun) writeFileSync(file, next, "utf8");
    return { file, status: "written" };
}

/**
 * Appends whatever is missing to the project's global stylesheet: the Tailwind import, the
 * theme + typography token imports, the plugin/`@custom-variant`/`@utility` lines a copied
 * component actually needs, and the `@source` line that makes Tailwind scan the copied
 * components. When `@import "tailwindcss";` already exists, everything is inserted
 * immediately *after* that line — never above it, which previously made Tailwind emit the
 * theme as unlayered `:root` and broke `.dark-mode` on `<html>` (2.2).
 */
function wireStylesheet(
    cwd: string,
    config: ComponentsConfig,
    typographyFile: string,
    includeAnimatePlugin: boolean,
    dryRun: boolean,
): { file: string; added: string[] } {
    const cssFile = path.resolve(cwd, config.tailwind.css);
    const existing = existsSync(cssFile) ? readFileSync(cssFile, "utf8") : "";

    const themeImport = `@import "${relativeCssPath(cssFile, path.resolve(cwd, config.tailwind.theme))}";`;
    const typographyImport = `@import "${relativeCssPath(cssFile, typographyFile)}";`;
    const componentsDir = path.resolve(cwd, config.tailwind.theme, "..", "..", "components");
    const sourceLine = `@source "${relativeCssPath(cssFile, componentsDir)}/**/*.{ts,tsx,js,jsx}";`;

    const pluginLines = [
        STYLESHEET_PLUGIN_LINES.typography,
        STYLESHEET_PLUGIN_LINES.reactAria,
        ...(includeAnimatePlugin ? [STYLESHEET_PLUGIN_LINES.animate] : []),
    ];

    const hasTailwindImport = existing.includes(TAILWIND_IMPORT);
    const sections = [
        [themeImport, typographyImport].filter((line) => !existing.includes(line)),
        pluginLines.filter((line) => !existing.includes(line)),
        STYLESHEET_CUSTOM_VARIANTS.filter((line) => !existing.includes(line)),
        STYLESHEET_UTILITIES.filter((block) => !existing.includes(block)),
        existing.includes(sourceLine) ? [] : [sourceLine],
    ].filter((section) => section.length > 0);

    const added = [...(hasTailwindImport ? [] : [TAILWIND_IMPORT]), ...sections.flat()];
    if (added.length === 0) return { file: cssFile, added };

    const block = sections.map((section) => section.join("\n")).join("\n\n");

    let next: string;
    if (!hasTailwindImport) {
        const lead = [TAILWIND_IMPORT, block].filter(Boolean).join("\n");
        next = existing.trim().length > 0 ? `${lead}\n\n${existing.replace(/^\uFEFF/, "")}` : `${lead}\n`;
    } else {
        const importEnd = existing.indexOf(TAILWIND_IMPORT) + TAILWIND_IMPORT.length;
        next = block ? `${existing.slice(0, importEnd)}\n${block}${existing.slice(importEnd)}` : existing;
    }

    if (!dryRun) {
        mkdirSync(path.dirname(cssFile), { recursive: true });
        writeFileSync(cssFile, next, "utf8");
    }
    return { file: cssFile, added };
}

/** Candidate root files to wrap in `<ThemeProvider>` / `<RouterProvider>`, most specific first. */
function entryCandidates(project: ProjectInfo): string[] {
    const roots = project.srcDir ? ["src", "."] : [".", "src"];
    const names =
        project.framework === "next-app"
            ? ["app/layout.tsx", "app/layout.jsx"]
            : project.framework === "next-pages"
              ? ["pages/_app.tsx", "pages/_app.jsx"]
              : ["main.tsx", "main.jsx", "index.tsx", "index.jsx"];
    return roots.flatMap((root) => names.map((name) => path.join(project.cwd, root, name)));
}

/**
 * Re-indents a block of JSX to `indent`, preserving its own relative indentation. The first
 * line is already trimmed by the caller, so the common prefix is measured on the rest.
 */
function reindent(block: string, indent: string): string {
    const lines = block.replace(/\s+$/, "").split("\n");
    const rest = lines.slice(1).filter((line) => line.trim());
    const common = rest.length > 0 ? Math.min(...rest.map((line) => (/^\s*/.exec(line)?.[0] ?? "").length)) : 0;
    return lines.map((line, index) => (index === 0 ? `${indent}${line.trim()}` : line.trim() ? `${indent}${line.slice(common)}` : "")).join("\n");
}

/** Wraps the app's root element in `<TagName>`. Returns null when the entry's shape isn't recognised. */
function wrapRoot(source: string, tagName: string): string | null {
    // Next.js layouts: wrap the children of <body>.
    const bodyMatch = /^([ \t]*)(<body[^>]*>)([\s\S]*?)(<\/body>)/m.exec(source);
    const renderStart = source.indexOf(".render(");

    if (bodyMatch?.[2] && bodyMatch[3]?.trim() && bodyMatch[4]) {
        const indent = bodyMatch[1] ?? "";
        const inner = bodyMatch[3].trim();
        const wrapped = inner.includes("\n")
            ? `${indent}    <${tagName}>\n${reindent(inner, `${indent}        `)}\n${indent}    </${tagName}>`
            : `${indent}    <${tagName}>${inner}</${tagName}>`;
        return source.replace(bodyMatch[0], `${indent}${bodyMatch[2]}\n${wrapped}\n${indent}${bodyMatch[4]}`);
    }
    if (renderStart !== -1) {
        // Vite / CRA entries: wrap the tree handed to createRoot(...).render(...).
        const open = renderStart + ".render(".length;
        const close = source.lastIndexOf(")");
        const inner = close > open ? source.slice(open, close).trim().replace(/,$/, "") : "";
        if (inner) {
            return `${source.slice(0, open)}\n    <${tagName}>\n${reindent(inner, "        ")}\n    </${tagName}>,\n${source.slice(close)}`;
        }
    }
    return null;
}

/**
 * Wraps the existing content of an already-present `<OuterTag>...</OuterTag>` pair (written
 * by `wrapRoot`, or the project's own) in `<InnerTag>`. Returns null when `OuterTag` isn't
 * found, its body is empty, or `InnerTag` is already present anywhere in `source`.
 */
function wrapInsideTag(source: string, outerTag: string, innerTag: string): string | null {
    if (source.includes(`<${innerTag}`)) return null;
    const pattern = new RegExp(`(<${outerTag}(?:\\s[^>]*)?>)([\\s\\S]*?)(</${outerTag}>)`);
    const match = pattern.exec(source);
    if (!match?.[2]?.trim() || match.index === undefined) return null;

    const lineStart = source.lastIndexOf("\n", match.index) + 1;
    const indent = /^[ \t]*/.exec(source.slice(lineStart))?.[0] ?? "";
    const inner = match[2].trim();
    const wrapped = inner.includes("\n")
        ? `${indent}    <${innerTag}>\n${reindent(inner, `${indent}        `)}\n${indent}    </${innerTag}>`
        : `${indent}    <${innerTag}>${inner}</${innerTag}>`;

    return `${source.slice(0, match.index)}${match[1]}\n${wrapped}\n${indent}${match[3]}${source.slice(match.index + match[0].length)}`;
}

interface ProviderWireResult {
    file: string;
    themeWired: boolean;
    routerWired: boolean;
}

/**
 * Wires `<ThemeProvider>` (and, on Next's App Router, `<RouterProvider>` inside it) into the
 * app's entry point. Conservative on purpose: if the entry does not match a shape we
 * recognise, nothing is touched and the caller prints a snippet instead.
 */
function wireProviders(project: ProjectInfo, config: ComponentsConfig, wireRouter: boolean, dryRun: boolean): ProviderWireResult | null {
    const entry = entryCandidates(project).find((candidate) => existsSync(candidate));
    if (!entry) return null;

    let source = readFileSync(entry, "utf8");
    const importBase = config.aliases.components.replace(/\/components$/, "");
    const importLines: string[] = [];
    let themeWired = false;
    let routerWired = false;

    if (!source.includes("ThemeProvider")) {
        const wrapped = wrapRoot(source, "ThemeProvider");
        if (wrapped) {
            source = wrapped;
            themeWired = true;
            importLines.push(`import { ThemeProvider } from "${importBase}/providers/theme-provider";`);
        }
    }

    if (wireRouter && !source.includes("RouterProvider")) {
        const wrapped = wrapInsideTag(source, "ThemeProvider", "RouterProvider");
        if (wrapped) {
            source = wrapped;
            routerWired = true;
            importLines.push(`import { RouterProvider } from "${importBase}/providers/router-provider";`);
        }
    }

    if (importLines.length === 0) return { file: entry, themeWired: false, routerWired: false };

    const withUseClient = /^(["']use client["'];?\s*\n)?/.exec(source);
    const insertAt = withUseClient?.[0]?.length ?? 0;
    source = `${source.slice(0, insertAt)}${importLines.join("\n")}\n${source.slice(insertAt)}`;

    if (!dryRun) writeFileSync(entry, source, "utf8");
    return { file: entry, themeWired, routerWired };
}

interface ToolingIgnoreResult {
    file: string | null;
    status: "written" | "already-present" | "unsupported" | "not-found";
}

const IGNORE_MARKER = "Proper UI: vendored source copied in by `properui init`/`add` — not this project's code style";

/**
 * Appends a `{ ignores: [...] }` block to a flat ESLint config, idempotently. Handles two
 * shapes: a plain (or wrapped) array literal — `export default [...]` — and the variadic
 * `tseslint.config(a, b, c)` helper (this very repo's own eslint.config.mjs uses it, and it
 * is typescript-eslint's own documented convention), where there is no array literal at all
 * and the new block is inserted as the first *argument* instead of the first *element*.
 */
function wireEslintIgnores(cwd: string, dirs: string[], dryRun: boolean): ToolingIgnoreResult {
    const file = ["eslint.config.js", "eslint.config.mjs", "eslint.config.ts"].map((name) => path.join(cwd, name)).find((candidate) => existsSync(candidate));
    if (!file) return { file: null, status: "not-found" };

    const raw = readFileSync(file, "utf8");
    if (raw.includes(IGNORE_MARKER)) return { file, status: "already-present" };

    const arrayMatch = /(?:export\s+default|module\.exports\s*=)\s*(?:[\w.]+\s*\(\s*)?\[/.exec(raw);
    const callMatch = /(?:export\s+default|module\.exports\s*=)\s*[\w.]+\s*\(/.exec(raw);

    let insertAt: number;
    if (arrayMatch) {
        const openIndex = arrayMatch.index + arrayMatch[0].length - 1;
        if (matchBalanced(raw, openIndex, "[", "]") === -1) return { file, status: "unsupported" };
        insertAt = openIndex + 1;
    } else if (callMatch) {
        insertAt = callMatch.index + callMatch[0].length;
    } else {
        return { file, status: "unsupported" };
    }

    const block = `\n    {\n        // ${IGNORE_MARKER}\n        ignores: [\n${dirs.map((dir) => `            "${dir}",`).join("\n")}\n        ],\n    },`;
    const next = `${raw.slice(0, insertAt)}${block}${raw.slice(insertAt)}`;

    if (!dryRun) writeFileSync(file, next, "utf8");
    return { file, status: "written" };
}

/** Appends the vendored directories to `.prettierignore`, creating it when a Prettier config exists. */
function wirePrettierIgnore(cwd: string, dirs: string[], dryRun: boolean): ToolingIgnoreResult {
    const ignoreFile = path.join(cwd, ".prettierignore");
    const configExists = [
        ".prettierrc",
        ".prettierrc.json",
        ".prettierrc.js",
        ".prettierrc.cjs",
        ".prettierrc.mjs",
        ".prettierrc.yaml",
        ".prettierrc.yml",
        "prettier.config.js",
        "prettier.config.cjs",
        "prettier.config.mjs",
    ].some((name) => existsSync(path.join(cwd, name)));

    if (!existsSync(ignoreFile) && !configExists) return { file: null, status: "not-found" };

    const existing = existsSync(ignoreFile) ? readFileSync(ignoreFile, "utf8") : "";
    if (existing.includes(IGNORE_MARKER)) return { file: ignoreFile, status: "already-present" };

    const block = `${existing.trim().length > 0 ? "\n\n" : ""}# ${IGNORE_MARKER}\n${dirs.join("\n")}\n`;
    if (!dryRun) writeFileSync(ignoreFile, `${existing}${block}`, "utf8");
    return { file: ignoreFile, status: "written" };
}

export async function runInit(options: InitOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    if (options.platform && options.platform !== "react" && options.platform !== "html") {
        log.error(`Unknown --platform "${options.platform}". Use "react" or "html".`);
        process.exitCode = 1;
        return;
    }
    // `--nextjs` / `--vite` name a React framework, so they imply the react platform.
    const platformOverride = (options.platform as Platform | undefined) ?? (options.nextjs || options.vite ? "react" : undefined);
    const project = detectProject(cwd, frameworkOverride(options), platformOverride);
    const filesTouched: string[] = [];
    const relTo = (file: string) => path.relative(cwd, file) || path.basename(file);
    // Resolve before writing anything, so a mistyped preset fails fast instead of half-initialising.
    const preset = options.preset ? resolvePreset(options.preset) : null;

    if (project.platform === "html") {
        await runInitHtml(project, options, preset);
        return;
    }

    log.title("Configuring this project for Proper UI");
    log.step(`Framework       ${FRAMEWORK_LABEL[project.framework]}`);
    log.step(`Platform        react`);
    log.step(`Language        ${project.typescript ? "TypeScript" : "JavaScript"}`);
    log.step(`Source folder   ${project.srcDir ? "src/" : "project root"}`);
    log.step(`Import alias    ${project.aliasPrefix}${project.aliasDeclared ? "" : kleur.yellow(" (not declared in tsconfig paths)")}`);
    log.step(`Tailwind        ${project.tailwindVersion ? `v${project.tailwindVersion}` : "not installed"}`);
    log.step(`Package manager ${project.packageManager}`);
    log.plain();

    if (project.tailwindVersion === 3) {
        log.error(TAILWIND_V3_MESSAGE);
        process.exitCode = 1;
        return;
    }
    if (!project.aliasDeclared) {
        log.warn(`No \`paths\` mapping found. Add this to tsconfig.json so \`${project.aliasPrefix}\` resolves:`);
        log.plain(kleur.dim(`        "baseUrl": ".", "paths": { "${project.aliasPrefix}*": ["./${project.srcDir ? "src/" : ""}*"] }`));
        log.plain();
    }

    const existingConfig = readConfig(cwd);
    if (existingConfig && !options.overwrite) {
        const proceed = await confirm(`${path.basename(configPath(cwd))} already exists. Overwrite it?`, { yes: options.yes, fallback: false });
        if (!proceed) {
            log.info("Keeping the existing components.json; only missing files will be written.");
        }
    }

    const baseRelative = path.relative(cwd, project.aliasBase).split(path.sep).join("/");
    const withBase = (target: string) => (baseRelative && baseRelative !== "." ? `${baseRelative}/${target}` : target);

    const cssFile = await ask("Where is your global stylesheet?", {
        yes: options.yes,
        initial: existingConfig?.tailwind.css ?? project.cssFile ?? defaultCssFile(project.framework, project.srcDir),
    });
    const registrySource = resolveRegistrySource(options.registry, existingConfig?.registry);
    const alias = project.aliasPrefix;
    const providersEnabled = options.providers !== false;
    const toolingIgnoresEnabled = options.toolingIgnores !== false;

    const config: ComponentsConfig = {
        $schema: CONFIG_SCHEMA_URL,
        style: "default",
        platform: "react",
        tsx: project.typescript,
        tailwind: {
            css: cssFile,
            theme: withBase("styles/theme.css"),
            prefix: "",
        },
        aliases: {
            components: `${alias}components`,
            utils: `${alias}utils`,
            ui: `${alias}components/base`,
            hooks: `${alias}hooks`,
        },
        registry: registrySource.startsWith("http") ? registrySource : (existingConfig?.registry ?? DEFAULT_REGISTRY_URL),
    };

    if (!existingConfig || options.overwrite) {
        writeConfig(cwd, config);
        filesTouched.push(relTo(configPath(cwd)));
    }

    const registry = new Registry(registrySource);
    const writes: WriteResult[] = [];
    const writeOptions = { cwd, overwrite: Boolean(options.overwrite), dryRun: false };
    const typographyTarget = path.resolve(cwd, config.tailwind.theme.replace(/theme\.css$/, "typography.css"));

    // styles/theme.css, styles/typography.css, utils/cx.ts and the providers — from the
    // registry when reachable, offline fallbacks otherwise.
    const registrySpinner = spinner(`Fetching theme tokens and providers from ${registry.describe()}`);
    let themeCss = THEME_CSS_PLACEHOLDER;
    let typographyCss = TYPOGRAPHY_CSS_PLACEHOLDER;
    let cxSource = CX_TS_FALLBACK;
    let cxDependencies: string[] = ["tailwind-merge"];
    let themeProviderSource = config.tsx ? THEME_PROVIDER_TSX : THEME_PROVIDER_JSX;
    let routerProviderSource = ROUTER_PROVIDER_FALLBACK;
    let themeProviderDependencies: string[] = [];
    let routerProviderDependencies = ["react-aria-components"];
    let registryReachable = false;
    try {
        const styles = await registry.item("styles");
        themeCss = styles.files.find((file) => file.target.endsWith("theme.css"))?.content ?? themeCss;
        typographyCss = styles.files.find((file) => file.target.endsWith("typography.css"))?.content ?? typographyCss;

        const cx = await registry.item("cx");
        cxSource = cx.files[0]?.content ?? cxSource;
        cxDependencies = cx.dependencies.length > 0 ? cx.dependencies : cxDependencies;

        if (providersEnabled) {
            const providers = await registry.item("providers");
            themeProviderSource = providers.files.find((file) => file.target.endsWith("theme-provider.tsx"))?.content ?? themeProviderSource;
            routerProviderSource = providers.files.find((file) => file.target.endsWith("router-provider.tsx"))?.content ?? routerProviderSource;
            themeProviderDependencies = ["next-themes"];
            routerProviderDependencies = providers.dependencies.filter((dependency) => dependency !== "next-themes" && dependency !== "next");
        }

        registryReachable = true;
        registrySpinner.succeed("Fetched theme tokens, typography, utils/cx and providers from the registry.");
    } catch (error) {
        registrySpinner.stop();
        log.warn(`Registry unavailable (${(error as Error).message}).`);
        log.warn(
            "Wrote placeholder theme tokens and offline provider fallbacks. Run `properui add styles providers --overwrite` once the registry is reachable.",
        );
    }

    const themeWrite = writeSourceFile(path.resolve(cwd, config.tailwind.theme), themeCss, writeOptions);
    writes.push(themeWrite);
    const typographyWrite = writeSourceFile(typographyTarget, typographyCss, writeOptions);
    writes.push(typographyWrite);
    const cxWrite = writeSourceFile(path.resolve(project.aliasBase, config.tsx ? "utils/cx.ts" : "utils/cx.js"), cxSource, writeOptions);
    writes.push(cxWrite);

    let themeProviderWrite: WriteResult | null = null;
    let routerProviderWrite: WriteResult | null = null;
    if (providersEnabled) {
        themeProviderWrite = writeSourceFile(path.resolve(project.aliasBase, "providers/theme-provider.tsx"), themeProviderSource, writeOptions);
        writes.push(themeProviderWrite);
        if (project.framework === "next-app") {
            routerProviderWrite = writeSourceFile(path.resolve(project.aliasBase, "providers/router-provider.tsx"), routerProviderSource, writeOptions);
            writes.push(routerProviderWrite);
        }
    }
    for (const write of writes) {
        if (write.status === "created" || write.status === "updated") filesTouched.push(write.relative);
    }

    const stylesheet = wireStylesheet(cwd, config, typographyTarget, STYLESHEET_INCLUDES_ANIMATE_PLUGIN, false);
    if (stylesheet.added.length > 0) filesTouched.push(relTo(stylesheet.file));
    const presetResult = preset ? applyPresetToFile(stylesheet.file, preset) : null;
    if (presetResult?.status === "written") filesTouched.push(relTo(presetResult.file));

    const wireRouter = providersEnabled && project.framework === "next-app";
    const wiring = options.manual || !providersEnabled ? null : wireProviders(project, config, wireRouter, false);
    if (wiring?.themeWired || wiring?.routerWired) filesTouched.push(relTo(wiring.file));

    const viteDryRun = Boolean(options.manual);
    const viteTailwindPlugin = project.framework === "vite" ? wireViteTailwindPlugin(project, viteDryRun) : null;
    if (viteTailwindPlugin?.status === "written" && viteTailwindPlugin.file) filesTouched.push(relTo(viteTailwindPlugin.file));
    const viteTsconfig = project.framework === "vite" ? wireViteTsconfigPaths(project, viteDryRun) : null;
    if (viteTsconfig?.status === "written" && viteTsconfig.file) filesTouched.push(relTo(viteTsconfig.file));
    const viteConfigAlias = project.framework === "vite" ? wireViteConfigAlias(project, viteDryRun) : null;
    if (viteConfigAlias?.status === "written" && viteConfigAlias.file) filesTouched.push(relTo(viteConfigAlias.file));

    const baseDirPrefix = baseRelative && baseRelative !== "." ? `${baseRelative}/` : "";
    const vendoredDirs = [
        `${baseDirPrefix}components/**`,
        `${baseDirPrefix}utils/**`,
        `${baseDirPrefix}hooks/**`,
        ...(providersEnabled ? [`${baseDirPrefix}providers/**`] : []),
    ];
    const eslintIgnores = toolingIgnoresEnabled ? wireEslintIgnores(cwd, vendoredDirs, false) : null;
    if (eslintIgnores?.status === "written" && eslintIgnores.file) filesTouched.push(relTo(eslintIgnores.file));
    const prettierIgnore = toolingIgnoresEnabled ? wirePrettierIgnore(cwd, vendoredDirs, false) : null;
    if (prettierIgnore?.status === "written" && prettierIgnore.file) filesTouched.push(relTo(prettierIgnore.file));

    log.plain();
    log.title("Changes");
    log.step(`${kleur.green("write")} ${path.relative(cwd, configPath(cwd))}`);
    for (const result of writes) log.step(`${statusLabel(result.status)} ${result.relative}`);
    if (stylesheet.added.length > 0) {
        log.step(
            `${kleur.green("write")} ${path.relative(cwd, stylesheet.file)} (+${stylesheet.added.length} line${stylesheet.added.length === 1 ? "" : "s"})`,
        );
        for (const line of stylesheet.added) log.plain(kleur.dim(`        ${line.split("\n")[0]}${line.includes("\n") ? " …" : ""}`));
    } else {
        log.step(`${kleur.dim("keep ")} ${path.relative(cwd, stylesheet.file)} (already wired)`);
    }

    if (presetResult) {
        const label = presetResult.status === "written" ? kleur.green("write") : kleur.dim("keep ");
        log.step(`${label} ${path.relative(cwd, presetResult.file)} (theme preset "${presetResult.preset.name}", code ${presetResult.code})`);
    }

    if (!providersEnabled) {
        log.plain();
        log.info("Skipped provider files and wiring (--no-providers). Wrap your app root yourself:");
        const importPath = `${config.aliases.components.replace(/\/components$/, "")}/providers/theme-provider`;
        log.plain(kleur.dim(`        import { ThemeProvider } from "${importPath}";`));
        log.plain(kleur.dim("        <ThemeProvider>{children}</ThemeProvider>"));
    } else {
        if (wiring?.themeWired) {
            log.step(`${kleur.green("write")} ${path.relative(cwd, wiring.file)} (wrapped in <ThemeProvider>)`);
        } else {
            const importPath = `${config.aliases.components.replace(/\/components$/, "")}/providers/theme-provider`;
            log.plain();
            log.info(options.manual ? "Manual mode. Wrap your app yourself:" : "Could not wire the provider automatically. Wrap your app root yourself:");
            log.plain(kleur.dim(`        import { ThemeProvider } from "${importPath}";`));
            log.plain(kleur.dim("        <ThemeProvider>{children}</ThemeProvider>"));
        }

        if (project.framework === "next-app") {
            if (wiring?.routerWired) {
                log.step(`${kleur.green("write")} ${path.relative(cwd, wiring.file)} (wrapped in <RouterProvider>)`);
            } else if (!wiring?.themeWired) {
                const importPath = `${config.aliases.components.replace(/\/components$/, "")}/providers/router-provider`;
                log.plain(kleur.dim(`        import { RouterProvider } from "${importPath}";`));
                log.plain(kleur.dim("        <ThemeProvider><RouterProvider>{children}</RouterProvider></ThemeProvider>"));
            }
        } else if (project.framework === "vite") {
            log.info("Vite: use React Aria's own <RouterProvider> with react-router — see docs/vite.md.");
        }
    }

    if (viteTailwindPlugin || viteTsconfig || viteConfigAlias) {
        log.plain();
        if (viteTailwindPlugin) logViteTailwindPluginResult(cwd, viteTailwindPlugin, Boolean(options.manual));
        if (viteTsconfig) logTsconfigAliasResult(cwd, viteTsconfig, Boolean(options.manual));
        if (viteConfigAlias) logViteConfigAliasResult(cwd, viteConfigAlias, Boolean(options.manual));
    }

    if (toolingIgnoresEnabled) {
        log.plain();
        log.title("Consumer tooling");
        logToolingIgnoreResult("ESLint", cwd, eslintIgnores);
        logToolingIgnoreResult("Prettier", cwd, prettierIgnore);
    }

    log.plain();
    if (!registryReachable) log.warn("Theme tokens, typography and providers are placeholders/offline fallbacks. See the note above.");

    const viteAliasFailed =
        !options.manual &&
        ((viteTsconfig?.status ?? "written") === "unsupported" ||
            (viteConfigAlias?.status ?? "written") === "unsupported" ||
            (viteTailwindPlugin?.status ?? "written") === "unsupported");
    if (viteAliasFailed) {
        log.error("Could not wire the Vite `@` alias or Tailwind plugin automatically. Add the snippets printed above by hand, then re-run `properui init`.");
        process.exitCode = 1;
        return;
    }

    log.plain();
    log.title("Files written/changed");
    if (filesTouched.length === 0) {
        log.step(kleur.dim("(none — everything already matched)"));
    } else {
        for (const file of [...new Set(filesTouched)]) log.step(file);
    }

    log.success("Project configured. Next: npx @properui/cli add buttons badges");

    // Install block — always last, so it is the final thing an agent (or a human) reads.
    const pluginPackages = [
        "@tailwindcss/typography",
        "tailwindcss-react-aria-components",
        ...(STYLESHEET_INCLUDES_ANIMATE_PLUGIN ? ["tailwindcss-animate"] : []),
    ];
    const viteTailwindPackages = project.framework === "vite" && viteTailwindPlugin?.status !== "already-present" ? ["tailwindcss", "@tailwindcss/vite"] : [];
    const required = [
        ...cxDependencies,
        ...(providersEnabled ? [...themeProviderDependencies, ...(wireRouter ? routerProviderDependencies : [])] : []),
        ...pluginPackages,
        ...viteTailwindPackages,
    ];
    const npmDependencies = missingDependencies(cwd, required);

    log.plain();
    if (npmDependencies.length === 0) {
        log.info("No new npm packages required — everything the written files need is already installed.");
        return;
    }

    log.title("Install");
    for (const dependency of npmDependencies) log.step(`${kleur.cyan("need  ")} ${dependency}`);

    const manager = project.packageManager;
    const cmd = installCommand(manager, npmDependencies);
    if (options.install) {
        log.plain();
        const { ok, command } = installDependencies(cwd, manager, npmDependencies);
        if (ok) log.success(`Installed with \`${command}\`.`);
        else log.error(`\`${command}\` failed. Run it yourself — the project will not build until it succeeds.`);
    } else {
        log.plain();
        log.warn(`Install to finish: ${kleur.bold(cmd)} — the project will not build until this runs.`);
    }
}

function statusLabel(status: WriteResult["status"]): string {
    if (status === "created") return kleur.green("write");
    if (status === "updated") return kleur.yellow("updat");
    if (status === "skipped") return kleur.dim("skip ");
    return kleur.dim("keep ");
}

function logTsconfigAliasResult(cwd: string, result: TsconfigAliasResult, manual: boolean): void {
    if (result.status === "already-declared") {
        log.step(`${kleur.dim("keep ")} ${result.file ? path.relative(cwd, result.file) : "tsconfig.json"} (alias already declared)`);
        return;
    }
    if (result.status === "skipped") {
        log.warn("No tsconfig.json, tsconfig.app.json or jsconfig.json found. Cannot wire the path alias. Add it yourself:");
        log.plain(kleur.dim(`        ${result.snippet}`));
        return;
    }
    const label = result.file ? path.relative(cwd, result.file) : "tsconfig.json";
    if (manual || result.status === "unsupported") {
        log.info(manual ? `Manual mode. Add this to ${label}'s "compilerOptions":` : `Could not find "compilerOptions" in ${label}. Add this yourself:`);
        log.plain(kleur.dim(`        ${result.snippet}`));
        return;
    }
    log.step(`${kleur.green("write")} ${label} (+ \`paths\` entry)`);
}

function logViteConfigAliasResult(cwd: string, result: ViteConfigAliasResult, manual: boolean): void {
    if (result.status === "already-present") {
        log.step(`${kleur.dim("keep ")} ${result.file ? path.relative(cwd, result.file) : "vite.config.ts"} (resolve.alias already present)`);
        return;
    }
    if (result.status === "skipped") {
        log.warn("No vite.config.(ts|mts|js|mjs) found. Vite build/tsc will fail on `@/...` imports until you add:");
        for (const line of result.snippet.split("\n")) log.plain(kleur.dim(`        ${line}`));
        return;
    }
    const label = result.file ? path.relative(cwd, result.file) : "vite.config.ts";
    if (manual || result.status === "unsupported") {
        log.info(
            manual
                ? `Manual mode. Add this inside ${label}'s defineConfig({ ... }):`
                : `Could not safely edit ${label} (unrecognised shape). Add this yourself:`,
        );
        for (const line of result.snippet.split("\n")) log.plain(kleur.dim(`        ${line}`));
        return;
    }
    log.step(`${kleur.green("write")} ${label} (+ \`resolve.alias\` for \`${result.aliasKey}\`)`);
}

function logViteTailwindPluginResult(cwd: string, result: ViteTailwindPluginResult, manual: boolean): void {
    if (result.status === "already-present") {
        log.step(`${kleur.dim("keep ")} ${result.file ? path.relative(cwd, result.file) : "vite.config.ts"} (tailwindcss() plugin already present)`);
        return;
    }
    if (result.status === "skipped") {
        log.warn("No vite.config.(ts|mts|js|mjs) found. Add the Tailwind Vite plugin yourself:");
        log.plain(kleur.dim('        import tailwindcss from "@tailwindcss/vite";'));
        log.plain(kleur.dim("        plugins: [tailwindcss()],"));
        return;
    }
    const label = result.file ? path.relative(cwd, result.file) : "vite.config.ts";
    if (manual || result.status === "unsupported") {
        log.info(
            manual
                ? `Manual mode. Add this inside ${label}'s defineConfig({ ... }):`
                : `Could not safely edit ${label} (unrecognised shape). Add this yourself:`,
        );
        log.plain(kleur.dim('        import tailwindcss from "@tailwindcss/vite";'));
        log.plain(kleur.dim("        plugins: [tailwindcss()],"));
        return;
    }
    log.step(`${kleur.green("write")} ${label} (+ \`tailwindcss()\` plugin)`);
}

function logToolingIgnoreResult(label: string, cwd: string, result: ToolingIgnoreResult | null): void {
    if (!result || result.status === "not-found") {
        log.step(`${kleur.dim("skip ")} ${label} (no config found)`);
        return;
    }
    if (result.status === "already-present") {
        log.step(`${kleur.dim("keep ")} ${label} — ${result.file ? path.relative(cwd, result.file) : ""} (ignore entry already present)`);
        return;
    }
    if (result.status === "unsupported") {
        log.warn(
            `${label}: could not parse ${result.file ? path.relative(cwd, result.file) : "the config"} (unrecognised shape). Add the ignore entries yourself.`,
        );
        return;
    }
    log.step(`${kleur.green("write")} ${label} — ${result.file ? path.relative(cwd, result.file) : ""} (+ ignore entries)`);
}
