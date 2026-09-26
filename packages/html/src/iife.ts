/**
 * Entry for `dist/properui-html.iife.js`. tsup wraps this module as `var ProperUI = (...)()`, so a
 * classic `<script>` exposes `window.ProperUI.init`, `.toast`, `.setTheme`, ...
 * With `<script src=".../properui-html.iife.js" data-auto-init>`, `init()` runs on DOMContentLoaded.
 */
import { init } from "./js/init";

export * from "./index";

const script = typeof document !== "undefined" ? (document.currentScript as HTMLScriptElement | null) : null;

if (script?.hasAttribute("data-auto-init")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init(), { once: true });
    else init();
}
