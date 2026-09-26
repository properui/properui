/**
 * Compiles scripts/properui.entry.css to dist/properui.css with Tailwind v4 (the token source of
 * truth stays packages/ui/src/styles/theme.css, imported at build time, never copied into this
 * package's source).
 */
import tailwindcss from "@tailwindcss/postcss";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, "properui.entry.css");
const out = resolve(here, "../dist/properui.css");

const result = await postcss([tailwindcss({ base: resolve(here, ".."), optimize: { minify: false } })]).process(readFileSync(entry, "utf8"), {
    from: entry,
    to: out,
});

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, result.css);
console.log(`dist/properui.css  ${(Buffer.byteLength(result.css) / 1024).toFixed(1)} KB`);
