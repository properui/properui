# AGENTS.md

Conventions for an AI assistant working in this repository. Same file Codex reads; Claude Code reads it too.

If you are consuming Proper UI in **another** project rather than developing the library itself, you only need the
four surfaces under "Fetching components" below.

## Fetching components

Do not write a Proper UI component from memory. Fetch it.

```bash
curl https://properui.dev/llms.txt          # index of every docs page, as plain markdown
curl https://properui.dev/r/index.json      # every registry entry: name, layer, type, dependencies
curl https://properui.dev/r/buttons.json    # one entry, including its real source
npx @properui/cli@latest add buttons date-picker # write the files, report what to install
npx @properui/cli@latest info --json             # this project's setup: framework, platform, aliases, installed entries
npx @properui/cli@latest list --platform html    # the html entries (<component>-html) for non-React projects
npx @properui/cli@latest agent init              # install the Proper UI Skill for Claude, Codex, Cursor and Lovable
npx skills add properui/properui                 # the same Skill through skills.sh, which reaches 75+ agents
npx -y @properui/mcp                             # MCP server over stdio: the same registry and add, as tools
claude mcp add --transport http properui https://properui.dev/api/mcp   # remote MCP endpoint, no account (https://properui.dev/mcp)
```

`add` resolves `registryDependencies`, rewrites `@/` imports to the alias in `components.json`, and reports the missing
npm packages an install needs; pass `--install` to have it run that install itself instead of just printing the
command. `init` behaves the same way: it never installs on its own unless you pass `--install`, and either way prints
the install command last, after every file it wrote. Prefer `add` over hand-copying source out of a registry payload.
`info --json` is what to run before deciding anything: it always probes the registry, so `registryReachable` reflects
a live check, and it reports whether `components.json` exists yet and what's already installed. `remove` and `why`
cover the other direction: `remove <name>` deletes an installed entry (and warns if something else still depends on
it), `why <name>` prints what pulled it in. `check` is a token guard: it flags raw palette classes and arbitrary
values that should have been semantic tokens. `agent init` writes the portable Skill (`skills/properui/SKILL.md`)
into `.claude/skills/`, `.agents/skills/`, or `.cursor/rules/`, so every session after the first one gets this
guidance automatically instead of relying on this file alone. It also registers the MCP server (`@properui/mcp`) in
`.mcp.json` and `.cursor/mcp.json`; when an assistant has those tools (`search_components`, `get_component`,
`add_component`, ...) connected, prefer them to shelling out to the CLI. The same server is also hosted at
`https://properui.dev/api/mcp` (Streamable HTTP, stateless, no account). It has no access to a project, so it offers the
search and plan tools (`search_screens`, `search_sections`, `search_flows`, `compare_screens`, `get_install_plan`) but
not `add_component`; over HTTP, take the command from `get_install_plan` and run the CLI. The product page is
`https://properui.dev/mcp`.

`info --json` also reports `platform`. `react` (Next.js, Vite React, Remix, React) gets the TSX components. `html`
(Vue, Nuxt, Angular, Svelte, SvelteKit, Astro, plain HTML, or `init --platform html`) makes `init` wire
`@properui/tokens` + `@properui/html` instead of the React files, and makes `add <name>` install the `<name>-html`
snippet entry; a React-only entry is refused with the HTML alternative named. See `docs/frameworks.md`.

## Writing component code

- **Check the platform first.** On an html-platform project (`info --json` → `"platform": "html"`), write HTML on the
  `pui-` classes from `@properui/html`, or `@properui/elements` tags (`<pui-button>`, `<pui-modal>`) in Vue, Angular,
  Svelte and Astro templates. Never write TSX or React Aria code into those projects. The React rules below apply to
  React projects; the token, no-`dark:` and logical-property rules apply everywhere.
- **React Aria props, not DOM props.** `onPress` not `onClick`, `isDisabled` not `disabled`, `isSelected` not
  `checked`, `isReadOnly` not `readOnly`, `isRequired` not `required`. Interactive components wrap React Aria
  Components; the DOM prop is silently ignored, except `id` on `NativeSelect`, which is a real `<select>` and honours
  it directly. Dev-mode warnings cover the common aliases, but they warn, they don't fail the build; only a
  DOM-vs-Aria prop mismatch that TypeScript can see (a prop name that doesn't exist on the type) is a compile error.
- **Semantic tokens only.** `bg-primary`, `text-tertiary`, `border-secondary`, `bg-brand-solid`. Never a raw palette
  class (`bg-purple-600`), never an arbitrary value (`bg-[#7f56d9]`, `p-[13px]`). The full set is in
  `packages/ui/src/styles/theme.css`.
- **No `dark:` utilities.** A `.dark-mode` class on an ancestor repoints every token. A component written against
  semantic tokens is already correct in both themes; a `dark:` utility is a bug.
- **Logical properties for anything directional.** `ms-*`/`me-*` not `ml-*`/`mr-*`, `ps-*`/`pe-*` not `pl-*`/`pr-*`,
  `start-*`/`end-*` not `left-*`/`right-*`, `text-start` not `text-left`. This is what makes `dir="rtl"` work.
- **Typography is tokenised too.** `text-display-lg`, `text-md`, not `text-4xl`.
- **Icons as component references, except inside React Server Components.**
  `<Button iconLeading={ArrowRight}>`, not `<Button iconLeading={<ArrowRight />}>`, is the default: the component
  applies sizing and the `data-icon` attribute that its own styles target. A bare component reference can't cross the
  server/client boundary, so a true server component (no `"use client"`) rendering `Button` directly must use the
  element form instead, setting `data-icon` itself since the wrapper never runs:
  `<Button iconTrailing={<ArrowRight data-icon="trailing" />}>`.
- **Import from the subpath** so bundlers keep only what is used:
  `@properui/ui/components/base/buttons/button`.

## Repository conventions

These apply when changing the library itself.

- kebab-case file names; one component group per folder under `packages/ui/src/components/<layer>/`.
- React Aria imports are aliased `Aria*` (`import { Button as AriaButton } from "react-aria-components"`).
- Class lists go through `styles = sortCx({})` from `@properui/ui/utils/cx`.
- Anything a server component may render needs `"use client"` when it exports a function or a compound-component object,
  since those cannot cross the RSC boundary.
- Every component ships a demo, a story, a test and a docs page. The test asserts zero axe violations.
- Generated files (barrels, demos, variants, nav, registry) come from `pnpm gen:all`. Edit the generator, not the output.

## Checks

Run these before claiming a change is done. They are what CI runs.

```bash
pnpm type-check     # tsc --noEmit across the workspace
pnpm lint
pnpm prettier:check
pnpm test           # vitest + axe
pnpm build
```

`pnpm test` builds the CLI first via `packages/cli/turbo.json`; a bare `vitest` in `packages/cli` will fail without it.

## Things that are not true

Do not document or generate code against these, because they do not exist:

- `properui upgrade` / `properui migrate`. The commands are `init`, `create`, `add`, `remove`, `why`, `check`, `icons`,
  `list`, `search`, `diff`, `login`, `info`, `theme` and `agent init`.
- A browser OAuth flow for `login`. It takes `--token`, or prompts you to paste one.
- MCP tools beyond the twelve `@properui/mcp` ships: `list_components`, `search_components`, `search_screens`,
  `search_sections`, `search_flows`, `compare_screens`, `get_component`, `get_component_docs`, `get_install_plan`,
  `add_component`, `get_project_info` and `check_tokens`. The remote endpoint omits the last three, which need a project
  on disk. There is no `init` tool: run `npx @properui/cli@latest init` for that.
- Vue, Angular or Svelte ports of the React components. Non-React projects get `@properui/tokens`, the
  `@properui/html` classes and snippets, and the `@properui/elements` custom elements, which cover a curated subset
  (about twenty components, listed in `docs/frameworks.md`), not the whole React library.
- A paid or PRO tier. Everything in this repository is MIT licensed.
