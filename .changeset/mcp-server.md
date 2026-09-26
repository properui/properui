---
"@properui/cli": minor
---

New package: `@properui/mcp` 0.1.0, a Model Context Protocol server for Proper UI (`npx -y @properui/mcp`). It exposes
`list_components`, `search_components`, `get_component`, `get_component_docs`, `add_component`, `get_project_info` and
`check_tokens` as tools, and the registry index and every entry as `properui://registry/...` resources. It bundles the
CLI's own registry client, search scoring, `add`, `info` and `check` code, so it reads the same registry (`--registry`,
`PROPERUI_REGISTRY`, `REGISTRY_URL`, `components.json`, then `https://properui.dev/r`) and writes the same files. It
publishes at its initial 0.1.0 because that version is not on npm yet, so it carries no bump of its own here.

CLI: `properui agent init` now also registers the MCP server: `.mcp.json` for Claude Code and `.cursor/mcp.json` for
Cursor (merged into an existing file; an existing `properui` entry is only replaced with `--overwrite`), and prints the
`~/.codex/config.toml` block for Codex. `--no-mcp` skips it. `properui check` accepts a single file as well as a
directory.
