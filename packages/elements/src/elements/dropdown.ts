import { PuiElement, type Rendered, defineProps, emit, h, readBool } from "../base";
import { initDropdowns } from "../behaviours";
import { icon } from "../icons";

/**
 * `<pui-menu-item>`: one item of a `<pui-dropdown>`. Renders a `<button class="pui-menu__item">`;
 * `value` is what `pui-select` reports (the text when absent), `is-disabled` disables it,
 * `<span slot="icon">` adds a leading icon, `shortcut` a trailing hint.
 */
export class PuiMenuItem extends PuiElement {
    static props = { value: "string", isDisabled: "boolean", shortcut: "string", href: "string" } as const;

    declare value: string | undefined;
    declare isDisabled: boolean;
    declare shortcut: string | undefined;
    declare href: string | undefined;

    #item: HTMLButtonElement | HTMLAnchorElement | null = null;
    #text: HTMLSpanElement | null = null;

    protected render(content: Node[]): Rendered {
        const href = this.getAttribute("href");
        const tag = href === null ? "button" : "a";
        let item = this.#item;
        if (!item || item.localName !== tag) item = tag === "a" ? h("a") : h("button", { type: "button" });
        this.#item = item;
        item.className = "pui-menu__item";
        item.setAttribute("role", "menuitem");
        item.setAttribute("tabindex", "-1");
        const disabled = readBool(this, "is-disabled");
        if (disabled) item.setAttribute("aria-disabled", "true");
        else item.removeAttribute("aria-disabled");
        if (item instanceof HTMLAnchorElement) {
            if (href !== null && !disabled) item.setAttribute("href", href);
            else item.removeAttribute("href");
        }
        const value = this.getAttribute("value");
        if (value !== null) item.dataset.value = value;
        else delete item.dataset.value;

        const text = (this.#text ??= h("span", { class: "pui-menu__label" }));
        text.replaceChildren(...content);
        const shortcut = this.getAttribute("shortcut");
        item.replaceChildren(
            ...this.slotted("icon").map((n) => (n instanceof Element && n.setAttribute("aria-hidden", "true"), n)),
            text,
            shortcut ? h("span", { class: "pui-menu__shortcut", "aria-hidden": "true" }, [shortcut]) : "",
        );
        return { nodes: [item], target: text };
    }
}
defineProps(PuiMenuItem);

/**
 * `<pui-dropdown>`: the host is the `.pui-dropdown` and the `data-pui="dropdown"` root that
 * `initDropdowns` from `@properui/html` drives (open/close, arrow keys, type-ahead, Escape,
 * outside click, `role="menu"`). `label` is the trigger's text, `color` and `size` style it as a
 * `<pui-button>`, `<span slot="trigger">` replaces its content, `align="start"` opens the menu from
 * the start edge. Children are `<pui-menu-item>`s and `<hr>` separators. Choosing an item emits
 * `pui-select` with `{ value }`.
 */
export class PuiDropdown extends PuiElement {
    static props = { label: "string", color: "string", size: "string", align: "string" } as const;

    declare label: string | undefined;
    declare color: string | undefined;
    declare size: string | undefined;
    declare align: string | undefined;

    #trigger: HTMLButtonElement | null = null;
    #menu: HTMLDivElement | null = null;

    protected render(content: Node[]): Rendered {
        this.setHostClasses("pui-dropdown");
        this.setAttribute("data-pui", "dropdown");
        const color = this.getAttribute("color") ?? "secondary";
        const size = this.getAttribute("size") ?? "sm";
        const trigger = (this.#trigger ??= h("button", { type: "button" }));
        trigger.className = `pui-btn pui-btn--${color} pui-btn--${size} pui-dropdown__trigger`;
        const custom = this.slotted("trigger");
        const label = this.getAttribute("label") ?? "Options";
        trigger.replaceChildren(...(custom.length ? custom : [label, icon("chevronDown", "pui-btn__icon pui-dropdown__chevron")]));
        if (custom.length && !custom.some((n) => (n.textContent ?? "").trim())) trigger.setAttribute("aria-label", label);
        else trigger.removeAttribute("aria-label");
        if (custom.length) for (const n of custom) if (n instanceof Element) n.removeAttribute("slot");

        const menu = (this.#menu ??= h("div", { hidden: true }));
        menu.className = this.getAttribute("align") === "start" ? "pui-menu pui-menu--start" : "pui-menu";
        for (const node of content) if (node instanceof HTMLHRElement) node.classList.add("pui-menu__separator");
        menu.replaceChildren(...content);
        return { nodes: [trigger, menu], target: menu };
    }

    protected connected(): void {
        this.addEventListener("pui:select", (event) => {
            const { item } = (event as CustomEvent<{ item: HTMLElement; value: string }>).detail;
            const host = item.closest("pui-menu-item");
            const value = host?.getAttribute("value") ?? item.dataset.value ?? item.textContent?.trim() ?? "";
            emit(this, "pui-select", { value, item: host ?? item });
        });
        initDropdowns(this);
    }
}
defineProps(PuiDropdown);
