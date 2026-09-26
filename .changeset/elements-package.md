---
---

New package: `@properui/elements` 0.1.0, Proper UI as framework-agnostic custom elements for Vue, Angular, Svelte,
Astro and plain HTML. 21 light-DOM tags (`pui-button`, `pui-badge`, `pui-avatar`, `pui-input`, `pui-textarea`,
`pui-select`, `pui-checkbox`, `pui-toggle`, `pui-alert`, `pui-tabs`/`pui-tab`/`pui-tab-panel`,
`pui-dropdown`/`pui-menu-item`, `pui-modal` on `<dialog>`, `pui-tooltip`, `pui-progress`, `pui-skeleton`,
`pui-breadcrumbs`, `pui-pagination`, `pui-theme-toggle`) that render the `@properui/html` markup and call its behaviours,
plus `toast()` and `setTheme()`. No shadow root, so the global stylesheet applies and the form controls are
form-associated through `ElementInternals`; attributes mirror the React prop names (`color`, `size`, `is-disabled`,
`is-loading`), and the elements forward framework child patches (`insertBefore`, `textContent`) to where the content
was moved. Ships ESM (`@properui/elements`, `@properui/elements/register`), a classic script
(`dist/properui-elements.global.js`, `window.ProperUIElements`, behaviours bundled in), and editor typings for Vue
templates (`@properui/elements/vue`) and React JSX (`@properui/elements/react`). It publishes at its initial 0.1.0,
so it carries no bump of its own here. Example apps for Vue, Angular, Svelte, Astro and plain HTML live in `examples/`.
