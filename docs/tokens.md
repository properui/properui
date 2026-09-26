# Design tokens as CSS (`@properui/tokens`)

`@properui/tokens` is the Proper UI token layer as plain CSS, for projects that are not using the React components: a
Vue, Angular, Svelte or Astro app, a server-rendered site, or a single HTML page. Same colours, type scale, radii,
shadows and dark mode as the React library, from the same source.

Nothing in the package is maintained by hand. [`packages/tokens/scripts/build.ts`](../packages/tokens/scripts/build.ts)
generates every file from [`packages/ui/src/styles`](../packages/ui/src/styles) (`theme.css`, `typography.css`,
`globals.css`, `presets.ts`), so the files never drift from what the components use. React remains the primary,
fullest layer; this package is the tokens and a base stylesheet. For components outside React see
[Frameworks](./frameworks.md).

## What each file is for

| File                                | Use it when                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `properui.min.css` / `properui.css` | No build step. Prebuilt: Tailwind's preflight, every token, the dark-mode block and the `@properui/html` component classes.                |
| `tokens.css`                        | A build step but no Tailwind. Every token as a plain custom property: light on `:root`, dark on `.dark-mode`. No Tailwind syntax.          |
| `theme.css`                         | Tailwind CSS v4 in any framework. `theme.css` + `typography.css` verbatim: the `@theme` layer, so `bg-primary` and `text-display-lg` work. |
| `presets/<name>.css`                | `theme.css` plus a shipped preset. The `generateThemeCss()` `@theme` override block, inside `properui:theme-preset` markers.               |
| `presets/plain/<name>.css`          | `tokens.css` or `properui.css` plus a preset. The same override as a plain `:root` block.                                                  |

Presets: `brand` (the default purple), `blue`, `indigo`, `teal`, `green`, `orange`, `rose` and `slate-mono`.

## No build step

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css" />
```

The same file is at `https://properui.dev/css/properui.min.css` (served by the docs site from `packages/tokens/dist`)
and at `https://unpkg.com/@properui/tokens`. Pin a version in production (`@properui/tokens@0.1.0`).

`properui.css` only contains the utilities the `@properui/html` snippets use, not all of Tailwind, but every token is
emitted, so your own CSS can read any of them:

```css
.panel {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-xl);
    padding: calc(var(--spacing) * 4);
}
```

It does not load a web font: `--font-body` asks for Inter first and falls back to the system stack.

## Without Tailwind: `tokens.css`

```bash
npm install @properui/tokens
```

```ts
// Vue, Svelte, Astro or plain Vite: once, in the entry or root layout
import "@properui/tokens/tokens.css";
```

For Angular, add `node_modules/@properui/tokens/dist/tokens.css` to the `styles` array in `angular.json`.

Every token is then a CSS variable on `:root` (`--color-bg-primary`, `--color-text-secondary`, `--text-sm` and
`--text-sm--line-height`, `--radius-lg`, `--shadow-md`, ...). The Tailwind defaults a token reads (`--spacing` and the
stock colour ramps some utility colours point at) are resolved from `tailwindcss/theme.css` and included, so the file
stands on its own. Utility classes like `bg-primary` are Tailwind's and are not in this file.

## With Tailwind v4: `theme.css`

```css
@import "tailwindcss";
@import "@properui/tokens/theme.css";

@custom-variant dark (&:where(.dark-mode, .dark-mode *));
```

The `@custom-variant` line matches `globals.css`, so Tailwind's `dark` variant follows the `.dark-mode` class. The same
authoring rules as React apply: semantic tokens only, no `dark:` utilities, logical properties.

## Adding a preset

Load it after the file it overrides:

```css
@import "tailwindcss";
@import "@properui/tokens/theme.css";
@import "@properui/tokens/presets/teal.css";
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@properui/tokens/dist/presets/plain/teal.css" />
```

A preset redeclares only the brand ramp, the neutral ramp, the radius scale and (when set) the fonts. Both modes read
those ramps, so it applies in dark mode too. For a custom colour use the
[theme generator](https://properui.dev/docs/theme-generator); for plain CSS, change `@theme` to `:root` in its output.

## Dark mode

Class-based, as in React: `class="dark-mode"` on an ancestor (usually `<html>`) switches every token. Any subtree works
too. See [Dark mode](./dark-mode.md).

```js
document.documentElement.classList.toggle("dark-mode", matchMedia("(prefers-color-scheme: dark)").matches);
```

## Building it

```bash
pnpm -F @properui/tokens build   # writes packages/tokens/dist
pnpm -F @properui/tokens test    # builds into a temp dir and checks the output
```

`properui.css` is compiled with `@tailwindcss/postcss` from an entry that imports `tailwindcss` (with automatic
source detection off), `theme.css` with `theme(static)` so every token is emitted, `typography.css`, and `globals.css`
minus its imports and plugins. When `packages/html` exists, the entry adds `@source` for its `src/**/*.{html,css,ts}`
and imports its `src/index.css`; without it, the build still succeeds and emits the token and preflight layer only.
`properui.min.css` is the same file minified with lightningcss.
