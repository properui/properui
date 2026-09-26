---
---

New package: `@properui/tokens` 0.1.0, the Proper UI token layer as plain CSS for projects outside React. It ships
`theme.css` (the Tailwind v4 `@theme` layer plus the prose styles, for Tailwind projects in any framework), `tokens.css`
(every token as a plain CSS custom property on `:root`, with dark values on `.dark-mode`, for apps with no Tailwind),
`presets/<name>.css` and `presets/plain/<name>.css` (each shipped theme preset as a `@theme` override and as a plain
`:root` override), and `properui.css`/`properui.min.css`, a prebuilt stylesheet a plain HTML page can `<link>` from
jsDelivr or unpkg with no build step. Everything is generated from `packages/ui/src/styles` at build time, and the docs
site serves the same files at `https://properui.dev/css/<file>`. It publishes at its initial 0.1.0 because that version
is not on npm yet, so it carries no bump of its own here.
