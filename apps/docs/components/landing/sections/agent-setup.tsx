"use client";

import { useState } from "react";
import { CopyButton } from "~/components/landing/copy-button";
import { SetupDialog } from "~/components/landing/setup-dialog";
import { TOOL_ORDER, TOOL_SETUPS, type ToolKey, UNIVERSAL_SETUP_COMMAND, createsLabel } from "~/components/landing/tool-setup";

/**
 * Landing section "setup": the five agent setup cards plus the universal setup command. Every
 * command, path, note and prompt shown here (or in the dialog it opens) comes from
 * `tool-setup.ts`, which is verified against `packages/cli/src/commands/agent.ts`.
 */
export function AgentSetup() {
    const [selected, setSelected] = useState<ToolKey>("claude");
    // Bumped on every trigger click so the dialog re-opens even when re-clicking the same card's
    // trigger after closing it. See the comment on SetupDialog's `openToken` prop.
    const [openToken, setOpenToken] = useState(0);

    const openGuide = (key: ToolKey) => {
        setSelected(key);
        setOpenToken((token) => token + 1);
    };

    return (
        <section className="section" id="setup" aria-labelledby="setup-title">
            <div className="container">
                <div className="section-head">
                    <span className="eyebrow">For AI coding agents</span>
                    <h2 id="setup-title">Set up your agent in minutes.</h2>
                    <p>
                        Each command configures the current project: it writes a durable skill or rule and registers the MCP server, so your agent searches
                        Proper UI before it writes UI code. Any other MCP client connects with one line.
                    </p>
                </div>

                <div className="setup-grid">
                    {TOOL_ORDER.map((key) => {
                        const tool = TOOL_SETUPS[key];
                        return (
                            <article className="setup-card" key={tool.key}>
                                <div className="setup-card-head">
                                    <span className="setup-mark" aria-hidden="true">
                                        <img src={tool.logo} alt="" />
                                    </span>
                                    <strong>{tool.name}</strong>
                                </div>

                                <div className="setup-command-row">
                                    <span>{tool.valueLabel}</span>
                                    <div className="command">
                                        {tool.mode === "url" ? (
                                            <a className="command-link" href={tool.copyValue} target="_blank" rel="noreferrer">
                                                {tool.copyValue.replace(/^https:\/\//, "")}
                                            </a>
                                        ) : (
                                            <code>{tool.copyValue}</code>
                                        )}
                                        <CopyButton value={tool.copyValue}>{tool.copyLabel}</CopyButton>
                                    </div>
                                </div>

                                {tool.note ? <p className="setup-note">{tool.note}</p> : null}

                                <p className="setup-creates">
                                    {createsLabel(tool)}:{" "}
                                    {tool.creates.map((entry, index) => (
                                        <span key={entry.path}>
                                            {index > 0 ? " and " : ""}
                                            <code>{entry.path}</code>
                                        </span>
                                    ))}
                                </p>

                                <button className="setup-guide-trigger" type="button" onClick={() => openGuide(tool.key)}>
                                    View step-by-step setup <span aria-hidden="true">&rarr;</span>
                                </button>
                            </article>
                        );
                    })}
                </div>

                <div className="setup-universal">
                    <div>
                        <span>Universal setup</span>
                        <p>
                            Runs the local install for Claude Code, Codex and Cursor in one pass, then prints the Skill URL and Knowledge instructions for
                            Lovable, since Lovable cannot read local project files.
                        </p>
                    </div>
                    <div className="command">
                        <code>{UNIVERSAL_SETUP_COMMAND}</code>
                        <CopyButton value={UNIVERSAL_SETUP_COMMAND}>Copy</CopyButton>
                    </div>
                </div>
            </div>

            <SetupDialog tool={TOOL_SETUPS[selected]} openToken={openToken} />
        </section>
    );
}
