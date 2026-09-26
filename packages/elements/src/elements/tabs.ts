import { PuiElement, type Rendered, defineProps, emit, h, nextId, readBool } from "../base";
import { initTabs } from "../behaviours";

/** `<pui-tab>`: one tab of a `<pui-tabs>`. Renders a `<button class="pui-tab">`; `value` pairs it with the `<pui-tab-panel>` of the same `value` (otherwise tabs and panels pair by order), `is-disabled` disables it. */
export class PuiTab extends PuiElement {
    static props = { value: "string", isDisabled: "boolean" } as const;

    declare value: string | undefined;
    declare isDisabled: boolean;

    #button: HTMLButtonElement | null = null;

    /** The rendered `<button role="tab">`. */
    get button(): HTMLButtonElement | null {
        return this.#button;
    }

    protected render(content: Node[]): Rendered {
        const button = (this.#button ??= h("button", { type: "button", class: "pui-tab", id: nextId("tab"), "aria-selected": "false", tabindex: "-1" }));
        button.disabled = readBool(this, "is-disabled");
        button.replaceChildren(...content);
        return { nodes: [button], target: button };
    }
}
defineProps(PuiTab);

/** `<pui-tab-panel>`: the host is the `.pui-tabs__panel` (`role="tabpanel"`), shown while its tab is selected. */
export class PuiTabPanel extends PuiElement {
    static props = { value: "string" } as const;

    declare value: string | undefined;

    protected render(content: Node[]): Rendered {
        this.setHostClasses("pui-tabs__panel");
        if (!this.id) this.id = nextId("tabpanel");
        return { nodes: content, target: null };
    }
}
defineProps(PuiTabPanel);

/**
 * `<pui-tabs>`: the host is the `.pui-tabs` and the `data-pui="tabs"` root that `initTabs` from
 * `@properui/html` drives (roles, roving tabindex, arrow keys, Home/End, automatic activation).
 * `<pui-tab>` children go into the tab list, `<pui-tab-panel>` children follow it. `label` names
 * the tab list, `type` is `underline` (default) or `button`, `selected` (a tab's `value` or index)
 * picks the selected tab. Selecting a tab emits `pui-change` with `{ value, index }`.
 *
 * The set of tabs is read when the element first renders; to change which tabs exist, render a new
 * `<pui-tabs>` (a `key` in Vue, `{#key}` in Svelte).
 */
export class PuiTabs extends PuiElement {
    static props = { label: "string", type: "string", selected: "string" } as const;

    declare label: string | undefined;
    declare type: string | undefined;
    declare selected: string | undefined;

    #list: HTMLDivElement | null = null;
    #initialised = false;

    protected render(content: Node[]): Rendered {
        const type = this.getAttribute("type") ?? "underline";
        this.setHostClasses("pui-tabs", type.startsWith("button") ? "pui-tabs--button" : "pui-tabs--underline");
        this.setAttribute("data-pui", "tabs");
        const list = (this.#list ??= h("div", { class: "pui-tabs__list" }));
        const label = this.getAttribute("label");
        if (label) list.setAttribute("aria-label", label);
        else list.removeAttribute("aria-label");

        const isTab = (n: Node) => n instanceof Element && n.localName === "pui-tab";
        const tabs = [...Array.from(list.childNodes), ...content.filter(isTab)];
        list.replaceChildren(...tabs);
        return { nodes: [list, ...content.filter((n) => !isTab(n))], target: null };
    }

    protected changed(name: string): void {
        if (name === "selected") this.#selectFromAttribute();
        else this.rerender();
    }

    protected connected(): void {
        this.addEventListener("pui:change", (event) => {
            const { tab, index } = (event as CustomEvent<{ tab: HTMLElement; index: number }>).detail;
            const host = tab.closest("pui-tab");
            if (!host || !this.contains(host)) return;
            emit(this, "pui-change", { value: host.getAttribute("value") ?? String(index), index });
        });
        // The tabs and panels upgrade after this element; initialise once they have rendered.
        const ready =
            typeof customElements === "undefined"
                ? Promise.resolve()
                : Promise.all([customElements.whenDefined("pui-tab"), customElements.whenDefined("pui-tab-panel")]);
        void ready.then(() => queueMicrotask(() => this.#init()));
    }

    #tabs(): PuiTab[] {
        return Array.from(this.#list?.children ?? []).filter((el): el is PuiTab => el instanceof PuiTab);
    }

    #panels(): PuiTabPanel[] {
        return Array.from(this.children).filter((el): el is PuiTabPanel => el instanceof PuiTabPanel);
    }

    #init(): void {
        if (this.#initialised || !this.isConnected) return;
        this.#initialised = true;
        const tabs = this.#tabs();
        const panels = this.#panels();
        for (const el of [...tabs, ...panels]) el.renderNow();
        // Pair by `value` where both sides set one; `initTabs` pairs the rest by order.
        for (const tab of tabs) {
            const value = tab.getAttribute("value");
            const panel = value === null ? undefined : panels.find((p) => p.getAttribute("value") === value);
            if (panel && tab.button) tab.button.setAttribute("data-pui-tab", panel.id);
        }
        const initial = this.#find(this.getAttribute("selected"));
        if (initial?.button) initial.button.setAttribute("aria-selected", "true");
        initTabs(this);
    }

    #find(key: string | null): PuiTab | undefined {
        if (key === null) return undefined;
        const tabs = this.#tabs();
        return tabs.find((t) => t.getAttribute("value") === key) ?? (/^\d+$/.test(key) ? tabs[Number(key)] : undefined);
    }

    /** Applies a changed `selected` attribute the way `initTabs` selects: aria-selected, tabindex, panel `hidden`. */
    #selectFromAttribute(): void {
        const target = this.#find(this.getAttribute("selected"));
        if (!target?.button || !this.#initialised) return;
        for (const tab of this.#tabs()) {
            const button = tab.button;
            if (!button) continue;
            const selected = tab === target;
            button.setAttribute("aria-selected", String(selected));
            button.setAttribute("tabindex", selected ? "0" : "-1");
            const panelId = button.getAttribute("aria-controls");
            const panel = panelId ? document.getElementById(panelId) : null;
            if (panel) panel.hidden = !selected;
        }
    }
}
defineProps(PuiTabs);
