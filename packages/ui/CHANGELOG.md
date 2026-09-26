# @properui/ui

## 0.3.0

### Minor Changes

- 5e99b0e: Add the `ai-elements` group for AI chat interfaces: `AIConversation` (stick-to-bottom log with a scroll-to-latest button), `AIMessage` (user and assistant messages with avatar, timestamp, actions and a streaming shimmer and caret), `AIResponse` (a small built-in markdown renderer with highlighted code blocks), `AIReasoning`, `AIToolCall`, `AISources`, `AISuggestions`, `AIPromptInput` (auto-growing, Enter to send, attachments, model selector and counter slots, Stop while streaming), `AIModelSelector` and `AIBranch`. They take plain props and callbacks, so they work with any streaming source and need no AI SDK.
- 6db077e: Adds six new component groups. Under `base/`: `HoverCard` (a rich hover/focus-triggered preview built on
  `Popover`, for things a plain `Tooltip` can't hold, like a profile card with a Follow button), `Menubar` (an
  application-style `File`/`Edit`/`View` menu bar built on React Aria's `Toolbar` plus the same `Menu`/`MenuTrigger`
  primitives `Dropdown` uses, with hover-switching between open menus, submenus, and checkbox/radio items),
  `NumberInput` (a `NumberField`-based numeric input with stacked or inline increment/decrement buttons and
  `formatOptions` for currency/percent/unit display), and `TagInput` (type-to-add tags on Enter/comma, paste-splits-
  on-commas, `maxTags`, a `validate` callback, and `isReadOnly`). Under `application/`: `Stepper` (a controlled
  multi-step form wizard — distinct from the purely decorative `ProgressSteps` — with `canAdvance` validation, linear
  and non-linear navigation, and horizontal/vertical layouts) and `Timeline` (vertical, alternating and horizontal
  status timelines with `completed`/`current`/`upcoming` coloring).
- 564d586: Adds four chart groups to round out coverage against the top component libraries: `area-charts`
  (stacked, gradient, stepped, a brush range selector, small multiples), `scatter-bubble-charts`
  (scatter, a z-axis-sized bubble chart, a fitted regression line, categorical colors), `sparklines`
  (a standalone `Sparkline` primitive for metric cards and table cells, plus demos dropping it into
  existing `MetricSimple` cards and a `Table`), and `combined-charts` (bar + line, dual y-axes, a bar
  with a target `ReferenceLine`, a waterfall built from stacked bars, and a `Funnel`).

    Also adds `chartColorTokens`, `chartColors` and `sequentialScale` to `charts-base`: an ordered,
    documented categorical color list (and a single-hue scale builder) for charts that assign color to
    an unknown number of series, resolved from the same `--color-utility-*` tokens every chart already
    uses. `ChartLegendContent`'s swatch now also reads a series' `style.color`, alongside the existing
    `className` support, so a series colored this way still gets a correctly tinted legend swatch.

    The four new chart docs pages each cover their own examples, and a "Chart colours" section explaining
    the ordering and dark-mode behavior was added to all eight chart docs pages (`line-bar-charts`,
    `pie-charts`, `radar-charts`, `activity-gauges`, and the four new ones).

- c661b87: Add `DataTable` and `useDataTable` (`application/data-table`): sorting with optional multi-column stacking, search, faceted, text, number-range and date-range filters, column visibility, pinning and resizing, row selection with a bulk-action bar, client-side pagination, a `manual` server-side mode driven by `onQueryChange`, density toggle, loading skeleton rows, empty state, sticky header and virtualization through React Aria's `Virtualizer` and `TableLayout`. `Table` is unchanged and remains the styling primitive.
- 73b1016: Add four application component groups: `Kanban` (board, columns and cards with drag and drop between columns, keyboard moves, collapsible columns and custom card rendering), `SortableList` (vertical reordering with drag handles and keyboard support), `ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle` (horizontal and vertical layouts, min and max sizes, collapsible panels and keyboard-resizable separators) and `ScrollArea` (native scrolling with token-styled scrollbars, `auto` / `always` / `hover` visibility and fade edges). Drag and drop uses React Aria's built-in hooks; no new dependencies.
- 367d1b2: Add `Gantt` (application/gantt): a grouped Gantt chart with day, week and month zoom, a sticky sidebar with owner avatars, a synced date header, weekend shading, a today line, date markers, milestones, dependency arrows, and drag or keyboard move and resize (`onMove`, `onResize`). Add `CodeEditor` (application/code-editor): a dependency-free editable code area with syntax highlighting, line numbers, current-line highlight, Tab/Shift+Tab indentation, auto-indent, bracket auto-close, read-only mode, a toolbar slot with a copy button, and error and warning diagnostics. Press Escape, then Tab, to move focus out of the editor.
- 95470ee: Adds `withProperUI`, exported from `@properui/ui/next`, for the one line of `next.config.ts` every
  Next.js consumer of this package needs: `withProperUI(nextConfig)` appends `@properui/ui` to
  `transpilePackages`, deduplicated, preserving whatever else the config already sets.

    ```ts
    // next.config.ts
    import type { NextConfig } from "next";
    import { withProperUI } from "@properui/ui/next";

    const nextConfig: NextConfig = {};

    export default withProperUI(nextConfig);
    ```

    This does not remove the need for `transpilePackages` — Next.js still won't compile this package's
    TSX from `node_modules` without it — it's a shorter way to write it. The manual snippet keeps
    working unchanged.

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

- 37f0dc3: Replace the `motion` runtime with CSS transitions in the dual-tier and slim sidebar navigations'
  secondary panel (width/border-color, previously a Framer spring inside `AnimatePresence`). Visual
  behavior is unchanged; `motion` is no longer imported by `app-navigation`, so consumers of that
  registry entry no longer pull in the `motion` package. `file-upload` (drag physics in
  `draggable.tsx`, FLIP list-reorder animation in `file-upload-base.tsx`) still depends on `motion`
  for cases CSS genuinely can't express.

## 0.2.0

### Minor Changes

- 8d014f9: `RouterProvider` moves to its own subpath: `@properui/ui/providers/router-provider`.

    It imports `next/navigation`, and `next` is an optional peer. Re-exporting it from
    `@properui/ui/providers` and from the root barrel meant any bundler resolving either one
    without Next installed failed on a specifier it could not satisfy: Vite stubs the module and
    the build dies with `"useRouter" is not exported by "__vite-optional-peer-dep:next/navigation"`.
    That broke the Vite quick-start in the README, which tells Vite users to import `ThemeProvider`
    from `@properui/ui/providers`.

    Next.js projects update their import:

    ```diff
    -import { RouterProvider, ThemeProvider } from "@properui/ui/providers";
    +import { ThemeProvider } from "@properui/ui/providers";
    +import { RouterProvider } from "@properui/ui/providers/router-provider";
    ```

    Vite projects need no change and now build; they were already told to use React Aria's own
    `RouterProvider`.

- fcdd944: Adds `src/utils/jsdom-setup.ts` (`npx @properui/cli@latest add jsdom-setup`), a side-effect module that shims the six browser APIs React Aria Components needs and jsdom 25 doesn't implement: `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `Element.prototype.scrollIntoView`, the three `*PointerCapture` methods, and `HTMLElement.prototype.inert`. `packages/ui/vitest.setup.ts` now imports it, so this repo's own test suite dogfoods the shipped file; every existing shim keeps the same behavior as before.

    Adds executable jsdom recipes for the interaction patterns that were previously undocumented and silently broke under the standard `userEvent` recipe: opening a `Select` popover (`select-popover.test.tsx`), driving `Select.ComboBox` (`combobox-popover.test.tsx`), and targeting date-field segments plus driving a `usePress` component under fake timers (`date-picker-interaction.test.tsx`).

    Adds a new "Testing" docs page (`apps/docs/content/docs/testing.mdx`) covering the six shims, a per-component "how to open this in a test" table, the `Table` accessible-role note, the `isLoading`/`aria-disabled` distinction, accessible-name guidance for `Label`/`Select`/`Checkbox`, `onDropFiles` and jsdom's missing `DataTransfer`, a Playwright portalled-overlay note, and a shared-checkout warning about running `next build` alongside a sibling `next dev` server.

    No existing component source changed.

- fcdd944: Fixes and additive props across metrics, modals, notifications, pagination, table, file-upload,
  loading-indicator, progress-steps, alerts, app-navigation, and `CloseButton`, addressing item
  2.1, 2.4, 2.9, 2.12, 2.18, 2.19 and part of 2.5 from `docs/spec/feedback/2026-09-11-agent-feedback-map.md`.

    - **Metrics**: `change` is now optional on every metric card. `MetricChangeIndicator` only
      renders when `change` is a non-empty string, so a plain metric (no change to report) no longer
      shows an empty green pill.
    - **Modals**: `ModalHeader`'s close button now actually closes the dialog (it carries React
      Aria's default `slot="close"` again). Added `onClose` and `closeLabel` (default `"Close"`) to
      `ModalHeader`. `hasBackgroundPattern` now defaults to `true` only when an `icon` is given (was
      unconditionally `true`); pass it explicitly to opt in/out with a bare `media`. `ModalOverlay`'s
      doc comment now spells out that `isDismissable` covers pointer dismissal only and
      `isKeyboardDismissDisabled` covers Escape. Added a "confirm dialog" composition demo.
    - **Labels / i18n**: added override props with English defaults for every previously hardcoded
      user-visible string in the touched groups — `FileUploadDropZone` (`uploadLabel`,
      `uploadLabelMobileSuffix`, `dragAndDropLabel`), pagination (`previousLabel`, `nextLabel`,
      `pageLabel` format function, `aria-label` on `Pagination.Root`), and app-navigation
      (`MobileNavigationHeader`'s `labels` prop covering "Mobile navigation" / "Expand navigation
      menu" / "Close navigation menu" / "Navigation menu"; `SidebarNavigationSimple`'s `ariaLabel` /
      `searchLabel`; `SidebarNavigationSlim`'s `ariaLabel`). `Pagination`'s `PrevTrigger`/`NextTrigger`
      `asChild` clone no longer overwrites an `aria-label` when the child already has its own visible
      text or `aria-label`. `Notification`'s `closeLabel` and `CloseButton`'s `label` were already
      correct — verified, not forced to English.
    - **Sidebar/nav**: `SidebarNavigationSimple` gained `logo` (default `<ProperLogo>`) and `search`
      (`boolean | ReactNode`, default `true`) slots. `SidebarNavigationSlim` gained `logo` and
      `mobileLogo` slots. `NavItemBase` gained `className` (merged last) and `classNames` (`{ root?,
rootSelected? }`) to restyle the selected-row treatment without forking the component.
    - **Loading indicator**: added an `xs` (16px) size and an `inline` prop that lays the spinner and
      label out side by side instead of stacked. Documented that a spinner inside a `Button` should
      use the button's own `isLoading` prop instead.
    - **ProgressSteps**: added `onStepPress?(id)` (steps render as buttons when provided), a
      `"locked"` status (looks like `incomplete`, stays disabled even with `onStepPress`), and a
      per-step `children` slot. Default static rendering is unchanged.
    - **Cursor pagination**: added `PaginationCursor`, a `hasNext`/`hasPrevious` previous/next pair
      for unknown-total feeds — no "Page X of Y".
    - **Table**: documented (JSDoc + `tables.mdx`) that `Table` renders an ARIA `grid`
      (`getByRole('table')` will not match; use `getByRole('grid')`), the static-children usage
      contract (explicit `aria-label`, an `id` per `Row`, omit `selectionMode`), a visually-hidden
      column label recipe, and that `Table.Row`'s existing `href` support does not render a real
      `<a>`. Added "Static usage" and "Visually hidden column label" demos.
    - **Alerts**: documented (JSDoc + `alerts.mdx`) that `Alert` is an inline banner, not an alert
      dialog — compose `Modal` for a confirm dialog. `role` was already overridable via
      `HTMLAttributes` and is now called out explicitly.
    - Prefixed the two unused `event` parameters in `file-upload/draggable.tsx` with `_` for
      `noUnusedParameters`.

    No public export was renamed or removed; every change above is additive.

- fcdd944: Field API and accessible-name fixes from the agent feedback map (docs/spec/feedback/2026-09-11-agent-feedback-map.md
  items 2.17, 2.20, 2.22, and the JSDoc half of 2.11), batched across `input`, `select`, `checkbox`, `radio-buttons`,
  `badges`, `toggle`, `tags`, `buttons/button`, `date-picker`, `page-headers`, and `foundations/featured-icon`:

    - **Button.** Accepts a native `title` (applied via a ref, since React Aria's own `filterDOMProps` allowlist drops
      it); exports `LinkProps` alongside `ButtonProps`; widens `iconLeading`/`iconTrailing` from `FC<{className}>` to
      `ComponentType<{className}> | ReactNode`; documents the React Server Component icon form
      (`iconLeading={<Icon data-icon="leading" />}`).
    - **Input/TextField.** Passes through `min`/`max`/`step`; adds a `hintProps` escape hatch (e.g.
      `hintProps={{ role: "alert" }}`) and `prefix`/`suffix` slots; documents that `onChange` hands back a plain string.
    - **Label (2.20).** The required `*` indicator is omitted from the DOM entirely when `isRequired={false}` (previously
      only CSS-hidden, which doesn't apply in jsdom), so a non-required field's accessible name exactly matches its label
      text.
    - **Select (2.20).** The trigger's accessible name is now exactly the label, not React Aria's default
      "value, label" concatenation — fixed by giving the trigger an explicit `aria-labelledby` pointing at the label
      alone. Along the way, fixed a real bug this surfaced: `Label`'s tooltip button had no `slot`, so inside `Select`
      it silently absorbed the trigger's own `ButtonContext` (duplicate `id`, `aria-haspopup`, `aria-expanded`) — it now
      opts out with `slot={null}`.
    - **Checkbox (2.20).** The hint now renders outside the `<label>`, linked via `aria-describedby`, so the accessible
      name equals just the label instead of "label + hint".
    - **NativeSelect (2.17).** Honours a caller `id` (falls back to `useId`; label/select/hint ids are always distinct —
      fixed a latent id collision), accepts a `readonly` options array, and renders an optional `placeholder` as a
      disabled first option. Also applies each option's `disabled` flag, which was accepted but never used.
    - **Badge family + Tag (2.17).** `Badge`, `BadgeWithDot`, `BadgeWithIcon`, `BadgeWithFlag`, `BadgeWithImage`,
      `BadgeWithButton`, `BadgeIcon`, and `Tag` all spread unrecognized props onto their root element now, instead of
      silently dropping them.
    - **Toggle (2.17).** New `labelPosition?: "start" | "end"` (default `"end"`).
    - **DatePicker / DateRangePicker (2.17).** New `label`, `hint`, `tooltip`, `isRequired` props matching the other
      field components; documents that clearing every segment emits `null`, and that segment order comes from the
      ambient `I18nProvider` locale.
    - **ComboBox (2.17).** Exposes `menuTrigger` (defaults to the existing `"focus"` behavior) and `allowsEmptyCollection`
      as documented props; documents that RAC's own filter still applies unless `defaultFilter={() => true}` is passed.
    - **FeaturedIcon (2.17).** `icon` widened from `FC<{className}>` to `ComponentType<{className}> | ReactNode`.
    - **PageHeader (2.17).** New `gutter?: boolean` (default `true`); `gutter={false}` also disables the banner's
      edge-to-edge negative margin, since there's no longer a gutter to break out of.
    - **Dev-mode warnings (2.22).** New `utils/warn-dom-props.ts`: in development, warns once per component + prop when
      a native DOM prop name is used where React Aria expects its own (`onClick` -> `onPress`, `disabled` ->
      `isDisabled`, `checked` -> `isSelected`, `readOnly` -> `isReadOnly`, `required` -> `isRequired`); a no-op in
      production. Wired into `Button`, `Input`, `Checkbox`, `Toggle`, `RadioGroup`, `Select`.
    - **Testing pointers.** `Select` and `ComboBox` carry a JSDoc note that opening their popover in a jsdom test needs
      `fireEvent.click(trigger)` or `focus` + `ArrowDown` — `userEvent.click` alone toggles it shut.

    Skipped: `TextArea` is not owned by this change (not present under the owned globs), so the `onChange`-returns-a-string
    doc note and the dev-mode warning were not added there. `title` still does not reach the DOM on `Tag` specifically —
    React Aria's `useTag` hook filters it out at a lower layer than any prop we spread; `data-*`/`aria-*` do pass through.

- fcdd944: Adds six new primitives requested in the DrivenSellers feedback pass (docs/spec/feedback/2026-09-11-agent-feedback-map.md
  item 2.18, DrivenSellers §4): `Skeleton`/`SkeletonText` for loading placeholders, `DescriptionList` for term/details
  key-value content, a free-form `Popover` built on React Aria's `DialogTrigger`/`Popover`/`Dialog` that never binds its
  width to the trigger, `ConfirmDialog` (composed from the existing `modals` parts) for a controlled "are you sure?"
  prompt with an async `onConfirm` and a loading state, tone-tinted `Callout` for inline tips and notices, and a
  standalone `ToggleChip` built on React Aria's `ToggleButton`, colored from the badge palette.

    `Callout`'s `warning` and `success` tones fall back to the neutral `border-secondary` token: dedicated
    `border-warning`/`border-success` tokens do not exist in `theme.css` yet.

- fcdd944: Fixes the theming/token gaps from the agent feedback map (2.2 theme.css half, 2.14, 2.15) and
  DrivenSellers §3.2/§6:

    - `theme.css`'s dark-mode block now wins regardless of whether a consumer imports it before or
      after `@import "tailwindcss"`. Previously it was written as `.dark-mode { ... }` inside
      `@layer base`; Tailwind v4 only wraps `@theme`'s own output in a cascade layer when
      `theme.css` is imported _after_ `tailwindcss`, so an import in the other order left the light
      defaults unlayered and always winning over the layered dark override on cascade-layer terms
      alone, no matter the selector. The block is now unlayered too, with a boosted
      `:root.dark-mode, .dark-mode` selector, so it wins either way (verified by compiling both
      import orders with `@tailwindcss/postcss` and reading `getComputedStyle` in a browser).
    - Completes the `success`/`warning` token families to match the existing `error` ones:
      `--ring-color-{success,success_subtle,warning,warning_subtle}`, plus the matching
      `--border-color-*`/`--outline-color-*` pairs, in both light and dark mode. Adds a
      `--text-decoration-color-*` namespace (the theme key Tailwind's `decoration-*` utility
      actually resolves against, verified by compiling `decoration-brand` and comparing against a
      `--decoration-color-*` guess, which produced no rule at all) mirroring the text/border remaps,
      so `decoration-brand`, `decoration-error`, `decoration-success`, `decoration-warning`, etc. all
      resolve instead of silently inheriting `currentColor`.
    - Declares `--color-neutral-50…950` and the `red`/`green`/`yellow` steps the semantic layer
      consumes, at their current Tailwind default values, so "re-brand in one file" covers every
      color the system depends on rather than only the eleven `--color-brand-*` lines (values
      unchanged; verified by diffing every affected custom property's compiled value before and
      after). `--font-body`/`--font-display` are now commented as the sanctioned place to set a font
      stack.
    - Adds the `animate-in`/`animate-out`/`fade-in`/`fade-out`/`zoom-in-95`/`zoom-out-95`/
      `slide-in-from-*`/`slide-out-to-*` keyframes and utilities that `modal.tsx`, `dropdown.tsx` and
      `mobile-header.tsx` already use, as plain CSS in `theme.css`, so copy-in consumers who don't
      install `tailwindcss-animate` still get the enter/exit animations those components render with.
      `globals.css` keeps the plugin for the npm/monorepo path; verified the two don't conflict when
      both are present (Tailwind merges same-named utilities, and the declarations agree).
    - `ThemeProvider`'s JSDoc now documents its `next-themes` passthrough props (`defaultTheme`,
      `forcedTheme`, `enableSystem`, `storageKey`, `attribute`) and that `next-themes` has no Next.js
      dependency, so it works the same way in Vite/plain React. Adds
      `providers/theme-provider.test.tsx` (none existed before).
    - `theming.mdx` and `dark-mode.mdx` document all of the above: the declared ramps, the "one file"
      claim stated accurately, the new status token families and `decoration-*` namespace, the
      font-token home, import-order independence, and the `ThemeProvider` prop table.

    Not done: no `--color-blue-*`/etc. utility-color ramp was added (only the four the semantic layer
    itself consumes — neutral/red/green/yellow); the CLI's `init` template is unaffected by this
    change (see 2.13/2.14 for that side).

### Patch Changes

- 2ba0269: Internal imports under `packages/ui/src` no longer use the `@/...` alias: every specifier is now a
  plain relative import (`./cx`, `../../utils/cx`, etc.), converted mechanically across 1,017 files /
  4,650 specifiers.

    `@/*` resolved only through this workspace's own `tsconfig.json` `paths`, so it never worked for an
    external consumer: a scratch Vite app built from a packed tarball failed with `Rolldown failed to
resolve import "@/utils/cx"`, and a Next.js consumer with `transpilePackages` failed its
    type-check step on `Cannot find module '@/utils/cx'`. Neither environment has this workspace's
    tsconfig, so the alias was unresolvable outside this monorepo.

    No consumer-facing import path changes: this only affects imports _within_ the package's own
    source, not the public subpath/barrel exports. `npm pack` into a scratch Vite app now builds
    importing both a subpath (`@properui/ui/components/base/checkbox/checkbox`) and the root barrel
    (`@properui/ui`). Next.js with `transpilePackages` set now compiles and type-checks instead of
    failing on the missing module: `transpilePackages` itself is still required (Next does not
    transpile TSX from `node_modules` by default), it just actually works now.

    The component registry (what `properui add` copies into a consuming project) is unaffected: an
    entry's own files still ship `@/...` for any import that crosses from `components/**` into
    `utils/**`/`hooks/**` (the one case where the CLI's `--path <dir>` relocation actually changes the
    relative distance between two files), so `properui add`'s alias rewrite keeps working exactly as
    before. `pnpm test:clean-room` (Vite + Next.js copy-in, end to end) passes.

    `packages/ui/tsconfig.json`'s `@/*` path entry and `apps/docs/tsconfig.json`'s `@/*` entry
    (pointing at `packages/ui/src`) are removed. Neither is referenced by any remaining import.

- fcdd944: Removes the internal `DemoNativeSelect` duplicate. It existed as a placeholder until `NativeSelect`
  was ported; the eight demo call sites now use `NativeSelect` from `base/select/select-native`.
  `DemoNativeSelect` was never documented as public API.
