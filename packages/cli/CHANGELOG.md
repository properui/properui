# @properui/cli

## 0.3.0

### Minor Changes

- 95470ee: Adds `properui create <dir>`, which scaffolds a brand-new Next.js (App Router) or Vite project from
  an embedded template — `package.json`, `tsconfig.json` with the `@/*` alias, the Tailwind v4
  stylesheet, the framework config, and a home page rendering a `Button` and a `Badge` — then runs the
  same `init`/`add` logic `properui` uses against an existing project, so the new project is already
  configured and has real components installed. `--template next|vite` picks the template (default
  `next`), `--pm pnpm|npm|yarn|bun` picks the package manager referenced in the printed next steps
  (default `npm`), `--install` also runs that package manager's install, `--overwrite` allows
  scaffolding into a directory that already has files in it, and `-y`/`--yes` accepts every default.
  Without `--install`, `create` never touches the network: it only writes files and prints the install
  command to run afterward.

    `properui diff <component>` also now prints the entry's changelog — the `@properui/ui` releases
    newer than the version recorded for it in your `components.json` `installed` manifest, when that
    record carries a real `x.y.z` to compare against, or the full changelog otherwise — reading the new
    per-entry `changelog` field the registry now publishes on every entry.

- 6596dfc: Makes the CLI platform-aware. Detection now recognises Vue, Nuxt, Angular, Svelte, SvelteKit and Astro (from
  `package.json` and their config files) and treats a folder with no `package.json` or no known framework as plain HTML;
  React projects detect exactly as before. `components.json` gains an optional `"platform": "react" | "html"` (default
  `react`). On the html platform, `init` skips the React-only steps (no `utils/cx.ts`, no providers, no TSX `@source`),
  wires `@properui/tokens/theme.css` and `@properui/html/css` into a Tailwind v4 stylesheet when there is one or prints
  the CDN `<link>`/`<script>` lines when there is not, and prints the `@properui/tokens @properui/html
@properui/elements` install last; `init --platform react|html` overrides detection. `add <name>` on an html project
  installs the `<name>-html` snippet entry (`.html` files under the components alias, recorded in `components.json`) and
  refuses a React-only entry with one line naming the HTML alternative. `list --platform <p>` and `search --platform <p>`
  filter by platform, `search` shows a platform column, and `info --json` reports `platform`, `detectedPlatform`,
  `installedHtml` and the html-platform package versions.
- c574288: New package: `@properui/mcp` 0.1.0, a Model Context Protocol server for Proper UI (`npx -y @properui/mcp`). It exposes
  `list_components`, `search_components`, `get_component`, `get_component_docs`, `add_component`, `get_project_info` and
  `check_tokens` as tools, and the registry index and every entry as `properui://registry/...` resources. It bundles the
  CLI's own registry client, search scoring, `add`, `info` and `check` code, so it reads the same registry (`--registry`,
  `PROPERUI_REGISTRY`, `REGISTRY_URL`, `components.json`, then `https://properui.dev/r`) and writes the same files. It
  publishes at its initial 0.1.0 because that version is not on npm yet, so it carries no bump of its own here.

    CLI: `properui agent init` now also registers the MCP server: `.mcp.json` for Claude Code and `.cursor/mcp.json` for
    Cursor (merged into an existing file; an existing `properui` entry is only replaced with `--overwrite`), and prints the
    `~/.codex/config.toml` block for Codex. `--no-mcp` skips it. `properui check` accepts a single file as well as a
    directory.

- 7a583e0: Add theme presets. `@properui/ui/styles/presets` ships eight presets (`brand`, `blue`, `indigo`, `teal`, `green`,
  `orange`, `rose`, `slate-mono`), each a brand ramp plus a base gray (`gray`, `slate`, `zinc`, `neutral`, `stone`), a
  radius scale (`none` to `xl`) and optional fonts, together with `generateThemeCss()` (the `@theme` override block to
  append after the Proper UI stylesheet), `scaleFromHue()`/`scaleFromHex()` (an 11-step brand ramp derived in OKLCH from
  one colour), and `encodePreset()`/`decodePreset()` (short url-safe preset codes). `theme.css` now pins Tailwind's
  `--radius-xs` … `--radius-4xl` scale so presets have a documented radius hook; values are unchanged.

    The CLI gains `properui theme list`, `properui theme apply <preset|code> [--css <file>] [--dry-run]` (writes or
    replaces a marked `/* properui:theme-preset */` block in the global stylesheet, idempotently) and `init --preset
<name|code>`. The docs add a theme generator page (/docs/theme-generator) that previews real components with any preset
    or hex colour and prints the CSS, the preset code and the `theme apply` command.

### Patch Changes

- ded6348: New package: `@properui/eslint-plugin` 0.1.0, a flat-config ESLint 9 plugin with four rules —
  `no-raw-palette`, `no-arbitrary-values`, `no-dark-variant` and `no-physical-properties` (with an
  autofix to the logical equivalent, e.g. `ml-4` → `ms-4`) — that keep component code on the semantic
  token layer and on logical directional properties, inline as you type instead of as a separate
  command. `no-raw-palette`/`no-arbitrary-values`/`no-dark-variant`'s detection is copied from
  `properui check` (`packages/cli/src/commands/check.ts`), not reimplemented independently, so the two
  never drift on what counts as a violation; `check` itself is unchanged. `configs.recommended` turns
  on all four (`no-arbitrary-values` at `warn`, the rest at `error`); this repository's own
  `eslint.config.mjs` applies them to `packages/ui/src/components/**`. See the
  [Linting docs page](https://properui.dev/docs/linting). It publishes at its initial 0.1.0 because
  that version is not on npm yet, so it carries no bump of its own here.

    `properui check`'s docs (`docs/cli.md`, `apps/docs/content/docs/cli.mdx`) now link to the plugin.

## 0.2.2

### Patch Changes

- `agent init` printed a truncated `updat` status label when it appended to an existing
  `CLAUDE.md` or `AGENTS.md`. The labels are now `write`, `update`, `skip` and `keep`, padded to
  the same width.

## 0.2.1

### Patch Changes

- `properui --version` reads the version from the package's own `package.json` instead of a
  string in the source, which had stayed at `0.1.0` in the 0.2.0 release. The smoke test now
  asserts the two match.

## 0.2.0

### Minor Changes

- fcdd944: Fixes `init`'s CSS-ordering, honesty and incomplete-provider gaps from the agent feedback map
  (2.2, 2.3, 2.5, 2.6, 2.13, 2.14) and Miraveli F1-F6:

    - **CSS insertion order (2.2).** When the target stylesheet already has `@import "tailwindcss";`,
      everything `init` writes lands immediately _after_ that line, never above it — previously
      prepending broke `.dark-mode` on `<html>` by emitting the theme as unlayered `:root`.
    - **Full stylesheet (Miraveli F3).** `init` now mirrors the whole block a copied component
      needs, not three of twelve lines: the theme _and_ `styles/typography.css` imports, all three
      `@plugin` lines, all three `@custom-variant` lines (including `dark`), both `@utility` blocks,
      and the `@source` line. The plugin packages (`@tailwindcss/typography`,
      `tailwindcss-react-aria-components`, `tailwindcss-animate`) are reported in the install block.
    - **ThemeProvider + RouterProvider from the registry (2.3, 2.14).** `init` no longer writes a
      hand-rolled ThemeProvider; it copies the registry's `next-themes`-based one, and on Next's App
      Router also copies `providers/router-provider.tsx` and wires `<RouterProvider>` inside
      `<ThemeProvider>` in the root layout. Skipped for Vite (React Aria's own works with
      react-router) with a one-line note. New `--no-providers` skips all provider files and wiring
      (Miraveli F5).
    - **Honesty (2.6, Miraveli F1).** `init` collects every npm package the files it wrote need
      (theme plugins, `tailwind-merge`, `next-themes`, `react-aria-components`, and for Vite
      `tailwindcss` + `@tailwindcss/vite`) and prints `Install to finish: <cmd>` as the last thing it
      prints, plus that the project will not build until it runs. New `--install` runs it via the
      detected package manager. Fixed the success line: `Next: npx @properui/cli add buttons badges`
      (buttons, plural — 2.13). `--vite` now also registers `tailwindcss()` in `vite.config.ts`'s
      `plugins` when `@tailwindcss/vite` isn't already configured (Miraveli F2).
    - **Consumer tooling (2.5).** Detects `eslint.config.{js,mjs,ts}` (both a plain array export and
      the variadic `tseslint.config(...)` helper) and `.prettierignore`/a Prettier config, and
      appends an `ignores` entry for the vendored `components/`, `utils/`, `hooks/` and `providers/`
      directories with an explanatory comment, printing what it wrote. New `--no-tooling-ignores`
      skips this.
    - **Transparency (Miraveli F4).** `init` always prints a final "Files written/changed" list.

    `scripts/clean-room.ts` no longer hand-wires the Vite Tailwind plugin (init does it now, backed
    by a real `--install`) and, after `add`, runs the scaffold's own ESLint and a strict
    `npx tsc --noEmit` so a copy-in ESLint/Prettier regression fails the release gate instead of
    shipping quietly.

- fcdd944: Fixes the CLI honesty and dependency-hygiene gaps from the agent feedback map (2.6, 2.7, 2.8,
  2.10, 2.13, 2.21):

    - `info` probes the registry regardless of whether `components.json` exists yet, so
      `registryReachable` reflects the network instead of always being `false` on a fresh project
      (2.7). Its `installed` field now mirrors the new manifest below.
    - `add` records every installed entry in `components.json` under
      `installed: { [name]: { version, files, installedAt } }`. `diff` and `info` read it instead of
      re-scanning the filesystem or the whole registry index. Two new commands use it too:
      `remove <entry...>` deletes an entry's files (only those not shared with another installed
      entry) and reports npm dependencies that may now be orphaned; `why <file|entry>` prints the
      dependency chain that brought something in.
    - `add`'s install block always prints last. When npm dependencies are missing and neither
      `--yes` nor a TTY is available, it now exits non-zero with `Install to finish: <cmd>` as its
      final line instead of silently printing "Skipped install" with exit 0. `--yes` still installs.
      New `--no-optional` skips `optionalRegistryDependencies` (installed by default; the summary
      labels them `(optional)`). New `--with-demos` also writes an entry's `kind: "demo"` files when
      the registry publishes them. Missing npm dependencies are attributed to the specific file that
      needs them when the registry provides per-file `dependencies` (`need recharts
(metrics-chart.tsx)`).
    - `search` applies a real score threshold and prints `no match for "x"` instead of forcing a
      weak match; it also indexes `exports.json` so a query like `combobox` finds `select` (which
      exports `ComboBox` but never says so in its name/title/description) and reports the actual
      file. Counts are now honest: `N docs examples · M files`, and 0-file entries never appear.
      New `icons <query>` (also `search --icons`) fuzzy-searches the icon export index and prints
      the import line.
    - `list` hides 0-file entries and shows a file count per entry.
    - New `check [dir]` scans `.ts`/`.tsx`/`.jsx` files for raw Tailwind palette classes, hardcoded
      `dark:` variants and arbitrary colour values, printing `file:line` and exiting non-zero on any
      hit; the regexes are documented in `--help`.

    All of the above degrades gracefully against a registry built before these fields existed:
    `optionalRegistryDependencies`, per-file `dependencies`/`kind`, `icons.json` and `exports.json`
    are all optional.
