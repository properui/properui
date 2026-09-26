# Roadmap

Proper UI is at `0.2.0`. The component library, the documentation site, the registry and the CLI
all work today. This page lists what is **not** built yet, so nothing in the docs promises something
the code does not do.

Each item links to where it would live. Issues and pull requests are welcome. See
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Shipped since this page was written

### MCP server

[`packages/mcp`](./packages/mcp) (`@properui/mcp`) lets an AI coding assistant query the registry
directly instead of shelling out to `npx @properui/cli` for every lookup: `list_components`,
`search_components`, `get_component`, `get_component_docs`, `add_component`, `get_project_info` and
`check_tokens`, plus the registry index and every entry as MCP resources. It does not reimplement
anything: registry access, fuzzy search, `add`, `info` and `check` are the CLI's own modules, bundled
in. `properui agent init` registers it for Claude Code and Cursor. Setup for each client is in
[docs/mcp.md](./docs/mcp.md).

The CLI is still the path for anything the server does not cover (`init`, `diff`, `remove`, `why`,
`login`), and for assistants that do not speak MCP.

### `init` scaffolding a new project

`properui create <dir>` scaffolds a brand-new Next.js (App Router) or Vite project from an embedded
template — `package.json`, `tsconfig.json`, the Tailwind v4 stylesheet, the framework config, a home
page rendering a `Button` and a `Badge` — then runs the same `init`/`add` logic `properui` uses
against an existing project. `create-next-app`/`create-vite` first, then `init`, is no longer a
required two-step: `create` does both. `properui init` itself is unchanged and still only configures
an **existing** project. See [docs/cli.md](./docs/cli.md#create).

### A lint rule for raw palette colours

[`packages/eslint-plugin`](./packages/eslint-plugin) (`@properui/eslint-plugin`) is a flat-config
ESLint 9 plugin with four rules: `no-raw-palette` (`bg-red-500`, `from-blue-50`, ... in JSX
`className`, template literals and `cx()`/`cn()`/`clsx()`/`sortCx()` arguments and object values, with
an `allow` option), `no-arbitrary-values` (`bg-[#7f56d9]`, `p-[13px]`, ...; a bare arbitrary property
like `[mask-image:...]` is allowed by default, also with an `allow` option), `no-dark-variant` (any
`dark:` utility) and `no-physical-properties` (`ml-`, `pr-`, `left-`, `text-left`, `rounded-l-`,
`border-r-`, ... with an autofix to the logical equivalent, e.g. `ml-4` → `ms-4`). `configs.recommended`
turns all four on (`no-arbitrary-values` at `warn`, the rest at `error`), and the root
[`eslint.config.mjs`](./eslint.config.mjs) applies them to `packages/ui/src/components/**`. The
palette/dark-variant/arbitrary-value detection is copied from `properui check`
(`packages/cli/src/commands/check.ts`), extended with the gradient-stop prefixes (`from-`, `via-`,
`to-`) `check.ts` doesn't scan for; `check` itself is unchanged and still the guard for a project that
only has the CLI installed, not ESLint. See [Linting](./apps/docs/content/docs/linting.mdx).

## Not built yet

### A bundled build for non-bundling consumers: attempted, not shipped

The package ships **source TSX**, which is why Next.js consumers add `transpilePackages`. A `tsup`
ESM build was built and measured three times; the numbers are recorded here so a fourth attempt
starts from evidence rather than the same assumption.

It does not solve the problem it was meant to solve. With `dist` in place, Next.js **still** needs
`transpilePackages`: a Server Component import reaches `dist` but trips Next's RSC client-only
check, and a Client Component import falls through to `src` and fails on this package's internal
`@/*` alias. Only Vite subpath imports benefit, and Vite users already have a working path.

The cost lands on everyone: the tarball goes from 0.93 MB to 7.6 MB, unpacked 5.9 MB to 42.1 MB,
1,177 files to 5,362. `dist` is 45 MB, of which 27 MB is duplicated chunks: `tsup`'s DTS step runs
in a worker capped near 4 GiB and OOMs on this tree, so the build is split into 47 independent
invocations that cannot share a chunk graph. A full build takes about five hours.

Two real defects surfaced while measuring, both are now fixed, independently of the bundled build:

- [`providers/router-provider.tsx`](./packages/ui/src/providers/router-provider.tsx) imported
  `next/navigation` unconditionally, breaking the root barrel under Vite even from source.
  `RouterProvider` has since been dropped from the root barrel (`packages/ui/src/index.ts`), so
  importing from the barrel under Vite no longer pulls in `next/navigation`.
- The package's internal `@/*` alias resolved only through this workspace's tsconfig, which stopped
  any external consumer (not just Next.js) from resolving `packages/ui/src`. Every internal
  specifier under `packages/ui/src` is now a relative import (converted by a one-off script; see the
  `@properui/ui` changeset for the count), and `packages/registry/src/build.ts` rewrites the
  relative specifiers that cross from `components/**` into `utils/**`/`hooks/**` back to `@/...` in
  the registry payload it serves, since that crossing is the one case the CLI's `--path` relocation
  actually breaks. `packages/ui/tsconfig.json`'s `paths` entry and `apps/docs/tsconfig.json`'s
  `@/*` entry (pointing at `packages/ui/src`) are gone. Neither was still referenced.

    **This does not make `transpilePackages` optional.** Verified with `npm pack` into scratch Vite
    and Next.js 15 apps: Vite's `vite build` now resolves both a subpath import and the root barrel
    with no config beyond installing the package. Next.js still needs `transpilePackages`. Without
    it, webpack's default loader can't parse the raw TSX/generics syntax this package ships from
    `node_modules` at all (`Module parse failed: Unexpected token`), regardless of the alias. What the
    fix changes is that `transpilePackages` now **works**: before, a Next.js build with
    `transpilePackages` set failed type-checking on `Cannot find module '@/utils/cx'`; now it compiles
    and type-checks cleanly. Separately (and unrelated to the alias): the default `create-next-app`
    tsconfig targets `ES2017`, and one file in this package
    (`components/application/code-snippet/highlight.ts`) uses ES2018 named capture groups in a regex
    literal, so Next's type-check step fails at that target: bumping the consumer's `target` to
    `ES2020`+ (already common) clears it. This is a pre-existing source-compatibility gap, not an
    alias issue.

`transpilePackages` itself is now a one-liner instead of an array literal to remember: `withProperUI`
(`import { withProperUI } from "@properui/ui/next"`, wrapping your `next.config.ts` export) appends
`@properui/ui` to whatever `transpilePackages` your config already sets, deduplicated. It does not
change any of the above — Next.js still needs `transpilePackages`, this just writes it for you.

### Registry entries that over-fetch

`properui add input` still copies `payment-icons` (60 files) because `input-payment.tsx` imports
them and lives inside the `input` entry. Splitting it into its own `input-payment` entry, with
`input` listing it as an optional dependency, is the fix. Likewise the hero sections render a
header, so every hero pulls all header-navigation variants; a header slot on those sections would
end that. The registry build already refuses to mark a dependency optional or a file demo-only while
a required file imports it, so neither can be fixed by a flag alone. It would live in
[`packages/registry/src/build.ts`](./packages/registry/src/build.ts) and the affected components.

### Full RTL coverage

Every component in `packages/ui/src/components` now uses logical properties. Zero physical
directional utilities remain. [`.storybook/preview.tsx`](./.storybook/preview.tsx) now registers a
direction (LTR/RTL) toolbar toggle alongside the light/dark theme switcher, and the committed visual
baseline (below) includes `dir="rtl"` captures of a form-heavy page, a dashboard and a marketing
hero, so a physical-property regression is caught the same way a layout regression is.

### Visual regression testing

`pnpm docs:shot` and `pnpm docs:diff` exist and work against a local run of the docs site for
one-off parity checks. Alongside them, a curated ~25-route visual regression baseline is now
committed under [`tests/visual/baseline/`](./tests/visual/baseline/) (light/dark, two viewports, a
handful of RTL passes: see [`tests/visual/routes.ts`](./tests/visual/routes.ts)) and compared on
every PR by the `visual` job in `.github/workflows/ci.yml`, via
[`scripts/visual-baseline.ts`](./scripts/visual-baseline.ts) and
[`scripts/visual-check.ts`](./scripts/visual-check.ts).

### Variant gallery thumbnails

The variant galleries render a neutral placeholder card where a thumbnail is missing, which is
currently every variant. `pnpm shots:thumbs` generates them into `apps/docs/public/thumbs/` by
rendering each variant's preview route; they are not committed yet.

### `cssVars` in the registry

Every registry entry carries an empty `cssVars` array. The field is reserved for per-component CSS
custom properties the CLI would merge into a consuming app's stylesheet. Components currently rely
entirely on the shared token file, so nothing needs merging. The field exists for when that changes.

## Not planned

- **A paid or "PRO" tier.** Everything in this repository is MIT licensed. There is no paid icon
  package, no gated component set and no account system. The CLI's `login` command exists only to
  store a token for someone self-hosting a private registry.
- **An `upgrade` or `migrate` command.** Copied-in components are yours to edit, so an automatic
  rewrite would fight you. `properui diff` shows what changed against the registry and
  `properui add --overwrite` takes the new version when you want it.
