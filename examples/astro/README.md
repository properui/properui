# Proper UI + Astro

A small Astro site built with the `<pui-*>` custom elements from [`@properui/elements`](../../packages/elements) and
the prebuilt stylesheet from [`@properui/tokens`](../../packages/tokens). Astro renders the tags as plain HTML on the
server; one `<script>` in the layout defines them in the browser. No UI framework is shipped to the client.

```bash
npm install && npm run dev
```

It installs the published packages from npm; it is not part of the repository's pnpm workspace.

What to look at:

- `src/layouts/Layout.astro`: the stylesheet import in the frontmatter, `import "@properui/elements/register"` in a
  bundled `<script>`, and an inline script that applies a saved dark theme before first paint.
- `src/pages/index.astro`: server data mapped into `<pui-avatar>` tags, `data-pui-modal-open` opening the modal with no
  code, and a `<form method="dialog">` whose submit button value arrives as `pui-close`'s `returnValue`.

Docs: [Astro integration](../../apps/docs/content/integrations/astro.mdx) and the
[custom elements reference](../../docs/elements.md).
