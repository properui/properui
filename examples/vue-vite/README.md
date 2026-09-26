# Proper UI + Vue 3 (Vite)

A small Vue 3 app built with the `<pui-*>` custom elements from
[`@properui/elements`](../../packages/elements) and the prebuilt stylesheet from
[`@properui/tokens`](../../packages/tokens): a theme toggle, a dropdown, an alert, tabs, avatars, pagination, a toggle,
a progress bar, and a modal with a `v-model` input that ends in a toast.

```bash
npm install && npm run dev
```

It installs the published packages from npm; it is not part of the repository's pnpm workspace.

What to look at:

- `vite.config.ts`: `isCustomElement: (tag) => tag.startsWith("pui-")`, so Vue treats the tags as custom elements.
- `src/main.ts`: the stylesheet import and `@properui/elements/register`, before `createApp`.
- `src/env.d.ts`: `@properui/elements/vue` types every tag, attribute and event for Volar and `vue-tsc`.
- `src/App.vue`: `:open` + `@pui-close` on the modal, `v-model` on `pui-input`, `@pui-page-change`, `@pui-select`.

Docs: [Vue integration](../../apps/docs/content/integrations/vue.mdx) and the
[custom elements reference](../../docs/elements.md).
