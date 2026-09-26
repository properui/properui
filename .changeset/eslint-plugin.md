---
"@properui/cli": patch
---

New package: `@properui/eslint-plugin` 0.1.0, a flat-config ESLint 9 plugin with four rules —
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
