import { CopyButton } from "~/components/landing/copy-button";

const MCP_URL = "https://properui.dev/api/mcp";

/**
 * Compact "Prefer an MCP?" block on the landing page, placed after the agent setup cards. Uses
 * only classes that already exist in landing.css (`.section`, `.container`, `.eyebrow`, `.command`,
 * `.button`) plus inline layout, so the home page does not load the `/mcp` page's stylesheet.
 */
export function McpCallout() {
    return (
        <section aria-labelledby="mcp-callout-title" style={{ paddingBottom: 72 }}>
            <div
                className="container"
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                    padding: 28,
                    border: "1px solid var(--line-2)",
                    borderRadius: 16,
                    background: "var(--soft)",
                }}
            >
                <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                    <span className="eyebrow">Model Context Protocol</span>
                    <h2 id="mcp-callout-title" style={{ margin: "8px 0 6px", fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                        Prefer an MCP?
                    </h2>
                    <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 16, lineHeight: 1.6 }}>
                        Add one URL to Claude, ChatGPT, Codex, Cursor or Gemini CLI and the agent can search real screens, flows and sections, then plan the
                        install of the one it picks. Prefer to install from the tool itself? Run the local package.
                    </p>
                </div>
                <div style={{ display: "grid", flex: "1 1 360px", gap: 12, minWidth: 0 }}>
                    <div className="command">
                        <code>{MCP_URL}</code>
                        <CopyButton value={MCP_URL}>Copy</CopyButton>
                    </div>
                    <a className="button button-secondary" href="/mcp" style={{ justifySelf: "start" }}>
                        See how it works <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </div>
        </section>
    );
}
