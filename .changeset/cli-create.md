---
"@properui/cli": minor
---

Adds `properui create <dir>`, which scaffolds a brand-new Next.js (App Router) or Vite project from
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
