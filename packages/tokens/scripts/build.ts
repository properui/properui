/**
 * Builds `@properui/tokens` into `dist/`.
 *
 * Nothing here is a second copy of the design tokens. The source of truth stays in
 * `packages/ui/src/styles` (`theme.css`, `typography.css`, `globals.css`, `presets.ts`); this
 * script copies, re-emits or compiles those files:
 *
 * - `theme.css`: `theme.css` + `typography.css` verbatim, under a generated header. The Tailwind
 *   v4 form (`@theme`, `@utility`), for Tailwind projects in any framework.
 * - `tokens.css`: every custom property of the `@theme` block re-emitted under `:root`, and the
 *   dark-mode block under `:root.dark-mode, .dark-mode`, as plain CSS with no Tailwind syntax. The
 *   Tailwind defaults the tokens reference (`--spacing`, the stock colour ramps some utility
 *   colours read) are resolved from `tailwindcss/theme.css` and emitted too, so the file stands
 *   alone in an app with no Tailwind at all.
 * - `presets/<name>.css`: one `@theme` override per shipped preset, from `generateThemeCss()`.
 * - `presets/plain/<name>.css`: the same preset as a plain `:root` block, for `tokens.css` users.
 * - `properui.css` / `properui.min.css`: Tailwind compiled from an entry that pulls in preflight,
 *   the token layer, the custom variants and base rules from `globals.css`, and (when the package
 *   exists) the `@properui/html` component classes plus every utility its snippets use.
 *
 * Run with `pnpm build` (or `tsx scripts/build.ts [outDir]`). `buildTokens()` is exported so the
 * tests can build into a temporary directory.
 */
import tailwindPostcss from "@tailwindcss/postcss";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import postcss from "postcss";
import { PRESET_BLOCK_END, PRESET_BLOCK_START, THEME_PRESETS, type ThemePreset, generateThemeCss, themePresetVariables } from "../../ui/src/styles/presets";

const here = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(here, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");
const stylesDir = path.join(repoRoot, "packages", "ui", "src", "styles");
const defaultHtmlRoot = path.join(repoRoot, "packages", "html");
const require = createRequire(path.join(packageRoot, "package.json"));

const { version } = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8")) as { version: string };

/* -------------------------------------------------------------------------- */
/* A small CSS reader                                                         */
/* -------------------------------------------------------------------------- */

/** One top-level item of a block body: a comment, a declaration, or a nested block. */
export type CssNode = { kind: "comment"; text: string } | { kind: "decl"; name: string; value: string } | { kind: "block"; prelude: string; body: string };

/**
 * Splits a stylesheet or block body into its top-level comments, declarations and blocks. It
 * understands comments, strings, parentheses and nested braces, which is all the token files use;
 * it is not a general CSS parser.
 */
export const parseCss = (source: string): CssNode[] => {
    const nodes: CssNode[] = [];
    let buffer = "";
    let i = 0;
    const flushDecl = () => {
        const text = buffer.trim();
        buffer = "";
        if (!text) return;
        const colon = text.indexOf(":");
        if (colon === -1) return;
        nodes.push({ kind: "decl", name: text.slice(0, colon).trim(), value: text.slice(colon + 1).trim() });
    };
    while (i < source.length) {
        const char = source[i];
        if (char === "/" && source[i + 1] === "*") {
            const end = source.indexOf("*/", i + 2);
            const stop = end === -1 ? source.length : end + 2;
            if (!buffer.trim()) nodes.push({ kind: "comment", text: source.slice(i, stop) });
            i = stop;
            continue;
        }
        if (char === '"' || char === "'") {
            let j = i + 1;
            while (j < source.length && source[j] !== char) j += source[j] === "\\" ? 2 : 1;
            buffer += source.slice(i, j + 1);
            i = j + 1;
            continue;
        }
        if (char === "(") {
            let depth = 0;
            let j = i;
            for (; j < source.length; j++) {
                if (source[j] === "(") depth++;
                else if (source[j] === ")" && --depth === 0) break;
            }
            buffer += source.slice(i, j + 1);
            i = j + 1;
            continue;
        }
        if (char === ";") {
            flushDecl();
            i++;
            continue;
        }
        if (char === "{") {
            let depth = 0;
            let j = i;
            for (; j < source.length; j++) {
                const c = source[j];
                if (c === "/" && source[j + 1] === "*") {
                    const end = source.indexOf("*/", j + 2);
                    j = end === -1 ? source.length : end + 1;
                    continue;
                }
                if (c === '"' || c === "'") {
                    let k = j + 1;
                    while (k < source.length && source[k] !== c) k += source[k] === "\\" ? 2 : 1;
                    j = k;
                    continue;
                }
                if (c === "{") depth++;
                else if (c === "}" && --depth === 0) break;
            }
            nodes.push({ kind: "block", prelude: buffer.trim(), body: source.slice(i + 1, j) });
            buffer = "";
            i = j + 1;
            continue;
        }
        buffer += char;
        i++;
    }
    flushDecl();
    return nodes;
};

const isThemeBlock = (node: CssNode): node is Extract<CssNode, { kind: "block" }> => node.kind === "block" && /^@theme\b/.test(node.prelude);

const isDarkBlock = (node: CssNode): node is Extract<CssNode, { kind: "block" }> =>
    node.kind === "block" &&
    node.prelude
        .split(",")
        .map((selector) => selector.trim())
        .includes(".dark-mode");

/** Tailwind namespace resets (`--color-*: initial`) have no meaning outside Tailwind. */
const isPlainCustomProperty = (name: string) => /^--[a-zA-Z0-9_-]+$/.test(name);

/** `--theme(--x, fallback)` is Tailwind's; `var()` is the plain-CSS equivalent. */
const toPlainValue = (value: string) => value.replace(/--theme\(/g, "var(");

const VAR_REFERENCE = /var\(\s*(--[a-zA-Z0-9_-]+)/g;

const referencedVariables = (value: string) => [...value.matchAll(VAR_REFERENCE)].map((match) => match[1] as string);

const indent = (text: string, prefix = "    ") =>
    text
        .split("\n")
        .map((line) => (line.trim() ? prefix + line : ""))
        .join("\n");

/** Re-indents a comment that was written at one level of indentation inside a block. */
const reindentComment = (text: string) =>
    text
        .split("\n")
        .map((line, index) => (index === 0 ? line.trim() : ` ${line.trim()}`))
        .join("\n");

/* -------------------------------------------------------------------------- */
/* tokens.css                                                                 */
/* -------------------------------------------------------------------------- */

/** The declarations of every `@theme` block in Tailwind's own `theme.css`, by name. */
const tailwindDefaults = (): Map<string, string> => {
    const defaults = new Map<string, string>();
    const source = readFileSync(path.join(path.dirname(require.resolve("tailwindcss/package.json")), "theme.css"), "utf8");
    for (const block of parseCss(source).filter(isThemeBlock)) {
        for (const node of parseCss(block.body)) {
            if (node.kind === "decl" && isPlainCustomProperty(node.name)) defaults.set(node.name, toPlainValue(node.value));
        }
    }
    return defaults;
};

/** Renders the nodes of a token block as plain CSS declarations, keeping its section comments. */
const renderDeclarations = (nodes: CssNode[]) => {
    const lines: string[] = [];
    for (const node of nodes) {
        if (node.kind === "comment") lines.push("", reindentComment(node.text));
        else if (node.kind === "decl" && isPlainCustomProperty(node.name)) lines.push(`${node.name}: ${toPlainValue(node.value)};`);
    }
    return indent(lines.join("\n").replace(/^\n+/, ""));
};

export interface TokenSummary {
    /** Custom properties emitted under `:root` (theme tokens plus resolved Tailwind defaults). */
    light: number;
    /** Custom properties emitted under `.dark-mode`. */
    dark: number;
    /** Tailwind defaults pulled in because a token references them. */
    defaults: number;
}

/**
 * Re-emits `theme.css` as plain CSS variables: `:root { ... }` for the `@theme` tokens (plus the
 * Tailwind defaults they reference), `:root.dark-mode, .dark-mode { ... }` for dark mode, and the
 * `@keyframes` declared inside `@theme` as top-level rules.
 */
export const generateTokensCss = (themeSource: string): { css: string; summary: TokenSummary } => {
    const topLevel = parseCss(themeSource);
    const themeNodes = topLevel.filter(isThemeBlock).flatMap((block) => parseCss(block.body));
    const darkBlocks = topLevel.filter(isDarkBlock);
    if (!themeNodes.length) throw new Error("theme.css has no @theme block");
    if (!darkBlocks.length) throw new Error("theme.css has no .dark-mode block");
    const darkNodes = darkBlocks.flatMap((block) => parseCss(block.body));

    const declared = new Set<string>();
    const values: string[] = [];
    for (const node of [...themeNodes, ...darkNodes]) {
        if (node.kind !== "decl" || !isPlainCustomProperty(node.name)) continue;
        declared.add(node.name);
        values.push(node.value);
    }

    // Close over every variable a token reads that theme.css leaves to Tailwind's defaults.
    const defaults = tailwindDefaults();
    const pulled = new Map<string, string>();
    const queue = values.flatMap(referencedVariables);
    while (queue.length) {
        const name = queue.shift() as string;
        if (declared.has(name) || pulled.has(name)) continue;
        const value = defaults.get(name);
        if (value === undefined) continue; // an optional hook such as --font-inter, which always has a fallback
        pulled.set(name, value);
        queue.push(...referencedVariables(value));
    }

    const keyframes = themeNodes.filter((node): node is Extract<CssNode, { kind: "block" }> => node.kind === "block" && node.prelude.startsWith("@keyframes"));
    const darkSelector = darkBlocks[0]?.prelude.replace(/\s*,\s*/g, ",\n") ?? ".dark-mode";

    const sections = [
        header("tokens.css", [
            "Every Proper UI design token as a plain CSS custom property: light values on :root,",
            "dark values on .dark-mode. No Tailwind required; read them with var(--color-bg-primary).",
            "Generated from packages/ui/src/styles/theme.css by packages/tokens/scripts/build.ts.",
        ]),
        ":root {",
        pulled.size
            ? indent(
                  [
                      "/* Tailwind defaults the tokens below reference (resolved from tailwindcss/theme.css). */",
                      ...[...pulled].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([name, value]) => `${name}: ${value};`),
                  ].join("\n"),
              ) + "\n"
            : "",
        renderDeclarations(themeNodes),
        "}",
        "",
        `${darkSelector} {`,
        renderDeclarations(darkNodes),
        "}",
        ...keyframes.flatMap((block) => ["", `${block.prelude} {`, indent(dedent(block.body)), "}"]),
        "",
    ];

    const count = (nodes: CssNode[]) => nodes.filter((node) => node.kind === "decl" && isPlainCustomProperty(node.name)).length;
    return {
        css: sections.join("\n"),
        summary: { light: count(themeNodes) + pulled.size, dark: count(darkNodes), defaults: pulled.size },
    };
};

/** Strips the common leading indentation of a block body. */
const dedent = (body: string) => {
    const lines = body.replace(/^\n+|\s+$/g, "").split("\n");
    const width = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^ */)?.[0].length ?? 0));
    return lines.map((line) => line.slice(width)).join("\n");
};

/* -------------------------------------------------------------------------- */
/* Headers and presets                                                        */
/* -------------------------------------------------------------------------- */

const header = (file: string, lines: string[]) =>
    [
        "/*!",
        ` * @properui/tokens v${version}: ${file}`,
        ...lines.map((line) => ` * ${line}`),
        " * MIT License. https://properui.dev/docs/tokens",
        " */",
        "",
    ].join("\n");

/** The same preset as `generateThemeCss()`, as a plain `:root` block for `tokens.css` users. */
export const generatePlainPresetCss = (preset: ThemePreset): string => {
    const variables = themePresetVariables(preset);
    return [
        PRESET_BLOCK_START,
        "/*",
        ` * Proper UI theme preset "${preset.label.replace(/\*\//g, "")}" as plain CSS variables.`,
        " * Load it after @properui/tokens/tokens.css (or properui.css). Both modes read these ramps.",
        " */",
        ":root {",
        ...Object.entries(variables).map(([name, value]) => `    ${name}: ${value};`),
        "}",
        PRESET_BLOCK_END,
        "",
    ].join("\n");
};

/* -------------------------------------------------------------------------- */
/* properui.css                                                               */
/* -------------------------------------------------------------------------- */

const cssPath = (file: string) => JSON.stringify(file.split(path.sep).join("/"));

/**
 * Where the `@properui/html` stylesheet lives, if that package exists in this checkout: the
 * package's `css` export when it is linked into this package's node_modules, else its
 * `src/index.css` by path.
 */
const resolveHtmlCss = (root: string): string | null => {
    const file = path.join(root, "src", "index.css");
    if (!existsSync(file)) return null;
    if (root !== defaultHtmlRoot) return file;
    try {
        require.resolve("@properui/html/css");
        return "@properui/html/css";
    } catch {
        return file;
    }
};

/** `globals.css` minus its imports and plugins: the custom variants, utilities and base rules. */
const globalsWithoutImports = () =>
    readFileSync(path.join(stylesDir, "globals.css"), "utf8")
        .split("\n")
        .filter((line) => !/^\s*@(import|plugin)\b/.test(line))
        .join("\n")
        .trim();

export interface PrebuiltEntry {
    css: string;
    /** Whether the `@properui/html` component layer was found and included. */
    html: boolean;
}

/** The Tailwind entry `properui.css` is compiled from. */
export const prebuiltEntry = (htmlRoot: string = defaultHtmlRoot): PrebuiltEntry => {
    const htmlSrc = path.join(htmlRoot, "src");
    const htmlCss = resolveHtmlCss(htmlRoot);
    const lines = [
        // No automatic source detection: only the html snippets decide which utilities ship.
        `@import "tailwindcss" source(none);`,
        // `theme(static)` keeps every token in the output, used by a utility or not, so a page can read any of them.
        `@import ${cssPath(path.join(stylesDir, "theme.css"))} theme(static);`,
        `@import ${cssPath(path.join(stylesDir, "typography.css"))};`,
    ];
    if (existsSync(htmlSrc)) lines.push(`@source ${cssPath(`${htmlSrc}/**/*.{html,css,ts}`)};`);
    if (htmlCss) lines.push(`@import ${cssPath(htmlCss)};`);
    lines.push("", globalsWithoutImports(), "");
    return { css: lines.join("\n"), html: Boolean(htmlCss) };
};

const compileTailwind = async (entry: string, minify: boolean) => {
    // `from` must sit inside this package so `tailwindcss` resolves from its node_modules.
    const result = await postcss([tailwindPostcss({ base: packageRoot, optimize: { minify } })]).process(entry, {
        from: path.join(packageRoot, "scripts", "properui.entry.css"),
    });
    return result.css;
};

const minifyCss = async (css: string, fallbackEntry: string) => {
    try {
        const { transform } = await import("lightningcss");
        return Buffer.from(transform({ filename: "properui.css", code: Buffer.from(css), minify: true }).code).toString("utf8");
    } catch {
        return compileTailwind(fallbackEntry, true);
    }
};

/* -------------------------------------------------------------------------- */
/* Build                                                                      */
/* -------------------------------------------------------------------------- */

export interface BuildResult {
    outDir: string;
    files: string[];
    tokens: TokenSummary;
    html: boolean;
}

export interface BuildOptions {
    /** Where to write; `dist/` by default. The directory is emptied first. */
    outDir?: string;
    /** Root of the `@properui/html` package; `packages/html` by default. Missing is fine. */
    htmlRoot?: string;
}

export const buildTokens = async ({ outDir = path.join(packageRoot, "dist"), htmlRoot = defaultHtmlRoot }: BuildOptions = {}): Promise<BuildResult> => {
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(path.join(outDir, "presets", "plain"), { recursive: true });
    const files: string[] = [];
    const write = (relative: string, content: string) => {
        writeFileSync(path.join(outDir, relative), content);
        files.push(relative);
    };

    const themeSource = readFileSync(path.join(stylesDir, "theme.css"), "utf8");
    const typographySource = readFileSync(path.join(stylesDir, "typography.css"), "utf8");

    write(
        "theme.css",
        [
            header("theme.css", [
                "The Proper UI token layer in Tailwind CSS v4 form: import it after tailwindcss.",
                '  @import "tailwindcss";',
                '  @import "@properui/tokens/theme.css";',
                "Verbatim copy of packages/ui/src/styles/theme.css + typography.css. Do not edit.",
            ]),
            themeSource.trimEnd(),
            "",
            typographySource.trimEnd(),
            "",
        ].join("\n"),
    );

    const tokens = generateTokensCss(themeSource);
    write("tokens.css", tokens.css);

    for (const preset of THEME_PRESETS) {
        write(`presets/${preset.name}.css`, generateThemeCss(preset));
        write(`presets/plain/${preset.name}.css`, generatePlainPresetCss(preset));
    }

    const entry = prebuiltEntry(htmlRoot);
    const banner = header("properui.css", [
        "Prebuilt, self-contained Proper UI stylesheet: Tailwind preflight, every design token,",
        entry.html ? "and the @properui/html component classes. No build step needed." : "and the base layer. No build step needed.",
        "Toggle dark mode with the .dark-mode class on <html>.",
    ]);
    const compiled = await compileTailwind(entry.css, false);
    write("properui.css", `${banner}${compiled}`);
    const minified = await minifyCss(compiled, entry.css);
    write("properui.min.css", `/*! @properui/tokens v${version} | MIT | https://properui.dev/docs/tokens */\n${minified}`);

    return { outDir, files, tokens: tokens.summary, html: entry.html };
};

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
    const outDir = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
    buildTokens({ outDir })
        .then((result) => {
            const relative = path.relative(process.cwd(), result.outDir) || ".";
            console.log(`@properui/tokens: wrote ${result.files.length} files to ${relative}`);
            console.log(`  tokens.css: ${result.tokens.light} light (${result.tokens.defaults} Tailwind defaults), ${result.tokens.dark} dark`);
            console.log(
                `  properui.css: ${result.html ? "tokens + @properui/html components" : "tokens + preflight only (packages/html/src/index.css not found)"}`,
            );
        })
        .catch((error: unknown) => {
            console.error(error);
            process.exitCode = 1;
        });
}
