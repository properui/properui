/**
 * Attribute and event types for every element, keyed by tag. They drive the editor typings in
 * `@properui/elements/vue` and `@properui/elements/react`, and document the public surface.
 * Attribute names are the HTML names (kebab-case), mirroring the React props (`isDisabled` ->
 * `is-disabled`).
 */

/** A boolean attribute: present, absent, or the strings Vue and Angular bindings write. */
export type BooleanAttribute = boolean | "" | "true" | "false";

export type ButtonColor =
    | "primary"
    | "secondary"
    | "tertiary"
    | "link"
    | "link-color"
    | "link-gray"
    | "link-destructive"
    | "primary-destructive"
    | "secondary-destructive"
    | "tertiary-destructive";

export type BadgeColor = "gray" | "brand" | "error" | "warning" | "success" | "blue" | "indigo" | "purple" | "pink" | "orange";

export interface PuiButtonAttributes {
    /** Colour variant, as the React `Button`'s `color`. @default "primary" */
    color?: ButtonColor;
    /** @default "sm" */
    size?: "sm" | "md" | "lg" | "xl";
    /** Renders an `<a>` instead of a `<button>`. */
    href?: string;
    target?: string;
    rel?: string;
    /** @default "button" */
    type?: "button" | "submit" | "reset";
    name?: string;
    value?: string;
    /** Id of the form the button submits, when it sits outside it. */
    form?: string;
    /** Accessible name; required for an icon-only button (also its hover title). */
    label?: string;
    "is-disabled"?: BooleanAttribute;
    /** Shows a spinner, sets `aria-busy` and disables the button. */
    "is-loading"?: BooleanAttribute;
}

export interface PuiBadgeAttributes {
    /** @default "gray" */
    color?: BadgeColor;
    /** @default "md" */
    size?: "sm" | "md" | "lg";
    /** `modern`: neutral surface, the colour moves to the dot. @default "pill-color" */
    type?: "pill-color" | "modern";
    /** A leading status dot. */
    dot?: BooleanAttribute;
}

export interface PuiAvatarAttributes {
    src?: string;
    alt?: string;
    /** Shown when there is no `src`, or it fails to load. */
    initials?: string;
    /** @default "md" */
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    status?: "online" | "offline";
}

interface FieldAttributes {
    label?: string;
    hint?: string;
    /** Error text: sets `aria-invalid` and replaces the hint. */
    error?: string;
    /** @default "md" */
    size?: "sm" | "md" | "lg";
    name?: string;
    value?: string;
    placeholder?: string;
    required?: BooleanAttribute;
    "is-required"?: BooleanAttribute;
    "is-disabled"?: BooleanAttribute;
    disabled?: BooleanAttribute;
    "is-read-only"?: BooleanAttribute;
    autocomplete?: string;
}

export interface PuiInputAttributes extends FieldAttributes {
    /** @default "text" */
    type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number" | "date" | "time" | "datetime-local" | "month" | "week";
    min?: string | number;
    max?: string | number;
    step?: string | number;
    minlength?: string | number;
    maxlength?: string | number;
    pattern?: string;
    inputmode?: string;
}

export interface PuiTextareaAttributes extends FieldAttributes {
    /** @default 4 */
    rows?: string | number;
    maxlength?: string | number;
}

export type PuiSelectAttributes = FieldAttributes;

export interface PuiCheckboxAttributes {
    /** The label text; the element's content is used when absent. */
    label?: string;
    hint?: string;
    name?: string;
    /** Submitted when checked. @default "on" */
    value?: string;
    /** @default "sm" */
    size?: "sm" | "md";
    checked?: BooleanAttribute;
    "is-selected"?: BooleanAttribute;
    "is-indeterminate"?: BooleanAttribute;
    "is-disabled"?: BooleanAttribute;
    disabled?: BooleanAttribute;
    required?: BooleanAttribute;
    "is-required"?: BooleanAttribute;
}

export type PuiToggleAttributes = PuiCheckboxAttributes;

export interface PuiAlertAttributes {
    /** @default "info" */
    variant?: "info" | "success" | "warning" | "error";
    /** A React `Alert` colour, mapped onto a variant (brand and gray are `info`). */
    color?: "brand" | "gray" | "default" | "success" | "warning" | "error";
    /** The heading. Moved off the host so it is not also a hover tooltip. */
    title?: string;
    /** Adds a close button that emits `pui-dismiss`. */
    dismissible?: BooleanAttribute;
    /** @default "Dismiss" */
    "dismiss-label"?: string;
}

export interface PuiTabsAttributes {
    /** Accessible name of the tab list. */
    label?: string;
    /** @default "underline" */
    type?: "underline" | "button" | "button-brand";
    /** The selected tab's `value`, or its index. */
    selected?: string | number;
}

export interface PuiTabAttributes {
    /** Pairs the tab with the `<pui-tab-panel>` of the same `value`. */
    value?: string;
    "is-disabled"?: BooleanAttribute;
}

export interface PuiTabPanelAttributes {
    value?: string;
}

export interface PuiDropdownAttributes {
    /** The trigger's text (and its accessible name when the trigger slot has no text). @default "Options" */
    label?: string;
    /** Trigger colour. @default "secondary" */
    color?: ButtonColor;
    /** @default "sm" */
    size?: "sm" | "md" | "lg" | "xl";
    /** `start` opens the menu from the start edge instead of the end. */
    align?: "start" | "end";
}

export interface PuiMenuItemAttributes {
    /** Reported by `pui-select`; the item text when absent. */
    value?: string;
    /** Renders the item as a link. */
    href?: string;
    shortcut?: string;
    "is-disabled"?: BooleanAttribute;
}

export interface PuiModalAttributes {
    open?: BooleanAttribute;
    title?: string;
    description?: string;
    /** Accessible name when there is no `title`. */
    label?: string;
    /** @default "md" */
    size?: "sm" | "md" | "lg";
    /** `"false"` keeps the modal open on a backdrop click and on Escape. */
    "is-dismissable"?: "true" | "false";
    /** @default "Close" */
    "close-label"?: string;
}

export interface PuiTooltipAttributes {
    text?: string;
    description?: string;
    /** @default "top" */
    placement?: "top" | "bottom";
    /** Hover delay in ms. @default 300 */
    delay?: string | number;
}

export interface PuiProgressAttributes {
    value?: string | number;
    /** @default 100 */
    max?: string | number;
    /** Accessible name. @default "Progress" */
    label?: string;
    /** @default "md" */
    size?: "sm" | "md";
    /** Prints the percentage beside the bar. */
    "show-value"?: BooleanAttribute;
}

export interface PuiSkeletonAttributes {
    /** @default "text" */
    variant?: "text" | "circle" | "rect";
    width?: string;
    height?: string;
}

export interface PuiBreadcrumbsAttributes {
    /** @default "Breadcrumb" */
    label?: string;
}

export interface PuiPaginationAttributes {
    /** 1-based. @default 1 */
    page?: string | number;
    /** Number of pages. */
    total?: string | number;
    /** @default "Pagination" */
    label?: string;
    "previous-label"?: string;
    "next-label"?: string;
}

export interface PuiThemeToggleAttributes {
    /** @default "sm" */
    size?: "sm" | "md" | "lg" | "xl";
    "label-light"?: string;
    "label-dark"?: string;
}

/** Attributes of every element, by tag. */
export interface ElementAttributes {
    "pui-button": PuiButtonAttributes;
    "pui-badge": PuiBadgeAttributes;
    "pui-avatar": PuiAvatarAttributes;
    "pui-input": PuiInputAttributes;
    "pui-textarea": PuiTextareaAttributes;
    "pui-checkbox": PuiCheckboxAttributes;
    "pui-toggle": PuiToggleAttributes;
    "pui-select": PuiSelectAttributes;
    "pui-alert": PuiAlertAttributes;
    "pui-tabs": PuiTabsAttributes;
    "pui-tab": PuiTabAttributes;
    "pui-tab-panel": PuiTabPanelAttributes;
    "pui-dropdown": PuiDropdownAttributes;
    "pui-menu-item": PuiMenuItemAttributes;
    "pui-modal": PuiModalAttributes;
    "pui-tooltip": PuiTooltipAttributes;
    "pui-progress": PuiProgressAttributes;
    "pui-skeleton": PuiSkeletonAttributes;
    "pui-breadcrumbs": PuiBreadcrumbsAttributes;
    "pui-pagination": PuiPaginationAttributes;
    "pui-theme-toggle": PuiThemeToggleAttributes;
}

/** `detail` of each custom event, by tag. Native `input` / `change` come from the form controls. */
export interface ElementEvents {
    "pui-alert": { "pui-dismiss": undefined };
    "pui-tabs": { "pui-change": { value: string; index: number } };
    "pui-dropdown": { "pui-select": { value: string; item: HTMLElement } };
    "pui-modal": { "pui-close": { returnValue: string } };
    "pui-pagination": { "pui-page-change": { page: number; previous: number } };
    "pui-theme-toggle": { "pui-theme-change": { theme: "light" | "dark" } };
}
