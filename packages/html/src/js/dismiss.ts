import { claim, emit, queryAll } from "./dom";

/**
 * `[data-pui-dismiss]` buttons remove the closest `.pui-alert` (or the element whose id the
 * attribute names: `data-pui-dismiss="banner"`), then move focus to `<main>` or the body so it is
 * not lost with the removed node. Fires `pui:dismiss` on the removed element first.
 */
export function initDismiss(root: ParentNode = document): void {
    for (const button of queryAll(root, "[data-pui-dismiss]")) {
        if (!claim(button, "dismiss")) continue;
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-pui-dismiss");
            const target = id ? button.ownerDocument.getElementById(id) : button.closest<HTMLElement>(".pui-alert, [data-pui-dismissible]");
            if (!target) return;
            emit(target, "dismiss", {});
            const hadFocus = target.contains(button.ownerDocument.activeElement);
            target.remove();
            if (hadFocus) {
                const fallback = button.ownerDocument.querySelector<HTMLElement>("main") ?? button.ownerDocument.body;
                if (!fallback.hasAttribute("tabindex")) fallback.setAttribute("tabindex", "-1");
                fallback.focus();
            }
        });
    }
}
