# Proper UI + Angular

A minimal standalone-component Angular app (zoneless, signals) built with the `<pui-*>` custom elements from
[`@properui/elements`](../../packages/elements) and the prebuilt stylesheet from
[`@properui/tokens`](../../packages/tokens): a theme toggle, a dropdown, an alert, tabs, avatars, pagination, a toggle,
a progress bar, and a modal with an input that ends in a toast. Only the files Angular needs are here, no generated
boilerplate.

```bash
npm install && npm start
```

It installs the published packages from npm; it is not part of the repository's pnpm workspace.

What to look at:

- `src/main.ts`: `@properui/elements/register` before `bootstrapApplication`.
- `angular.json`: `node_modules/@properui/tokens/dist/properui.css` in `styles`.
- `src/app/app.component.ts`: `schemas: [CUSTOM_ELEMENTS_SCHEMA]`, `[attr.open]` / `[attr.is-disabled]` bindings (`null`
  removes the attribute, `''` sets it), and custom events as `(pui-close)`, `(pui-page-change)`, `(pui-select)`.

Docs: [Angular integration](../../apps/docs/content/integrations/angular.mdx) and the
[custom elements reference](../../docs/elements.md).
