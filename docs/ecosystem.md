# Getting Proper UI listed across the ecosystem

What Proper UI already publishes, and the concrete steps and payloads to get it listed on the
places a consumer or an agent might look for a component registry: shadcn's own registry
directory, the community `registry.directory` explorer, `21st.dev`, and the Claude/agent skills
marketplaces. Everything below was checked against each service's own documentation and public
repositories; where a service's process might change or isn't fully controlled by us (every
third-party marketplace here is), that's called out rather than glossed over.

## What we already publish

Before submitting anywhere, this is the surface every listing below points back to:

- **Native registry** — `https://properui.dev/r/index.json` (catalogue) and
  `https://properui.dev/r/<name>.json` (one entry with real source), served by
  `apps/docs/app/r/[name]/route.ts` from `packages/registry/dist/*.json`
  (`pnpm registry:build`, source in `packages/registry/src/build.ts`).
- **shadcn-compatible mirror** — `https://properui.dev/r/shadcn/registry.json` (the shadcn
  `registry.json` index) and `https://properui.dev/r/shadcn/<name>.json` (one
  `registry-item.json` per entry), served by `apps/docs/app/r/shadcn/[name]/route.ts` from
  `packages/registry/dist/shadcn/*.json` (`packages/registry/src/shadcn.ts` translates the native
  registry into shadcn's shapes — see that file's header comment for the exact field mapping).
  Namespace: **`@properui`**.
- **Plain-markdown docs mirror** — `https://properui.dev/llms.txt`, every page's own `.md` twin at
  `<page-url>.md`.
- **The Skill** — [`skills/properui/SKILL.md`](../skills/properui/SKILL.md), installed into a
  project by `npx @properui/cli@latest agent init`.

Any listing process below just needs those URLs to already be live and correct; none of them
require a new build artifact beyond what `pnpm registry:build` already produces.

## 1. shadcn's official registry directory

The directory at [ui.shadcn.com/directory](https://ui.shadcn.com/docs/directory) is shadcn's own
curated list of third-party namespaces, sourced from `apps/v4/registry/directory.json` in
[`shadcn-ui/ui`](https://github.com/shadcn-ui/ui) and served publicly at
`https://ui.shadcn.com/r/registries.json`. Getting `@properui` listed there:

1. Fork `shadcn-ui/ui` and add an entry to `apps/v4/registry/directory.json`:

    ```json
    {
        "name": "@properui",
        "description": "Open-source React 19 component library built for AI-generated code — Untitled UI's design language, React Aria under the hood, MIT licensed.",
        "url": "https://properui.dev/r/shadcn/{name}.json",
        "registry_url": "https://properui.dev/r/shadcn/registry.json",
        "github_url": "https://github.com/properui/properui"
    }
    ```

    The `{name}` placeholder in `url` is mandatory and literal — shadcn substitutes it per item
    (`buttons` → `https://properui.dev/r/shadcn/buttons.json`); `registry_url` points at the
    index (our `registry.json`) so shadcn can list every item under the namespace instead of
    requiring one item to be named up front.

2. Run the repository's own `pnpm validate:registries` (documented on the
   [Registry Directory](https://ui.shadcn.com/docs/registry/registry-index) page) before opening
   the PR — it fetches `url`/`registry_url` and checks the response against the `registry.json` /
   `registry-item.json` schemas, which is exactly what `packages/registry/src/shadcn.ts` already
   validates locally at build time, so this should pass on the first try.
3. Open the PR against `shadcn-ui/ui`. Eligibility is a public, publicly-reachable registry in
   shadcn's format, which this already is — the shadcn team reviews and merges; once merged the
   listing is live immediately (no separate deploy on our side).
4. **After merge**, a consumer installs a component with:

    ```bash
    npx shadcn@latest add @properui/buttons
    ```

    once they've added the namespace to their own `components.json` (§5 below) — or, without that
    file present yet, `npx shadcn@latest add https://properui.dev/r/shadcn/buttons.json` works
    standalone.

## 2. registry.directory (community explorer)

[`registry.directory`](https://registry.directory) ([source](https://github.com/codedthemes/registry.directory))
is a community-run explorer for shadcn registries — not affiliated with shadcn itself, so treat
this listing as a discovery convenience, not a canonical one. It reads the same public
`registry.json`/`registry-item.json` shape, so no separate payload is needed beyond pointing it at
our URL:

1. Open an issue or PR against `codedthemes/registry.directory` (check the repository's own
   `CONTRIBUTING` for the current submission mechanism — community tools like this one change
   their intake process without notice, so verify there rather than assuming the shape below is
   still current) adding an entry equivalent to:

    ```json
    {
        "name": "Proper UI",
        "namespace": "@properui",
        "url": "https://properui.dev/r/shadcn/registry.json",
        "homepage": "https://properui.dev",
        "github": "https://github.com/properui/properui"
    }
    ```

2. Confirm the listing renders our real item list (it fetches `registry.json` live) rather than a
   stale cache before considering this done.

## 3. 21st.dev

[21st.dev](https://21st.dev) is npm-for-design-engineers: a public marketplace of individual
components, not a namespace/registry-URL listing like shadcn's, so "listing Proper UI" here means
publishing each component (or a curated subset) as its own entry via their CLI
([`@21st-dev/registry`](https://github.com/21st-dev/registry)), not linking to our `/r/` endpoint:

1. `npx @21st-dev/registry login` — one-time auth against a 21st.dev account.
2. Publish one component at a time from its real source file, e.g.:

    ```bash
    npx @21st-dev/registry publish packages/ui/src/components/base/buttons/button.tsx \
        --description "React Aria button with 9 color variants, 5 sizes, loading and icon slots" \
        --public
    ```

    Repeat per component, or script it over every entry in `packages/registry/dist/index.json`
    (that file already has `name`, `title`, `description` for each one — the CLI invocation above
    is generatable straight from it).

3. `--public` submits for their catalog review; `--unlisted` gives an installable link without
   catalog placement, useful for checking the published output looks right before going public.
4. Each published component keeps our attribution (21st.dev credits the publishing account, not
   an anonymous upload), and a consumer installs one with 21st's own CLI/UI flow, independent of
   our `/r/` registry entirely — this is a parallel distribution channel, not a mirror of it.

## 4. Skills marketplaces

There is no single official "Claude Skills marketplace" the way there's one shadcn directory —
distribution today is a mix of Anthropic's own
[`anthropics/skills`](https://github.com/anthropics/skills) examples repository, Claude Code's
git-based plugin marketplaces, and several independent, unaffiliated community sites (skills.sh,
localskills.sh, SkillsMP, and similar) that index public GitHub repositories containing a
`SKILL.md`. Concretely, for our [`skills/properui/SKILL.md`](../skills/properui/SKILL.md):

1. **Baseline: nothing to submit.** Any of these directories that crawl/index public GitHub repos
   for a `SKILL.md` will find ours in `properui/properui` without action on our part, since the
   repository and the file are already public.
2. **Claude Code plugin marketplace listing** (the one first-party mechanism): add a
   `.claude-plugin/marketplace.json` at the repository root (or a dedicated marketplace repo) that
   points at the Skill, following the shape Claude Code's own plugin docs describe — a `name`,
   `owner`, and a `plugins` array naming `skills/properui` as a plugin's `source`. Once that file
   exists, anyone can register it with `/plugin marketplace add properui/properui` and then
   `/plugin install properui@properui` (mirroring how `anthropics/skills` itself is registered,
   per `apps/docs/content/docs/agents.mdx`'s own recommendation, e.g.
   `/plugin install document-skills@anthropic-agent-skills`).
3. **Individual community sites** (skills.sh, localskills.sh, SkillsMP, etc.) each run their own,
   independently-operated submission form or PR process — check each site's own "submit"/"about"
   page at the time of listing rather than trusting a payload shape recorded here, since these are
   unaffiliated services whose intake mechanisms are not under our control and change without
   coordinating with registry authors.
4. In every case the actual content submitted is the same: a link to
   `https://github.com/properui/properui/blob/main/skills/properui/SKILL.md`, a one-line
   description ("Registry-aware Skill for building UI with Proper UI: inspects a project, fetches
   real component source before writing markup, verifies tokens/accessibility before reporting
   done"), and the install instructions already on the
   [AI agents & the Proper UI Skill](/docs/agents) page (`agent init`/manual copy).

## 5. The `components.json` snippet consumers add

Once `@properui` is registered with shadcn (§1) — or even before, since a consumer can point at
our shadcn mirror directly without waiting for the official directory PR to merge — this is what a
project's own `components.json` needs so `npx shadcn add @properui/<name>` resolves against us:

```json
{
    "registries": {
        "@properui": "https://properui.dev/r/shadcn/{name}.json"
    }
}
```

This snippet is also documented on the [AI agents & the Proper UI Skill](/docs/agents) page under
"Using Proper UI through the shadcn CLI and MCP", alongside the equivalent for an MCP-driven agent.
