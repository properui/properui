/**
 * Narrative step text for the per-tool "View step-by-step setup" dialog. This file owns only
 * prose: every command, path, note and prompt a step needs is pulled live from `ToolSetup`
 * (see `tool-setup.ts`) through the `description` function below, so nothing here can drift
 * out of sync with the verified data.
 */
import type { ToolKey, ToolSetup } from "./tool-setup";

export type DialogStep = {
    title: string;
    /** Rendered with the tool's own `ToolSetup` so paths and commands are never re-typed here. */
    description: (tool: ToolSetup) => string;
};

const creates = (tool: ToolSetup) => tool.creates.map((entry) => entry.path).join(" and ");

export const DIALOG_STEPS: Record<ToolKey, DialogStep[]> = {
    claude: [
        { title: "Open your project terminal", description: (tool) => `Go to the root of the project ${tool.name} will edit.` },
        {
            title: "Run the setup command",
            description: (tool) => `Run the command below. The CLI writes ${creates(tool)}, so Claude Code loads the skill on its own.`,
        },
        {
            title: "Prompt normally",
            description: () =>
                "Describe the screen you want. Claude Code searches the Proper UI registry and installs real components instead of guessing at one.",
        },
    ],
    codex: [
        { title: "Open your project terminal", description: (tool) => `Go to the root of the repository ${tool.name} will work inside.` },
        {
            title: "Run the setup command",
            description: (tool) => `Run the command below. The CLI writes ${creates(tool)}, so Codex reads both before it edits UI code.`,
        },
        {
            title: "Prompt normally",
            description: () => "Describe the interface. Codex searches the registry before writing markup and installs the components it finds.",
        },
    ],
    cursor: [
        { title: "Open your project terminal", description: () => "Go to the repository where you want to use Proper UI." },
        {
            title: "Run the setup command",
            description: (tool) => `Run the command below. The CLI writes ${creates(tool)}, an always-applied rule; Cursor does not read SKILL.md.`,
        },
        {
            title: "Prompt in Agent mode",
            description: () => "Describe the interface. Cursor searches the registry before composing the components it writes.",
        },
    ],
    lovable: [
        { title: "Open project settings", description: (tool) => `In Lovable, open ${tool.valueLabel.replace("Paste into ", "")}.` },
        {
            title: "Paste the Skill URL",
            description: () =>
                "Paste the URL below. Lovable runs in the browser and cannot read local project files, so this is how it learns the Proper UI workflow for this project.",
        },
        {
            title: "Prompt normally",
            description: () =>
                "Describe the interface and mention Proper UI. Lovable installs the package and uses the registry instead of a generic composition.",
        },
    ],
    mcp: [
        {
            title: "Open your client's MCP settings",
            description: () =>
                "Open the list of MCP servers in your assistant: for example .vscode/mcp.json in VS Code, the MCP settings in Windsurf, or settings.json in Gemini CLI.",
        },
        {
            title: "Add Proper UI as a stdio server",
            description: () =>
                "Add a server named properui that runs the command below. The client starts it on demand, and nothing is written to your project until you ask for a component.",
        },
        {
            title: "Prompt normally",
            description: () =>
                "Describe the screen. Your assistant calls search_components and add_component to install real Proper UI source instead of inventing markup.",
        },
    ],
};
