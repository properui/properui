import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initModals } from "./modal";

const markup = `
    <button id="opener" type="button" data-pui-modal-open="dlg">Open</button>
    <dialog class="pui-modal" id="dlg">
        <div class="pui-modal__header">
            <h2 class="pui-modal__title">Invite</h2>
            <p class="pui-modal__description">Send an invite.</p>
            <button class="pui-modal__close" type="button" aria-label="Close">x</button>
        </div>
        <div class="pui-modal__body"><input id="email" type="email" aria-label="Email" /></div>
        <div class="pui-modal__footer">
            <button id="cancel" type="button" data-pui-modal-close value="cancel">Cancel</button>
        </div>
    </dialog>`;

const parts = () => ({
    opener: document.getElementById("opener") as HTMLButtonElement,
    dialog: document.getElementById("dlg") as HTMLDialogElement,
});

describe.each([
    ["without showModal (fallback)", false],
    ["with native showModal", true],
])("initModals %s", (_label, native) => {
    const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
    const original = { showModal: proto.showModal, close: proto.close };

    beforeEach(() => {
        if (native) {
            proto.showModal = function (this: HTMLDialogElement) {
                this.setAttribute("open", "");
            };
            proto.close = function (this: HTMLDialogElement, value?: string) {
                if (value !== undefined) this.returnValue = value;
                this.removeAttribute("open");
                this.dispatchEvent(new Event("close"));
            };
        }
        document.body.innerHTML = markup;
        initModals();
    });

    afterEach(() => {
        proto.showModal = original.showModal;
        proto.close = original.close;
    });

    it("labels the dialog from its title and description", () => {
        const { dialog, opener } = parts();
        expect(dialog.getAttribute("aria-labelledby")).toBe(dialog.querySelector(".pui-modal__title")!.id);
        expect(dialog.getAttribute("aria-describedby")).toBe(dialog.querySelector(".pui-modal__description")!.id);
        expect(opener.getAttribute("aria-haspopup")).toBe("dialog");
    });

    it("opens, moves focus inside, and restores focus to the opener on close", () => {
        const { opener, dialog } = parts();
        opener.focus();
        opener.click();
        expect(dialog.open).toBe(true);
        expect(dialog.contains(document.activeElement)).toBe(true);
        dialog.querySelector<HTMLButtonElement>(".pui-modal__close")!.click();
        expect(dialog.open).toBe(false);
        expect(document.activeElement).toBe(opener);
    });

    it("passes the closing button's value as returnValue", () => {
        const { opener, dialog } = parts();
        const onClose = vi.fn();
        dialog.addEventListener("pui:close", onClose);
        opener.click();
        document.getElementById("cancel")!.click();
        expect(onClose).toHaveBeenCalledTimes(1);
        if (native) expect(dialog.returnValue).toBe("cancel");
    });

    it("closes on a backdrop click unless data-pui-static is set", () => {
        const { opener, dialog } = parts();
        opener.click();
        dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 1, clientY: 1 }));
        expect(dialog.open).toBe(false);
        dialog.setAttribute("data-pui-static", "");
        opener.click();
        dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 1, clientY: 1 }));
        expect(dialog.open).toBe(true);
    });

    if (!native) {
        it("closes on Escape in the fallback", () => {
            const { opener, dialog } = parts();
            opener.focus();
            opener.click();
            dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
            expect(dialog.open).toBe(false);
            expect(document.activeElement).toBe(opener);
        });
    }
});
