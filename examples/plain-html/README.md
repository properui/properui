# Proper UI on a plain HTML page

A landing page built with Proper UI and no build step: one stylesheet from
[`@properui/tokens`](../../packages/tokens) and one script from [`@properui/elements`](../../packages/elements), both
from jsDelivr. The page uses `<pui-*>` custom elements (buttons, badges, avatars, a tooltip, tabs, alerts, a progress
bar, a theme toggle, and a sign-up modal with a form) plus the `.pui-card` classes as plain markup.

```bash
npx serve .
```

Or open `index.html` in a browser directly. There is nothing to install.

What to look at:

- The `<link>` and `<script defer>` in `<head>`: that is the whole setup.
- `data-pui-modal-open="signup"` on any button opens the modal, with no code.
- The `<form method="dialog">` inside the modal closes it on submit, and the short script at the end reads the
  submitting button's value from `pui-close` and shows a toast with `window.ProperUIElements.toast()`.
- The `<style>` block uses only token variables (`var(--color-bg-primary)`, `var(--spacing)`, ...) and logical
  properties, so dark mode and right-to-left layouts need nothing extra.

Docs: [plain HTML integration](../../apps/docs/content/integrations/plain-html.mdx) and the
[custom elements reference](../../docs/elements.md).
