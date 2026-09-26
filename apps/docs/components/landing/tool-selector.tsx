"use client";

import { useRef, useState } from "react";
import { CopyButton } from "~/components/landing/copy-button";
import { TOOL_ORDER, TOOL_SETUPS, type ToolKey, createsLabel } from "~/components/landing/tool-setup";

/**
 * Hero interactive block (brief Priority 1): the CTA row, the microproof line, the five-tool
 * radiogroup and the setup preview card that updates with it. Kept as one client component so
 * the primary CTA ("Set up your agent") can find and focus the fieldset's checked radio.
 *
 * This is a compact, at-a-glance preview. The full, dialog-backed setup instructions for every
 * tool live in the separate "setup" section (`sections/agent-setup.tsx`); the two intentionally
 * duplicate the same verified data from `tool-setup.ts` at different levels of detail.
 */
export function ToolSelector({ microproof }: { microproof: string[] }) {
    const [selected, setSelected] = useState<ToolKey>("claude");
    const fieldsetRef = useRef<HTMLFieldSetElement>(null);
    const tool = TOOL_SETUPS[selected];

    const focusToolSelector = () => {
        const checked = fieldsetRef.current?.querySelector<HTMLInputElement>('input[name="hero-tool"]:checked');
        if (!checked) return;
        checked.scrollIntoView({ behavior: "smooth", block: "center" });
        checked.focus();
    };

    return (
        <>
            <div className="hero-actions">
                <button type="button" className="button button-primary button-xl" onClick={focusToolSelector}>
                    Set up your agent
                </button>
                <a className="button button-secondary button-xl" href="#examples">
                    Explore components
                </a>
            </div>

            <p className="hero-microproof">
                {microproof.map((item, index) => (
                    <span key={item}>
                        <span className="hero-microproof-item">
                            {item}
                            {index < microproof.length - 1 ? " ·" : ""}
                        </span>{" "}
                    </span>
                ))}
            </p>

            <fieldset className="tool-selector" ref={fieldsetRef}>
                <legend>Pick the tool you build with</legend>
                <div className="tool-options">
                    {TOOL_ORDER.map((key) => {
                        const option = TOOL_SETUPS[key];
                        return (
                            <span className="tool-option" key={key}>
                                <input
                                    type="radio"
                                    name="hero-tool"
                                    id={`hero-tool-${key}`}
                                    value={key}
                                    checked={selected === key}
                                    onChange={() => setSelected(key)}
                                />
                                <label htmlFor={`hero-tool-${key}`}>
                                    <img src={option.logo} alt="" />
                                    {option.name}
                                </label>
                            </span>
                        );
                    })}
                </div>
            </fieldset>

            <div className="hero-setup-wrap">
                <div className="hero-setup" aria-live="polite">
                    <div className="hero-setup-head">
                        <span className="hero-setup-mark" aria-hidden="true">
                            <img src={tool.logo} alt="" />
                        </span>
                        <strong>{tool.name}</strong>
                    </div>

                    <div className="hero-setup-value">
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

                    <p className="hero-setup-creates">
                        {createsLabel(tool)}:{" "}
                        {tool.creates.map((entry, index) => (
                            <span key={entry.path}>
                                {index > 0 ? "; " : ""}
                                <code>{entry.path}</code> ({entry.note})
                            </span>
                        ))}
                    </p>

                    {tool.note ? <p className="hero-setup-note">{tool.note}</p> : null}

                    <div className="hero-setup-prompt">
                        <span>Then ask it</span>
                        <p>{tool.prompt}</p>
                        <CopyButton value={tool.prompt} successLabel="Copied">
                            Copy prompt
                        </CopyButton>
                    </div>
                </div>
            </div>
        </>
    );
}
