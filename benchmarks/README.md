# Benchmarks

Reproducible comparisons: the same brief, the same model, the same scaffold, one condition per
library. Every number on a comparison page on properui.dev comes from a `metrics.json` in this
folder, produced by `measure.mjs`, never typed by hand. The agent reports are summarised next to
each run so the effort numbers can be checked against them.

## Protocol

1. Scaffold identical apps: `npx create-next-app@latest <name> --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes`, then `pnpm install`. Commit as "baseline before agent".
2. Set up the condition, timing it:
    - **properui**: `npx @properui/cli@latest init --install --yes` then `npx @properui/cli@latest agent init --client claude` (installs the Skill the agent is told to read).
    - **shadcn**: `npx shadcn@latest init -d`.
    - **tailwind**: nothing (Tailwind v4 comes with the scaffold).
      Commit again so the agent's work is the only diff.
3. Run one agent per condition, same model, same prompt. The only difference is one sentence naming what is installed. The prompt:
    > Build a billing settings page at /settings/billing: current plan with usage, payment method on file, an invoice history table, and a cancel-subscription confirmation dialog. Production quality. Run `pnpm build` and fix anything it reports until the build passes.
    > Each agent reports its files, commands, tool-call count and caveats; the summary is saved as `agent-report.md`.
4. Measure with `node benchmarks/measure.mjs <conditionDir> <outDir> <port>` (from this repo's root; set `AXE_PATH` to an `axe-core/axe.min.js` if it is not resolvable). It records: build pass and time; files and lines the agent authored (library files a CLI copied in are counted separately); raw Tailwind palette classes, arbitrary values and `dark:` variants in authored files; axe-core violations (WCAG 2 A, AA and best practice) on desktop and mobile; whether the cancel dialog opens, has a dialog role, receives focus and closes on Escape; horizontal overflow; console errors; full-page screenshots and a dialog screenshot.

## What this does and does not show

- One run per condition, one model, one brief written by the Proper UI maintainers. It is a
  reproducible sample, not a study. Re-run it yourself with the steps above; different runs of
  the same agent will differ.
- "Lines authored" is lower when a library ships the page as source (Proper UI installs full
  examples), which is the point of the comparison, not a flaw in the others.
- axe-core checks rendered markup only. Zero violations is not "accessible"; see
  https://properui.dev/docs/accessibility for what the number covers.
- The token-discipline counts are regexes over class strings. A raw palette class is not a bug
  in a project with no token system; the count shows how much of the page's look lives in
  one-off values versus a shared token file.

## Runs

- `2026-10-billing/`: the billing settings brief, 6 Oct 2026, claude-sonnet-5, Next.js 15, Tailwind v4. Conditions: properui (Proper UI 0.3.x), shadcn (shadcn/ui, default style), tailwind (no library).
