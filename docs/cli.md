# CLI

`properui` copies component source into your project, shadcn-style: you get the `.tsx` files, not a dependency. Run it
through `npx`: there is nothing to install:

```bash
npx @properui/cli@latest init
npx @properui/cli@latest add button
```

Or `pnpm dlx properui@latest ...`, `yarn dlx properui@latest ...`, `bunx properui@latest ...`.

Requires Node 20+.

## Commands

| Command               | What it does                                                             |
| --------------------- | ------------------------------------------------------------------------ |
| `create <dir>`        | Scaffold a new Next.js or Vite project, then `init` and `add` into it    |
| `init`                | Configure this project: `components.json`, tokens, `cx`, `ThemeProvider` |
| `add <components...>` | Copy components (and their dependencies) into the project                |
| `add example <name>`  | Copy a whole page example plus everything it uses                        |
| `list`                | List registry entries with layer and description                         |
| `search <query>`      | Fuzzy search names, descriptions and example names                       |
| `diff [component]`    | Show your local modifications against the registry version               |
| `login`               | Store a token for a private registry                                     |
| `check [dir]`         | Scan for raw palette classes and arbitrary values that bypass tokens     |
| `theme list`          | List the shipped theme presets and their preset codes                    |
| `theme apply <p>`     | Write a theme preset (name or code) into the global stylesheet           |

Every command accepts `--registry <source>`, `-y, --yes` and the global `--cwd <dir>`.

## `create`

```bash
npx @properui/cli@latest create my-app
npx @properui/cli@latest create my-app --template vite --pm pnpm --install
```

Scaffolds a brand-new project from an embedded template — no `create-next-app`/`create-vite` step first — then runs
`init` and `add buttons badges` against it, so the new project is already configured and has a working `Button` and
`Badge` on its home page.

| Option              | Description                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--template <name>` | `next` (Next.js 15 App Router) or `vite` (Vite + React 19); default `next`                                        |
| `--pm <manager>`    | `pnpm`, `npm`, `yarn` or `bun`; default `npm`                                                                     |
| `--install`         | Also run the package manager install, both for the template's own dependencies and for anything `init`/`add` need |
| `--overwrite`       | Scaffold into a directory that already has files in it                                                            |
| `-y, --yes`         | Accept every default; never prompt                                                                                |

`<dir>` must not already exist with files in it unless `--overwrite` is passed. Without `--install`, nothing touches
the network: the command only writes files, and prints the install command to run afterward.

## `init`

```bash
npx @properui/cli@latest init
```

Detects your framework (Next.js App Router, Next.js Pages Router, Vite, plain React), whether you use TypeScript, whether
you have a `src/` directory, your `tsconfig.json` path alias, your Tailwind version and your package manager, then:

- writes `components.json`,
- copies the theme token file,
- adds `@import "tailwindcss"`, the theme import and the `@source` scan line to your global stylesheet,
- creates `utils/cx.ts`,
- wraps your app entry (`app/layout.tsx`, `pages/_app.tsx` or `src/main.tsx`) in `ThemeProvider`.

Tailwind v3 projects are stopped with upgrade instructions rather than half-configured: the token layer is written in
v4 `@theme` syntax.

| Option        | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `--nextjs`    | Treat the project as Next.js instead of auto-detecting     |
| `--vite`      | Treat the project as Vite instead of auto-detecting        |
| `--manual`    | Write the files but leave the app entry point alone        |
| `--overwrite` | Replace `components.json` and any files that already exist |
| `-y, --yes`   | Accept every default; never prompt                         |

`--preset <name|code>` also applies a theme preset to the global stylesheet as part of `init`, exactly as
[`theme apply`](#theme) does. An unknown name or an invalid code stops `init` before it writes anything.

### `components.json`

Written by `init`, read by every other command:

```json
{
    "$schema": "https://properui.dev/schema.json",
    "style": "default",
    "tsx": true,
    "tailwind": {
        "css": "app/globals.css",
        "theme": "app/styles/theme.css",
        "prefix": ""
    },
    "aliases": {
        "components": "@/components",
        "utils": "@/utils",
        "ui": "@/components/base",
        "hooks": "@/hooks"
    },
    "registry": "https://properui.dev/r"
}
```

Edit `aliases` to control where files land and how imports are rewritten; edit `registry` to point at a different
source permanently.

## `add`

```bash
npx @properui/cli@latest add button
npx @properui/cli@latest add button input select table
```

For each component the CLI resolves its registry dependencies, copies every file to the target derived from your
aliases, rewrites `@/` imports to your alias prefix, and installs any missing npm packages.

Dependency resolution is transitive: `add badge-groups` also brings in `badges` and `dot-icon`, so you never end up with
a broken import.

| Option         | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| `--all`        | Add every component in the registry                            |
| `--overwrite`  | Replace files that already exist (how you pull upstream fixes) |
| `--path <dir>` | Write into this directory instead of the components alias      |
| `--dry-run`    | Print what would change without writing anything               |
| `-y, --yes`    | Skip the dependency-install confirmation                       |

`--dry-run` before `--all` is a good habit:

```bash
npx @properui/cli@latest add --all --dry-run
```

### Page examples

```bash
npx @properui/cli@latest add example about-page-01
```

An example is a complete page (a dashboard, a settings screen, a marketing landing page) and its registry entry lists
every section and component it composes, so all of them are installed with it. Once installed it is your code; the CLI
never rewrites it unless you pass `--overwrite`.

Not sure of a name? List them:

```bash
npx @properui/cli@latest list --type example --layer marketing-examples
```

## `list`

```bash
npx @properui/cli@latest list
npx @properui/cli@latest list --layer base
npx @properui/cli@latest list --type component
npx @properui/cli@latest list --json
```

| Option        | Description                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--layer <l>` | `base`, `application`, `marketing`, `app-examples`, `marketing-examples`, `foundations`, `shared-assets`, `hooks`, `utils`, `styles` |
| `--type <t>`  | `component`, `example`, `util`, `hook`, `style`                                                                                      |
| `--json`      | Print the raw index rows, for scripting                                                                                              |

## `search`

Fuzzy match over component names, descriptions and example names:

```bash
npx @properui/cli@latest search "pricing"
npx @properui/cli@latest search "empty state" --limit 5
```

| Option        | Description                    |
| ------------- | ------------------------------ |
| `--limit <n>` | Maximum results (default `20`) |

## `diff`

Compare the files in your project against the registry version, so you can see what you have changed before pulling an
update:

```bash
npx @properui/cli@latest diff              # every installed component
npx @properui/cli@latest diff button       # just one
```

Requires `components.json`, so run `init` first.

`diff <component>` also prints the entry's `changelog` (see [registry metadata](https://properui.dev/docs/registry-metadata)):
the `@properui/ui` releases newer than the version recorded for it in your `components.json` `installed` manifest,
when that record carries a real `x.y.z` to compare against — otherwise the full changelog, since there's nothing to
compare it to yet.

## `login`

Only needed for a **private** registry: the public one is anonymous, and `add` works without ever logging in.

```bash
npx @properui/cli@latest login
npx @properui/cli@latest login --token <token>
```

The token is stored at `~/.properui/auth.json` and reused by later commands on the same machine.

## `check`

The token guard: scans your installed component directories (or a path you give it) for raw palette classes and
arbitrary values that should have been semantic tokens, and exits non-zero on any hit.

```bash
npx @properui/cli@latest check
npx @properui/cli@latest check src/components/ui
```

If your project already runs ESLint, [`@properui/eslint-plugin`](https://properui.dev/docs/linting) catches the
same things (plus `dark:` variants and physical directional properties) inline as you type, with an autofix for
the directional-property rule.

## `theme`

Theme presets: a brand ramp, a base gray (`gray`, `slate`, `zinc`, `neutral` or `stone`), a radius scale (`none`, `sm`,
`md`, `lg` or `xl`) and optional fonts. They ship inside the CLI, so both subcommands work offline.

```bash
npx @properui/cli@latest theme list
npx @properui/cli@latest theme apply teal
npx @properui/cli@latest theme apply AYoDBHRlYWw   # a preset code from the theme generator
```

`theme list` prints each shipped preset (`brand`, `blue`, `indigo`, `teal`, `green`, `orange`, `rose`, `slate-mono`)
with its base gray, radius and preset code, and marks the one currently applied. `--json` prints them as JSON.

`theme apply <preset>` takes a preset name or a preset code (the short url-safe string the
[theme generator](https://properui.dev/docs/theme-generator) produces) and writes one `@theme` block that redeclares
`--color-brand-*`, `--color-neutral-*`, `--radius-*` and, when set, `--font-body`/`--font-display`. The block sits
between `/* properui:theme-preset */` and `/* /properui:theme-preset */` markers at the end of the stylesheet, after the
theme import, so it wins. Re-running replaces that block in place and never touches anything outside it; applying the
same preset twice leaves the file byte-for-byte unchanged.

| Option         | Description                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `--css <file>` | Stylesheet to write to. Default: `tailwind.css` from `components.json`, else the detected global stylesheet |
| `--dry-run`    | Print the block without writing anything                                                                    |

## Pointing at another registry

A registry source is either an HTTP(S) base URL or a **directory on disk**. Both expose the same shape: `index.json`
plus one `<name>.json` per entry. The source is resolved in this order:

1. `--registry <source>` on the command line
2. the `REGISTRY_URL` environment variable
3. the `registry` field in `components.json`
4. the built-in default

The hosted registry is not live yet, so while working from a clone of this repo, build it and point the CLI at the
output directory:

```bash
pnpm registry:build
npx @properui/cli@latest add button --registry ./packages/registry/dist
# or: REGISTRY_URL=./packages/registry/dist npx @properui/cli@latest add button
```

## Troubleshooting

**"No components.json found."** Run `init` first, from the directory that holds your `package.json`.

**Imports point at the wrong place.** The alias in `components.json` no longer matches `tsconfig.json`. Fix the
tsconfig path and re-run `init --overwrite`.

**A component installed but renders unstyled.** Your stylesheet is missing the `@source` line for the directory the
components landed in. See [installation.md](./installation.md).

**Debugging.** Set `PROPERUI_DEBUG=1` to get a full stack trace instead of a single error line.
