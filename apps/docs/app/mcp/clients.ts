/**
 * Per-client setup for the Proper UI MCP, shown on `/mcp`. Every command and menu path here was
 * checked against the client's own documentation on 6 Oct 2026; the source for each entry is
 * recorded in `source`. If a client's docs change, update the entry and its date, do not guess.
 *
 * Each client lists the remote URL first and the local stdio form second. The two differ in one
 * way that matters: over stdio the server runs in the user's project, so `add_component` installs;
 * over HTTP there is no project, so the agent calls `get_install_plan` and then runs the CLI.
 */

/** The remote endpoint (Streamable HTTP, stateless). Needs no account and no API key. */
export const MCP_URL = "https://properui.dev/api/mcp";

/** The local stdio package, for clients without remote MCP support, for installing straight from the tool, and for offline registries. */
export const MCP_STDIO = "npx -y @properui/mcp";

/** The same stdio server as an `mcpServers` JSON entry, the shape Cursor, Claude Desktop, Windsurf and Gemini CLI read. */
const STDIO_JSON = `{\n  "mcpServers": {\n    "properui": {\n      "command": "npx",\n      "args": ["-y", "@properui/mcp"]\n    }\n  }\n}`;

export type ClientSetup = {
    id: string;
    label: string;
    /** One-line lead shown above the steps. */
    intro: string;
    /** Ordered steps in plain words; inline `code` is written with backticks and rendered as code. */
    steps: string[];
    /** Rows shown in `.command` boxes with a copy button. */
    commands: Array<{ label: string; value: string }>;
    /** Where the syntax was verified. */
    source: { label: string; href: string };
};

export const CLIENTS: ClientSetup[] = [
    {
        id: "claude-code",
        label: "Claude Code",
        intro: "One command registers the remote server. Add `--scope user` to make it available in every project. Use the second command to run the server locally, so `add_component` can install into your project.",
        steps: [
            "Run one of the commands below in your terminal.",
            "Inside Claude Code, run `/mcp` (or `claude mcp list` in the shell) to confirm `properui` shows as connected.",
            "Ask for a screen: `Search Proper UI for a billing settings page, show me three options, then plan the install.`",
        ],
        commands: [
            { label: "Remote (HTTP)", value: `claude mcp add --transport http properui ${MCP_URL}` },
            { label: "Local (stdio)", value: `claude mcp add properui -- ${MCP_STDIO}` },
        ],
        source: { label: "Claude Code MCP documentation", href: "https://code.claude.com/docs/en/mcp" },
    },
    {
        id: "claude-desktop",
        label: "Claude Desktop and Web",
        intro: "Claude takes remote servers as custom connectors. No account on our side, so leave sign-in off. Claude Desktop can also run the stdio server from its config file.",
        steps: [
            "Open Customize, then Connectors.",
            "Choose `+ Add`, then `Add custom connector`.",
            "Name it `Proper UI`, paste the URL below and continue.",
            "Choose the no sign in option, then add the connector.",
            "In a chat, use the `+` button, open Connectors and switch Proper UI on for that conversation.",
            "On Team and Enterprise plans an owner first adds the connector under Organization settings, then Connectors; members connect it from Customize.",
            "For the local server on Claude Desktop, add the JSON entry to `claude_desktop_config.json` instead and restart the app. Claude on the web takes the connector only.",
        ],
        commands: [
            { label: "Connector URL (remote)", value: MCP_URL },
            { label: "claude_desktop_config.json (stdio)", value: STDIO_JSON },
        ],
        source: {
            label: "Get started with custom connectors using remote MCP",
            href: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp",
        },
    },
    {
        id: "chatgpt",
        label: "ChatGPT",
        intro: "ChatGPT takes a remote server through its custom MCP server dialog. It cannot run a local process, so the stdio package is not an option here. Its menus and plan availability change often, so check the current page if a label differs.",
        steps: [
            "Open the plugins page at `chatgpt.com/plugins`, select the plus button, then `Add custom MCP server`.",
            "Name it `Proper UI` and describe it as a searchable library of web-app screens, flows and sections.",
            "Under connection, enter the URL below, including the `/mcp` path. No authentication is needed.",
            "Confirm the risk notice and create it, then check that the tools ChatGPT discovered include `search_screens` and `get_install_plan`.",
            "ChatGPT cannot write to your project. Take the install command from `get_install_plan` and run it in your own terminal.",
        ],
        commands: [{ label: "Server URL (remote)", value: MCP_URL }],
        source: { label: "Connect from ChatGPT (OpenAI Apps SDK)", href: "https://developers.openai.com/apps-sdk/deploy/connect-chatgpt" },
    },
    {
        id: "codex",
        label: "Codex",
        intro: "Codex takes a streamable HTTP server by URL, or a local command, from the command line or from its config file.",
        steps: ["Run the command below, or add one of the entries to your Codex `config.toml`.", "Start a new Codex session so it loads the server."],
        commands: [
            { label: "Remote (HTTP)", value: `codex mcp add properui --url ${MCP_URL}` },
            { label: "config.toml, remote", value: `[mcp_servers.properui]\nurl = "${MCP_URL}"` },
            { label: "config.toml, local (stdio)", value: `[mcp_servers.properui]\ncommand = "npx"\nargs = ["-y", "@properui/mcp"]` },
        ],
        source: { label: "Codex MCP documentation", href: "https://learn.chatgpt.com/docs/extend/mcp?surface=cli" },
    },
    {
        id: "cursor",
        label: "Cursor",
        intro: "Cursor reads `mcp.json`: a `url` entry for the remote server, a `command` entry for the local one. Use `.cursor/mcp.json` for one project or `~/.cursor/mcp.json` for every project.",
        steps: [
            "Create or edit the file and add one of the entries below.",
            "Reload Cursor, then check that `properui` is listed and enabled under MCP in settings.",
        ],
        commands: [
            {
                label: ".cursor/mcp.json, remote",
                value: `{\n  "mcpServers": {\n    "properui": {\n      "url": "${MCP_URL}"\n    }\n  }\n}`,
            },
            { label: ".cursor/mcp.json, local (stdio)", value: STDIO_JSON },
        ],
        source: { label: "Cursor MCP documentation", href: "https://cursor.com/docs/context/mcp" },
    },
    {
        id: "gemini",
        label: "Gemini CLI",
        intro: "Gemini CLI registers a remote server with `gemini mcp add`. The local server goes in `settings.json` under `mcpServers`.",
        steps: [
            "Run the command below, or add the `mcpServers` entry to `~/.gemini/settings.json` (or `.gemini/settings.json` in a project).",
            "Start Gemini CLI and run `/mcp` to confirm `properui` is connected.",
        ],
        commands: [
            { label: "Remote (HTTP)", value: `gemini mcp add --transport http properui ${MCP_URL}` },
            { label: "settings.json, local (stdio)", value: STDIO_JSON },
        ],
        source: { label: "Gemini CLI MCP server documentation", href: "https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md" },
    },
    {
        id: "other",
        label: "Other clients",
        intro: "Any client that supports remote MCP over Streamable HTTP can use the URL as is. Any client that can start a command can run the local package.",
        steps: [
            "For remote, add an MCP server in your client and give it the URL below, with no authentication.",
            "For local, register the command `npx -y @properui/mcp` (Node 20 or newer; `npx` fetches the package on first run) in whatever form your client takes.",
            "Add `--registry <url or directory>` to the local command to read from a mirror or a local copy of `packages/registry/dist` instead of properui.dev.",
        ],
        commands: [
            { label: "Server URL (remote)", value: MCP_URL },
            { label: "Command (stdio)", value: MCP_STDIO },
            { label: "Offline registry (stdio)", value: `${MCP_STDIO} --registry ./registry` },
        ],
        source: { label: "Model Context Protocol", href: "https://modelcontextprotocol.io" },
    },
];
