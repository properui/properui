import { PuiElement, type Rendered, defineProps, emit, h, nextId, readBool } from "../base";
import { icon } from "../icons";

/**
 * `<pui-modal>`: wraps a native `<dialog class="pui-modal">`, so focus containment, Escape, the top
 * layer and the inert background come from the platform.
 *
 * `open` shows it as a modal (and is removed again when it closes), `.show()` / `.close()` do the
 * same from script. `title` and `description` fill the header, the content becomes the body, and
 * `<div slot="footer">` holds the actions. `size` (sm, md, lg). Clicking the backdrop closes it
 * unless `is-dismissable="false"`. Closing, by any route, emits `pui-close` with
 * `{ returnValue }`; a `<form method="dialog">` inside closes it with the submit button's value.
 *
 * Any element with `data-pui-modal-open="<id of the pui-modal>"` opens it on click.
 */
export class PuiModal extends PuiElement {
    static props = {
        open: "boolean",
        title: "string",
        description: "string",
        label: "string",
        size: "string",
        isDismissable: "string",
        closeLabel: "string",
    } as const;

    declare open: boolean;
    declare description: string | undefined;
    declare size: string | undefined;
    declare closeLabel: string | undefined;

    #dialog: HTMLDialogElement | null = null;
    #body: HTMLDivElement | null = null;
    #returnFocus: HTMLElement | null = null;
    #syncing = false;
    readonly #titleId = nextId("modal-title");

    /** The rendered `<dialog>`, once connected. */
    get dialog(): HTMLDialogElement | null {
        return this.#dialog;
    }

    /** Opens the modal. */
    show(): void {
        this.toggleAttribute("open", true);
    }

    /** Closes the modal; `returnValue` is passed on in the `pui-close` event. */
    close(returnValue?: string): void {
        const dialog = this.#dialog;
        if (dialog?.open) dialog.close(returnValue);
        else this.toggleAttribute("open", false);
    }

    protected connected(): void {
        this.#syncOpen();
    }

    protected changed(name: string): void {
        if (name === "open") {
            if (!this.#syncing) this.#syncOpen();
            return;
        }
        this.rerender();
    }

    #syncOpen(): void {
        const dialog = this.#dialog;
        if (!dialog) return;
        const wanted = readBool(this, "open");
        if (wanted && !dialog.open) {
            this.#returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (typeof dialog.showModal === "function" && dialog.isConnected) dialog.showModal();
            else dialog.setAttribute("open", "");
        } else if (!wanted && dialog.open) {
            dialog.close();
        }
    }

    #onClose = (): void => {
        const dialog = this.#dialog;
        this.#syncing = true;
        try {
            this.removeAttribute("open");
        } finally {
            this.#syncing = false;
        }
        const target = this.#returnFocus;
        this.#returnFocus = null;
        if (target?.isConnected) target.focus();
        emit(this, "pui-close", { returnValue: dialog?.returnValue ?? "" });
    };

    protected render(content: Node[]): Rendered {
        const title = this.takeTitle();
        const description = this.getAttribute("description");
        const size = this.getAttribute("size") ?? "md";
        const dialog = this.#dialog ?? this.#createDialog();

        dialog.className = `pui-modal pui-modal--${["sm", "md", "lg"].includes(size) ? size : "md"}`;
        if (title) dialog.setAttribute("aria-labelledby", this.#titleId);
        else dialog.removeAttribute("aria-labelledby");
        const label = this.getAttribute("label");
        if (!title && label) dialog.setAttribute("aria-label", label);
        else dialog.removeAttribute("aria-label");

        const close = h("button", { type: "button", class: "pui-modal__close", "aria-label": this.getAttribute("close-label") ?? "Close" }, [icon("close")]);
        close.addEventListener("click", () => this.close());
        const header = h("div", { class: "pui-modal__header" }, [
            ...this.slotted("icon").map((n) => (n instanceof Element && n.classList.add("pui-modal__icon"), n)),
            title ? h("h2", { class: "pui-modal__title", id: this.#titleId }, [title]) : null,
            description ? h("p", { class: "pui-modal__description" }, [description]) : null,
            close,
        ]);
        const body = (this.#body ??= h("div", { class: "pui-modal__body" }));
        body.replaceChildren(...content);
        const footer = this.slotted("footer");
        dialog.replaceChildren(header, body, ...footer.map((n) => (n instanceof Element && n.classList.add("pui-modal__footer"), n)));
        return { nodes: [dialog], target: body };
    }

    #createDialog(): HTMLDialogElement {
        const dialog = h("dialog");
        dialog.addEventListener("close", this.#onClose);
        // A click whose target is the <dialog> itself landed on the backdrop (the panel's children cover the rest).
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog && this.getAttribute("is-dismissable") !== "false") this.close();
        });
        dialog.addEventListener("cancel", (event) => {
            if (this.getAttribute("is-dismissable") === "false") event.preventDefault();
        });
        this.#dialog = dialog;
        return dialog;
    }
}
defineProps(PuiModal);

let delegated = false;
/** One document listener for `data-pui-modal-open` triggers that point at a `<pui-modal>`. */
export function delegateModalTriggers(): void {
    if (delegated || typeof document === "undefined") return;
    delegated = true;
    document.addEventListener("click", (event) => {
        const trigger = (event.target as Element | null)?.closest?.("[data-pui-modal-open]");
        const id = trigger?.getAttribute("data-pui-modal-open");
        const modal = id ? document.getElementById(id) : null;
        if (modal instanceof PuiModal) {
            event.preventDefault();
            modal.show();
        }
    });
}
