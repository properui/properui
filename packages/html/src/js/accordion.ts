import { claim, ensureId, queryAll } from "./dom";

function setup(root: HTMLElement): void {
    const exclusive = root.hasAttribute("data-pui-exclusive");
    const items = () =>
        Array.from(root.querySelectorAll<HTMLDetailsElement>("details")).filter((d) => d.parentElement?.closest('[data-pui="accordion"]') === root);

    for (const details of items()) {
        // Native exclusive accordions (`<details name>`) where supported; the listener below covers the rest.
        if (exclusive && !details.hasAttribute("name")) details.setAttribute("name", ensureId(root, "accordion"));
        const summary = details.querySelector(":scope > summary");
        const panel = details.querySelector<HTMLElement>(":scope > .pui-accordion__panel");
        if (summary && panel) {
            summary.setAttribute("aria-controls", ensureId(panel, "accordion-panel"));
        }
    }

    if (!exclusive) return;
    root.addEventListener(
        "toggle",
        (event) => {
            const opened = event.target;
            if (!(opened instanceof HTMLDetailsElement) || !opened.open) return;
            for (const other of items()) if (other !== opened && other.open) other.open = false;
        },
        // `toggle` does not bubble; capture it on the way down instead.
        true,
    );
}

/**
 * `[data-pui="accordion"]`: `<details class="pui-accordion__item">` items. Keyboard, focus and
 * the expanded state are native to `<details>`/`<summary>`. With `data-pui-exclusive`, opening one
 * item closes the others (and every item gets the same `name`, so supporting browsers do it natively).
 */
export function initAccordions(root: ParentNode = document): void {
    for (const el of queryAll(root, '[data-pui="accordion"]')) if (claim(el, "accordion")) setup(el);
}
