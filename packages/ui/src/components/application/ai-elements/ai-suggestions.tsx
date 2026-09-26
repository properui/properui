"use client";

import type { FC, ReactNode } from "react";
import { createContext, useContext } from "react";
import { Button as AriaButton } from "react-aria-components";
import { cx, sortCx } from "../../../utils/cx";

export const styles = sortCx({
    root: "scrollbar-hide -mx-1 flex w-full snap-x gap-2 overflow-x-auto px-1 py-1",
    item: "flex shrink-0 snap-start",
    chip: [
        "bg-primary text-secondary ring-primary shadow-xs outline-focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap ring-1 transition duration-100 ease-linear ring-inset",
        "hover:bg-primary_hover hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    icon: "text-fg-quaternary size-4 shrink-0",
});

interface AISuggestionsContextValue {
    onSelect?: (suggestion: string) => void;
    isDisabled?: boolean;
}

const AISuggestionsContext = createContext<AISuggestionsContextValue>({});

export interface AISuggestionsProps {
    /** Accessible name of the list. @default "Suggested follow-ups" */
    "aria-label"?: string;
    /** Called with a suggestion's text when it is pressed, e.g. to send it as the next prompt. */
    onSelect?: (suggestion: string) => void;
    /** Disables every suggestion, e.g. while a response is streaming. */
    isDisabled?: boolean;
    /** `AISuggestions.Item` entries. */
    children: ReactNode;
    /** Additional classes merged onto the list. */
    className?: string;
}

/** A single, horizontally scrolling row of follow-up prompts. */
const AISuggestionsRoot = ({ "aria-label": ariaLabel = "Suggested follow-ups", onSelect, isDisabled, children, className }: AISuggestionsProps) => (
    <AISuggestionsContext.Provider value={{ onSelect, isDisabled }}>
        <ul aria-label={ariaLabel} className={cx(styles.root, className)}>
            {children}
        </ul>
    </AISuggestionsContext.Provider>
);

export interface AISuggestionsItemProps {
    /** The prompt text. Passed to `onSelect`, and shown on the chip unless `children` is given. */
    suggestion: string;
    /** Optional icon component reference shown before the text. */
    icon?: FC<{ className?: string }>;
    /** Replaces the visible chip content. */
    children?: ReactNode;
    /** Disables this suggestion. */
    isDisabled?: boolean;
    /** Additional classes merged onto the chip. */
    className?: string;
}

/** One follow-up prompt chip. */
const AISuggestionsItem = ({ suggestion, icon: Icon, children, isDisabled, className }: AISuggestionsItemProps) => {
    const context = useContext(AISuggestionsContext);

    return (
        <li className={styles.item}>
            <AriaButton isDisabled={isDisabled ?? context.isDisabled} onPress={() => context.onSelect?.(suggestion)} className={cx(styles.chip, className)}>
                {Icon && <Icon aria-hidden="true" className={styles.icon} />}
                {children ?? suggestion}
            </AriaButton>
        </li>
    );
};

export const AISuggestions = Object.assign(AISuggestionsRoot, {
    Item: AISuggestionsItem,
});
