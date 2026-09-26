import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PRESET_BLOCK_END, PRESET_BLOCK_START, THEME_PRESETS } from "../../ui/src/styles/presets";
import { type BuildResult, buildTokens, parseCss } from "../scripts/build";

const scratch = mkdtempSync(path.join(tmpdir(), "properui-tokens-"));
const read = (outDir: string, file: string) => readFileSync(path.join(outDir, file), "utf8");

/** The declarations of the first top-level rule whose selector list includes `selector`. */
const declarationsOf = (css: string, selector: string) => {
    const block = parseCss(css).find(
        (node) =>
            node.kind === "block" &&
            node.prelude
                .split(",")
                .map((part) => part.trim())
                .includes(selector),
    );
    if (block?.kind !== "block") return new Map<string, string>();
    return new Map(parseCss(block.body).flatMap((node) => (node.kind === "decl" ? [[node.name, node.value] as const] : [])));
};

let result: BuildResult;
const outDir = path.join(scratch, "dist");

beforeAll(async () => {
    // A missing html package must not fail the build: this is the "tokens + preflight only" path.
    result = await buildTokens({ outDir, htmlRoot: path.join(scratch, "no-html-package") });
});

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

describe("tokens.css", () => {
    it("declares --color-bg-primary under both :root and .dark-mode", () => {
        const css = read(outDir, "tokens.css");
        const light = declarationsOf(css, ":root");
        const dark = declarationsOf(css, ".dark-mode");
        expect(light.get("--color-bg-primary")).toBeTruthy();
        expect(dark.get("--color-bg-primary")).toBeTruthy();
        expect(dark.get("--color-bg-primary")).not.toBe(light.get("--color-bg-primary"));
    });

    it("is plain CSS with no Tailwind syntax", () => {
        const css = read(outDir, "tokens.css");
        expect(css).not.toMatch(/@theme|@utility|@apply|@custom-variant|--theme\(/);
    });

    it("defines every variable its tokens reference, except optional hooks with a fallback", () => {
        const css = read(outDir, "tokens.css");
        const defined = new Set([...declarationsOf(css, ":root").keys(), ...declarationsOf(css, ".dark-mode").keys()]);
        const missing = [...css.matchAll(/var\((--[a-zA-Z0-9_-]+)(\s*,)?/g)]
            .filter(([, name, fallback]) => !defined.has(name as string) && !fallback)
            .map(([, name]) => name);
        expect([...new Set(missing)]).toEqual([]);
        expect(defined.has("--spacing")).toBe(true);
    });

    it("carries every custom property of theme.css's @theme block", () => {
        const theme = readFileSync(path.join(__dirname, "../../ui/src/styles/theme.css"), "utf8");
        const themeBlock = parseCss(theme).find((node) => node.kind === "block" && node.prelude.startsWith("@theme"));
        if (themeBlock?.kind !== "block") throw new Error("no @theme block");
        const names = parseCss(themeBlock.body).flatMap((node) => (node.kind === "decl" ? [node.name] : []));
        const light = declarationsOf(read(outDir, "tokens.css"), ":root");
        expect(names.filter((name) => !light.has(name))).toEqual([]);
        expect(result.tokens.light).toBeGreaterThanOrEqual(names.length);
    });
});

describe("presets", () => {
    it("writes one @theme file and one plain file per shipped preset, each with the marked block", () => {
        for (const preset of THEME_PRESETS) {
            for (const file of [`presets/${preset.name}.css`, `presets/plain/${preset.name}.css`]) {
                const css = read(outDir, file);
                expect(css.startsWith(PRESET_BLOCK_START), file).toBe(true);
                expect(css.trimEnd().endsWith(PRESET_BLOCK_END), file).toBe(true);
                expect(css, file).toContain("--color-brand-600:");
            }
            expect(read(outDir, `presets/${preset.name}.css`)).toContain("@theme {");
            expect(read(outDir, `presets/plain/${preset.name}.css`)).toContain(":root {");
        }
        expect(readdirSync(path.join(outDir, "presets")).filter((file) => file.endsWith(".css"))).toHaveLength(THEME_PRESETS.length);
    });
});

describe("theme.css", () => {
    it("is theme.css + typography.css under a header", () => {
        const css = read(outDir, "theme.css");
        expect(css.startsWith("/*!")).toBe(true);
        expect(css).toContain("@theme {");
        expect(css).toContain(".prose");
        expect(css).toContain(":root.dark-mode,");
    });
});

describe("properui.css", () => {
    it("is compiled, carries the tokens and the dark-mode block, and has no Tailwind at-rules left", () => {
        for (const file of ["properui.css", "properui.min.css"]) {
            const css = read(outDir, file);
            expect(css, file).toContain(".dark-mode");
            expect(css, file).toMatch(/--color-bg-primary:/);
            expect(css, file).not.toMatch(/@theme|@apply|@custom-variant|@source|@import/);
        }
        expect(result.html).toBe(false);
        expect(read(outDir, "properui.min.css").length).toBeLessThan(read(outDir, "properui.css").length);
    });

    it("includes the @properui/html layer and the utilities its snippets use when the package exists", async () => {
        const htmlRoot = path.join(scratch, "html");
        mkdirSync(path.join(htmlRoot, "src", "css"), { recursive: true });
        mkdirSync(path.join(htmlRoot, "src", "components", "buttons"), { recursive: true });
        writeFileSync(path.join(htmlRoot, "src", "index.css"), '@import "./css/button.css";\n');
        writeFileSync(
            path.join(htmlRoot, "src", "css", "button.css"),
            "@layer components {\n    .pui-btn {\n        @apply bg-brand-solid text-white;\n    }\n}\n",
        );
        writeFileSync(path.join(htmlRoot, "src", "components", "buttons", "primary.html"), '<button class="pui-btn ps-4">Save</button>\n');

        const withHtml = await buildTokens({ outDir: path.join(scratch, "with-html"), htmlRoot });
        const css = read(withHtml.outDir, "properui.css");
        expect(withHtml.html).toBe(true);
        expect(css).toContain(".pui-btn");
        expect(css).toContain("var(--color-bg-brand-solid)");
        expect(css).toContain(".ps-4");
    });
});
