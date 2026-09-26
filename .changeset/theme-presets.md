---
"@properui/ui": minor
"@properui/cli": minor
---

Add theme presets. `@properui/ui/styles/presets` ships eight presets (`brand`, `blue`, `indigo`, `teal`, `green`,
`orange`, `rose`, `slate-mono`), each a brand ramp plus a base gray (`gray`, `slate`, `zinc`, `neutral`, `stone`), a
radius scale (`none` to `xl`) and optional fonts, together with `generateThemeCss()` (the `@theme` override block to
append after the Proper UI stylesheet), `scaleFromHue()`/`scaleFromHex()` (an 11-step brand ramp derived in OKLCH from
one colour), and `encodePreset()`/`decodePreset()` (short url-safe preset codes). `theme.css` now pins Tailwind's
`--radius-xs` … `--radius-4xl` scale so presets have a documented radius hook; values are unchanged.

The CLI gains `properui theme list`, `properui theme apply <preset|code> [--css <file>] [--dry-run]` (writes or
replaces a marked `/* properui:theme-preset */` block in the global stylesheet, idempotently) and `init --preset
<name|code>`. The docs add a theme generator page (/docs/theme-generator) that previews real components with any preset
or hex colour and prints the CSS, the preset code and the `theme apply` command.
