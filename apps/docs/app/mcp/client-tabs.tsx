"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { CopyButton } from "~/components/landing/copy-button";
import { CLIENTS } from "./clients";
import { Inline } from "./inline";

/**
 * The per-client setup tabs on `/mcp`. Same ARIA pattern as the landing's example showcase: a
 * `tablist` with roving tabindex, Arrow/Home/End keys, and one `tabpanel` mounted at a time.
 */
export function ClientTabs() {
    const [activeId, setActiveId] = useState(CLIENTS[0]!.id);
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const activeIndex = CLIENTS.findIndex((client) => client.id === activeId);
    const active = CLIENTS[activeIndex]!;

    const selectByIndex = (index: number) => {
        const target = CLIENTS[(index + CLIENTS.length) % CLIENTS.length]!;
        setActiveId(target.id);
        tabRefs.current[CLIENTS.indexOf(target)]?.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case "ArrowRight":
                event.preventDefault();
                selectByIndex(activeIndex + 1);
                break;
            case "ArrowLeft":
                event.preventDefault();
                selectByIndex(activeIndex - 1);
                break;
            case "Home":
                event.preventDefault();
                selectByIndex(0);
                break;
            case "End":
                event.preventDefault();
                selectByIndex(CLIENTS.length - 1);
                break;
            default:
                break;
        }
    };

    return (
        <div className="mcp-tabs">
            {/* The tablist is never a tab stop (focus lives on the active tab), but jsx-a11y wants an explicit tabIndex on an element with an interactive role. */}
            <div className="mcp-tablist" role="tablist" aria-label="MCP clients" tabIndex={-1} onKeyDown={onKeyDown}>
                {CLIENTS.map((client, index) => (
                    <button
                        key={client.id}
                        ref={(el) => {
                            tabRefs.current[index] = el;
                        }}
                        role="tab"
                        type="button"
                        id={`mcp-tab-${client.id}`}
                        aria-selected={client.id === activeId}
                        aria-controls={`mcp-panel-${client.id}`}
                        tabIndex={client.id === activeId ? 0 : -1}
                        className="mcp-tab"
                        onClick={() => setActiveId(client.id)}
                    >
                        {client.label}
                    </button>
                ))}
            </div>

            <div id={`mcp-panel-${active.id}`} role="tabpanel" aria-labelledby={`mcp-tab-${active.id}`} tabIndex={0} className="mcp-panel">
                <h3>{active.label}</h3>
                <p className="mcp-panel-intro">
                    <Inline text={active.intro} />
                </p>

                <div className="mcp-commands">
                    {active.commands.map((command) => (
                        <div className="mcp-command" key={command.label}>
                            <span>{command.label}</span>
                            <div className="command">
                                <code>{command.value}</code>
                                <CopyButton value={command.value}>Copy</CopyButton>
                            </div>
                        </div>
                    ))}
                </div>

                <ol className="mcp-steps-list">
                    {active.steps.map((step) => (
                        <li key={step}>
                            <Inline text={step} />
                        </li>
                    ))}
                </ol>

                <p className="mcp-source">
                    Syntax checked against{" "}
                    <a href={active.source.href} target="_blank" rel="noreferrer">
                        {active.source.label}
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
