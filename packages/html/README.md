# @properui/html

Proper UI without React: `pui-` CSS component classes on the same semantic tokens as the React library, small
dependency-free vanilla-JS behaviours, and copy-paste HTML snippets.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@properui/html/dist/properui-html.iife.js" data-auto-init defer></script>

<button class="pui-btn pui-btn--primary" type="button" data-pui-modal-open="hello">Open</button>
<dialog class="pui-modal pui-modal--sm" id="hello">
    <div class="pui-modal__header"><h2 class="pui-modal__title">Hello</h2></div>
    <div class="pui-modal__footer"><button class="pui-btn pui-btn--secondary" type="button" data-pui-modal-close>Close</button></div>
</dialog>
```

With Tailwind v4 (any framework):

```css
@import "tailwindcss";
@import "@properui/tokens/theme.css";
@import "@properui/html/css";
```

```ts
import { init, setTheme, toast } from "@properui/html";
```

React (`@properui/ui`) remains the primary, fullest layer; this package covers a curated set of about twenty components
with native HTML primitives. Classes, behaviours, the JS API and the React-only list:
[docs/html.md](https://github.com/properui/properui/blob/main/docs/html.md).

MIT licensed.
