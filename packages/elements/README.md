# @properui/elements

[Proper UI](https://github.com/properui/properui) as framework-agnostic custom elements: `<pui-button>`, `<pui-modal>`,
`<pui-tabs>` and 18 more, for Vue, Angular, Svelte, Astro, plain HTML and vanilla JS. They render the
[`@properui/html`](../html) markup in light DOM (no shadow root), so the Proper UI stylesheet styles them and forms see
their controls, and they call its small behaviours for keyboard and ARIA wiring. No framework runtime, no Lit.

Proper UI is a React 19 library first: `@properui/ui` has 126 component groups on React Aria. This package is the
curated cross-framework set; see the [custom elements reference](../../docs/elements.md) for every tag, attribute,
event and slot, and [Frameworks](../../docs/frameworks.md) for what is React-only.

## Install

```bash
npm install @properui/elements @properui/tokens
```

```ts
// tokens, preflight and component classes, prebuilt
import "@properui/elements/register";
import "@properui/tokens/properui.css";

// defines every <pui-*> element
```

No build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@properui/elements/dist/properui-elements.global.js" defer></script>
```

## Use

```html
<pui-button color="primary" data-pui-modal-open="invite">Invite teammates</pui-button>

<pui-modal id="invite" title="Invite teammates" size="sm">
    <pui-input label="Email address" type="email" name="email"></pui-input>
    <div slot="footer"><pui-button>Send invite</pui-button></div>
</pui-modal>
```

- Attributes mirror the React props (`color`, `size`, `is-disabled`, `is-loading`), each with a reflecting camelCase
  property.
- Children are the content and are moved into place; framework updates to them keep working.
- `pui-input`, `pui-textarea`, `pui-select`, `pui-checkbox` and `pui-toggle` are form-associated (`ElementInternals`)
  and re-dispatch `input`/`change` from themselves.
- Custom events: `pui-close`, `pui-select`, `pui-change`, `pui-page-change`, `pui-dismiss`, `pui-theme-change`.
- `toast()` and `setTheme()` are exported (and on `window.ProperUIElements` in the script build).

## Frameworks

| Framework | Setup                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Vue 3     | `isCustomElement: (tag) => tag.startsWith("pui-")`; `/// <reference types="@properui/elements/vue" />` for typing |
| Angular   | `schemas: [CUSTOM_ELEMENTS_SCHEMA]` on standalone components                                                      |
| Svelte 5  | nothing; events as `onpui-close={...}`                                                                            |
| Astro     | the tags in `.astro` markup, `<script>import "@properui/elements/register";</script>` once                        |
| React     | use `@properui/ui`; `/// <reference types="@properui/elements/react" />` types the tags for shared markup         |

Runnable examples: [`examples/`](../../examples).

## License

MIT
