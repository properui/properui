<div align="center">

# Proper UI

**The open-source React 19 component library built for AI-generated code.**

[properui.dev](https://properui.dev) · [Documentation](https://properui.dev/docs/installation) · [Components](https://properui.dev/components) · [llms.txt](https://properui.dev/llms.txt)

[![CI](https://img.shields.io/github/actions/workflow/status/properui/properui/ci.yml?branch=main&label=CI&logo=github)](https://github.com/properui/properui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40properui%2Fui?logo=npm&label=%40properui%2Fui)](https://www.npmjs.com/package/@properui/ui)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

</div>

Proper UI is a component library, a documentation site and a copy-in CLI in one repository, designed for the way UI
code gets written now: by a coding agent, at speed. A model writing UI from memory invents class names, props and markup
that look plausible and do not compile. This library is readable by machines on purpose: a public JSON registry your
assistant fetches real source from, a plain-markdown mirror of every documentation page indexed at
[`/llms.txt`](https://properui.dev/llms.txt), and a CLI that writes the files into your project.

Components ship as readable TypeScript source rather than a compiled bundle, so you can install `@properui/ui` as a
normal dependency _or_ copy the files in with `npx @properui/cli@latest add` and own them outright. Behaviour, keyboard
handling and ARIA come from [React Aria Components](https://react-spectrum.adobe.com/react-aria/); styling is Tailwind
CSS v4 utilities resolved through a semantic token layer, so re-branding the whole system means editing one file, and a
generated screen lands on the system rather than near it.

<!-- stats:start -->

The registry currently holds **818 entries**: **89 published component groups** (**125** counting foundations, shared assets and example-page groups) across seven layers (26 base, 45 application, 18 marketing sections, 12 application page examples, 10 marketing page examples, 8 foundations, 6 shared assets), **446 section variants** and **233 full-page examples** (**679** composable variants total), and the shared hooks, utils and styles they depend on.
<!-- stats:end -->

## Built for AI code generators

Nothing here is specific to one assistant. The three surfaces below are plain HTTP and a shell command, so Claude Code,
Codex, Cursor, v0, Bolt and Lovable can all drive them.

| Surface             | URL                                                                    | What an assistant does with it                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown docs index | [`/llms.txt`](https://properui.dev/llms.txt)                           | Finds the plain-markdown twin of every page, so it reads the same reference you do without parsing rendered HTML.                                                       |
| Component registry  | [`/r/index.json`](https://properui.dev/r/index.json), `/r/<name>.json` | Fetches a component's real source, props, npm dependencies and registry dependencies: 797 entries.                                                                      |
| Config schema       | [`/schema.json`](https://properui.dev/schema.json)                     | Validates and autocompletes the `components.json` that `init` writes.                                                                                                   |
| CLI: `add`          | `npx @properui/cli@latest add <component>`                             | Writes the `.tsx` into the project, resolves the dependency chain, rewrites `@/` imports to the configured alias, and reports (or, with `--install`, runs) the install. |
| CLI: `remove`       | `npx @properui/cli@latest remove <component>`                          | Deletes an installed entry from the project and warns if something else installed still depends on it.                                                                  |
| CLI: `why`          | `npx @properui/cli@latest why <component>`                             | Prints what pulled a given entry in, for auditing an install you didn't expect.                                                                                         |
| CLI: `check`        | `npx @properui/cli@latest check`                                       | The token guard: flags raw palette classes and arbitrary values in place of semantic tokens.                                                                            |
| CLI: `icons`        | `npx @properui/cli@latest icons`                                       | Lists and installs icon components the same way `add` handles the rest of the registry.                                                                                 |

Why generated code comes out better against this library specifically:

- **A closed vocabulary.** Components only ever name semantic tokens (`bg-primary`, `text-tertiary`, `bg-brand-solid`),
  so a model has a small named set to choose from instead of the open set of arbitrary Tailwind values.
- **A wrong prop fails the build, most of the time.** `strict` and `noUncheckedIndexedAccess` across the monorepo mean
  a DOM prop where an Aria prop belongs (`disabled` instead of `isDisabled`, a name that doesn't exist on the type) is
  a compile error the agent can read and fix. That covers names, not behaviour: a prop that exists on both DOM and
  Aria vocabularies but means something subtly different will typecheck and still be wrong, which is why dev-mode
  warnings cover the common aliases (`readOnly`/`isReadOnly`, `required`/`isRequired`, `checked`/`isSelected`) instead
  of relying on the type system alone.
- **Accessibility it never had to know about.** React Aria supplies focus management, keyboard navigation and ARIA, so
  generated markup inherits them whether or not the prompt mentioned accessibility.
- **Dark mode and RTL by construction.** One `.dark-mode` class repoints every token and spacing uses logical properties,
  so there are no `dark:` utilities to forget on half the elements and no second stylesheet to hand-write.
- **679 named variants to compose from.** Asked for a pricing page, an assistant reaches for an existing file instead of
  inventing three hundred lines of layout.
- **You review a diff.** The CLI writes plain `.tsx` you own. There is no opaque wrapper between the generated code and
  what renders.

[`AGENTS.md`](./AGENTS.md) holds the conventions an assistant working in this repository should follow. There is no MCP
server yet; it is on the [roadmap](./ROADMAP.md), and the CLI covers the same ground today.

## Features

- **Accessible by default.** Every interactive primitive (menus, dialogs, comboboxes, tables, sliders, date pickers)
  delegates to React Aria Components. Focus management, keyboard navigation and ARIA wiring are inherited, not
  re-implemented. Each component ships an `axe` smoke test that runs in CI: zero _detected_ violations across 125 automated suites; see
  [the accessibility page](https://properui.dev/docs/accessibility) for what that does and does not cover.
- **Tailwind CSS v4 tokens, no config file.** All design decisions live in `@theme` blocks in
  [`packages/ui/src/styles/theme.css`](./packages/ui/src/styles/theme.css). There is no `tailwind.config.js`.
- **Dark mode without `dark:` utilities.** A `.dark-mode` class anywhere in the ancestor chain re-maps every semantic
  token. Components written against `bg-primary` / `text-secondary` are correct in both themes automatically.
- **RTL support.** React Aria supplies direction-aware behaviour, and components use CSS logical properties (`ms-*`,
  `ps-*`, `start-*`, `text-start`) so `dir="rtl"` flips the layout without a fork. The migration away from physical
  utilities is still in progress in parts of the marketing layer. See [docs/rtl.md](./docs/rtl.md).
- **TypeScript strict.** `strict` and `noUncheckedIndexedAccess` across the monorepo; every prop is typed and
  JSDoc-documented, and `tsc --noEmit` runs in CI.
- **Tree-shakeable source.** The package publishes `.tsx` with per-component subpath exports, so a bundler only ever
  sees the components you import.
- **No alias to configure.** Every internal import in the package is a plain relative specifier. Installing
  `@properui/ui` as a normal dependency and importing it in a Vite (or other bundler) project needs no `@/` path alias
  or `tsconfig` change on your end. Next.js still needs `transpilePackages` (see below) because it does not compile
  TSX from `node_modules` by default, not because of any alias.
- **Copy-in CLI.** `npx @properui/cli@latest add button` writes the component's source into your project, resolves its
  registry dependencies, rewrites `@/` imports to your alias and installs missing npm packages.

## Quick start

### Next.js (App Router)

**1. Install**

```bash
pnpm add @properui/ui
# npm install @properui/ui · yarn add @properui/ui
```

**2. Import the stylesheet and let Tailwind scan the package**

`@properui/ui/styles/globals.css` already contains the Tailwind import, the token layer, typography and every plugin
the components need. Tailwind v4 does not scan `node_modules` by default, so add one `@source` line:

```css
/* app/globals.css */
@import "@properui/ui/styles/globals.css";

@source "../node_modules/@properui/ui/src/**/*.{ts,tsx}";
```

**3. Transpile the package**

Next.js compiles only your own source by default, and this package ships TSX:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@properui/ui"],
};

export default nextConfig;
```

**4. Wrap the app in the providers**

`ThemeProvider` maps `next-themes` onto the `.light-mode` / `.dark-mode` classes the tokens key off. `RouterProvider`
hands React Aria the Next router so every component that accepts `href` performs a client-side transition. Both carry
their own `"use client"` directive, so they can be rendered straight from a server layout:

```tsx
// app/layout.tsx
import { ThemeProvider } from "@properui/ui/providers";
import { RouterProvider } from "@properui/ui/providers/router-provider";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-primary text-primary antialiased">
                <ThemeProvider>
                    <RouterProvider>{children}</RouterProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
```

`suppressHydrationWarning` is required: `next-themes` writes the theme class onto `<html>` before React hydrates.

### React + Vite

**1. Install**

```bash
pnpm add @properui/ui
pnpm add -D @tailwindcss/vite
```

**2. Register the Tailwind plugin**

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
});
```

**3. Import the stylesheet and let Tailwind scan the package**

```css
/* src/index.css */
@import "@properui/ui/styles/globals.css";

@source "../node_modules/@properui/ui/src/**/*.{ts,tsx}";
```

**4. Wrap the app in the providers**

`ThemeProvider` is framework-agnostic and works as-is. `RouterProvider` from `@properui/ui/providers/router-provider` is Next-only.
In Vite, use React Aria's own `RouterProvider` and hand it your router's navigate function:

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { RouterProvider } from "react-aria-components";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@properui/ui/providers";
import { App } from "./app";
import "./index.css";

const Providers = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    return (
        <ThemeProvider>
            <RouterProvider navigate={navigate}>{children}</RouterProvider>
        </ThemeProvider>
    );
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Providers>
                <App />
            </Providers>
        </BrowserRouter>
    </StrictMode>,
);
```

With no router at all, drop `RouterProvider` entirely: every component still renders and works; `href` links just do a
full page load.

### Your first component

```tsx
import { Button } from "@properui/ui/components/base/buttons/button";

export const Example = () => (
    <Button size="md" color="primary" onPress={() => console.log("pressed")}>
        Get started
    </Button>
);
```

Import from the subpath (`@properui/ui/components/<layer>/<group>/<file>`) so bundlers pull in only that component.
The root barrel (`import { Button } from "@properui/ui"`) re-exports everything and is handy while prototyping.

Interactive components are React Aria based: use `onPress` rather than `onClick`, and `isDisabled` rather than
`disabled`.

### Or copy the components in

Prefer to own the source? Skip the dependency and use the CLI:

```bash
npx @properui/cli@latest init
npx @properui/cli@latest add button
```

`init` writes `components.json`, your theme file, the `cx` utility and the Tailwind `@source` line, and wires up
`ThemeProvider`. `add` copies a component's files (plus everything it depends on) into your project. See
[docs/cli.md](./docs/cli.md).

## Theming

Every colour, radius, shadow and type step is a CSS variable in
[`packages/ui/src/styles/theme.css`](./packages/ui/src/styles/theme.css). The tokens are layered: a raw palette, a
wider `--color-utility-*` set for charts and badges, and semantic tokens (`--color-bg-primary`, `--color-text-secondary`,
`--color-border-tertiary`) that components consume as `bg-primary`, `text-secondary`, `border-tertiary`.

A re-brand starts with one edit: replace the eleven `--color-brand-*` values. If your neutrals or status colours
(`success`, `warning`, and so on) are not Tailwind's stock ramps either, shadow those in the same `theme.css` file,
which now declares the neutral and status ramps, and their `ring`/`border` families, that the semantic layer consumes,
so there is one file to grep for every colour a re-brand depends on, not a ramp that is used but never declared.

```css
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

Every semantic token references those through `var()`, so buttons, focus rings, links, selected states and charts follow
in both light and dark mode. Full detail in [docs/theming.md](./docs/theming.md).

## Project layout

```
apps/docs             documentation site: Next.js 15 App Router + MDX
packages/ui           @properui/ui: the component library
  src/components      base/ application/ marketing/ app-examples/
                      marketing-examples/ foundations/ shared-assets/
  src/styles          globals.css · theme.css · typography.css
  src/{hooks,utils,providers}
packages/cli          properui: the init/add CLI
packages/registry     generated registry JSON consumed by the CLI and the docs site
scripts               generators, screenshot and visual-diff tooling
docs                  these guides
```

## Development

Requires **Node 20+** and **pnpm 9**.

```bash
pnpm install
pnpm dev            # docs site → http://localhost:3000
pnpm storybook      # Storybook → http://localhost:6006
pnpm test           # type-check + lint + prettier + vitest/axe across the workspace
pnpm gen:all        # regenerate barrels, demos, variants, nav and the registry
```

The documentation site is hosted at [properui.dev](https://properui.dev). `pnpm dev` serves the same site locally
at `http://localhost:3000`.

Other useful commands:

```bash
pnpm type-check     # tsc --noEmit everywhere
pnpm lint           # eslint
pnpm prettier       # format the repo
pnpm build          # build every package and the docs site
pnpm docs:shot <slug>   # screenshot a docs page with Playwright
pnpm docs:diff <slug>   # pixel-diff it against the stored reference
```

## Contributing

Contributions are welcome. [CONTRIBUTING.md](./CONTRIBUTING.md) covers the setup, the component conventions that matter
(kebab-case files, `Aria*` import aliases, semantic tokens only, the `styles = sortCx({})` pattern, and the demo, story,
test and docs page every component ships with), how to run the checks, and the changeset-based release flow.
[docs/contributing-components.md](./docs/contributing-components.md) walks through adding a component end to end.

[ROADMAP.md](./ROADMAP.md) lists what is not built yet (an MCP server, full RTL coverage, visual regression baselines
and a few others) so you can see where help is most useful.

By participating you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues should be reported
privately. See [SECURITY.md](./SECURITY.md).

## License

Released under the **MIT License**. Use it in personal and commercial projects, without attribution.

Every component, example, icon and page in this repository is included. There is no paid tier, no private
registry and nothing held back behind an account.

## Credits

Some components are derived from [Untitled UI React](https://github.com/untitleduico/react), which is released
under the MIT License. Its licence text is kept at
[`LICENSES/untitledui-react-MIT.txt`](./LICENSES/untitledui-react-MIT.txt). Thanks to that project for the token system
and the base component APIs this library builds on.

Built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) and
[Tailwind CSS](https://tailwindcss.com).
