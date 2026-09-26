import { claim, emit, ensureId, isDisabled, queryAll, setDefault } from "./dom";

const ROOT = '[data-pui="dropdown"]';
const ITEM = ".pui-menu__item, [role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']";

interface Dropdown {
    root: HTMLElement;
    trigger: HTMLElement;
    menu: HTMLElement;
}

const open = new Set<Dropdown>();
let documentListening = false;

function items(menu: HTMLElement): HTMLElement[] {
    return Array.from(menu.querySelectorAll<HTMLElement>(ITEM)).filter((item) => !isDisabled(item));
}

function place(dropdown: Dropdown): void {
    const { menu, trigger } = dropdown;
    menu.removeAttribute("data-placement");
    const view = menu.ownerDocument.defaultView;
    if (!view) return;
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const below = view.innerHeight - triggerRect.bottom;
    const above = triggerRect.top;
    if (menuRect.height > below && above > below) menu.setAttribute("data-placement", "top");
}

function openMenu(dropdown: Dropdown, focus: "first" | "last" | "none"): void {
    for (const other of Array.from(open)) if (other !== dropdown) closeMenu(other, false);
    const { root, trigger, menu } = dropdown;
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    root.setAttribute("data-open", "");
    open.add(dropdown);
    place(dropdown);
    const list = items(menu);
    const target = focus === "last" ? list[list.length - 1] : focus === "first" ? list[0] : undefined;
    target?.focus();
    emit(root, "open", {});
}

function closeMenu(dropdown: Dropdown, restoreFocus: boolean): void {
    const { root, trigger, menu } = dropdown;
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    root.removeAttribute("data-open");
    open.delete(dropdown);
    if (restoreFocus) trigger.focus();
    emit(root, "close", {});
}

function onDocumentPointer(event: Event): void {
    const target = event.target as Node | null;
    for (const dropdown of Array.from(open)) {
        if (!target || !dropdown.root.contains(target)) closeMenu(dropdown, false);
    }
}

function onDocumentFocus(event: FocusEvent): void {
    const target = event.target as Node | null;
    for (const dropdown of Array.from(open)) {
        if (target && !dropdown.root.contains(target)) closeMenu(dropdown, false);
    }
}

function setup(root: HTMLElement): void {
    const trigger = root.querySelector<HTMLElement>(".pui-dropdown__trigger, [data-pui-trigger]");
    const menu = root.querySelector<HTMLElement>(".pui-menu, [data-pui-menu]");
    if (!trigger || !menu) return;

    const dropdown: Dropdown = { root, trigger, menu };
    const triggerId = ensureId(trigger, "dropdown-trigger");
    const menuId = ensureId(menu, "menu");

    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", menuId);
    menu.setAttribute("role", "menu");
    setDefault(menu, "aria-labelledby", triggerId);
    menu.setAttribute("tabindex", "-1");
    menu.hidden = true;

    menu.querySelectorAll<HTMLElement>(".pui-menu__item").forEach((item) => {
        setDefault(item, "role", "menuitem");
        item.setAttribute("tabindex", "-1");
        if (item.hasAttribute("disabled")) item.setAttribute("aria-disabled", "true");
    });
    menu.querySelectorAll<HTMLElement>(".pui-menu__separator").forEach((sep) => sep.setAttribute("role", "separator"));
    menu.querySelectorAll<HTMLElement>(".pui-menu__section").forEach((section) => {
        section.setAttribute("role", "group");
        const heading = section.querySelector<HTMLElement>(".pui-menu__heading");
        if (heading) {
            heading.setAttribute("role", "presentation");
            setDefault(section, "aria-labelledby", ensureId(heading, "menu-heading"));
        }
    });

    trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (menu.hidden) openMenu(dropdown, "first");
        else closeMenu(dropdown, false);
    });

    trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(dropdown, event.key === "ArrowUp" ? "last" : "first");
        } else if (event.key === "Escape" && !menu.hidden) {
            event.preventDefault();
            closeMenu(dropdown, true);
        }
    });

    menu.addEventListener("keydown", (event) => {
        const list = items(menu);
        const index = list.indexOf(document.activeElement as HTMLElement);
        const move = (next: number) => {
            event.preventDefault();
            list[(next + list.length) % list.length]?.focus();
        };
        switch (event.key) {
            case "ArrowDown":
                return move(index + 1);
            case "ArrowUp":
                return move(index < 0 ? list.length - 1 : index - 1);
            case "Home":
            case "PageUp":
                return move(0);
            case "End":
            case "PageDown":
                return move(list.length - 1);
            case "Escape":
                event.preventDefault();
                event.stopPropagation();
                return closeMenu(dropdown, true);
            case "Tab":
                return closeMenu(dropdown, false);
            case " ":
            case "Enter": {
                const current = list[index];
                // A <button> activates natively on both keys and a link on Enter; anything else
                // (a link on Space, a `role="menuitem"` div) is clicked here.
                if (!current || current instanceof HTMLButtonElement) return;
                if (event.key === "Enter" && current instanceof HTMLAnchorElement) return;
                event.preventDefault();
                current.click();
                return;
            }
            default:
                if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    const char = event.key.toLowerCase();
                    const start = index + 1;
                    const ordered = [...list.slice(start), ...list.slice(0, start)];
                    const match = ordered.find((item) => (item.textContent ?? "").trim().toLowerCase().startsWith(char));
                    if (match) {
                        event.preventDefault();
                        match.focus();
                    }
                }
        }
    });

    menu.addEventListener("click", (event) => {
        const item = (event.target as Element).closest<HTMLElement>(ITEM);
        if (!item || !menu.contains(item)) return;
        if (isDisabled(item)) {
            event.preventDefault();
            return;
        }
        emit(root, "select", { item, value: item.dataset.value ?? item.textContent?.trim() ?? "" });
        if (!item.hasAttribute("data-pui-keep-open")) closeMenu(dropdown, true);
    });

    if (!documentListening) {
        documentListening = true;
        document.addEventListener("pointerdown", onDocumentPointer, true);
        document.addEventListener("click", onDocumentPointer, true);
        document.addEventListener("focusin", onDocumentFocus);
    }
}

/**
 * `[data-pui="dropdown"]`: a `.pui-dropdown__trigger` that opens a `.pui-menu`.
 * Click or ArrowDown/ArrowUp/Enter/Space on the trigger opens it; arrow keys, Home/End and
 * type-ahead move between items; Escape closes and returns focus; a click outside or Tab closes.
 * Sets `role="menu"`/`menuitem`/`separator`/`group`, `aria-haspopup`, `aria-expanded` and
 * `aria-controls`. Fires `pui:open`, `pui:close` and `pui:select` (`detail.item`, `detail.value`).
 */
export function initDropdowns(root: ParentNode = document): void {
    for (const el of queryAll(root, ROOT)) if (claim(el, "dropdown")) setup(el);
}
