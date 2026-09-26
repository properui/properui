/**
 * Per-client file templates for `properui agent init`.
 *
 * The Skill content itself (SKILL_MD) is generated from the single authored source at
 * skills/properui/SKILL.md in this repo. The published CLI package does not ship the
 * monorepo's skills/ directory, so tsup cannot follow a runtime read at bundle time — this
 * constant is a literal embed of that file's contents, kept byte-for-byte identical.
 *
 * TO REGENERATE after editing skills/properui/SKILL.md, run from the repo root:
 *
 *   node -e "const fs=require('node:fs');console.log(JSON.stringify(fs.readFileSync('skills/properui/SKILL.md','utf8')))"
 *
 * and replace the SKILL_MD string literal below with the output. (A build-time codegen step
 * that does this automatically is worth adding once there is a prebuild hook in this
 * package's tsup config; inlining keeps `tsup src/index.ts` a single-entry-point bundle today.)
 *
 * Spec: docs/spec/strategy/2026-09-plan.md §3 P1.1–P1.2.
 */

/** The canonical Skill, byte-for-byte identical to skills/properui/SKILL.md in this repo. */
export const SKILL_MD: string =
    "---\nname: properui\ndescription: Use when building or editing UI screens, pages, forms, or components in a project that uses (or could use) Proper UI (@properui/ui). Use it before writing any new JSX/TSX markup by hand. Covers checking the registry for an existing component or full-page example, inspecting the project's Proper UI setup, installing with the CLI instead of hand-copying source, and the accessibility/token/RTL rules the installed code must keep. Trigger on \"build a settings page\", \"add a form\", \"make a dashboard\", \"add a button/modal/table\", or any request to create or modify UI in a React/Next.js/Vite project.\nlicense: MIT\n---\n\n# Proper UI\n\nProper UI (`@properui/ui`) is a registry of React Aria + Tailwind v4 components distributed as\nsource, not a runtime package you import blindly. The `properui` CLI copies the files you ask for\ninto the project and rewrites their imports to fit. Follow these steps, in order, every time UI work\ncomes up.\n\nIf the Proper UI MCP server (`@properui/mcp`) is connected, prefer its tools to the shell commands\nbelow: `get_project_info` is `info --json`, `search_components` and `list_components` are `search`\nand `list`, `get_component` and `get_component_docs` return the real source and docs page,\n`add_component` is `add`, and `check_tokens` is `check`. Without it, use the CLI exactly as shown.\n\n## 1. Inspect the project first\n\nBefore adding or writing anything, run:\n\n```bash\nnpx @properui/cli@latest info --json\n```\n\nThis reports whether the project is already set up (framework, Tailwind version, `components.json`\naliases, theme CSS path, which registry entries are already installed, and the installed\n`@properui/ui` / `properui` versions). `info` always probes the registry, whether or not\n`components.json` exists yet, so `registryReachable` reflects a live network check rather than a\nside effect of the project being unconfigured. Read the output before deciding anything else:\n\n- No `components.json` → `info --json` still reports the detected framework, the Tailwind version,\n  and a real `registryReachable`, just with no aliases and nothing installed. That is the expected\n  shape of a fresh project, not a broken one. Run `npx @properui/cli@latest init -y` next. Do not\n  hand-write `components.json`, `utils/cx.ts`, the theme token file, or the `ThemeProvider` wiring.\n  `init` generates all of it correctly for the detected framework.\n- `components.json` exists → note the `aliases.components` value (often `@/components`, sometimes a\n  project-specific prefix) and use it for every import you write by hand.\n- Tailwind is not v4 → `init` will refuse and print an upgrade path. Do not attempt to work around\n  this by writing v3-style config.\n\n### Non-React projects\n\n`info --json` also reports `platform`: `react` for React, Next.js, Vite React and Remix, `html` for\nVue, Nuxt, Angular, Svelte, SvelteKit, Astro and plain HTML. On `html`, `init` writes\n`\"platform\": \"html\"` into `components.json` and wires `@properui/tokens` + `@properui/html` (or prints\nthe CDN `<link>`/`<script>` lines when there is no Tailwind v4 stylesheet), and `add <name>` installs\nthe `<name>-html` snippets (plain HTML on the `pui-` classes) instead of TSX; it refuses React-only\nentries and names the HTML alternative when there is one (`list --platform html` shows what exists).\nIn Vue, Angular and Svelte templates, prefer the `@properui/elements` custom elements\n(`<pui-button>`, `<pui-modal>`) over pasted markup. Never write TSX or React Aria code into a Vue,\nAngular, Svelte or Astro project; the React rules in step 5 apply to React projects only, while the\ntoken, no-`dark:` and logical-property rules apply everywhere.\n\n## 2. Search before creating\n\nNever write a component's markup from memory or invent your own version of something the registry\nalready has. Check first:\n\n```bash\nnpx @properui/cli@latest search \"<what you need>\"     # fuzzy match over names, titles, examples\nnpx @properui/cli@latest list --layer base             # browse by layer: base, application, marketing\nnpx @properui/cli@latest list --type example            # full-page examples specifically\n```\n\n`search` prints \"no match\" plainly when nothing scores, but it's still a local fuzzy match over\nnames and titles, not the registry itself: a component that exists under a different word can still\ncome up empty. Treat \"no match\" as a lead, not a verdict, and confirm against the registry directly\nbefore concluding a component doesn't exist:\n\n```bash\ncurl <registry>/index.json     # e.g. https://properui.dev/r/index.json, the authoritative check\n```\n\nOnly write custom markup once both come up empty. If it does, still build the custom piece out of\nalready-installed primitives and the same semantic tokens (below) rather than one-off styling.\n\n## 3. Brownfield vs greenfield: examples are not always the install target\n\n- **For a screen that already exists**, read the example and install the primitives. Search\n  `list --type example` / `search` for the closest full-page example, but treat it as reference, not\n  a file to drop in: it's a complete, opinionated page with its own shell, its own copy and its own\n  layout chrome, while the real screen already has routing, data wiring and non-placeholder content\n  you'd otherwise delete most of the file to recover. Pull the primitives it composes\n  (`add <name>` for each) and follow the layout pattern it demonstrates, then rebuild the screen's\n  markup around the project's existing wiring using those pieces and the same semantic tokens.\n- **`add example` is for a screen created from nothing**: a new route, a fresh prototype, an empty\n  file with no existing layout to preserve. Install it and adapt copy and data to the request; don't\n  rebuild the layout from primitives when an example already covers it.\n\n```bash\nnpx @properui/cli@latest add example settings-01     # greenfield: install and adapt\nnpx @properui/cli@latest add button input select     # brownfield: primitives only, read the example\n```\n\n`add` resolves `registryDependencies` recursively (installing a component's own component\ndependencies) and rewrites the library's internal `@/` imports to the project's configured alias. A\nsecond `add` of the same name is a no-op unless you pass `--overwrite`; never pass `--overwrite` on\ntop of a file a human has since edited without checking `diff` first:\n\n```bash\nnpx @properui/cli@latest diff <name>     # see local modifications before overwriting\n```\n\n## 4. Never mix component systems\n\nOnce a screen uses Proper UI components, keep using Proper UI components for the rest of that\nscreen. Don't drop in a different UI library's `<Button>` or a hand-rolled equivalent alongside\ninstalled ones. If the project already has another design system in place, ask before introducing\nProper UI into it rather than mixing the two silently.\n\n## 5. Write code that matches the installed conventions\n\nEvery file `add` copies in already follows these rules. Any markup you write by hand (glue code, a\npage shell, a piece the registry doesn't have) must follow them too:\n\n- **React Aria props, not DOM props.** `onPress` not `onClick`, `isDisabled` not `disabled`,\n  `isSelected` not `checked`, `isReadOnly` not `readOnly`, `isRequired` not `required`. These\n  components wrap React Aria Components; a DOM prop is silently ignored. One exception:\n  `NativeSelect` is a real `<select>` under the hood, so it honours a caller's `id` directly.\n- **Semantic tokens only, never a literal.** `bg-primary`, `text-tertiary`, `border-secondary`,\n  `bg-brand-solid`. Never a raw palette class (`bg-purple-600`) and never an arbitrary value\n  (`bg-[#7f56d9]`, `p-[13px]`). Typography is tokenised the same way: `text-display-lg`, `text-md`,\n  not `text-4xl`. The full token set lives in the project's theme CSS file (path reported by\n  `info --json`).\n- **No `dark:` utilities.** A `.dark-mode` class on an ancestor repoints every semantic token, so a\n  component written against tokens is already correct in both themes. A `dark:` utility is a bug,\n  not a stylistic choice.\n- **Logical properties for anything directional**, so `dir=\"rtl\"` keeps working: `ms-*`/`me-*` not\n  `ml-*`/`mr-*`, `ps-*`/`pe-*` not `pl-*`/`pr-*`, `start-*`/`end-*` not `left-*`/`right-*`,\n  `text-start` not `text-left`.\n- **Icons as component references, except inside React Server Components.**\n  `<Button iconLeading={ArrowRight}>`, not `<Button iconLeading={<ArrowRight />}>`, is the default:\n  the component applies its own sizing and the `data-icon` attribute its styles target. Inside a true\n  server component (a file with no `\"use client\"` that renders `Button` directly, not through a\n  client wrapper), a bare component reference can't cross the server/client boundary and the build\n  fails, sometimes with an error that names an unrelated page. Use the element form there instead,\n  and set `data-icon` yourself since the wrapper never runs: `<Button iconTrailing={<ArrowRight\ndata-icon=\"trailing\" />}>` (`data-icon=\"leading\"` for `iconLeading`).\n- **Import from the component's subpath**, e.g. `@properui/ui/components/base/buttons/button`, so\n  bundlers keep only what's used, never a barrel import of the whole library for one component.\n- **Preserve what's already there.** Keyboard interaction, focus order, ARIA attributes, and\n  responsive breakpoints on installed components are load-bearing. When adapting a copied file,\n  change content and composition, not the underlying interaction or accessibility behavior, and\n  don't remove a responsive class because a screenshot at one width looked fine without it.\n\n## 6. Verify after installing or editing\n\nBefore reporting the work as done, run whatever subset of these the project defines (check\n`package.json` scripts (names vary by project, but the checks are the same ones the registry's own\nCI runs):\n\n1. Type-check (`tsc --noEmit` or the project's `type-check`/`typecheck` script).\n2. Build (`next build`, `vite build`, or the project's `build` script), which catches broken imports\n   from alias rewriting and the server-component icon issue above.\n3. Targeted tests for anything touched, if the project has a test runner configured.\n4. `npx @properui/cli@latest check`, the token guard: flags raw palette classes and arbitrary\n   values that slipped past the semantic-token convention in step 5.\n\nIf a check fails because of something `add` did (a missing dependency it reported but that wasn't\ninstalled, for example), fix that before moving on. Don't report success with a broken build.\n\nIf you're working in a checkout shared with other running processes (another agent's dev server\nagainst the same `.next`/`node_modules`, for instance), run the build check last, not mid-task: a\n`next build` (or `vite build`) in a shared checkout takes down every sibling `dev` server pointed at\nthe same directory.\n\n## 7. Report what happened\n\nEnd every piece of UI work with a short, concrete summary:\n\n- **Files added**: which components/examples were installed, and where (respecting `--path` or the\n  project's configured alias directory).\n- **Entries reused**: anything `info --json` or `diff` showed was already installed and left alone.\n- **Checks run**: which of type-check / build / tests were run, and whether they passed.\n\nThis is what lets a human (or the next session) trust the change without re-deriving it.\n";

const markerStart = (id: string) => `<!-- properui:${id}:start -->`;
const markerEnd = (id: string) => `<!-- properui:${id}:end -->`;

/**
 * Inserts `block` into `existing` between a pair of HTML-comment markers, replacing a previous
 * insertion if one is already there. Used for every append-only edit `agent init` makes to a
 * project's own CLAUDE.md / AGENTS.md, so it never clobbers the rest of the file and re-running
 * the command is idempotent.
 */
export function upsertMarkedBlock(existing: string, id: string, block: string): string {
    const start = markerStart(id);
    const end = markerEnd(id);
    const section = `${start}
${block.trim()}
${end}`;
    const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);

    if (pattern.test(existing)) return existing.replace(pattern, section);
    const separator =
        existing.trim().length > 0
            ? `${existing.replace(/\s+$/, "")}

`
            : "";
    return `${separator}${section}
`;
}

/** Short pointer appended to a project's CLAUDE.md — the Skill file itself carries the detail. */
export const CLAUDE_MD_BLOCK = `## Proper UI

This project has the Proper UI skill installed at \`.claude/skills/properui/SKILL.md\`. Claude
Code loads it automatically for UI work. Before writing new UI markup by hand: run
\`npx @properui/cli@latest info --json\`, search the registry with \`npx @properui/cli@latest search\`,
and prefer \`npx @properui/cli@latest add\` (or \`add example <name>\` for a whole screen) over
hand-rolling markup the registry already has.`;

/** Rules block appended to a project's AGENTS.md for Codex. */
export const AGENTS_MD_BLOCK = `## Proper UI

This project uses Proper UI (\`@properui/ui\`). Follow \`.agents/skills/properui/SKILL.md\`
for the full workflow before writing any new UI markup. In short:

1. Run \`npx @properui/cli@latest info --json\` to see what is already configured and installed.
2. Search the registry (\`npx @properui/cli@latest search "<what you need>"\`) before writing markup
   by hand: prefer \`add example <name>\` for a whole screen, \`add <name>\` for one component.
3. Keep semantic tokens (\`bg-primary\`, \`text-tertiary\`, ...), React Aria props (\`onPress\`,
   \`isDisabled\`), and logical properties (\`ms-*\`/\`me-*\`, \`start-*\`/\`end-*\`) in anything
   you write yourself. Never a raw palette class, an arbitrary value, or a \`dark:\` utility.
4. Run type-check and build after installing or editing components before calling the work done.
5. If \`info --json\` reports \`"platform": "html"\` (Vue, Angular, Svelte, Astro, plain HTML), \`add\`
   installs HTML snippets and \`@properui/elements\` provides \`<pui-*>\` tags: never write TSX there.`;

/** `.cursor/rules/properui.mdc` — Cursor only reads `.mdc` files with frontmatter, never SKILL.md. */
export const CURSOR_RULE_MDC = `---
alwaysApply: true
---

# Proper UI

This project uses Proper UI (\`@properui/ui\`). Before writing any new UI markup:

- Run \`npx @properui/cli@latest info --json\` to see the project's Proper UI setup and what is
  already installed.
- Run \`npx @properui/cli@latest search "<what you need>"\` to check whether a component or
  full-page example already covers it.
- Install matches with \`npx @properui/cli@latest add <name>\` (or \`add example <name>\` for a whole
  screen) rather than hand-rolling the equivalent markup.
- Import installed components from \`@/components/...\` (or this project's configured alias in
  \`components.json\`) and follow their existing prop APIs. Don't rename props to "clean them up".
- Never mix in another component library once a screen uses Proper UI components.

When writing or editing component code:

- Use React Aria props, not DOM props: \`onPress\` not \`onClick\`, \`isDisabled\` not
  \`disabled\`, \`isSelected\` not \`checked\`.
- Use semantic tokens only: \`bg-primary\`, \`text-tertiary\`, \`border-secondary\`,
  \`bg-brand-solid\`. Never a raw palette class (\`bg-purple-600\`) or an arbitrary value
  (\`bg-[#7f56d9]\`).
- Never use \`dark:\` utilities. A \`.dark-mode\` class on an ancestor repoints every semantic
  token, so a component written against tokens is already correct in both themes.
- Use logical properties for anything directional: \`ms-*\`/\`me-*\` not \`ml-*\`/\`mr-*\`,
  \`ps-*\`/\`pe-*\` not \`pl-*\`/\`pr-*\`, \`start-*\`/\`end-*\` not \`left-*\`/\`right-*\`,
  \`text-start\` not \`text-left\`.
- Use tokenised typography: \`text-display-lg\`, \`text-md\`, not raw sizes like \`text-4xl\`.
- Pass icons as component references: \`<Button iconLeading={ArrowRight}>\`, not
  \`<Button iconLeading={<ArrowRight />}>\`.
- Import from the component's subpath so bundlers keep only what's used, e.g.
  \`@properui/ui/components/base/buttons/button\`.
- Run type-check and build after installing or editing components before calling the work done.
`;

/** Package name and server key `agent init` registers in each client's MCP config. */
export const MCP_PACKAGE = "@properui/mcp";
export const MCP_SERVER_NAME = "properui";

/** The stdio server entry, identical in `.mcp.json` (Claude Code) and `.cursor/mcp.json`. */
export const MCP_SERVER_ENTRY = { command: "npx", args: ["-y", MCP_PACKAGE] };

/** Codex keeps MCP servers in the user-level `~/.codex/config.toml`, so `agent init` prints this rather than writing it. */
export const CODEX_MCP_TOML = `[mcp_servers.${MCP_SERVER_NAME}]
command = "npx"
args = ["-y", "${MCP_PACKAGE}"]`;

/** GitHub blob URL Lovable's knowledge/instructions box can import. */
export const LOVABLE_SKILL_URL = "https://github.com/properui/properui/blob/main/skills/properui/SKILL.md";

/** What `agent init --client lovable` prints — there is no local file Lovable itself reads. */
export const LOVABLE_INSTRUCTIONS = `Lovable runs in the browser and does not read files from this
checkout, so there is nothing to write locally. Instead:

  1. Open your Lovable project's knowledge / custom instructions panel.
  2. Paste this URL so Lovable can fetch the Skill's raw Markdown:
       ${LOVABLE_SKILL_URL}
  3. Or paste the Skill's content directly: copy it from that URL, or from
     skills/properui/SKILL.md if you have this repo checked out.

Once added, prompt Lovable the same way you would Claude Code or Codex: describe the screen and
mention using the installed Proper UI components. Lovable will then follow the Skill's steps
(check the registry, install with the CLI or npm, keep semantic tokens and React Aria props)
instead of generating its own markup from scratch.`;
