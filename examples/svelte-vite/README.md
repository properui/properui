# Proper UI + Svelte 5 (Vite)

A small Svelte 5 app built with the `<pui-*>` custom elements from
[`@properui/elements`](../../packages/elements) and the prebuilt stylesheet from
[`@properui/tokens`](../../packages/tokens): a theme toggle, a dropdown, an alert, tabs, avatars, pagination, a toggle,
a progress bar, and a modal with an input that ends in a toast.

```bash
npm install && npm run dev
```

It installs the published packages from npm; it is not part of the repository's pnpm workspace.

What to look at:

- `src/main.ts`: the stylesheet import and `@properui/elements/register`. Svelte needs no other configuration.
- `svelte.config.js`: filters Svelte's a11y warning about click handlers on `pui-` tags (they render real buttons).
- `src/App.svelte`: custom events as `onpui-close` / `onpui-page-change` attributes, `open={open || undefined}` to add
  and remove a boolean attribute, `value` + `oninput` on `pui-input`.

Docs: [Svelte integration](../../apps/docs/content/integrations/svelte.mdx) and the
[custom elements reference](../../docs/elements.md).
