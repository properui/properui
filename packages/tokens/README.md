# @properui/tokens

The [Proper UI](https://properui.dev) design tokens as plain CSS, for projects outside React: Vue, Angular, Svelte,
Astro, server-rendered sites and plain HTML pages. Generated from the same source as the React library, so the colours,
type scale, radii, shadows and dark mode match exactly.

## No build step

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css" />
```

## With a bundler

```bash
npm install @properui/tokens
```

```ts
import "@properui/tokens/tokens.css";

// plain CSS variables, no Tailwind needed
```

```css
/* Tailwind CSS v4 */
@import "tailwindcss";
@import "@properui/tokens/theme.css";
@custom-variant dark (&:where(.dark-mode, .dark-mode *));
```

| Export                                              | What it is                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@properui/tokens/properui.css`, `properui.min.css` | Prebuilt stylesheet: preflight, every token, dark mode and the `@properui/html` classes |
| `@properui/tokens/tokens.css`                       | Every token as a CSS custom property on `:root`, dark values on `.dark-mode`            |
| `@properui/tokens/theme.css`                        | The Tailwind v4 `@theme` token layer plus prose styles                                  |
| `@properui/tokens/presets/<name>.css`               | A theme preset as a `@theme` override (after `theme.css`)                               |
| `@properui/tokens/presets/plain/<name>.css`         | The same preset as a plain `:root` override (after `tokens.css` or `properui.css`)      |

Dark mode: add the `dark-mode` class to `<html>` (or any ancestor).

Full guide: https://properui.dev/docs/tokens. MIT licensed.
