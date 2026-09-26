/**
 * The per-tool setup facts the landing page shows: hero selector, setup cards and dialogs all
 * read from here so a command can never differ between two places on the page.
 *
 * Every value is verified against `packages/cli/src/commands/agent.ts` (`properui agent init
 * --client claude|codex|cursor|lovable|all`) and `packages/mcp` (`npx -y @properui/mcp`, a stdio
 * server). Lovable runs in the browser and cannot read local files, so it gets the public Skill
 * URL and a Knowledge destination instead of a command. The MCP entry's command is what the
 * client runs, not something the visitor runs once, so its target is labelled "Add to".
 */

export type ToolKey = "claude" | "codex" | "cursor" | "lovable" | "mcp";

export type ToolSetup = {
    key: ToolKey;
    name: string;
    /** Path under `apps/docs/public`. */
    logo: string;
    /** "command" copies a shell command; "url" copies a URL to paste somewhere. */
    mode: "command" | "url";
    /** Label above the copyable value, e.g. "Run in your project terminal". */
    valueLabel: string;
    /** The exact string the Copy button writes to the clipboard. */
    copyValue: string;
    /** Label for the Copy button before it is pressed. */
    copyLabel: string;
    /** Files the command creates or updates in the project, or where to paste the URL. */
    creates: Array<{ path: string; note: string }>;
    /** Overrides the "Creates" / "Destination" label in front of `creates`. */
    createsLabel?: string;
    /** A one-line caveat shown under the value, or null. */
    note: string | null;
    /** A copyable example prompt to use after setup. */
    prompt: string;
};

const PROMPT = "Build a settings page for my app. Use Proper UI's components so it looks consistent with the rest of the product.";

export const TOOL_SETUPS: Record<ToolKey, ToolSetup> = {
    claude: {
        key: "claude",
        name: "Claude Code",
        logo: "/claude.svg",
        mode: "command",
        valueLabel: "Run in your project terminal",
        copyValue: "npx @properui/cli@latest agent init --client claude",
        copyLabel: "Copy",
        creates: [
            { path: ".claude/skills/properui/SKILL.md", note: "the Proper UI skill" },
            { path: "CLAUDE.md", note: "a short pointer appended, nothing replaced" },
            { path: ".mcp.json", note: "the Proper UI MCP server, merged with any servers already there" },
        ],
        note: null,
        prompt: PROMPT,
    },
    codex: {
        key: "codex",
        name: "Codex",
        logo: "/codex.svg",
        mode: "command",
        valueLabel: "Run in your project terminal",
        copyValue: "npx @properui/cli@latest agent init --client codex",
        copyLabel: "Copy",
        creates: [
            { path: ".agents/skills/properui/SKILL.md", note: "the Proper UI skill" },
            { path: "AGENTS.md", note: "a marked Proper UI block appended, nothing replaced" },
        ],
        note: null,
        prompt: PROMPT,
    },
    cursor: {
        key: "cursor",
        name: "Cursor",
        logo: "/cursor.svg",
        mode: "command",
        valueLabel: "Run in your project terminal",
        copyValue: "npx @properui/cli@latest agent init --client cursor",
        copyLabel: "Copy",
        creates: [
            { path: ".cursor/rules/properui.mdc", note: "an always-applied rule; Cursor does not read SKILL.md" },
            { path: ".cursor/mcp.json", note: "the Proper UI MCP server, merged with any servers already there" },
        ],
        note: null,
        prompt: PROMPT,
    },
    lovable: {
        key: "lovable",
        name: "Lovable",
        logo: "/lovable.svg",
        mode: "url",
        valueLabel: "Paste into Project settings, Knowledge, Custom instructions",
        copyValue: "https://github.com/properui/properui/blob/main/skills/properui/SKILL.md",
        copyLabel: "Copy URL",
        creates: [{ path: "Project settings > Knowledge > Custom instructions", note: "nothing is written to your machine" }],
        note: "Lovable runs in the browser and cannot read local project files, so it gets the same instructions through its Knowledge panel.",
        prompt: PROMPT,
    },
    mcp: {
        key: "mcp",
        name: "Any MCP client",
        logo: "/mcp.svg",
        mode: "command",
        valueLabel: "Add as a stdio MCP server in your client",
        copyValue: "npx -y @properui/mcp",
        copyLabel: "Copy",
        creates: [{ path: "your client's MCP server list", note: "one stdio entry named properui; the command itself writes nothing" }],
        createsLabel: "Add to",
        note: "Works with any client that speaks MCP, such as Windsurf, VS Code, Zed or Gemini CLI. Your assistant gets search_components, get_component, add_component and four more tools.",
        prompt: PROMPT,
    },
};

export const TOOL_ORDER: ToolKey[] = ["claude", "codex", "cursor", "lovable", "mcp"];

/** The label in front of a tool's `creates` list, shared by every place that renders it. */
export const createsLabel = (tool: ToolSetup) => tool.createsLabel ?? (tool.mode === "url" ? "Destination" : "Creates");

/** One command that installs the skill for every supported client at once. */
export const UNIVERSAL_SETUP_COMMAND = "npx @properui/cli@latest agent init --client all";
