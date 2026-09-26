# @properui/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for [Proper UI](https://github.com/properui/properui):
an accessible React 19 component library built on React Aria Components and Tailwind CSS v4.

It gives an AI coding assistant the component registry and the CLI's `add` as tools, so it can search, read and install
components without shelling out to `npx @properui/cli` for every lookup. Registry access, search, `add`, `info` and
`check` are the CLI's own code, bundled in: a file `add_component` writes is exactly what `properui add` would write.

## Usage

```bash
claude mcp add properui -- npx -y @properui/mcp
```

Cursor (`.cursor/mcp.json`), Windsurf (`~/.codeium/windsurf/mcp_config.json`) and Claude Desktop:

```json
{
    "mcpServers": {
        "properui": { "command": "npx", "args": ["-y", "@properui/mcp"] }
    }
}
```

Codex (`~/.codex/config.toml`):

```toml
[mcp_servers.properui]
command = "npx"
args = ["-y", "@properui/mcp"]
```

VS Code (`.vscode/mcp.json`):

```json
{
    "servers": {
        "properui": { "type": "stdio", "command": "npx", "args": ["-y", "@properui/mcp"] }
    }
}
```

`npx @properui/cli@latest agent init` writes the Claude Code and Cursor entries for you, next to the Proper UI Skill.

Requires Node 20+.

## Tools

| Tool                 | What it does                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `list_components`    | Registry entries (name, layer, type, title, description), filtered by `layer` / `type`, paginated       |
| `search_components`  | Fuzzy search over names, titles, descriptions, example names and exported symbols (`properui search`)   |
| `get_component`      | The full entry: every file with its source, dependencies, `registryDependencies`, usage notes, docs URL |
| `get_component_docs` | The entry's docs page as markdown                                                                       |
| `add_component`      | `properui add`: writes the files, resolves dependencies, rewrites `@/` imports, returns the install cmd |
| `get_project_info`   | `properui info --json`                                                                                  |
| `check_tokens`       | `properui check` on a file or directory: raw palette classes, `dark:` variants, arbitrary colours       |

Resources: `properui://registry/index` (the index) and `properui://registry/<name>` (one entry with its source).

## Options

| Option                | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `--registry <source>` | Registry base URL or local directory                                     |
| `--cwd <dir>`         | Project directory tools act on when a call passes no `cwd` (default `.`) |

The registry resolves in this order: `--registry`, `PROPERUI_REGISTRY`, `REGISTRY_URL`, the `registry` field of the
project's `components.json`, then `https://properui.dev/r`. A private registry's token is read from `PROPERUI_TOKEN` or
from `~/.properui/auth.json` (written by `properui login`).

Full documentation: [docs/mcp.md](https://github.com/properui/properui/blob/main/docs/mcp.md).

## License

MIT
