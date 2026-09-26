import { PuiElement, type Rendered, cls, defineProps, h, isMeaningful, place, readBool } from "../base";

/** Colours the React `Button` accepts, and the `.pui-btn` modifier each one maps to. */
const COLOR_CLASS: Record<string, string> = {
    primary: "pui-btn--primary",
    secondary: "pui-btn--secondary",
    tertiary: "pui-btn--tertiary",
    link: "pui-btn--link",
    "link-color": "pui-btn--link",
    "link-gray": "pui-btn--link-gray",
    "link-destructive": "pui-btn--link",
    "primary-destructive": "pui-btn--primary-destructive",
    "secondary-destructive": "pui-btn--secondary-destructive",
    "tertiary-destructive": "pui-btn--tertiary-destructive",
};

/** `xs` exists in React only; the html layer starts at `sm`, which is also the React default. */
const SIZES = ["sm", "md", "lg", "xl"];

/** Marks an author's slotted icon as the button's icon, the way React's `iconLeading` does. */
const asIcon = (node: Node, position: "leading" | "trailing"): Node => {
    if (node instanceof Element) {
        node.classList.add("pui-btn__icon");
        node.setAttribute("data-icon", position);
        if (!node.hasAttribute("aria-hidden") && !node.hasAttribute("aria-label")) node.setAttribute("aria-hidden", "true");
    }
    return node;
};

/**
 * `<pui-button>`: renders a `<button class="pui-btn">`, or an `<a>` when `href` is set.
 *
 * Attributes mirror the React `Button` props: `color`, `size`, `is-disabled`, `is-loading`, `href`,
 * `type`. Icons go in `<span slot="icon-leading">` / `<span slot="icon-trailing">`; a button with
 * only an icon gets `pui-btn--icon-only` and needs a `label` (its accessible name).
 */
export class PuiButton extends PuiElement {
    static props = {
        color: "string",
        size: "string",
        href: "string",
        target: "string",
        rel: "string",
        type: "string",
        name: "string",
        value: "string",
        form: "string",
        label: "string",
        isDisabled: "boolean",
        isLoading: "boolean",
    } as const;

    declare color: string | undefined;
    declare size: string | undefined;
    declare href: string | undefined;
    declare target: string | undefined;
    declare rel: string | undefined;
    declare type: string | undefined;
    declare name: string | undefined;
    declare value: string | undefined;
    declare form: string | undefined;
    declare label: string | undefined;
    declare isDisabled: boolean;
    declare isLoading: boolean;

    #control: HTMLButtonElement | HTMLAnchorElement | null = null;
    #text: HTMLSpanElement | null = null;

    /** The rendered `<button>` or `<a>`, once connected. */
    get control(): HTMLButtonElement | HTMLAnchorElement | null {
        return this.#control;
    }

    override focus(options?: FocusOptions): void {
        if (this.#control) this.#control.focus(options);
        else super.focus(options);
    }

    override click(): void {
        if (this.#control) this.#control.click();
        else super.click();
    }

    protected render(content: Node[]): Rendered {
        const color = this.getAttribute("color") ?? "primary";
        const size = this.getAttribute("size") ?? "sm";
        const href = this.getAttribute("href");
        const disabled = readBool(this, "is-disabled") || readBool(this, "disabled");
        const loading = readBool(this, "is-loading");
        const label = this.getAttribute("label");
        const leading = this.slotted("icon-leading").map((n) => asIcon(n, "leading"));
        const trailing = this.slotted("icon-trailing").map((n) => asIcon(n, "trailing"));
        const iconOnly = !content.some(isMeaningful) && leading.length + trailing.length > 0;

        const tag = href !== null ? "a" : "button";
        let control = this.#control;
        if (!control || control.localName !== tag) control = tag === "a" ? h("a") : h("button");
        this.#control = control;

        control.className = cls(
            "pui-btn",
            COLOR_CLASS[color] ?? "pui-btn--primary",
            `pui-btn--${SIZES.includes(size) ? size : "sm"}`,
            iconOnly && "pui-btn--icon-only",
        );
        const set = (name: string, value: string | null) => (value === null ? control.removeAttribute(name) : control.setAttribute(name, value));
        set("aria-label", label);
        set("title", iconOnly ? label : null);
        set("data-loading", loading ? "" : null);
        set("aria-busy", loading ? "true" : null);

        if (control instanceof HTMLAnchorElement) {
            const inactive = disabled || loading;
            set("href", inactive ? null : href);
            set("role", inactive ? "link" : null);
            set("aria-disabled", inactive ? "true" : null);
            set("target", this.getAttribute("target"));
            set("rel", this.getAttribute("rel") ?? (this.getAttribute("target") === "_blank" ? "noopener noreferrer" : null));
        } else {
            control.type = (this.getAttribute("type") as "button" | "submit" | "reset" | null) ?? "button";
            control.disabled = disabled || loading;
            set("name", this.getAttribute("name"));
            set("value", this.getAttribute("value"));
            set("form", this.getAttribute("form"));
        }

        const text = (this.#text ??= h("span", { class: "pui-btn__text", "data-text": true }));
        place(text, content);
        place(control, [...leading, text, ...trailing]);
        return { nodes: [control], target: text };
    }
}
defineProps(PuiButton);
