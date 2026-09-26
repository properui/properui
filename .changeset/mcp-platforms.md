---
"@properui/mcp": minor
---

Platform-aware tools. `list_components` and `search_components` take a `platform` filter (`react`, `next`, `html`,
`vue`, `angular`, `svelte`, `astro`, `vanilla`) and return each entry's `platforms`; `type` accepts `html`.
`get_project_info` reports `platform` (`react` or `html`) and the installed html entries. `add_component` follows the
CLI's resolution: on a project whose `components.json` platform is `html` it installs `<name>-html` and refuses
React-only entries with the HTML alternative named.
