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

### Remote (no install)

The same library is served read-only over Streamable HTTP at `https://properui.dev/api/mcp`, with no account:

```bash
claude mcp add --transport http properui https://properui.dev/api/mcp
```

```json
{
    "mcpServers": {
        "properui": { "url": "https://properui.dev/api/mcp" }
    }
}
```

The remote server has the search, compare, read and plan tools below. It has no project on the other end, so
`add_component`, `get_project_info` and `check_tokens` are only on the local server; over HTTP an agent calls
`get_install_plan` and runs the CLI command it prints.

## Tools

| Tool                 | What it does                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_components`    | Registry entries (name, layer, type, title, description, platforms), filtered by `layer` / `type` / `platform`, paginated                                   |
| `search_components`  | Fuzzy search over names, titles, descriptions, example names and exported symbols (`properui search`)                                                       |
| `get_component`      | The full entry: every file with its source, dependencies, `registryDependencies`, usage notes, docs URL                                                     |
| `get_component_docs` | The entry's docs page as markdown                                                                                                                           |
| `add_component`      | `properui add`: writes the files, resolves dependencies, rewrites `@/` imports, returns the install cmd; on an html-platform project installs `<name>-html` |
| `get_project_info`   | `properui info --json`, including `platform` (`react` or `html`)                                                                                            |
| `check_tokens`       | `properui check` on a file or directory: raw palette classes, `dark:` variants, arbitrary colours                                                           |

### Design reference library

Tools to research a screen before building it. Results are markdown (one line per hit) with the same data as
`structuredContent`: `name`, `title`, `layer`, `group`, `thumbnail` (`light`/`dark` URLs), `docsUrl`, `previewUrl`,
`composesWith`, `tokenContract` and `addCommand`. Thumbnails come from the registry's `thumbs.json`, the preview URL is
derived from the thumbnail path, and `search_flows` reads `flows.json`; a registry without either says so in a sentence
instead of failing.

| Tool               | What it does                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search_screens`   | Full-page examples (dashboards, settings, auth, pricing, landing and more), optionally `platform: "app" \| "marketing"`                                  |
| `search_sections`  | Marketing section variants (heroes, pricing tables, footers and more), optionally limited to a `group` such as `pricing-sections`                        |
| `search_flows`     | Curated multi-step flows (authentication, onboarding, billing, marketing site): each step is a resolved screen with the reason it is in the flow         |
| `compare_screens`  | Two to five entries side by side: what they compose, tokens and npm packages they share or only one uses, file counts; `include_source` appends the code |
| `get_install_plan` | Read-only plan for one or more names: dependencies (optional ones separate), npm packages, files that would be written and the exact CLI command         |

Queries are split into words, matched with the CLI's fuzzy scorer against a real threshold, and an unrelated query gets
"no match" with the three nearest names. The `build_screen` prompt walks an agent through search, review, compare,
`get_component`, `get_install_plan` and install, then adapting copy and data while keeping the semantic tokens.
`properui://stats` serves the registry's `stats.json`.

Resources: `properui://stats`, `properui://registry/index` (the index) and `properui://registry/<name>` (one entry with its source).

## Options

| Option                | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `--registry <source>` | Registry base URL or local directory                                     |
| `--cwd <dir>`         | Project directory tools act on when a call passes no `cwd` (default `.`) |

The registry resolves in this order: `--registry`, `PROPERUI_REGISTRY`, `REGISTRY_URL`, the `registry` field of the
project's `components.json`, then `https://properui.dev/r`. A private registry's token is read from `PROPERUI_TOKEN` or
from `~/.properui/auth.json` (written by `properui login`).

### Embedding the HTTP handler

```ts
import { handleMcpRequest } from "@properui/mcp";

export const POST = (request: Request) => handleMcpRequest(request, { registryUrl: "https://properui.dev/r", siteUrl: "https://properui.dev" });
```

`handleMcpRequest(request: Request, options: { registryUrl: string; siteUrl: string }): Promise<Response>` is stateless
and runs on web-standard `Request`/`Response`: JSON responses, CORS `*`, `204` for `OPTIONS`, `405` for `GET` and `DELETE`.
`registryUrl` is where `index.json` and the entry files are read; `siteUrl` is the origin that docs, preview and thumbnail
links point at. The package root exports only this handler; the stdio server is the `properui-mcp` bin.

Full documentation: [docs/mcp.md](https://github.com/properui/properui/blob/main/docs/mcp.md).

## License

MIT
