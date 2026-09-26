"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button as AriaButton, Disclosure as AriaDisclosure, DisclosurePanel as AriaDisclosurePanel } from "react-aria-components";
import { ChevronDown, Lightbulb02 } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";

export const styles = sortCx({
    root: "group/ai-reasoning flex w-full flex-col",
    trigger:
        "text-tertiary hover:text-secondary outline-focus-ring flex w-max max-w-full cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
    icon: "text-fg-quaternary size-4 shrink-0",
    chevron: "text-fg-quaternary size-4 shrink-0 transition-transform duration-150 ease-out motion-reduce:transition-none",
    streamingLabel: "animate-pulse motion-reduce:animate-none",
    panel: "border-secondary text-tertiary mt-2 border-s-2 ps-3 text-sm whitespace-pre-wrap",
});

/** Formats a duration in seconds as the collapsed label, e.g. `Thought for 12 seconds`. */
const defaultDoneLabel = (duration?: number) => {
    if (duration === undefined) return "Reasoning";
    if (duration < 1) return "Thought for a moment";
    const seconds = Math.round(duration);
    return `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
};

export interface AIReasoningProps {
    /**
     * Whether the model is still reasoning. The block opens when streaming starts and collapses
     * again when it ends; the reader can still toggle it either way.
     *
     * @default false
     */
    isStreaming?: boolean;
    /** How long the model reasoned, in seconds. Shown in the collapsed label. */
    duration?: number;
    /** Label shown while streaming. @default "Thinking…" */
    streamingLabel?: ReactNode;
    /** Label shown once done. Defaults to `Thought for N seconds`, or `Reasoning` without a `duration`. */
    label?: ReactNode;
    /** Whether the block starts open. Ignored while streaming, which always opens it. @default false */
    defaultExpanded?: boolean;
    /** Controlled open state. When set, the automatic open/collapse is up to you. */
    isExpanded?: boolean;
    /** Called when the block opens or closes. */
    onExpandedChange?: (isExpanded: boolean) => void;
    /** The reasoning text. */
    children?: ReactNode;
    /** Additional classes merged onto the block. */
    className?: string;
}

/**
 * The model's "thinking" shown as a disclosure: open and pulsing while it streams, collapsed to
 * a one-line summary with the time it took once the answer starts.
 */
export const AIReasoning = ({
    isStreaming = false,
    duration,
    streamingLabel = "Thinking…",
    label,
    defaultExpanded = false,
    isExpanded: isExpandedProp,
    onExpandedChange,
    children,
    className,
}: AIReasoningProps) => {
    const [isExpandedState, setIsExpandedState] = useState(isStreaming || defaultExpanded);
    const [wasStreaming, setWasStreaming] = useState(isStreaming);

    // Open when streaming starts, collapse when it finishes. Adjusting state during render (rather
    // than in an effect) avoids painting one frame in the stale state.
    if (isStreaming !== wasStreaming) {
        setWasStreaming(isStreaming);
        setIsExpandedState(isStreaming);
    }

    const isExpanded = isExpandedProp ?? isExpandedState;

    return (
        <AriaDisclosure
            isExpanded={isExpanded}
            onExpandedChange={(next) => {
                setIsExpandedState(next);
                onExpandedChange?.(next);
            }}
            className={cx(styles.root, className)}
        >
            <AriaButton slot="trigger" className={styles.trigger}>
                <Lightbulb02 aria-hidden="true" className={styles.icon} />
                <span className={cx("truncate", isStreaming && styles.streamingLabel)}>
                    {isStreaming ? streamingLabel : (label ?? defaultDoneLabel(duration))}
                </span>
                <ChevronDown aria-hidden="true" className={cx(styles.chevron, isExpanded && "rotate-180")} />
            </AriaButton>
            <AriaDisclosurePanel className={styles.panel}>{children}</AriaDisclosurePanel>
        </AriaDisclosure>
    );
};
