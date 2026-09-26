# Theming

Every visual decision (colour, spacing, radius, shadow, type step) is a CSS variable declared once in
[`packages/ui/src/styles/theme.css`](../packages/ui/src/styles/theme.css) and consumed through Tailwind utilities.
Components never hard-code a colour, so re-theming is editing variables, not editing components.

## The three token layers

**1. Base palette.** The raw scale: `--color-brand-50` ... `--color-brand-950`, alongside Tailwind's own
neutral/red/yellow/green/blue/... scales. **This is the only layer a re-brand touches.**

**2. Utility colours.** `--color-utility-{brand,gray,blue,indigo,purple,pink,orange,green,...}-{50...700}`, used by badges,
tags and charts, which need a wider palette than the semantic layer exposes. These are remapped in dark mode (utility
`50` points at the `950` step, and so on) so a coloured badge stays legible in both themes.

**3. Semantic tokens.** Role-based variables (`--color-bg-primary`, `--color-text-secondary`,
`--color-fg-brand-primary`, `--color-border-tertiary`) which components consume as `bg-primary`, `text-secondary`,
`text-fg-brand-primary`, `border-tertiary`. Each one resolves through `var()` to a base or utility colour, so a brand
change cascades automatically, including into dark mode.

| Prefix     | Role                  | Example utility                    |
| ---------- | --------------------- | ---------------------------------- |
| `text-*`   | Typography colour     | `text-primary`, `text-tertiary`    |
| `fg-*`     | Icon / graphic colour | `text-fg-quaternary`               |
| `bg-*`     | Surface colour        | `bg-primary`, `bg-brand-solid`     |
| `border-*` | Stroke colour         | `border-secondary`, `ring-primary` |

Inside a component, never reach for a raw palette utility such as `bg-neutral-100` or `text-purple-600`. Pick a
semantic token by the role you need, not by the colour it happens to render as today. That is what keeps dark mode and
re-branding working without touching component files.

## Re-branding

Replace the eleven `--color-brand-*` values. That is the whole job.

```css
/* theme.css */
@theme {
    --color-brand-50: rgb(249 245 255);
    --color-brand-100: rgb(244 235 255);
    --color-brand-200: rgb(233 215 254);
    --color-brand-300: rgb(214 187 251);
    --color-brand-400: rgb(182 146 246);
    --color-brand-500: rgb(158 119 237);
    --color-brand-600: rgb(127 86 217);
    --color-brand-700: rgb(105 65 198);
    --color-brand-800: rgb(83 56 158);
    --color-brand-900: rgb(66 48 125);
    --color-brand-950: rgb(44 28 95);
}
```

Keep the contrast relationships the semantic layer assumes:

- **`600`** is the primary interactive colour on a light background: solid buttons, links, active states.
- **`700`** is its hover step.
- **`50` / `100`** are tints for subtle surfaces and badge backgrounds.
- **`300`** supplies the default focus-ring tone.
- **`400` / `500`** carry the dark-mode equivalents of `600` / `700`.

Do not edit the semantic mappings themselves (`--color-bg-*`, `--color-text-*`, `--color-fg-*`, `--color-border-*`);
they are already wired to cascade correctly in both modes.

If you consume the package rather than copying it in, override the brand variables in your own stylesheet after the
import:

```css
@import "@properui/ui/styles/globals.css";
@source "../node_modules/@properui/ui/src/**/*.{ts,tsx}";

@theme {
    --color-brand-600: #2563eb;
    /* ...the rest of the scale */
}
```

## Presets

Rather than writing the eleven brand lines by hand, start from a preset: a brand ramp, a base gray (`gray`, `slate`,
`zinc`, `neutral` or `stone`), a radius scale (`none`, `sm`, `md`, `lg` or `xl`) and optional fonts. Eight ship with
the library: `brand` (the default purple), `blue`, `indigo`, `teal`, `green`, `orange`, `rose` and `slate-mono`.

```bash
npx @properui/cli@latest theme list             # the shipped presets and their codes
npx @properui/cli@latest theme apply teal       # write it into your global stylesheet
npx @properui/cli@latest init --preset teal     # or apply one during setup
```

The [theme generator](https://properui.dev/docs/theme-generator) builds a custom preset from any hex colour (the ramp
is derived in OKLCH), previews real components with it in both modes, and gives you the CSS, a short preset code and
the matching `theme apply <code>` command. `theme apply` accepts either a name or a code.

A preset redeclares only primitives, inside `/* properui:theme-preset */` markers that `theme apply` replaces in place
on every run: `--color-brand-*`, `--color-neutral-*` (every gray semantic token reads this ramp, so redeclaring it is
how the base gray changes), `--radius-xs` to `--radius-4xl` (pinned in `theme.css`), and `--font-body`/`--font-display`
when set. The definitions and the generator live in
[`packages/ui/src/styles/presets.ts`](../packages/ui/src/styles/presets.ts) (`import { generateThemeCss } from
"@properui/ui/styles/presets"`).

## Scoping a theme to part of the app

Because every semantic token resolves through `var(--color-brand-*)`, you can re-theme a subtree by overriding the brand
variables on a wrapper class instead of forking components:

```css
.theme-product-b {
    --color-brand-50: #eff6ff;
    --color-brand-300: #93c5fd;
    --color-brand-600: #2563eb;
    --color-brand-700: #1d4ed8;
    /* ...the rest of the scale */
}
```

```tsx
<div className="theme-product-b">
    <Button color="primary">Uses the Product B brand</Button>
</div>
```

Everything inside (buttons, badges, focus rings, links) resolves against the overridden scale while the rest of the
page keeps the default. This is the same mechanism [dark mode](./dark-mode.md) uses, scoped to a class you choose
instead of `.dark-mode`.

## Beyond colour

`theme.css` also owns the rest of the visual language, all overridable the same way:

- **Typography**: `--font-body`, `--font-display`, `--font-mono`, and the `--text-display-xs ... --text-display-2xl`
  steps with their line-height and letter-spacing pairs.
- **Shadows**: `--shadow-xs` through the skeuomorphic composites used by buttons.
- **Spacing and radii**: spacing derives from Tailwind v4's `--spacing` base; `--radius-xs` ... `--radius-4xl` are
  pinned in `theme.css` (the scale presets change).

Override any of them in an `@theme` block of your own; the last declaration wins.

## FAQ

**Do I need to restart the dev server after editing tokens?** No. Tailwind's dev server picks up CSS variable changes
on save.

**How do theme changes affect dark mode?** Both modes read the same brand scale. The `.dark-mode` block re-maps
semantic tokens, not the brand palette, so a brand change applies to both at once.

**Can I define fewer than eleven brand steps?** Provide the full `50`-`950` range. Components reference lighter and
darker steps for tints, hovers and dark mode; a partial scale leaves those unresolved.

**Can I use the tokens outside React?** Yes: `theme.css` is plain CSS and works in any Tailwind v4 project,
regardless of framework.
