import { PuiElement, type Rendered, defineProps, emit, h, readBool } from "../base";
import { icon } from "../icons";

type Variant = "info" | "success" | "warning" | "error";

/** React `Alert` colours map onto the four html tones. */
const COLOR_TO_VARIANT: Record<string, Variant> = {
    brand: "info",
    default: "info",
    gray: "info",
    info: "info",
    success: "success",
    warning: "warning",
    error: "error",
};

/**
 * `<pui-alert>`: the host is the `.pui-alert`. `variant` (info, success, warning, error; `color`
 * with a React `Alert` colour also works), `title`, content as the body, `<div slot="actions">`
 * for buttons. `dismissible` adds a close button that emits a cancelable `pui-dismiss`; unless a
 * listener calls `preventDefault()`, the alert then hides itself (`hidden`), so a framework that
 * rendered it keeps owning the node.
 *
 * Error and warning alerts are announced (`role="alert"`), info and success politely
 * (`role="status"`). Set `role` yourself to override.
 */
export class PuiAlert extends PuiElement {
    static props = { variant: "string", color: "string", title: "string", dismissible: "boolean", dismissLabel: "string" } as const;

    declare variant: string | undefined;
    declare color: string | undefined;
    declare dismissible: boolean;
    declare dismissLabel: string | undefined;

    #description: HTMLDivElement | null = null;
    #autoRole: string | null = null;

    protected render(content: Node[]): Rendered {
        const raw = this.getAttribute("variant") ?? this.getAttribute("color") ?? "info";
        const variant: Variant = COLOR_TO_VARIANT[raw] ?? "info";
        const title = this.takeTitle();
        this.setHostClasses("pui-alert", `pui-alert--${variant}`);

        const role = variant === "error" || variant === "warning" ? "alert" : "status";
        if (!this.hasAttribute("role") || this.getAttribute("role") === this.#autoRole) {
            this.setHostAttr("role", role);
            this.#autoRole = role;
        }

        const description = (this.#description ??= h("div", { class: "pui-alert__description" }));
        description.replaceChildren(...content);
        const actions = this.slotted("actions");
        const body = h("div", { class: "pui-alert__body" }, [
            title ? h("p", { class: "pui-alert__title" }, [title]) : null,
            description,
            actions.length ? h("div", { class: "pui-alert__actions" }, actions) : null,
        ]);
        const nodes: Node[] = [
            icon(variant === "success" ? "success" : variant === "warning" ? "warning" : variant === "error" ? "error" : "info", "pui-alert__icon"),
            body,
        ];

        if (readBool(this, "dismissible")) {
            const close = h("button", { type: "button", class: "pui-alert__close", "aria-label": this.getAttribute("dismiss-label") ?? "Dismiss" }, [
                icon("close"),
            ]);
            close.addEventListener("click", () => this.dismiss());
            nodes.push(close);
        }
        return { nodes, target: description };
    }

    /** Emits `pui-dismiss` and, unless it is cancelled, hides the alert. */
    dismiss(): void {
        if (emit(this, "pui-dismiss", undefined, true)) this.hidden = true;
    }
}
defineProps(PuiAlert);
