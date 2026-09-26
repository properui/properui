# Custom elements (`@properui/elements`)

`@properui/elements` is Proper UI as framework-agnostic custom elements: `<pui-button>`, `<pui-modal>`, `<pui-tabs>` and
the rest of the set below. They work the same in Vue, Angular, Svelte, Astro, plain HTML and vanilla JS, render the
[`@properui/html`](./frameworks.md) markup, and call its behaviours for keyboard and ARIA wiring. No Lit, no framework
runtime, no dependencies beyond `@properui/html`.

React is still the primary, fullest layer: 126 component groups built on React Aria. The elements cover a curated set
of 21 tags, with accessibility from native HTML (`<button>`, `<dialog>`, real form controls) plus the roles and
`aria-*` attributes the behaviours set. See [Frameworks](./frameworks.md) for the support matrix.

## Install

```bash
npm install @properui/elements @properui/tokens
```

```ts
// tokens + component classes, prebuilt
import "@properui/elements/register";
import "@properui/tokens/properui.css";

// defines every <pui-*> element
```

In a Tailwind v4 project, import the source CSS instead of the prebuilt file, so utilities and the component classes
share one build:

```css
@import "tailwindcss";
@import "@properui/tokens/theme.css";
@import "@properui/html/css";
```

No build step: one stylesheet, one script. The script bundles the `@properui/html` behaviours and exposes
`window.ProperUIElements`.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@properui/elements/dist/properui-elements.global.js" defer></script>
```

`register` calls `defineElements()`. Import the package root instead to define a subset, or to reach the classes:

```ts
import { defineElements, setTheme, toast } from "@properui/elements";

defineElements(["pui-button", "pui-modal"]);
```

`defineElements` skips a tag that is already defined and does nothing during server rendering, so importing it from
shared code in Nuxt, SvelteKit, Astro or Next is safe.

## How the elements behave

- **Light DOM.** There is no shadow root. Each element renders its markup as its own children, so the global stylesheet
  styles it, `<form>` sees the controls, and `document.querySelector` reaches inside.
- **Your children are the content.** They are moved, not copied, into the rendered markup: the text of a
  `<pui-button>` ends up inside its `<button>`. A framework that owns those nodes keeps updating them (a Vue
  `{{ label }}` binding, a Svelte `{#if}` block); `appendChild`, `insertBefore`, `removeChild` and
  `textContent` on the element are forwarded to wherever the content now lives.
- **Named slots** use the `slot` attribute on a child: `<span slot="icon-leading">`. There is no `<slot>` element; the
  child is moved into place.
- **Attributes mirror the React props**, kebab-cased: `color`, `size`, `is-disabled`, `is-loading`. Every attribute
  also has a camelCase property (`el.isDisabled = true`) that reflects to the attribute. A boolean attribute is true
  when present, except the string `"false"`, which is what Vue and Angular attribute bindings write for `false`.
- **Rendering happens once**, on first connection. Moving an element does not render it again. Changing an attribute
  updates the markup in place: the same `<button>` or `<input>` stays, so focus is kept.
- **Form controls are form-associated.** `pui-input`, `pui-textarea`, `pui-select`, `pui-checkbox` and `pui-toggle`
  use `ElementInternals` where the browser supports it: the element submits under its own `name`, validates, resets
  and follows `<fieldset disabled>`. Where it is not supported, the inner native control carries the `name` instead.
  `input` and `change` are re-dispatched from the element itself, so `event.target.value` is always current.
- **Custom events** bubble, are `composed`, and carry their data in `detail`.
- A small `<style data-pui-elements>` is added to `<head>` once, with zero-specificity `display` defaults for the
  elements that wrap a control (`display: contents` for `pui-button`, `block` for `pui-input`, ...).

## Framework notes

**Vue 3 / Nuxt.** Tell the compiler these are custom elements, and add the typings for template checking:

```ts
// vite.config.ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("pui-") } } });
```

```ts
// env.d.ts
/// <reference types="@properui/elements/vue" />
```

`v-model` works on `pui-input`, `pui-textarea` and `pui-select` (it sets `.value` and listens to `input`). Listen to
custom events with `@pui-close`, `@pui-page-change`, and so on.

**Angular.** Add `CUSTOM_ELEMENTS_SCHEMA` to the standalone component's `schemas`. Bind boolean attributes with
`[attr.is-disabled]="busy ? '' : null"`, events with `(pui-close)="..."`.

**Svelte 5 / SvelteKit.** No configuration. Custom events are `onpui-close={...}` attributes; import the register module
in `onMount` or a `+layout.svelte` script (it is a no-op on the server anyway).

**Astro.** Write the tags in `.astro` markup; add `<script>import "@properui/elements/register";</script>` once. The
tags render as plain HTML on the server and upgrade in the browser.

**React / Next.js.** Use `@properui/ui`: that is the full, React Aria based layer. For markup shared with other stacks
(or a Server Component that should ship no React Aria), `/// <reference types="@properui/elements/react" />` adds the
tags to `JSX.IntrinsicElements`; define them from a `"use client"` module that imports
`@properui/elements/register`. React 19 passes `onpui-close={...}` to `addEventListener`.

## Elements

### `pui-button`

A `<button class="pui-btn">`, or an `<a>` when `href` is set.

| Attribute               | Values                                                                                                                                                            | Default   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `color`                 | `primary`, `secondary`, `tertiary`, `link`, `link-color`, `link-gray`, `link-destructive`, `primary-destructive`, `secondary-destructive`, `tertiary-destructive` | `primary` |
| `size`                  | `sm`, `md`, `lg`, `xl`                                                                                                                                            | `sm`      |
| `href`                  | URL: renders an `<a>`                                                                                                                                             |           |
| `target`, `rel`         | Passed to the `<a>` (`rel="noopener noreferrer"` is added for `target="_blank"`)                                                                                  |           |
| `type`                  | `button`, `submit`, `reset`                                                                                                                                       | `button`  |
| `name`, `value`, `form` | Passed to the `<button>`                                                                                                                                          |           |
| `label`                 | Accessible name; required when the button has only an icon (also its hover title)                                                                                 |           |
| `is-disabled`           | Boolean. A disabled link loses its `href` and gets `aria-disabled="true"`                                                                                         |           |
| `is-loading`            | Boolean. Spinner, `aria-busy="true"`, disabled                                                                                                                    |           |

Slots: `icon-leading`, `icon-trailing` (a button with only an icon gets `pui-btn--icon-only`). Properties: `control`
(the rendered `<button>`/`<a>`); `focus()` and `click()` go to it.

### `pui-badge`

The element itself is the `.pui-badge`.

| Attribute | Values                                                                                       | Default      |
| --------- | -------------------------------------------------------------------------------------------- | ------------ |
| `color`   | `gray`, `brand`, `error`, `warning`, `success`, `blue`, `indigo`, `purple`, `pink`, `orange` | `gray`       |
| `size`    | `sm`, `md`, `lg`                                                                             | `md`         |
| `type`    | `pill-color`, `modern`                                                                       | `pill-color` |
| `dot`     | Boolean: a leading status dot                                                                |              |

### `pui-avatar`

The element itself is the `.pui-avatar`.

| Attribute  | Values                                                 | Default |
| ---------- | ------------------------------------------------------ | ------- |
| `src`      | Image URL                                              |         |
| `alt`      | Image description; also the name of an initials avatar |         |
| `initials` | Shown when there is no `src` or it fails to load       |         |
| `size`     | `xs`, `sm`, `md`, `lg`, `xl`, `2xl`                    | `md`    |
| `status`   | `online`, `offline`                                    |         |

### `pui-input`

A `.pui-field` with a label, an `<input class="pui-input">`, and a hint or an error.

| Attribute                                                              | Values                                                                            | Default |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------- |
| `label`                                                                | Label text                                                                        |         |
| `hint`                                                                 | Help text under the input (`aria-describedby`)                                    |         |
| `error`                                                                | Error text: sets `aria-invalid`, replaces the hint, and a custom validity message |         |
| `size`                                                                 | `sm`, `md`, `lg`                                                                  | `md`    |
| `type`                                                                 | Any text-like input type                                                          | `text`  |
| `name`, `value`, `placeholder`, `autocomplete`                         | As on `<input>`; `value` is the default value                                     |         |
| `required` (or `is-required`)                                          | Boolean                                                                           |         |
| `is-disabled` (or `disabled`), `is-read-only`                          | Boolean                                                                           |         |
| `min`, `max`, `step`, `minlength`, `maxlength`, `pattern`, `inputmode` | As on `<input>`                                                                   |         |

Events: `input`, `change` (from the element). Properties: `value`, `form`, `validity`, `validationMessage`;
`checkValidity()`, `reportValidity()`, `focus()`.

### `pui-textarea`

`pui-input`'s attributes, events and properties on a `<textarea class="pui-textarea">`, plus `rows` (default `4`).

### `pui-select`

A labelled native `<select>` inside `.pui-select`. Its `<option>` and `<optgroup>` children become the options; `value`
selects one. Same `label`, `hint`, `error`, `size`, `name`, `required`, `is-disabled` attributes and the same events and
properties as `pui-input`.

### `pui-checkbox` and `pui-toggle`

A `<label class="pui-checkbox">` (or `.pui-toggle`, with `role="switch"`) around a real checkbox.

| Attribute                                 | Values                                        | Default |
| ----------------------------------------- | --------------------------------------------- | ------- |
| `label`                                   | Label text; the element's content when absent |         |
| `hint`                                    | Help text under the label                     |         |
| `checked` (or `is-selected`)              | Boolean: the initial state                    |         |
| `is-indeterminate`                        | Boolean (checkbox)                            |         |
| `name`, `value`                           | Submitted when checked                        | `on`    |
| `size`                                    | `sm`, `md`                                    | `sm`    |
| `is-disabled` (or `disabled`), `required` | Boolean                                       |         |

Events: `input`, `change`. Properties: `checked`, `value`, `form`, `validity`.

### `pui-alert`

The element itself is the `.pui-alert`.

| Attribute       | Values                                                                                 | Default   |
| --------------- | -------------------------------------------------------------------------------------- | --------- |
| `variant`       | `info`, `success`, `warning`, `error` (`color` with a React `Alert` colour also works) | `info`    |
| `title`         | Heading (moved off the element so it is not also a hover tooltip)                      |           |
| `dismissible`   | Boolean: a close button                                                                |           |
| `dismiss-label` | The close button's name                                                                | `Dismiss` |

Content is the body. Slot: `actions`. Error and warning alerts get `role="alert"`, the others `role="status"` (set
`role` yourself to change it). Event: `pui-dismiss` (cancelable; unless cancelled the alert sets `hidden`). Method:
`dismiss()`.

### `pui-tabs`, `pui-tab`, `pui-tab-panel`

`pui-tabs` is the `.pui-tabs` root that `initTabs` drives: roles, a roving tabindex, the arrow keys (mirrored in RTL),
Home and End, and automatic activation.

| Element         | Attribute     | Values                                                      |
| --------------- | ------------- | ----------------------------------------------------------- |
| `pui-tabs`      | `label`       | The tab list's accessible name                              |
|                 | `type`        | `underline` (default), `button`                             |
|                 | `selected`    | A tab's `value`, or its index                               |
| `pui-tab`       | `value`       | Pairs it with the panel of the same `value` (else by order) |
|                 | `is-disabled` | Boolean                                                     |
| `pui-tab-panel` | `value`       | See `pui-tab`                                               |

Event: `pui-change` with `{ value, index }` on `pui-tabs`. The set of tabs is read on first render; to change which
tabs exist, render a new `pui-tabs` (a `:key` in Vue, `{#key}` in Svelte).

### `pui-dropdown` and `pui-menu-item`

`pui-dropdown` is the `.pui-dropdown` root that `initDropdowns` drives: open and close, arrow keys, Home/End,
type-ahead, Escape, outside click, `role="menu"`.

| Element         | Attribute     | Values                                                        | Default     |
| --------------- | ------------- | ------------------------------------------------------------- | ----------- |
| `pui-dropdown`  | `label`       | Trigger text (and its name when the trigger slot has no text) | `Options`   |
|                 | `color`       | Trigger colour, as `pui-button`                               | `secondary` |
|                 | `size`        | Trigger size                                                  | `sm`        |
|                 | `align`       | `start` opens the menu from the start edge                    | `end`       |
| `pui-menu-item` | `value`       | Reported by `pui-select` (the text when absent)               |             |
|                 | `href`        | Renders the item as a link                                    |             |
|                 | `shortcut`    | Trailing hint, such as `⌘K`                                   |             |
|                 | `is-disabled` | Boolean                                                       |             |

Children of `pui-dropdown`: `pui-menu-item`s and `<hr>` separators. Slot: `trigger` replaces the trigger's content.
`pui-menu-item` slot: `icon`. Event: `pui-select` with `{ value, item }` on `pui-dropdown`.

### `pui-modal`

Wraps a native `<dialog class="pui-modal">`: focus containment, Escape, the top layer and the inert background come from
the platform.

| Attribute        | Values                                                  | Default |
| ---------------- | ------------------------------------------------------- | ------- |
| `open`           | Boolean: shown as a modal; removed again when it closes |         |
| `title`          | Heading (`aria-labelledby`)                             |         |
| `description`    | Supporting text under the title                         |         |
| `label`          | Accessible name when there is no `title`                |         |
| `size`           | `sm`, `md`, `lg`                                        | `md`    |
| `is-dismissable` | `"false"` keeps it open on backdrop click and Escape    |         |
| `close-label`    | The close button's name                                 | `Close` |

Content is the body. Slots: `footer` (the actions), `icon` (a featured icon above the title). Methods: `show()`,
`close(returnValue?)`. Property: `dialog`. Event: `pui-close` with `{ returnValue }`, however it closed (close button,
Escape, backdrop, `<form method="dialog">`). Any element with `data-pui-modal-open="<id of the pui-modal>"` opens it.

### `pui-tooltip`

Wraps one trigger and describes its first focusable element (the rendered `<button>` of a `pui-button` inside it)
through `initTooltips`: hover after a delay, keyboard focus, Escape, `role="tooltip"`, `aria-describedby`.

| Attribute     | Values                                        | Default |
| ------------- | --------------------------------------------- | ------- |
| `text`        | Tooltip text                                  |         |
| `description` | A second line                                 |         |
| `placement`   | `top`, `bottom` (flips when there is no room) | `top`   |
| `delay`       | Hover delay in ms                             | `300`   |

A tooltip supplements a label; it is never the only name of a control.

### `pui-progress`

| Attribute    | Values                              | Default    |
| ------------ | ----------------------------------- | ---------- |
| `value`      | Number                              | `0`        |
| `max`        | Number                              | `100`      |
| `label`      | Accessible name of the progress bar | `Progress` |
| `size`       | `sm`, `md`                          | `md`       |
| `show-value` | Boolean: prints the percentage      |            |

### `pui-skeleton`

`variant` (`text`, `circle`, `rect`; default `text`), `width`, `height` (CSS lengths). Always `aria-hidden`; put
`aria-busy="true"` on the region that is loading.

### `pui-breadcrumbs`

Each child element (an `<a>`, or a `<span>` for the current page) becomes a crumb; the last one gets
`aria-current="page"`. `label` names the landmark (default `Breadcrumb`).

### `pui-pagination`

| Attribute                      | Values                | Default            |
| ------------------------------ | --------------------- | ------------------ |
| `page`                         | Current page, 1-based | `1`                |
| `total`                        | Number of pages       | `1`                |
| `label`                        | Landmark name         | `Pagination`       |
| `previous-label`, `next-label` | Button text           | `Previous`, `Next` |

Event: `pui-page-change` with `{ page, previous }` (cancelable; unless cancelled `page` updates). Method: `goTo(page)`.

### `pui-theme-toggle`

An icon button that switches `.dark-mode` on `<html>` through `setTheme` (saved in `localStorage` under `theme`, the
key the React `ThemeProvider` uses), and follows theme changes made elsewhere. `size`; `label-light` and `label-dark`
for its accessible names. Event: `pui-theme-change` with `{ theme }`.

### Toasts

Not an element: call `toast({ title, description?, variant?, duration? })` from `@properui/elements` (or
`ProperUIElements.toast(...)` with the script build). Toasts appear in a polite live region.

## Events

| Element            | Event              | `detail`                         |
| ------------------ | ------------------ | -------------------------------- |
| form controls      | `input`, `change`  | (native `Event`)                 |
| `pui-alert`        | `pui-dismiss`      | none, cancelable                 |
| `pui-tabs`         | `pui-change`       | `{ value, index }`               |
| `pui-dropdown`     | `pui-select`       | `{ value, item }`                |
| `pui-modal`        | `pui-close`        | `{ returnValue }`                |
| `pui-pagination`   | `pui-page-change`  | `{ page, previous }`, cancelable |
| `pui-theme-toggle` | `pui-theme-change` | `{ theme }`                      |

## What is React-only

Everything outside the 21 tags above: date pickers, comboboxes, sliders, data tables, charts, command menus, file
upload, the application shells, every marketing section and page example. The elements also do not reproduce React
Aria's behaviour line for line (press events with pointer normalisation, typeahead in selects, virtual focus). The
[Frameworks](./frameworks.md) page lists the React-only groups by name.
