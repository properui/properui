import { defineConfig } from "tsup";

/**
 * - `dist/index.js` + `dist/register.js` (+ `.d.ts`): ESM for bundlers; `@properui/html` stays an
 *   import, so an app that also uses the html behaviours ships them once.
 * - `dist/properui-elements.global.js`: a classic script that defines every element and exposes
 *   `window.ProperUIElements`, with the `@properui/html` behaviours bundled in, for a page with no
 *   build step.
 */
export default defineConfig([
    {
        entry: { index: "src/index.ts", register: "src/register.ts" },
        format: ["esm"],
        platform: "browser",
        target: "es2022",
        dts: true,
        sourcemap: true,
        external: ["@properui/html"],
    },
    {
        entry: { "properui-elements": "src/iife.ts" },
        format: ["iife"],
        globalName: "ProperUIElements",
        platform: "browser",
        target: "es2022",
        minify: true,
        sourcemap: true,
        noExternal: ["@properui/html"],
    },
]);
