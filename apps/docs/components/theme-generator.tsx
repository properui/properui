import { readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "~/lib/content";
import { ThemeGeneratorClient } from "./theme-generator-client";

/**
 * `<ThemeGenerator />` — the MDX block behind /docs/theme-generator.
 *
 * The interactive part is the client component in `theme-generator-client.tsx`. This server
 * wrapper exists for one reason: a preset only redeclares primitives (`--color-brand-*`,
 * `--color-neutral-*`, `--radius-*`), and every semantic token that reads them is declared once
 * on `:root` (or `.dark-mode`), where its `var()` is resolved. Overriding the primitives inline
 * on a preview wrapper below `:root` therefore changes nothing by itself. So the preview also
 * needs every dependent semantic declaration re-stated on the wrapper, in light and dark form.
 * Rather than hand-maintain that list (the fixed one in `app/preview/[...path]/page.tsx` is
 * brand-only and light-only), it is derived here from `theme.css` at build time.
 */

/** Root custom properties a preset redeclares; everything that transitively reads one is re-scoped. */
const PRIMITIVE = /^--color-(brand|neutral)-\d+$/;

/** Body of the first `{ … }` block that starts at or after `from`, braces balanced. */
const blockAfter = (css: string, from: number): string => {
    const open = css.indexOf("{", from);
    if (from === -1 || open === -1) return "";
    let depth = 0;
    for (let index = open; index < css.length; index += 1) {
        if (css[index] === "{") depth += 1;
        else if (css[index] === "}") {
            depth -= 1;
            if (depth === 0) return css.slice(open + 1, index);
        }
    }
    return "";
};

/** Top-level `--name: value` declarations of a block body (nested blocks such as `@keyframes` are skipped). */
const declarations = (body: string): Map<string, string> => {
    const flat = body.replace(/\/\*[\s\S]*?\*\//g, "");
    let topLevel = "";
    let depth = 0;
    for (const char of flat) {
        if (char === "{") depth += 1;
        else if (char === "}") depth -= 1;
        else if (depth === 0) topLevel += char;
    }
    const map = new Map<string, string>();
    for (const statement of topLevel.split(";")) {
        const match = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(statement);
        if (match?.[1] && match[2]) map.set(match[1], match[2].replace(/\s+/g, " "));
    }
    return map;
};

/** Names in `map` whose value reads a primitive or a `seed`, directly or through other dependents. */
const dependents = (map: Map<string, string>, seeds: Set<string>): Set<string> => {
    const found = new Set<string>(seeds);
    let grew = true;
    while (grew) {
        grew = false;
        for (const [name, value] of map) {
            if (found.has(name) || PRIMITIVE.test(name)) continue;
            const refs = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1] as string);
            if (refs.some((ref) => PRIMITIVE.test(ref) || found.has(ref))) {
                found.add(name);
                grew = true;
            }
        }
    }
    return found;
};

let cached: string | undefined;

/**
 * Two rules keyed on the wrapper's `data-theme-preview` mode. Each re-states, for that mode,
 * every token the dark block redeclares and every token that reads a primitive or one of those
 * (transitively, e.g. `--background-color-primary` → `--color-bg-primary`), so the preview can
 * show either mode regardless of the site's own theme.
 */
const scopedTokenCss = (): string => {
    if (cached !== undefined) return cached;
    const css = readFileSync(path.join(repoRoot(), "packages", "ui", "src", "styles", "theme.css"), "utf8");
    const light = declarations(blockAfter(css, css.indexOf("@theme")));
    const darkOnly = declarations(blockAfter(css, css.indexOf(":root.dark-mode")));
    const dark = new Map([...light, ...darkOnly]);

    const seeds = new Set(darkOnly.keys());
    const names = new Set([...dependents(light, seeds), ...dependents(dark, seeds)]);
    names.forEach((name) => PRIMITIVE.test(name) && names.delete(name));

    const rule = (mode: "light" | "dark", map: Map<string, string>) => {
        const lines = [...names].filter((name) => map.has(name)).map((name) => `${name}:${map.get(name)};`);
        return `[data-theme-preview="${mode}"]{${lines.join("")}}`;
    };
    cached = `${rule("light", light)}${rule("dark", dark)}`;
    return cached;
};

export const ThemeGenerator = () => <ThemeGeneratorClient scopedCss={scopedTokenCss()} />;
