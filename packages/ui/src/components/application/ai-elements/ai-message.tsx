"use client";

import type { FC, ReactNode } from "react";
import { Children, createContext, useContext } from "react";
import { cx, sortCx } from "../../../utils/cx";
import { ButtonUtility } from "../../base/buttons/button-utility";

/** Who wrote a message: the person using the app, or the model answering them. */
export type AIMessageRole = "user" | "assistant";

export const styles = sortCx({
    root: {
        common: "group/ai-message flex w-full items-start gap-3",
        user: "flex-row-reverse",
        assistant: "",
    },
    body: {
        common: "flex min-w-0 flex-col gap-1.5",
        user: "max-w-4/5 items-end",
        assistant: "flex-1",
    },
    header: "flex items-center gap-2",
    name: "text-secondary truncate text-sm font-medium not-italic",
    time: "text-tertiary text-xs",
    content: {
        common: "text-md text-primary wrap-break-word",
        user: "bg-secondary ring-secondary rounded-xl rounded-se-sm px-3.5 py-2.5 whitespace-pre-wrap ring-1 ring-inset",
        assistant: "w-full",
    },
    /** The blinking bar appended to text that is still arriving. */
    caret: "animate-caret-blink bg-fg-brand-primary ms-0.5 inline-block h-4 w-1.5 translate-y-0.5 rounded-xs motion-reduce:animate-none",
    /** Placeholder lines shown before the first token of a response arrives. */
    shimmer: "bg-tertiary h-3 animate-pulse rounded-full motion-reduce:animate-none",
    actions: "-ms-1.5 flex items-center gap-0.5",
});

interface AIMessageContextValue {
    role: AIMessageRole;
    isStreaming: boolean;
}

const AIMessageContext = createContext<AIMessageContextValue | null>(null);

/** The role and streaming state of the enclosing `AIMessage`, or `null` outside one. */
export const useAIMessage = () => useContext(AIMessageContext);

export interface AIStreamingCaretProps {
    /** Additional classes merged onto the caret. */
    className?: string;
}

/** The blinking cursor appended to text that is still streaming in. Purely decorative. */
export const AIStreamingCaret = ({ className }: AIStreamingCaretProps) => <span aria-hidden="true" data-ai-caret="" className={cx(styles.caret, className)} />;

const defaultNames: Record<AIMessageRole, string> = { user: "You", assistant: "Assistant" };

export interface AIMessageProps {
    /**
     * Who wrote the message. User messages sit in a bubble at the end of the row; assistant
     * messages span it. Named `from` rather than `role` so it never reads as (or lints as) an
     * ARIA role; pass a chat hook's `message.role` straight through.
     */
    from: AIMessageRole;
    /**
     * Name of the author. Shown above the message when given; otherwise `You` or `Assistant` is
     * still announced to screen readers so every message is attributed.
     */
    name?: string;
    /** Avatar slot, e.g. `<Avatar size="sm" … />`. Rendered on the start side for assistant messages and the end side for user messages. */
    avatar?: ReactNode;
    /** Human readable timestamp, e.g. `2:20pm`. */
    time?: string;
    /** Machine readable value of the `<time>` element. Falls back to `time`. */
    dateTime?: string;
    /**
     * Whether the message is still being generated. With no content yet it renders shimmering
     * placeholder lines; with content it appends a blinking caret (an `AIResponse` inside picks
     * this up automatically). Sets `aria-busy` so assistive technology waits for the full text.
     *
     * @default false
     */
    isStreaming?: boolean;
    /** Label announced while the message has no content yet. @default "Generating response" */
    pendingLabel?: string;
    /** Action row under the message, typically `<AIMessage.Actions>`. */
    actions?: ReactNode;
    /** The message content: a string, an `AIResponse`, or any mix of AI elements. */
    children?: ReactNode;
    /** Additional classes merged onto the message. */
    className?: string;
}

/** `Children.toArray` already drops `null`, `undefined` and booleans; an empty string is empty too. */
const isEmpty = (children: ReactNode) => Children.toArray(children).every((child) => child === "");

const AIMessageRoot = ({
    from: role,
    name,
    avatar,
    time,
    dateTime,
    isStreaming = false,
    pendingLabel = "Generating response",
    actions,
    children,
    className,
}: AIMessageProps) => {
    const empty = isEmpty(children);
    const isText = typeof children === "string" || typeof children === "number";

    return (
        <AIMessageContext.Provider value={{ role, isStreaming }}>
            <article data-role={role} aria-busy={isStreaming || undefined} className={cx(styles.root.common, styles.root[role], className)}>
                {avatar && <div className="shrink-0">{avatar}</div>}

                <div className={cx(styles.body.common, styles.body[role])}>
                    <header className={cx(styles.header, !name && !time && "sr-only")}>
                        <cite className={cx(styles.name, !name && "sr-only")}>{name ?? defaultNames[role]}</cite>
                        {time && (
                            <time dateTime={dateTime ?? time} className={styles.time}>
                                {time}
                            </time>
                        )}
                    </header>

                    {empty && isStreaming ? (
                        <div role="status" className="flex w-full max-w-md flex-col gap-2 py-1.5">
                            <span className="sr-only">{pendingLabel}</span>
                            <span aria-hidden="true" className={cx(styles.shimmer, "w-full")} />
                            <span aria-hidden="true" className={cx(styles.shimmer, "w-4/5")} />
                            <span aria-hidden="true" className={cx(styles.shimmer, "w-3/5")} />
                        </div>
                    ) : (
                        !empty && (
                            <div className={cx(styles.content.common, styles.content[role])}>
                                {isText ? (
                                    <p>
                                        {children}
                                        {isStreaming && <AIStreamingCaret />}
                                    </p>
                                ) : (
                                    children
                                )}
                            </div>
                        )
                    )}

                    {actions}
                </div>
            </article>
        </AIMessageContext.Provider>
    );
};

export interface AIMessageActionsProps {
    /** Accessible name of the group. @default "Message actions" */
    "aria-label"?: string;
    /** `AIMessage.Action` buttons. */
    children: ReactNode;
    /** Additional classes merged onto the group. */
    className?: string;
}

/** The row of actions under a message: copy, regenerate, feedback. */
const AIMessageActions = ({ "aria-label": ariaLabel = "Message actions", children, className }: AIMessageActionsProps) => (
    <div role="group" aria-label={ariaLabel} className={cx(styles.actions, className)}>
        {children}
    </div>
);

export interface AIMessageActionProps {
    /** Accessible name of the action, also shown as its tooltip, e.g. `Copy`. */
    label: string;
    /** Icon component reference rendered inside the button. */
    icon: FC<{ className?: string }>;
    /** Called when the action is pressed. */
    onPress?: () => void;
    /**
     * Makes the action a toggle (e.g. thumbs up) and sets its pressed state. Leave undefined
     * for a plain action.
     */
    isSelected?: boolean;
    /** Whether the action is disabled. */
    isDisabled?: boolean;
    /** Additional classes merged onto the button. */
    className?: string;
}

/** One icon button in `AIMessage.Actions`, with a tooltip carrying its label. */
const AIMessageAction = ({ label, icon, onPress, isSelected, isDisabled, className }: AIMessageActionProps) => (
    <ButtonUtility
        size="xs"
        color="tertiary"
        icon={icon}
        tooltip={label}
        aria-label={label}
        aria-pressed={isSelected}
        onPress={onPress}
        isDisabled={isDisabled}
        className={cx(isSelected && "bg-primary_hover text-fg-brand-primary hover:text-fg-brand-primary", className)}
    />
);

export const AIMessage = Object.assign(AIMessageRoot, {
    Actions: AIMessageActions,
    Action: AIMessageAction,
});
