"use client";

import { useEffect, useRef } from "react";
import { SetupAnimation } from "./animations/setup-animation";
import { CopyButton } from "./copy-button";
import { DIALOG_STEPS } from "./setup-guides";
import { type ToolSetup, createsLabel } from "./tool-setup";

type SetupDialogProps = {
    tool: ToolSetup;
    /**
     * Bumped on every "View step-by-step setup" click, including re-clicking the card whose
     * dialog is already loaded. A plain `tool` prop isn't enough to trigger a re-open: if the
     * dialog was closed (Escape, backdrop click, the close button) and the visitor clicks the
     * *same* card's trigger again, `tool` doesn't change identity, so an effect keyed on it alone
     * would never fire `showModal()` again. Keying the effect on this ever-incrementing counter
     * instead makes every click open the dialog.
     */
    openToken: number;
};

/**
 * A single native `<dialog>` whose content is swapped for whichever tool's "View step-by-step
 * setup" button was pressed. Native `<dialog>` gives Escape-to-close, a focus trap while open,
 * and focus return to the triggering button on close for free; `landing-setup.css` styles the
 * element and its `::backdrop`.
 */
export function SetupDialog({ tool, openToken }: SetupDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = "setup-dialog-title";

    useEffect(() => {
        if (openToken === 0) return; // initial render: nothing has been clicked yet
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
    }, [openToken]);

    const steps = DIALOG_STEPS[tool.key];

    return (
        // Click-outside-to-close: a click that lands on the <dialog> element itself (not one of
        // its children) hit the backdrop area, so close it.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <dialog
            ref={dialogRef}
            className="setup-dialog"
            aria-labelledby={titleId}
            onClick={(event) => {
                if (event.target === dialogRef.current) dialogRef.current?.close();
            }}
        >
            <button className="setup-dialog-close" type="button" aria-label="Close setup guide" onClick={() => dialogRef.current?.close()}>
                &times;
            </button>

            <div className="setup-dialog-head">
                <span className="setup-mark" aria-hidden="true">
                    <img src={tool.logo} alt="" />
                </span>
                <div>
                    <small>Step-by-step setup</small>
                    <strong id={titleId}>{tool.name}</strong>
                </div>
            </div>

            <SetupAnimation tool={tool.key} />

            <ol className="setup-dialog-steps">
                {steps.map((step) => (
                    <li key={step.title}>
                        <div>
                            <strong>{step.title}</strong>
                            <span>{step.description(tool)}</span>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="setup-dialog-block">
                <span>{tool.valueLabel}</span>
                <div className="command">
                    <code>{tool.copyValue}</code>
                    <CopyButton value={tool.copyValue}>{tool.copyLabel}</CopyButton>
                </div>
                {tool.note ? <p className="setup-note">{tool.note}</p> : null}
                <p className="setup-dialog-creates">
                    {createsLabel(tool)}{" "}
                    {tool.creates.map((entry, index) => (
                        <span key={entry.path}>
                            {index > 0 ? " and " : ""}
                            <code>{entry.path}</code>
                        </span>
                    ))}
                </p>
            </div>

            <div className="setup-dialog-block">
                <span>Then ask your agent</span>
                <p className="setup-dialog-prompt-text">{tool.prompt}</p>
                <CopyButton value={tool.prompt} successLabel="Prompt copied" className="setup-prompt-copy">
                    Copy example prompt
                </CopyButton>
            </div>
        </dialog>
    );
}
