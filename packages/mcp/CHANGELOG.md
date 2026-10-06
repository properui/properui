# @properui/mcp

## 0.3.0

### Minor Changes

- Design reference library tools and a remote HTTP handler. New tools: `search_screens` (full-page examples, optional
  `platform`), `search_sections` (marketing section variants, optional `group`), `search_flows` (curated flows from the
  registry's `flows.json`, each step resolved to its screen), `compare_screens` (two to five entries side by side: shared
  and unique composed components, tokens and npm packages, file counts) and `get_install_plan` (read-only: dependencies,
  npm packages, files and the exact CLI command). Results are markdown with `structuredContent` and carry thumbnails from
  `thumbs.json`, docs and preview links, composed components, token contract and the add command; a registry without
  `flows.json` or `thumbs.json` degrades to a plain sentence. Adds the `build_screen` prompt and the `properui://stats`
  resource, and cleans em dashes and ellipsis characters out of registry copy.

    The package root now exports `handleMcpRequest(request, { registryUrl, siteUrl })`, a stateless Streamable HTTP handler
    on web-standard `Request` and `Response` (JSON responses, CORS, `405` for `GET` and `DELETE`). The hosted server omits
    the project-bound tools `add_component`, `get_project_info` and `check_tokens`. The `properui-mcp` stdio bin and every
    existing tool are unchanged.

## 0.2.0

### Minor Changes

- 6596dfc: Platform-aware tools. `list_components` and `search_components` take a `platform` filter (`react`, `next`, `html`,
  `vue`, `angular`, `svelte`, `astro`, `vanilla`) and return each entry's `platforms`; `type` accepts `html`.
  `get_project_info` reports `platform` (`react` or `html`) and the installed html entries. `add_component` follows the
  CLI's resolution: on a project whose `components.json` platform is `html` it installs `<name>-html` and refuses
  React-only entries with the HTML alternative named.
