"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { Button as AriaButton, Disclosure as AriaDisclosure, DisclosurePanel as AriaDisclosurePanel } from "react-aria-components";
import { ChevronDown, Tool02 } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { BadgeWithDot } from "../../base/badges/badges";
import type { CodeLanguage } from "../code-snippet/code-snippet";
import { CodeSnippet } from "../code-snippet/code-snippet";

/** Lifecycle of one tool call. */
export type AIToolCallStatus = "pending" | "running" | "completed" | "error";

export const styles = sortCx({
    root: "bg-primary ring-secondary w-full overflow-hidden rounded-xl ring-1 ring-inset",
    trigger:
        "hover:bg-primary_hover outline-focus-ring flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-start transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2",
    icon: "text-fg-quaternary size-4 shrink-0",
    name: "text-secondary min-w-0 flex-1 truncate font-mono text-sm font-medium",
    chevron: "text-fg-quaternary size-4 shrink-0 transition-transform duration-150 ease-out motion-reduce:transition-none",
    panel: "border-secondary flex flex-col gap-3 border-t p-3",
    section: "flex flex-col gap-1.5",
    sectionLabel: "text-tertiary text-xs font-medium",
    error: "bg-error-primary text-error-primary ring-error_subtle rounded-lg px-3 py-2 text-sm ring-1 ring-inset",
});

const statusBadge: Record<AIToolCallStatus, { color: "gray" | "brand" | "success" | "error"; label: string }> = {
    pending: { color: "gray", label: "Pending" },
    running: { color: "brand", label: "Running" },
    completed: { color: "success", label: "Completed" },
    error: { color: "error", label: "Error" },
};

const stringify = (value: unknown): string => {
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value, null, 2) ?? String(value);
    } catch {
        return String(value);
    }
};

export interface AIToolCallProps {
    /** Name of the tool the model called, e.g. `search_docs`. */
    name: string;
    /** Where the call is in its lifecycle. @default "pending" */
    status?: AIToolCallStatus;
    /** Labels for each status badge, e.g. for localisation. */
    statusLabels?: Partial<Record<AIToolCallStatus, string>>;
    /** Arguments the model passed. Objects are pretty-printed as JSON; strings render as-is. */
    input?: unknown;
    /** What the tool returned. Objects are pretty-printed as JSON; strings render as-is. */
    output?: unknown;
    /** Error message shown when `status` is `error`. */
    errorText?: ReactNode;
    /** Grammar used to highlight `input` and `output`. @default "json" */
    language?: CodeLanguage;
    /** Label above the input pane. @default "Parameters" */
    inputLabel?: string;
    /** Label above the output pane. @default "Result" */
    outputLabel?: string;
    /** Whether the panes start open. @default false */
    defaultExpanded?: boolean;
    /** Controlled open state. */
    isExpanded?: boolean;
    /** Called when the panes open or close. */
    onExpandedChange?: (isExpanded: boolean) => void;
    /** Additional classes merged onto the card. */
    className?: string;
}

/** One tool invocation: its name and status, with its input and output in collapsible code panes. */
export const AIToolCall = ({
    name,
    status = "pending",
    statusLabels,
    input,
    output,
    errorText,
    language = "json",
    inputLabel = "Parameters",
    outputLabel = "Result",
    defaultExpanded,
    isExpanded,
    onExpandedChange,
    className,
}: AIToolCallProps) => {
    const badge = statusBadge[status];
    const inputCode = useMemo(() => (input === undefined ? undefined : stringify(input)), [input]);
    const outputCode = useMemo(() => (output === undefined ? undefined : stringify(output)), [output]);

    return (
        <AriaDisclosure defaultExpanded={defaultExpanded} isExpanded={isExpanded} onExpandedChange={onExpandedChange} className={cx(styles.root, className)}>
            {({ isExpanded: expanded }) => (
                <>
                    <AriaButton slot="trigger" className={styles.trigger}>
                        <Tool02 aria-hidden="true" className={styles.icon} />
                        <span className={styles.name}>{name}</span>
                        <BadgeWithDot
                            type="pill-color"
                            size="sm"
                            color={badge.color}
                            className={cx(status === "running" && "animate-pulse motion-reduce:animate-none")}
                        >
                            {statusLabels?.[status] ?? badge.label}
                        </BadgeWithDot>
                        <ChevronDown aria-hidden="true" className={cx(styles.chevron, expanded && "rotate-180")} />
                    </AriaButton>

                    <AriaDisclosurePanel>
                        <div className={styles.panel}>
                            {inputCode !== undefined && (
                                <div className={styles.section}>
                                    <p className={styles.sectionLabel}>{inputLabel}</p>
                                    <CodeSnippet code={inputCode} language={language} aria-label={`${inputLabel} of ${name}`} />
                                </div>
                            )}

                            {status === "error" && errorText && (
                                <div className={styles.section}>
                                    <p className={styles.sectionLabel}>{outputLabel}</p>
                                    <p className={styles.error}>{errorText}</p>
                                </div>
                            )}

                            {status !== "error" && outputCode !== undefined && (
                                <div className={styles.section}>
                                    <p className={styles.sectionLabel}>{outputLabel}</p>
                                    <CodeSnippet code={outputCode} language={language} aria-label={`${outputLabel} of ${name}`} />
                                </div>
                            )}
                        </div>
                    </AriaDisclosurePanel>
                </>
            )}
        </AriaDisclosure>
    );
};
