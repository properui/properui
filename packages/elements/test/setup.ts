/**
 * jsdom gaps the elements rely on: `<dialog>` methods (jsdom has the element, not `showModal`) and
 * `CSS.escape` (used by the html behaviours' id helper).
 */
const dialog = HTMLDialogElement.prototype as HTMLDialogElement & { returnValue: string };

if (typeof dialog.showModal !== "function") {
    const values = new WeakMap<HTMLDialogElement, string>();
    Object.defineProperty(dialog, "returnValue", {
        configurable: true,
        get(this: HTMLDialogElement) {
            return values.get(this) ?? "";
        },
        set(this: HTMLDialogElement, value: string) {
            values.set(this, String(value));
        },
    });
    dialog.show = function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
    };
    dialog.showModal = function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
    };
    dialog.close = function (this: HTMLDialogElement & { returnValue: string }, returnValue?: string) {
        if (!this.hasAttribute("open")) return;
        if (returnValue !== undefined) this.returnValue = returnValue;
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
    };
}

const globalCss = globalThis as unknown as { CSS?: { escape?: (value: string) => string } };
if (!globalCss.CSS?.escape) {
    globalCss.CSS = { ...(globalCss.CSS ?? {}), escape: (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`) };
}
