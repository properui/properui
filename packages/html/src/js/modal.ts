import { FOCUSABLE, claim, emit, ensureId, queryAll, setDefault } from "./dom";

/** Where focus returns when each dialog closes. */
const returnFocus = new WeakMap<HTMLDialogElement, HTMLElement>();

function focusInitial(dialog: HTMLDialogElement): void {
    const target = dialog.querySelector<HTMLElement>("[autofocus]") ?? dialog.querySelector<HTMLElement>(FOCUSABLE) ?? dialog;
    if (target === dialog) dialog.setAttribute("tabindex", "-1");
    target.focus();
}

/**
 * Opens a `<dialog>` as a modal. Uses `showModal()` (top layer, inert page, native Escape) and
 * falls back to the `open` attribute where it is missing, so older engines and test DOMs still work.
 */
export function openModal(dialog: HTMLDialogElement, opener?: HTMLElement | null): void {
    if (dialog.open) return;
    const active = opener ?? (dialog.ownerDocument.activeElement as HTMLElement | null);
    if (active && active !== dialog.ownerDocument.body) returnFocus.set(dialog, active);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    focusInitial(dialog);
    emit(dialog, "open", {});
}

/** Closes a modal opened by `openModal` (or natively); focus returns to whatever opened it. */
export function closeModal(dialog: HTMLDialogElement, returnValue?: string): void {
    if (!dialog.open) return;
    if (typeof dialog.close === "function") {
        dialog.close(returnValue);
    } else {
        dialog.removeAttribute("open");
        dialog.dispatchEvent(new Event("close"));
    }
}

function setupDialog(dialog: HTMLDialogElement): void {
    if (!claim(dialog, "modal")) return;
    if (!dialog.hasAttribute("aria-label")) {
        const title = dialog.querySelector(".pui-modal__title");
        if (title) setDefault(dialog, "aria-labelledby", ensureId(title, "modal-title"));
    }
    const description = dialog.querySelector(".pui-modal__description");
    if (description) setDefault(dialog, "aria-describedby", ensureId(description, "modal-description"));
    if (typeof dialog.showModal !== "function") setDefault(dialog, "role", "dialog");

    dialog.addEventListener("close", () => {
        const target = returnFocus.get(dialog);
        returnFocus.delete(dialog);
        if (target && target.isConnected) target.focus();
        emit(dialog, "close", { returnValue: dialog.returnValue });
    });

    // Escape: native `showModal()` already fires `cancel` and closes; the fallback needs a hand.
    dialog.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && typeof dialog.showModal !== "function") {
            event.preventDefault();
            closeModal(dialog);
        }
    });

    dialog.addEventListener("click", (event) => {
        const closer = (event.target as Element).closest("[data-pui-modal-close], .pui-modal__close");
        if (closer && dialog.contains(closer)) {
            closeModal(dialog, closer.getAttribute("value") ?? undefined);
            return;
        }
        // A click on the dialog element itself outside its box is a click on the ::backdrop.
        if (event.target === dialog && !dialog.hasAttribute("data-pui-static")) {
            const rect = dialog.getBoundingClientRect();
            const inside =
                rect.width > 0 && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
            if (!inside) closeModal(dialog);
        }
    });
}

/**
 * `[data-pui-modal-open="<dialog id>"]` buttons open that `<dialog>` with `showModal()`;
 * `[data-pui-modal-close]` or `.pui-modal__close` inside it closes it (its `value` becomes the
 * dialog's `returnValue`), as do Escape and a click on the backdrop (not with `data-pui-static`).
 * Focus moves to the first focusable element (or `[autofocus]`) and returns to the opener on close.
 * Sets `aria-labelledby`/`aria-describedby` from `.pui-modal__title`/`.pui-modal__description`.
 * Fires `pui:open` and `pui:close` on the dialog.
 */
export function initModals(root: ParentNode = document): void {
    for (const opener of queryAll(root, "[data-pui-modal-open]")) {
        if (!claim(opener, "modal-open")) continue;
        const id = opener.getAttribute("data-pui-modal-open") ?? "";
        const dialog = opener.ownerDocument.getElementById(id);
        if (dialog instanceof HTMLDialogElement) {
            opener.setAttribute("aria-haspopup", "dialog");
            opener.setAttribute("aria-controls", id);
            setupDialog(dialog);
        }
        opener.addEventListener("click", (event) => {
            const target = opener.ownerDocument.getElementById(id);
            if (!(target instanceof HTMLDialogElement)) return;
            event.preventDefault();
            setupDialog(target);
            openModal(target, opener);
        });
    }
    for (const dialog of queryAll<HTMLDialogElement>(root, "dialog.pui-modal")) setupDialog(dialog);
}
