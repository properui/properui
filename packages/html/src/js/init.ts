import { initAccordions } from "./accordion";
import { initDismiss } from "./dismiss";
import { initDropdowns } from "./dropdown";
import { initModals } from "./modal";
import { initTabs } from "./tabs";
import { initThemeToggles, restoreTheme } from "./theme";
import { initToastTriggers } from "./toast";
import { initTooltips } from "./tooltip";

/**
 * Initialises every behaviour under `root` (default: the whole document): `data-pui="dropdown"`,
 * `"tabs"`, `"accordion"` and `"theme-toggle"`, plus `data-pui-modal-open`, `data-pui-tooltip`,
 * `data-pui-dismiss` and `data-pui-toast`. It also re-applies a theme saved by `setTheme`.
 * Safe to call again after new markup is added (a framework re-render, an HTMX swap): elements
 * already set up carry `data-pui-ready` and are skipped.
 */
export function init(root: ParentNode = document): void {
    if (typeof document === "undefined") return;
    restoreTheme();
    initDropdowns(root);
    initTabs(root);
    initModals(root);
    initAccordions(root);
    initTooltips(root);
    initDismiss(root);
    initThemeToggles(root);
    initToastTriggers(root);
}
