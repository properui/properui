import { defineConfig } from "tsup";

/**
 * Two builds of the same behaviours, no dependencies in either:
 * - `dist/index.js` (+ `.d.ts`): ESM for bundlers and `<script type="module">`.
 * - `dist/properui-html.iife.js`: a classic script that defines `window.ProperUI` and, when its
 *   `<script>` tag carries `data-auto-init`, calls `init()` on `DOMContentLoaded`.
 */
export default defineConfig([
    {
        entry: { index: "src/index.ts" },
        format: ["esm"],
        platform: "browser",
        target: "es2020",
        dts: true,
        sourcemap: true,
    },
    {
        entry: { "properui-html": "src/iife.ts" },
        format: ["iife"],
        globalName: "ProperUI",
        platform: "browser",
        target: "es2019",
        minify: true,
        sourcemap: true,
        outExtension: () => ({ js: ".iife.js" }),
    },
]);
