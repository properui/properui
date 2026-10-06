# MCP server

`@properui/mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server for Proper UI. It gives an AI
coding assistant the registry, a library of real screens, flows and sections, and the CLI's `add` as tools, so it can
search, read, compare and install without shelling out to `npx @properui/cli` for every lookup. There are two ways to
connect:

- **Local, stdio.** Runs through `npx`, so there is nothing to install. It runs in your project, so it has every tool,
  including `add_component`:

    ```bash
    npx -y @properui/mcp
    ```

    Requires Node 20+.

- **Remote, Streamable HTTP.** `https://properui.dev/api/mcp`, read-only, no account. It has no project on the other
  end, so it has the search, compare, read and plan tools but not `add_component`, `get_project_info` or
  `check_tokens`. An agent calls `get_install_plan` and runs the CLI command it prints.

It reads the same registry the CLI reads and writes files through the CLI's own code: the registry client, fuzzy
search, `add`, `info` and `check` are bundled in from `packages/cli/src`, not reimplemented. A file `add_component`
writes is byte-for-byte what `properui add` would have written.

## Tools

### Components and project (stdio and remote, except where marked)

| Tool                 | CLI equivalent        | What it does                                                                                                                                                 |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_components`    | `list --json`         | Registry entries (name, layer, type, title, description, platforms), filtered by `layer` / `type` / `platform`, paginated                                    |
| `search_components`  | `search <query>`      | Fuzzy search over names, titles, descriptions, docs example names and exported symbols; `type` and `platform` filters                                        |
| `get_component`      | `curl /r/<name>.json` | The full entry: every file with its source, npm and registry dependencies, usage guidance, docs URL                                                          |
| `get_component_docs` | `curl /<route>.md`    | The entry's docs page as markdown (the MDX source when the registry is a local checkout)                                                                     |
| `add_component`      | `add <names...>`      | Stdio only. Writes the files, resolves `registryDependencies`, rewrites `@/` imports, returns the install command; `<name>-html` on an html-platform project |
| `get_project_info`   | `info --json`         | Stdio only. Framework, platform, Tailwind, aliases, theme path, registry reachability, installed entries                                                     |
| `check_tokens`       | `check [dir]`         | Stdio only. Raw palette classes, `dark:` variants and arbitrary colour values in a file or directory                                                         |

### Design reference library (stdio and remote)

Tools to research a screen before building it. Results are markdown with the same data as `structuredContent`.

| Tool               | What it does                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search_screens`   | Full-page examples (dashboards, settings, auth, pricing, landing and more); `platform` is `app` or `marketing`; `limit` defaults to 8, maximum 25                                   |
| `search_sections`  | Marketing section variants (heroes, pricing tables, footers and more); `group` limits to one family such as `pricing-sections`; `limit` defaults to 8, maximum 25                   |
| `search_flows`     | Curated multi-step flows (authentication, onboarding, billing, marketing site, email lifecycle); each step is a resolved screen with its purpose; `limit` defaults to 5, maximum 25 |
| `compare_screens`  | Two to five entries side by side: what they compose, tokens and npm packages they share or only one uses, file counts; `include_source` appends the code                            |
| `get_install_plan` | Read-only plan for one to twenty names: dependencies (optional ones separate), npm packages, files that would be written and the exact CLI command                                  |

Every tool that touches a project takes an optional `cwd`; it defaults to the directory the server was started in,
which is the project root for every client below. `add_component` needs `components.json`, so run
`npx @properui/cli@latest init` first. It accepts `overwrite`, `dryRun`, `optional`, `withDemos`, `path` and `install`,
the same switches as the CLI's `--overwrite`, `--dry-run`, `--no-optional`, `--with-demos`, `--path` and `--install`.
Without `install: true` it never runs the package manager; it returns the command instead.

The server also offers the `build_screen` prompt, which walks an agent through search, review, compare,
`get_component`, `get_install_plan` and install.

The registry is also exposed as **resources**, over stdio and over HTTP: `properui://registry/index` is `index.json`,
`properui://registry/<name>` is one entry with its full source, and `properui://stats` is the registry's `stats.json`.

## Setup

Each client below lists the local stdio setup. To use the remote server instead, the URL is
`https://properui.dev/api/mcp`; the per-client remote forms are on [properui.dev/mcp](https://properui.dev/mcp).

### Claude Code

```bash
claude mcp add properui -- npx -y @properui/mcp
```

Or the remote server:

```bash
claude mcp add --transport http properui https://properui.dev/api/mcp
```

Add `--scope project` to write it to the project's `.mcp.json` so everyone working in the repo gets it.
`npx @properui/cli@latest agent init --client claude` writes that same `.mcp.json` entry alongside the Skill.

### Cursor

`.cursor/mcp.json` in the project (or `~/.cursor/mcp.json` for every project). `agent init --client cursor` writes it
for you.

```json
{
    "mcpServers": {
        "properui": {
            "command": "npx",
            "args": ["-y", "@properui/mcp"]
        }
    }
}
```

### Codex

`~/.codex/config.toml`. `agent init --client codex` prints this block rather than editing a file outside the project.

```toml
[mcp_servers.properui]
command = "npx"
args = ["-y", "@properui/mcp"]
```

Or: `codex mcp add properui -- npx -y @properui/mcp`. For the remote server: `codex mcp add properui --url https://properui.dev/api/mcp`.

### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
    "mcpServers": {
        "properui": {
            "command": "npx",
            "args": ["-y", "@properui/mcp"]
        }
    }
}
```

### VS Code

`.vscode/mcp.json` in the project. VS Code uses `servers`, not `mcpServers`:

```json
{
    "servers": {
        "properui": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "@properui/mcp"]
        }
    }
}
```

### Anything else

Any client that launches a stdio server works with the command `npx` and the arguments `-y @properui/mcp`.

## Options

| Option                | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `--registry <source>` | Registry base URL or local directory                                        |
| `--cwd <dir>`         | Project directory tools act on when a call passes no `cwd` (default: `.`)   |
| `--help`, `--version` | Print usage or the version (to stderr: stdout is reserved for the protocol) |

Pass them after the package name, e.g. `"args": ["-y", "@properui/mcp", "--registry", "./packages/registry/dist"]`.

## Pointing at another registry

The source is resolved like the CLI's, highest precedence first:

1. `--registry <source>`
2. the `PROPERUI_REGISTRY` environment variable
3. the `REGISTRY_URL` environment variable
4. the `registry` field in the project's `components.json`
5. `https://properui.dev/r`

A directory on disk works the same way it does for the CLI. From a clone of this repo:

```bash
pnpm registry:build
claude mcp add properui -- npx -y @properui/mcp --registry "$PWD/packages/registry/dist"
```

For a private registry, `properui login` stores a token at `~/.properui/auth.json` and the server sends it the same
way the CLI does; `PROPERUI_TOKEN` in the server's environment works too.

## Troubleshooting

**`add_component` says there is no `components.json`.** The server's working directory is not the project root, or
`init` has not run. Pass `cwd`, or start the server from the project (`--cwd`).

**`add_component` is not in the tool list.** You are connected to the remote server, which has no project to write to.
Use `get_install_plan` and run the command it prints, or register the local package.

**The client shows no tools.** Run `npx -y @properui/mcp --version` in a terminal to check Node and network access. On
Windows, some clients need `"command": "cmd"` with `"args": ["/c", "npx", "-y", "@properui/mcp"]`.

**The registry is unreachable.** `get_project_info` reports `registryReachable: false`. Behind a proxy that blocks
`properui.dev`, build the registry locally and pass `--registry`.
