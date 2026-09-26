"use client";

import type { ReactNode, RefObject } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { Button } from "../../base/buttons/button";

export const styles = sortCx({
    root: "relative flex min-h-0 flex-col overflow-hidden",
    scroller: "outline-focus-ring min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2",
    content: "flex flex-col gap-6 p-4",
    scrollButton: "absolute bottom-4 start-1/2 z-10 -translate-x-1/2 rounded-full shadow-lg rtl:translate-x-1/2",
});

/** How close to the bottom, in pixels, still counts as "at the bottom". */
const BOTTOM_THRESHOLD = 32;

interface AIConversationContextValue {
    scrollRef: RefObject<HTMLDivElement | null>;
    contentRef: RefObject<HTMLDivElement | null>;
    isAtBottom: boolean;
    isStreaming: boolean;
    ariaLabel: string;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
    onScroll: () => void;
}

const AIConversationContext = createContext<AIConversationContextValue | null>(null);

const useConversation = (component: string) => {
    const context = useContext(AIConversationContext);
    if (!context) throw new Error(`${component} must be rendered inside <AIConversation>.`);
    return context;
};

const prefersReducedMotion = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface AIConversationProps {
    /** Accessible name of the message log. @default "Conversation" */
    "aria-label"?: string;
    /**
     * Whether a response is streaming in. The log is marked `aria-busy` meanwhile, so screen
     * readers announce the finished message once instead of every chunk.
     *
     * @default false
     */
    isStreaming?: boolean;
    /** `AIConversation.Content` and `AIConversation.ScrollButton`. */
    children: ReactNode;
    /** Additional classes merged onto the container. Give it a height (or a flex parent) so it can scroll. */
    className?: string;
}

/**
 * A scrolling message log that sticks to the bottom while new content arrives, and lets go as
 * soon as the reader scrolls up to re-read something.
 */
const AIConversationRoot = ({ "aria-label": ariaLabel = "Conversation", isStreaming = false, children, className }: AIConversationProps) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    // Whether new content should pull the view down. Kept in a ref so growth can read it without re-rendering.
    const stickRef = useRef(true);
    const lastScrollTopRef = useRef(0);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        const element = scrollRef.current;
        if (!element) return;
        stickRef.current = true;
        setIsAtBottom(true);
        const top = element.scrollHeight;
        if (typeof element.scrollTo === "function") {
            element.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : behavior });
        } else {
            element.scrollTop = top;
        }
    }, []);

    const onScroll = useCallback(() => {
        const element = scrollRef.current;
        if (!element) return;
        const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= BOTTOM_THRESHOLD;
        const scrolledUp = element.scrollTop < lastScrollTopRef.current - 1;
        lastScrollTopRef.current = element.scrollTop;

        // Reaching the bottom re-attaches; only an upward scroll detaches. A smooth scroll on its
        // way down after "scroll to bottom" is neither, so it keeps the view attached.
        if (atBottom) stickRef.current = true;
        else if (scrolledUp) stickRef.current = false;
        setIsAtBottom(stickRef.current);
    }, []);

    // Follow the content as it grows (new messages, streamed tokens, expanding panels) while stuck.
    useEffect(() => {
        const content = contentRef.current;
        const element = scrollRef.current;
        if (!content || !element) return;

        const follow = () => {
            if (stickRef.current) element.scrollTop = element.scrollHeight;
        };
        follow();

        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(follow);
        observer.observe(content);
        return () => observer.disconnect();
    }, []);

    const value = useMemo(
        () => ({ scrollRef, contentRef, isAtBottom, isStreaming, ariaLabel, scrollToBottom, onScroll }),
        [isAtBottom, isStreaming, ariaLabel, scrollToBottom, onScroll],
    );

    return (
        <AIConversationContext.Provider value={value}>
            <div className={cx(styles.root, className)}>{children}</div>
        </AIConversationContext.Provider>
    );
};

export interface AIConversationContentProps {
    /** The messages, typically `AIMessage` elements, oldest first. */
    children: ReactNode;
    /** Additional classes merged onto the inner column. */
    className?: string;
}

/** The scrollable, keyboard-focusable log that holds the messages. */
const AIConversationContent = ({ children, className }: AIConversationContentProps) => {
    const { scrollRef, contentRef, isStreaming, ariaLabel, onScroll } = useConversation("AIConversation.Content");

    return (
        <div
            ref={scrollRef}
            role="log"
            aria-label={ariaLabel}
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={isStreaming || undefined}
            // A scrollable region must be reachable by keyboard (WCAG 2.1.1).
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            onScroll={onScroll}
            className={styles.scroller}
        >
            <div ref={contentRef} className={cx(styles.content, className)}>
                {children}
            </div>
        </div>
    );
};

export interface AIConversationScrollButtonProps {
    /** Accessible name of the button. @default "Scroll to latest message" */
    label?: string;
    /** Additional classes merged onto the button. */
    className?: string;
}

/** Appears once the reader has scrolled away from the latest message, and jumps back to it. */
const AIConversationScrollButton = ({ label = "Scroll to latest message", className }: AIConversationScrollButtonProps) => {
    const { isAtBottom, scrollToBottom } = useConversation("AIConversation.ScrollButton");

    if (isAtBottom) return null;

    return (
        <Button
            size="sm"
            color="secondary"
            iconLeading={ArrowDown}
            aria-label={label}
            onPress={() => scrollToBottom()}
            className={cx(styles.scrollButton, className)}
        />
    );
};

export const AIConversation = Object.assign(AIConversationRoot, {
    Content: AIConversationContent,
    ScrollButton: AIConversationScrollButton,
});
