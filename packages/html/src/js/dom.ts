/**
 * Small DOM helpers shared by the behaviours. Not part of the public API.
 */

/** Every element under `root` (and `root` itself) that matches `selector`. */
export function queryAll<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
    const found = Array.from(root.querySelectorAll<T>(selector));
    if (root instanceof Element && root.matches(selector)) found.unshift(root as unknown as T);
    return found;
}

/**
 * Marks `el` as initialised for `behaviour` and reports whether it already was. `data-pui-ready`
 * holds a space-separated list, so one element can carry several behaviours (a dropdown trigger
 * with a tooltip, say) and each is set up exactly once however often `init` runs.
 */
export function claim(el: Element, behaviour: string): boolean {
    const ready = (el.getAttribute("data-pui-ready") ?? "").split(" ").filter(Boolean);
    if (ready.includes(behaviour)) return false;
    ready.push(behaviour);
    el.setAttribute("data-pui-ready", ready.join(" "));
    return true;
}

let counter = 0;

/** Returns `el.id`, assigning a unique one first when it has none. */
export function ensureId(el: Element, prefix: string): string {
    if (!el.id) {
        let id: string;
        do {
            counter += 1;
            id = `pui-${prefix}-${counter}`;
        } while (el.ownerDocument.getElementById(id));
        el.id = id;
    }
    return el.id;
}

/** Sets an attribute only when the author has not set one. */
export function setDefault(el: Element, name: string, value: string): void {
    if (!el.hasAttribute(name)) el.setAttribute(name, value);
}

/** Whether the element (or its nearest `dir` ancestor) is right-to-left. */
export function isRtl(el: Element): boolean {
    return el.closest("[dir]")?.getAttribute("dir") === "rtl";
}

/** Whether a control is disabled, natively or through `aria-disabled`. */
export function isDisabled(el: Element): boolean {
    return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
}

export const FOCUSABLE = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type=hidden])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "summary",
    "[contenteditable]:not([contenteditable=false])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Fires a bubbling `pui:<name>` custom event from `el`. */
export function emit<T>(el: Element, name: string, detail: T): void {
    el.dispatchEvent(new CustomEvent(`pui:${name}`, { bubbles: true, detail }));
}
