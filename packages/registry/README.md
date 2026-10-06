# @properui/registry

Private build package. Walks `packages/ui/src`, derives every component's dependency graph from
its actual imports, and writes the JSON files the CLI (`@properui/cli`) and the docs site's
variant gallery read at `/r/<name>.json`. Nothing here is published to npm, but its output is a public contract: the CLI and the docs site are consumers, and
`apps/docs/app/r/**` serves `dist/*` verbatim over HTTP.

## Build

```sh
pnpm registry:build   # tsx src/build.ts && tsx src/shadcn.ts
```

`src/build.ts` writes `dist/`; `src/shadcn.ts` reads `dist/index.json` + `dist/<name>.json` and
translates them into a parallel `dist/shadcn/` tree (shadcn's `registry-item.json` shape), so
`npx shadcn@latest add @properui/<name>` and shadcn's own MCP server also work against this
catalogue. `shadcn.ts` only translates — it never edits `dist/*.json` and is never imported by
`build.ts` (kept in sync by hand, since the two scripts must stay decoupled).

The build is pure: same `packages/ui/src` in, same `dist/` out, byte-for-byte, every time. Two
consecutive runs with no source changes must produce identical output (`diff -rq` the two `dist/`
trees); if they don't, something in `build.ts` introduced non-determinism (unsorted `Set`/`Map`
iteration, wall-clock, etc.), not a bug in the registry's data.

## Output

| File                                                        | What it is                                                                                                                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dist/index.json`                                           | Every entry's metadata minus `files`, plus `fileCount` — the catalogue.                                                                                                                                        |
| `dist/<name>.json`                                          | One full entry: files (with content), dependencies, semantic manifest fields.                                                                                                                                  |
| `dist/schema.json` (repo root of this package, not `dist/`) | Draft-07 JSON Schema served at `/schema.json`: an entry (`definitions.registryEntry`, from `build.ts`'s `SCHEMA`) or a project's `components.json` (`definitions.componentsJson`). Regenerated on every build. |
| `dist/stats.json`                                           | Every count quoted in the root `README.md` and the docs landing page — one generated source.                                                                                                                   |
| `dist/icons.json`                                           | `{ package, alias, names }` — the installed `@properui/icons` export list, for the CLI's icon search.                                                                                                          |
| `dist/exports.json`                                         | `{ "<entry-name>": ["ComboBox", ...] }` — named exports per entry, so `search` can index export names, not just entry names.                                                                                   |
| `dist/flows.json`                                           | `{ flows: [{ id, title, description, tags, steps: [{ entry, purpose }] }] }` — curated journeys, from `src/flows.ts`.                                                                                          |
| `dist/thumbs.json`                                          | `{ "<entry-name>": { light, dark } }` — site-relative thumbnail paths for example entries.                                                                                                                     |
| `dist/shadcn/*`                                             | shadcn-format mirror, written by `shadcn.ts` from the files above.                                                                                                                                             |

## flows.json and thumbs.json

Two files that let a client (the MCP server, the docs gallery) browse examples visually and by journey.
Both are written by `src/build.ts`; neither changes any `dist/<name>.json`.

### `dist/thumbs.json`

```json
{
    "login-simple": {
        "light": "/thumbs/app-examples/log-in-pages/login-simple.webp",
        "dark": null
    }
}
```

- Built by scanning `apps/docs/public/thumbs/<section>/<slug>/<variant>.webp`, with an optional
  `<variant>-dark.webp` beside it. `<section>` is `app-examples`, `marketing` or `marketing-examples`; `<slug>` is the
  group folder; `<variant>` is the example entry's name.
- Paths are site-relative: `apps/docs` serves `public/` at the site root, so the URL is `https://properui.dev` plus the path.
- Only entries with a light thumbnail appear. `dark` is `null` when there is no dark file.
- A file is skipped, with a warning, when no entry has that name, or when the entry lives in a different group.
  Variant names repeat across sibling groups (`dashboards` and `dashboards-02` both have `dashboard-01`) and the
  registry keeps one entry per name, so only the thumbnail from the group in the entry's `docs` path counts.
  Likewise `header-sections/` holds copies of `hero-header-sections/` thumbnails.
- An entry whose own name ends in `-dark` keeps its own light thumbnail; the `-dark.webp` suffix only means "dark
  version" when there is no entry of that exact name.

### `dist/flows.json`

```json
{
    "flows": [
        {
            "id": "auth",
            "title": "Authentication",
            "description": "Sign up, confirm the email address, log in, and recover a forgotten password.",
            "tags": ["login", "sign up", "forgot password"],
            "steps": [{ "entry": "signup-simple", "purpose": "A short sign-up form that asks for the minimum to create an account." }]
        }
    ]
}
```

A flow is an ordered list of example entries that together cover one product journey. They are curated by hand in
`src/flows.ts`, in the order they are written to the file.

To add a flow, append an object to `FLOWS` in `src/flows.ts`:

1. `id`: unique, kebab-case. `title` and `description`: one sentence each.
2. `tags`: 4 to 8 words people search for ("login", "onboarding", "checkout", "paywall", "empty state").
3. `steps`: 3 to 6 of `{ entry, purpose }`. `entry` is the name of an `example` entry in `dist/index.json`; `purpose` is one
   sentence on what that screen does in the journey.
4. Run `pnpm registry:build`. The build fails, listing every problem, if an id repeats, a step's entry does not exist
   or is not an example, a step has no light thumbnail, a count is out of range, or any copy contains an em dash or an
   ellipsis character.

`stats.json` gains `flows` and `thumbnails` (counts of the two files above). Contract tests live in
`src/outputs.test.ts`; run `pnpm -F @properui/registry test`, which builds first.

## Entry shape

Every `dist/<name>.json` validates against `schema.json`:

```ts
{
  name, layer, type, title, description, docs?,
  files: [{ path, target, type, content, dependencies, kind? }],
  registryDependencies: string[],          // other registry entries this one needs to compile
  optionalRegistryDependencies: string[],  // registry entries that are decorative/demo-only — see below
  dependencies: string[],                  // npm packages, entry-level union of every file's own list
  cssVars: string[],
  examples: string[],
  platforms: string[],                      // ["react","next"] for TSX entries; ["html","vue","angular","svelte","astro","vanilla"] for html entries
  // semantic manifest (hand-authored for base/application in packages/registry/manifest/**, all optional):
  intent?, avoid_when?, composes_with?, a11y_contract?, responsive_contract?, requires_data?,
  token_contract?,                          // always derived from the entry's own source, never hand-authored
}
```

### HTML entries

When `packages/html/src/components/<component>/*.html` exists, the build also emits one entry per
component folder: `name: "<component>-html"`, `type: "html"`, `layer: "html"`, one `type: "html"`
file per snippet (target `components/<component>/<file>.html`), no dependencies, title from the
folder name and description from an optional leading `<!-- description: ... -->` comment in the
first snippet. Without that folder the build still succeeds and reports 0 html entries. html entries
are excluded from `exports.json`, from the shadcn mirror and from `stats.json`'s `entries` (counted
separately as `htmlEntries`).

### `registryDependencies` vs `optionalRegistryDependencies`

A dependency is **required** by default. It moves to `optionalRegistryDependencies` when it's
decorative or demo-only — the consumer can skip installing it and lose nothing functional. Two
mechanisms feed the split (`build.ts`, "Optional (decorative/demo-only) registryDependencies"):

1. **Automatic.** An import reachable only through a `*.demo.tsx` / `.story.tsx` / `.test.tsx`
   file never becomes a `registryDependency` at all — `discoverGroups` excludes those files from
   a group's real file list before the dependency scan ever runs.
2. **Hand-maintained (`OPTIONAL_DEPS` in `build.ts`).** Crossings from real component files that
   are still known, by inspection, to be decorative: a swappable brand asset, page chrome
   rendered "alongside" the thing an entry teaches, or a variant inside a group that only one
   sibling file actually needs. Every rule carries an inline reason. Any `registryDependency`
   whose target lives in the `shared-assets` layer (background-patterns, credit-card,
   illustrations, mockups, qr-code) is optional unconditionally — that whole layer is visual
   dressing by construction.

Adding a new decorative crossing means adding one entry to `OPTIONAL_DEPS`, not touching the
dependency scanner itself.

### File-level `dependencies` and `kind`

Every file in `files[]` carries its own npm `dependencies` (the entry-level `dependencies` array
is the union across all of a group's files), so the CLI can say "need recharts (metrics-chart.tsx)"
instead of only naming the whole entry. Type-only imports (`import type {...}`, and a type-position
`import("pkg")`) are included and skip the runtime allow-list gate — they erase at compile time, so
a consumer needs the package for type support, never the bundle.

A file gets `kind: "demo"` when it exists only to carry fixture/placeholder data for other files in
the same entry — `utils/demo-assets.ts`, `table-data.ts`, and the `data(.<letter>)?.ts` files a few
page examples use. It's informational only; the file still ships normally.

### Lint-directive stripping

`content` never carries an `eslint-disable`/`eslint-enable` comment — the copied source would
hard-error in a consumer's ESLint 9 flat config over a plugin or rule it doesn't have installed.
`stripLintDirectives` removes whole-line and block-comment directives (including the JSX
comment-expression form, `{/* eslint-disable-next-line ... */}`) and trims inline
`// eslint-disable-line` / `// eslint-disable-next-line` trailers, but leaves every other comment
— including `@ts-expect-error`, which is load-bearing — untouched.

## Allow-listed npm dependencies

`ALLOWED` is read from `packages/ui/package.json`'s own `dependencies` (plus the React/Next peers)
— never a second hard-coded list — so the registry and the package it mirrors can't drift. A
runtime (non-type-only) import of anything else fails the build with the file and specifier named.

## Manifests

`packages/registry/manifest/<layer>/<name>.json` hand-authors the semantic fields
(`intent`, `avoid_when`, `composes_with`, `a11y_contract`, `responsive_contract`, `requires_data`)
for base and application entries. All fields are optional, so an entry with no manifest file is
still a valid entry — it just falls back to a derived `composes_with` (from `registryDependencies`)
and no other semantic fields. `token_contract` is never hand-authored; it's always derived from the
entry's own source against `packages/ui/src/styles/theme.css`.

## Verifying a change here

```sh
pnpm registry:build && pnpm registry:build   # run twice
diff -rq packages/registry/dist /tmp/previous-dist   # byte-identical, or explain why not
pnpm -F @properui/registry type-check
pnpm -F @properui/registry lint
pnpm -F @properui/registry test   # builds, then checks flows.json, thumbs.json and stats.json
grep -rl "eslint-disable" packages/registry/dist/*.json   # must be empty
```
