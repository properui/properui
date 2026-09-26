---
---

New package: `@properui/html` 0.1.0, Proper UI without React. It ships `pui-` CSS component classes (buttons, badges,
inputs, textarea, checkbox, radio, toggle, native select, avatar, card, alert, tabs, tooltip, dropdown menu, modal on
`<dialog>`, accordion on `<details>`, breadcrumbs, pagination, table, progress, skeleton, toast and empty state) as
Tailwind v4 `@layer components` source that `@apply`s the same semantic tokens as the React components
(`@properui/html/css`), a compiled `dist/properui.css`, and dependency-free behaviours as ESM and as an IIFE
(`window.ProperUI`, `data-auto-init`): `init`, `initDropdowns`, `initTabs`, `initModals`, `initAccordions`,
`initTooltips`, `toast` and `setTheme`, all idempotent through `data-pui-ready` and setting the ARIA each pattern needs.
Copy-paste snippets for every component live in `src/components/<name>/*.html` (the source of the `<name>-html`
registry entries), with a landing page and a dashboard built only from this layer. Every snippet is axe-tested. It
publishes at its initial 0.1.0 because that version is not on npm yet, so it carries no bump of its own here.
