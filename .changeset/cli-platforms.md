---
"@properui/cli": minor
---

Makes the CLI platform-aware. Detection now recognises Vue, Nuxt, Angular, Svelte, SvelteKit and Astro (from
`package.json` and their config files) and treats a folder with no `package.json` or no known framework as plain HTML;
React projects detect exactly as before. `components.json` gains an optional `"platform": "react" | "html"` (default
`react`). On the html platform, `init` skips the React-only steps (no `utils/cx.ts`, no providers, no TSX `@source`),
wires `@properui/tokens/theme.css` and `@properui/html/css` into a Tailwind v4 stylesheet when there is one or prints
the CDN `<link>`/`<script>` lines when there is not, and prints the `@properui/tokens @properui/html
@properui/elements` install last; `init --platform react|html` overrides detection. `add <name>` on an html project
installs the `<name>-html` snippet entry (`.html` files under the components alias, recorded in `components.json`) and
refuses a React-only entry with one line naming the HTML alternative. `list --platform <p>` and `search --platform <p>`
filter by platform, `search` shows a platform column, and `info --json` reports `platform`, `detectedPlatform`,
`installedHtml` and the html-platform package versions.
