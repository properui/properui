# HTML and vanilla JS (`@properui/html`)

`@properui/html` is Proper UI without React. It has three parts:

- **CSS component classes** (`.pui-btn`, `.pui-modal`, `.pui-table`, ...) written as Tailwind v4 `@layer components`
  rules that `@apply` the same semantic-token utilities the React components use. Colours, spacing, radii, dark mode and
  RTL behave the same as in React.
- **Small vanilla-JS behaviours** for the interactive pieces (dropdown menus, tabs, modals, accordions, tooltips, toasts,
  theme switching). No dependencies, about 17 KB minified. They attach by `data-pui` attribute and are idempotent.
- **HTML snippets**, one folder per component under
  [`packages/html/src/components`](../packages/html/src/components), plus two whole pages
  ([`landing.html`](../packages/html/src/components/page-example/landing.html) and
  [`dashboard.html`](../packages/html/src/components/page-example/dashboard.html)) built only from this layer. The
  snippets are the copy-paste reference and are what `properui add <name>` installs on an html-platform project.

React is still the primary, fullest layer: 126 component groups on React Aria. This package covers a curated set of
about twenty components (the table below) with native HTML primitives (`<dialog>`, `<details>`, real form controls) and
the `role`/`aria-*` attributes its scripts set. See [Frameworks](./frameworks.md) for the support matrix and
[`@properui/elements`](./elements.md) for the same components as custom elements.

## Install

With the CLI, on a project with no React (Vue, Nuxt, Angular, Svelte, SvelteKit, Astro, or plain HTML):

```bash
npx @properui/cli@latest init          # "platform": "html"; wires @properui/tokens + @properui/html
npx @properui/cli@latest add buttons modals table
```

Or by hand:

```bash
npm i @properui/tokens @properui/html
```

## Loading the CSS: three ways

**1. No build step: the prebuilt stylesheet from a CDN.** `@properui/tokens` ships `properui.min.css`: Tailwind's
preflight, every token, dark mode, and all of the `pui-*` classes, compiled.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@properui/html/dist/properui-html.iife.js" data-auto-init defer></script>
```

Pin versions in production (`@properui/tokens@0.1.0`). This package's own build also writes an equivalent
`dist/properui.css` (`@properui/html/properui.css`), which the page examples link.

**2. Tailwind v4 in any framework: import the source.** The component layer is Tailwind source, so it compiles with
your own utilities and your theme overrides:

```css
@import "tailwindcss";
@import "@properui/tokens/theme.css";
@import "@properui/html/css";

/* Only if you copied snippets that also carry utility classes of your own: */
@source "./src/**/*.html";
```

`@properui/html/css` does not import Tailwind or the tokens itself; your entry does, once. Every class is in
`@layer components`, so a utility on the same element (`class="pui-btn mt-4"`) still wins.

**3. Copy.** The files are plain CSS with `@apply`: copy [`src/css/*.css`](../packages/html/src/css) (and
[`src/index.css`](../packages/html/src/index.css)) into your project and import them after Tailwind and the tokens.
Edit freely; nothing regenerates them.

## Loading the JS

```html
<!-- Classic script: window.ProperUI, init() on DOMContentLoaded -->
<script src="https://cdn.jsdelivr.net/npm/@properui/html/dist/properui-html.iife.js" data-auto-init defer></script>
```

```ts
// A bundler or <script type="module">
import { init, setTheme, toast } from "@properui/html";

init(); // or init(someElement) after rendering new markup
```

## Classes

Block, `__element`, `--modifier`, all prefixed `pui-`. Sizes are `--sm | --md | --lg | --xl` where they apply; colours
use the React prop names. Defaults match React (`pui-btn` alone is a primary sm button; `pui-badge` alone is a gray md
pill).

| Component       | Root                                                                | Modifiers and elements                                                                                                                                                                                                                                                    | Snippets              |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Button          | `.pui-btn`                                                          | `--primary` `--secondary` `--tertiary` `--link` `--link-gray` `--primary-destructive` `--secondary-destructive` `--tertiary-destructive`; `--sm..--xl`; `--icon-only`; `__icon` (+ `data-icon="leading"/"trailing"`); `:disabled`, `aria-disabled="true"`, `data-loading` | `buttons`             |
| Badge           | `.pui-badge`                                                        | `--gray --brand --error --warning --success --blue --indigo --purple --pink --orange`; `--sm --md --lg`; `--dot`; `--pill` (default), `--modern`                                                                                                                          | `badges`              |
| Input           | `.pui-field`, `.pui-label`, `.pui-input`, `.pui-hint`, `.pui-error` | `.pui-input--sm/--md/--lg`; `aria-invalid="true"`; `.pui-field__control` row with `.pui-field__icon-leading` or `.pui-field__addon`; `.pui-label__required`                                                                                                               | `input`               |
| Textarea        | `.pui-textarea`                                                     | `--sm`; same field wrapper and states                                                                                                                                                                                                                                     | `textarea`            |
| Checkbox        | `.pui-checkbox` (a `<label>`)                                       | `--md`; `__box`, `__text`, `__label`, `__hint`; the native `<input>` stays inside                                                                                                                                                                                         | `checkbox`            |
| Radio           | `.pui-radio`, `.pui-radio-group` (`<fieldset>`)                     | `--md`; `__box`, `__text`, `__label`, `__hint`                                                                                                                                                                                                                            | `radio-buttons`       |
| Toggle          | `.pui-toggle`                                                       | `--md`; `__track`, `__thumb`, `__text`, `__label`, `__hint`; `<input type="checkbox" role="switch">`                                                                                                                                                                      | `toggle`              |
| Select (native) | `.pui-select`                                                       | on a wrapper (draws the chevron) or on the `<select>`; `--sm --md --lg`                                                                                                                                                                                                   | `select`              |
| Avatar          | `.pui-avatar`                                                       | `--xs --sm --md --lg --xl --2xl`, `--square`; `__initials`, `__status` (`--online`, `--offline`); `.pui-avatar-group`                                                                                                                                                     | `avatar`              |
| Card            | `.pui-card`                                                         | `__header`, `__title`, `__description`, `__body`, `__footer`                                                                                                                                                                                                              | `card`                |
| Alert / callout | `.pui-alert`                                                        | `--info --success --warning --error`; `__icon`, `__body`, `__title`, `__description`, `__actions`, `__close`                                                                                                                                                              | `alerts`              |
| Tabs            | `.pui-tabs`                                                         | `--underline` (default), `--button`; `__list`, `.pui-tab` (`aria-selected`), `__panel`                                                                                                                                                                                    | `tabs`                |
| Tooltip         | `.pui-tooltip` (created by the JS)                                  | `__description`; `data-pui-tooltip` on the trigger                                                                                                                                                                                                                        | `tooltip`             |
| Dropdown        | `.pui-dropdown`                                                     | `__trigger`, `__chevron`; `.pui-menu` (`--start`), `.pui-menu__item`, `__label`, `__shortcut`, `__separator`, `__section`, `__heading`                                                                                                                                    | `dropdown`            |
| Modal           | `.pui-modal` on `<dialog>`                                          | `--sm --md --lg`; `__header`, `__icon`, `__title`, `__description`, `__close`, `__body`, `__footer`                                                                                                                                                                       | `modals`              |
| Accordion       | `.pui-accordion`                                                    | `__item` (`<details>`), `__trigger` (`<summary>`), `__panel`                                                                                                                                                                                                              | `accordion`           |
| Breadcrumbs     | `.pui-breadcrumbs` (`<nav>` + `<ol>`)                               | `__item`, `__separator`, `aria-current="page"`                                                                                                                                                                                                                            | `breadcrumbs`         |
| Pagination      | `.pui-pagination`                                                   | `__prev`, `__next`, `__pages`, `__item` (`aria-current="page"`), `__ellipsis`, `__summary`                                                                                                                                                                                | `pagination`          |
| Table           | `.pui-table` on `<table>`                                           | `--sm`; `.pui-table__card`, `__header`, `__heading`, `__title`, `__description`, `__select`, `__row--selected`, `__footer`                                                                                                                                                | `table`               |
| Progress        | `.pui-progress`                                                     | `--sm --md`; `__track` (`role="progressbar"`), `__bar`, `__label`                                                                                                                                                                                                         | `progress-indicators` |
| Skeleton        | `.pui-skeleton`                                                     | `--text --circle --rect`                                                                                                                                                                                                                                                  | `skeleton`            |
| Toast           | `.pui-toast` in `.pui-toaster` (created by the JS)                  | `--success --error --warning --info`; `__icon`, `__content`, `__title`, `__description`, `__close`                                                                                                                                                                        | `notifications`       |
| Empty state     | `.pui-empty`                                                        | `__icon`, `__title`, `__description`, `__actions`                                                                                                                                                                                                                         | `empty-state`         |

Helpers: `.pui-sr-only` (visually hidden) and `.pui-skip-link`.

## Behaviours (`data-pui`)

`init(root?)` sets up every one of these under `root`. Each element is marked with `data-pui-ready` once set up, so
calling `init` again after a re-render or an HTMX swap is safe.

| Attribute                           | What the script does                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-pui="dropdown"`               | `role="menu"`/`menuitem`/`separator`/`group`, `aria-haspopup`, `aria-expanded`, `aria-controls`. Click, Enter, Space, ArrowDown or ArrowUp opens; arrow keys, Home/End and type-ahead move; Escape closes and returns focus; Tab and a click outside close; flips above the trigger when there is no room below. Events: `pui:open`, `pui:close`, `pui:select`. |
| `data-pui="tabs"`                   | `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving tabindex; arrow keys (mirrored in RTL; Up/Down with `aria-orientation="vertical"`), Home and End select. `data-pui-hash` syncs the URL hash. Event: `pui:change`.                                                                                                |
| `data-pui-modal-open="<dialog id>"` | `showModal()` on the `<dialog class="pui-modal">`; focus to `[autofocus]` or the first control; focus back to the opener on close. `data-pui-modal-close` or `.pui-modal__close` closes (its `value` becomes `returnValue`); Escape and a backdrop click close, unless `data-pui-static`. Sets `aria-labelledby`/`aria-describedby`.                            |
| `data-pui="accordion"`              | Links each `<summary>` to its panel. With `data-pui-exclusive`, one item open at a time (and a shared `name`, so browsers that support exclusive `<details>` do it natively).                                                                                                                                                                                   |
| `data-pui-tooltip="text"`           | Creates a `role="tooltip"` element linked by `aria-describedby`; shows on hover after `data-pui-tooltip-delay` (300 ms) and on keyboard focus; hides on leave, blur, press and Escape; above the trigger, or below when the space above is too small (`data-pui-tooltip-placement="bottom"` prefers below). `data-pui-tooltip-description` adds a second line.  |
| `data-pui-toast="Title"`            | A click calls `toast()` with `data-pui-toast-description`, `-variant` and `-duration`.                                                                                                                                                                                                                                                                          |
| `data-pui-dismiss`                  | Removes the closest `.pui-alert` (or the element whose id it names) and keeps focus on the page.                                                                                                                                                                                                                                                                |
| `data-pui="theme-toggle"`           | Flips light/dark with `setTheme` and reflects the state in `aria-pressed`.                                                                                                                                                                                                                                                                                      |

## JS API

```ts
init(root?: ParentNode): void;
initDropdowns(root?): void;  initTabs(root?): void;  initModals(root?): void;  initAccordions(root?): void;
initTooltips(root?): void;   initDismiss(root?): void;  initThemeToggles(root?): void;  initToastTriggers(root?): void;
openModal(dialog: HTMLDialogElement, opener?: HTMLElement): void;
closeModal(dialog: HTMLDialogElement, returnValue?: string): void;
toast(opts: { title: string; description?: string; variant?: "success" | "error" | "warning" | "info"; duration?: number }): void;
setTheme(theme: "light" | "dark" | "system"): void;
getTheme(): "light" | "dark" | "system";
```

- `toast` creates the `.pui-toaster` region on first use (`aria-live="polite"`), sets the title and description as text
  (never HTML), and dismisses after `duration` ms (default 5000; `0` keeps it until closed), pausing while hovered or
  focused.
- `setTheme` puts `.dark-mode` (or `.light-mode`) on `<html>` and saves the choice in `localStorage` under `"theme"`:
  the same key and values the React `ThemeProvider` uses, so a page mixing both layers agrees. `"system"` follows
  `prefers-color-scheme` and keeps following it. `init()` re-applies a saved choice. To avoid a flash of the wrong theme,
  put this in `<head>` before the stylesheet:

    ```html
    <script>
        try {
            const t = localStorage.getItem("theme");
            if (t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches)) document.documentElement.classList.add("dark-mode");
        } catch {}
    </script>
    ```

The default export is the same functions as one object, and the IIFE build exposes it as `window.ProperUI`.

## What is React-only

Said plainly, so nobody finds out the hard way:

- **Behaviour depth.** The React components run on React Aria: typeahead in every collection, virtual focus,
  press/hover normalisation across touch, pen and mouse, locale-aware date and number handling, screen-reader
  announcements tuned per component. This layer uses native elements plus a few hundred lines of script. It covers the
  common keyboard paths (Escape, arrow keys in menus and tabs, focus return from dialogs); it is not a port.
- **Components.** Everything outside the table above: select with search (combobox), multi-select, date and time
  pickers, calendars, sliders, number and tag inputs, file upload, command menu, menubar, popover, hover card, data
  table (sorting, selection model, resizing), tree view, charts, kanban, gantt, code editor, rich text editor,
  carousel, the marketing sections and page examples, and the rest of the 126 groups.
- **Menus.** No submenus, no checkbox or radio menu items, no selection state in the dropdown.
- **Tables.** A styled `<table>`: no keyboard grid navigation, no sorting, no selection model. Row selection in the
  snippet is plain checkboxes.
- **Tooltips.** Above or below only (no left/right placement), and no collision handling beyond that flip and a clamp
  to the viewport.
- **Toasts.** No stacking animation, swipe to dismiss, or action buttons.
- **Animations.** Simple CSS enter animations; no exit animation for menus, tooltips or modals.

## Development

```bash
cd packages/html
pnpm build        # tsup (ESM + IIFE) and dist/properui.css
pnpm test         # vitest + jsdom: behaviours, plus axe on every snippet (as authored, after init, menus open)
pnpm type-check && pnpm lint
```

Snippet icons are inline SVG copied from `@properui/icons`. Snippets and page examples use no external images.
