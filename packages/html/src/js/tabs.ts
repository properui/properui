import { claim, emit, ensureId, isDisabled, isRtl, queryAll } from "./dom";

const ROOT = '[data-pui="tabs"]';

function setup(root: HTMLElement): void {
    const list = root.querySelector<HTMLElement>(".pui-tabs__list, [role='tablist']");
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll<HTMLElement>(".pui-tab, [role='tab']"));
    const panels = Array.from(root.querySelectorAll<HTMLElement>(".pui-tabs__panel, [role='tabpanel']")).filter((panel) => panel.closest(ROOT) === root);
    if (tabs.length === 0) return;

    const vertical = list.getAttribute("aria-orientation") === "vertical";
    list.setAttribute("role", "tablist");

    // Pair each tab with its panel: `aria-controls` or `data-pui-tab="<panel id>"` if the author
    // set one, otherwise by position.
    const panelFor = new Map<HTMLElement, HTMLElement | undefined>();
    tabs.forEach((tab, index) => {
        const wanted = tab.getAttribute("aria-controls") ?? tab.getAttribute("data-pui-tab");
        const panel = (wanted && root.ownerDocument.getElementById(wanted)) || panels[index];
        panelFor.set(tab, panel ?? undefined);
        tab.setAttribute("role", "tab");
        const tabId = ensureId(tab, "tab");
        if (tab instanceof HTMLButtonElement && !tab.hasAttribute("type")) tab.type = "button";
        if (panel) {
            tab.setAttribute("aria-controls", ensureId(panel, "tabpanel"));
            panel.setAttribute("role", "tabpanel");
            panel.setAttribute("aria-labelledby", tabId);
            if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "0");
        }
    });

    const select = (tab: HTMLElement, focus: boolean, fromUser: boolean) => {
        for (const other of tabs) {
            const selected = other === tab;
            other.setAttribute("aria-selected", String(selected));
            other.setAttribute("tabindex", selected ? "0" : "-1");
            const panel = panelFor.get(other);
            if (panel) panel.hidden = !selected;
        }
        if (focus) tab.focus();
        if (fromUser) {
            const panel = panelFor.get(tab);
            if (root.hasAttribute("data-pui-hash") && panel && typeof history !== "undefined") {
                history.replaceState(history.state, "", `#${panel.id}`);
            }
            emit(root, "change", { tab, panel, index: tabs.indexOf(tab) });
        }
    };

    // Initial selection: the URL hash (with `data-pui-hash`), then `aria-selected="true"`, then the first enabled tab.
    const hash = root.hasAttribute("data-pui-hash") && typeof location !== "undefined" ? decodeURIComponent(location.hash.slice(1)) : "";
    const fromHash = hash ? tabs.find((tab) => panelFor.get(tab)?.id === hash) : undefined;
    const initial = fromHash ?? tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs.find((tab) => !isDisabled(tab)) ?? tabs[0];
    if (initial) select(initial, false, false);

    list.addEventListener("click", (event) => {
        const tab = (event.target as Element).closest<HTMLElement>("[role='tab']");
        if (!tab || !tabs.includes(tab) || isDisabled(tab)) return;
        if (tab instanceof HTMLAnchorElement) event.preventDefault();
        select(tab, true, true);
    });

    list.addEventListener("keydown", (event) => {
        const current = (event.target as Element).closest<HTMLElement>("[role='tab']");
        if (!current || !tabs.includes(current)) return;
        const enabled = tabs.filter((tab) => !isDisabled(tab));
        const index = enabled.indexOf(current);
        const rtl = isRtl(list);
        const next = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
        const prev = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
        let target: HTMLElement | undefined;
        if (event.key === next) target = enabled[(index + 1) % enabled.length];
        else if (event.key === prev) target = enabled[(index - 1 + enabled.length) % enabled.length];
        else if (event.key === "Home") target = enabled[0];
        else if (event.key === "End") target = enabled[enabled.length - 1];
        if (!target) return;
        event.preventDefault();
        // Automatic activation, as React Aria's Tabs do by default: moving focus selects.
        select(target, true, true);
    });
}

/**
 * `[data-pui="tabs"]`: a `.pui-tabs__list` of `.pui-tab` elements and their `.pui-tabs__panel`s
 * (paired by `aria-controls`, `data-pui-tab="<panel id>"`, or order). Sets `role="tablist"`/`tab`/
 * `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby` and a roving tabindex; the arrow
 * keys (mirrored in RTL, Up/Down with `aria-orientation="vertical"`), Home and End move and select.
 * With `data-pui-hash` the selected panel's id is kept in the URL hash. Fires `pui:change`.
 */
export function initTabs(root: ParentNode = document): void {
    for (const el of queryAll(root, ROOT)) if (claim(el, "tabs")) setup(el);
}
