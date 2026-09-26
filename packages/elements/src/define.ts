import { PuiAlert } from "./elements/alert";
import { PuiAvatar } from "./elements/avatar";
import { PuiBadge } from "./elements/badge";
import { PuiBreadcrumbs } from "./elements/breadcrumbs";
import { PuiButton } from "./elements/button";
import { PuiDropdown, PuiMenuItem } from "./elements/dropdown";
import { PuiCheckbox, PuiInput, PuiSelect, PuiTextarea, PuiToggle } from "./elements/fields";
import { PuiModal, delegateModalTriggers } from "./elements/modal";
import { PuiPagination } from "./elements/pagination";
import { PuiProgress } from "./elements/progress";
import { PuiSkeleton } from "./elements/skeleton";
import { PuiTab, PuiTabPanel, PuiTabs } from "./elements/tabs";
import { PuiThemeToggle } from "./elements/theme-toggle";
import { PuiTooltip } from "./elements/tooltip";

/** Every element, by tag name. */
export const elements = {
    "pui-button": PuiButton,
    "pui-badge": PuiBadge,
    "pui-avatar": PuiAvatar,
    "pui-input": PuiInput,
    "pui-textarea": PuiTextarea,
    "pui-checkbox": PuiCheckbox,
    "pui-toggle": PuiToggle,
    "pui-select": PuiSelect,
    "pui-alert": PuiAlert,
    "pui-tabs": PuiTabs,
    "pui-tab": PuiTab,
    "pui-tab-panel": PuiTabPanel,
    "pui-dropdown": PuiDropdown,
    "pui-menu-item": PuiMenuItem,
    "pui-modal": PuiModal,
    "pui-tooltip": PuiTooltip,
    "pui-progress": PuiProgress,
    "pui-skeleton": PuiSkeleton,
    "pui-breadcrumbs": PuiBreadcrumbs,
    "pui-pagination": PuiPagination,
    "pui-theme-toggle": PuiThemeToggle,
} as const;

export type ElementTag = keyof typeof elements;

/**
 * Host display defaults. Wrapper elements are `display: contents`, so the `<button>` or `<dialog>`
 * they render is what a flex or grid parent lays out; the ones that wrap a block are `block`.
 * Elements that carry an `@properui/html` class themselves (`pui-badge`, `pui-alert`, ...) get
 * their `display` from that class and are not listed. `:where()` keeps every rule at zero
 * specificity, so any author style wins.
 */
const HOST_CSS = [
    ":where(pui-button,pui-tooltip,pui-theme-toggle,pui-modal,pui-tab,pui-menu-item){display:contents}",
    ":where(pui-input,pui-textarea,pui-select,pui-breadcrumbs,pui-pagination,pui-tab-panel:not([hidden])){display:block}",
    ":where(pui-checkbox,pui-toggle){display:inline-block}",
    ":where(.pui-btn__icon)>svg{width:100%;height:100%}",
].join("");

function injectHostStyles(): void {
    if (typeof document === "undefined" || document.querySelector("style[data-pui-elements]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-pui-elements", "");
    style.textContent = HOST_CSS;
    document.head.prepend(style);
}

/**
 * Defines every element (or the listed ones) on `customElements`. Safe to call more than once and
 * alongside another copy of the package: a tag that is already defined is left alone. A no-op
 * during server rendering.
 */
export function defineElements(tags: ElementTag[] = Object.keys(elements) as ElementTag[]): void {
    if (typeof customElements === "undefined") return;
    injectHostStyles();
    delegateModalTriggers();
    for (const tag of tags) {
        if (!customElements.get(tag)) customElements.define(tag, elements[tag]);
    }
}
