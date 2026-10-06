---
name: properui
description: Use when building or editing UI screens, pages, forms, or components in a project that uses (or could use) Proper UI (@properui/ui). Use it before writing any new JSX/TSX markup by hand. Covers checking the registry for an existing component or full-page example, inspecting the project's Proper UI setup, installing with the CLI instead of hand-copying source, and the accessibility/token/RTL rules the installed code must keep. Trigger on "build a settings page", "add a form", "make a dashboard", "add a button/modal/table", or any request to create or modify UI in a React/Next.js/Vite project.
license: MIT
---

# Proper UI

Proper UI (`@properui/ui`) is a registry of React Aria + Tailwind v4 components distributed as
source, not a runtime package you import blindly. The `properui` CLI copies the files you ask for
into the project and rewrites their imports to fit. Follow these steps, in order, every time UI work
comes up.

If the Proper UI MCP server (`@properui/mcp`) is connected, prefer its tools to the shell commands
below: `get_project_info` is `info --json`, `search_components` and `list_components` are `search`
and `list`, `get_component` and `get_component_docs` return the real source and docs page,
`add_component` is `add`, and `check_tokens` is `check`. Without it, use the CLI exactly as shown. The last
section, "Using the Proper UI MCP", says which tool answers which question.

## 1. Inspect the project first

Before adding or writing anything, run:

```bash
npx @properui/cli@latest info --json
```

This reports whether the project is already set up (framework, Tailwind version, `components.json`
aliases, theme CSS path, which registry entries are already installed, and the installed
`@properui/ui` / `properui` versions). `info` always probes the registry, whether or not
`components.json` exists yet, so `registryReachable` reflects a live network check rather than a
side effect of the project being unconfigured. Read the output before deciding anything else:

- No `components.json` → `info --json` still reports the detected framework, the Tailwind version,
  and a real `registryReachable`, just with no aliases and nothing installed. That is the expected
  shape of a fresh project, not a broken one. Run `npx @properui/cli@latest init -y` next. Do not
  hand-write `components.json`, `utils/cx.ts`, the theme token file, or the `ThemeProvider` wiring.
  `init` generates all of it correctly for the detected framework.
- `components.json` exists → note the `aliases.components` value (often `@/components`, sometimes a
  project-specific prefix) and use it for every import you write by hand.
- Tailwind is not v4 → `init` will refuse and print an upgrade path. Do not attempt to work around
  this by writing v3-style config.

### Non-React projects

`info --json` also reports `platform`: `react` for React, Next.js, Vite React and Remix, `html` for
Vue, Nuxt, Angular, Svelte, SvelteKit, Astro and plain HTML. On `html`, `init` writes
`"platform": "html"` into `components.json` and wires `@properui/tokens` + `@properui/html` (or prints
the CDN `<link>`/`<script>` lines when there is no Tailwind v4 stylesheet), and `add <name>` installs
the `<name>-html` snippets (plain HTML on the `pui-` classes) instead of TSX; it refuses React-only
entries and names the HTML alternative when there is one (`list --platform html` shows what exists).
In Vue, Angular and Svelte templates, prefer the `@properui/elements` custom elements
(`<pui-button>`, `<pui-modal>`) over pasted markup. Never write TSX or React Aria code into a Vue,
Angular, Svelte or Astro project; the React rules in step 5 apply to React projects only, while the
token, no-`dark:` and logical-property rules apply everywhere.

## 2. Search before creating

Never write a component's markup from memory or invent your own version of something the registry
already has. Check first:

```bash
npx @properui/cli@latest search "<what you need>"     # fuzzy match over names, titles, examples
npx @properui/cli@latest list --layer base             # browse by layer: base, application, marketing
npx @properui/cli@latest list --type example            # full-page examples specifically
```

`search` prints "no match" plainly when nothing scores, but it's still a local fuzzy match over
names and titles, not the registry itself: a component that exists under a different word can still
come up empty. Treat "no match" as a lead, not a verdict, and confirm against the registry directly
before concluding a component doesn't exist:

```bash
curl <registry>/index.json     # e.g. https://properui.dev/r/index.json, the authoritative check
```

Only write custom markup once both come up empty. If it does, still build the custom piece out of
already-installed primitives and the same semantic tokens (below) rather than one-off styling.

## 3. Brownfield vs greenfield: examples are not always the install target

- **For a screen that already exists**, read the example and install the primitives. Search
  `list --type example` / `search` for the closest full-page example, but treat it as reference, not
  a file to drop in: it's a complete, opinionated page with its own shell, its own copy and its own
  layout chrome, while the real screen already has routing, data wiring and non-placeholder content
  you'd otherwise delete most of the file to recover. Pull the primitives it composes
  (`add <name>` for each) and follow the layout pattern it demonstrates, then rebuild the screen's
  markup around the project's existing wiring using those pieces and the same semantic tokens.
- **`add example` is for a screen created from nothing**: a new route, a fresh prototype, an empty
  file with no existing layout to preserve. Install it and adapt copy and data to the request; don't
  rebuild the layout from primitives when an example already covers it.

```bash
npx @properui/cli@latest add example settings-01     # greenfield: install and adapt
npx @properui/cli@latest add button input select     # brownfield: primitives only, read the example
```

`add` resolves `registryDependencies` recursively (installing a component's own component
dependencies) and rewrites the library's internal `@/` imports to the project's configured alias. A
second `add` of the same name is a no-op unless you pass `--overwrite`; never pass `--overwrite` on
top of a file a human has since edited without checking `diff` first:

```bash
npx @properui/cli@latest diff <name>     # see local modifications before overwriting
```

## 4. Never mix component systems

Once a screen uses Proper UI components, keep using Proper UI components for the rest of that
screen. Don't drop in a different UI library's `<Button>` or a hand-rolled equivalent alongside
installed ones. If the project already has another design system in place, ask before introducing
Proper UI into it rather than mixing the two silently.

## 5. Write code that matches the installed conventions

Every file `add` copies in already follows these rules. Any markup you write by hand (glue code, a
page shell, a piece the registry doesn't have) must follow them too:

- **React Aria props, not DOM props.** `onPress` not `onClick`, `isDisabled` not `disabled`,
  `isSelected` not `checked`, `isReadOnly` not `readOnly`, `isRequired` not `required`. These
  components wrap React Aria Components; a DOM prop is silently ignored. One exception:
  `NativeSelect` is a real `<select>` under the hood, so it honours a caller's `id` directly.
- **Semantic tokens only, never a literal.** `bg-primary`, `text-tertiary`, `border-secondary`,
  `bg-brand-solid`. Never a raw palette class (`bg-purple-600`) and never an arbitrary value
  (`bg-[#7f56d9]`, `p-[13px]`). Typography is tokenised the same way: `text-display-lg`, `text-md`,
  not `text-4xl`. The full token set lives in the project's theme CSS file (path reported by
  `info --json`).
- **No `dark:` utilities.** A `.dark-mode` class on an ancestor repoints every semantic token, so a
  component written against tokens is already correct in both themes. A `dark:` utility is a bug,
  not a stylistic choice.
- **Logical properties for anything directional**, so `dir="rtl"` keeps working: `ms-*`/`me-*` not
  `ml-*`/`mr-*`, `ps-*`/`pe-*` not `pl-*`/`pr-*`, `start-*`/`end-*` not `left-*`/`right-*`,
  `text-start` not `text-left`.
- **Icons as component references, except inside React Server Components.**
  `<Button iconLeading={ArrowRight}>`, not `<Button iconLeading={<ArrowRight />}>`, is the default:
  the component applies its own sizing and the `data-icon` attribute its styles target. Inside a true
  server component (a file with no `"use client"` that renders `Button` directly, not through a
  client wrapper), a bare component reference can't cross the server/client boundary and the build
  fails, sometimes with an error that names an unrelated page. Use the element form there instead,
  and set `data-icon` yourself since the wrapper never runs: `<Button iconTrailing={<ArrowRight
data-icon="trailing" />}>` (`data-icon="leading"` for `iconLeading`).
- **Import from the component's subpath**, e.g. `@properui/ui/components/base/buttons/button`, so
  bundlers keep only what's used, never a barrel import of the whole library for one component.
- **Preserve what's already there.** Keyboard interaction, focus order, ARIA attributes, and
  responsive breakpoints on installed components are load-bearing. When adapting a copied file,
  change content and composition, not the underlying interaction or accessibility behavior, and
  don't remove a responsive class because a screenshot at one width looked fine without it.

## 6. Verify after installing or editing

Before reporting the work as done, run whatever subset of these the project defines (check
`package.json` scripts (names vary by project, but the checks are the same ones the registry's own
CI runs):

1. Type-check (`tsc --noEmit` or the project's `type-check`/`typecheck` script).
2. Build (`next build`, `vite build`, or the project's `build` script), which catches broken imports
   from alias rewriting and the server-component icon issue above.
3. Targeted tests for anything touched, if the project has a test runner configured.
4. `npx @properui/cli@latest check`, the token guard: flags raw palette classes and arbitrary
   values that slipped past the semantic-token convention in step 5.

If a check fails because of something `add` did (a missing dependency it reported but that wasn't
installed, for example), fix that before moving on. Don't report success with a broken build.

If you're working in a checkout shared with other running processes (another agent's dev server
against the same `.next`/`node_modules`, for instance), run the build check last, not mid-task: a
`next build` (or `vite build`) in a shared checkout takes down every sibling `dev` server pointed at
the same directory.

## 7. Report what happened

End every piece of UI work with a short, concrete summary:

- **Files added**: which components/examples were installed, and where (respecting `--path` or the
  project's configured alias directory).
- **Entries reused**: anything `info --json` or `diff` showed was already installed and left alone.
- **Checks run**: which of type-check / build / tests were run, and whether they passed.

This is what lets a human (or the next session) trust the change without re-deriving it.

## Using the Proper UI MCP

Connect it once, either remote (`https://properui.dev/api/mcp`, nothing to install) or local
(`npx -y @properui/mcp`, runs in the project). The product page is https://properui.dev/mcp. Pick
the tool by the question you are asking:

- **A component** ("is there a date picker, and how is it used?"): `search_components`, then
  `get_component` for the source and `get_component_docs` for the docs page.
- **A screen** ("a billing settings page"): `search_screens`. Full-page examples are references, see
  step 3.
- **A flow** ("sign up, then onboarding"): `search_flows`. Each step is a screen with the purpose of
  that step.
- **A section** ("a pricing block", "a footer"): `search_sections`.
- **Two or more candidates**: `compare_screens` shows the components and tokens they share and the
  ones only one of them uses.
- **What an install would do**: `get_install_plan` lists the files, npm packages and the exact CLI
  command, and writes nothing.
- **Installing**: `add_component` over the local server; over the remote one, run the CLI command
  from `get_install_plan`.

How to use the results:

- Search results are starting points, not decisions. Ask for several, compare them, then inspect
  the one you are likely to use. "No match" means try the job rather than the name, not that
  nothing exists.
- Thumbnails are images served by the docs site (`https://properui.dev/thumbs/...`). Look at them
  when the client can show images. They show the example, not your project.
- The remote endpoint cannot see the project, so `add_component`, `get_project_info` and
  `check_tokens` are not available there. Install through the CLI and run `info --json` yourself.
  Over the local server, call `get_project_info` before `add_component`.
- Steps 1 and 3 to 6 above apply whichever route installs the files: reference vs install target,
  one component system per screen, the conventions in step 5, and the checks in step 6.
