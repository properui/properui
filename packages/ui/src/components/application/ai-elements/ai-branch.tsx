"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { ButtonUtility } from "../../base/buttons/button-utility";

export interface AIBranchProps {
    /** How many alternatives exist, e.g. after regenerating a response twice. */
    count: number;
    /** The zero-based index of the alternative shown (controlled). */
    index?: number;
    /** The initially shown alternative (uncontrolled). @default count - 1, the newest */
    defaultIndex?: number;
    /** Called with the zero-based index of the alternative to show. */
    onIndexChange?: (index: number) => void;
    /** What an alternative is called in the button labels and the group name. @default "response" */
    noun?: string;
    /** Additional classes merged onto the group. */
    className?: string;
}

/** A `2 / 3` pager for switching between regenerated alternatives of a message. */
export const AIBranch = ({ count, index: indexProp, defaultIndex, onIndexChange, noun = "response", className }: AIBranchProps) => {
    const [indexState, setIndexState] = useState(defaultIndex ?? Math.max(0, count - 1));
    const index = Math.min(Math.max(indexProp ?? indexState, 0), Math.max(0, count - 1));

    const go = (next: number) => {
        if (indexProp === undefined) setIndexState(next);
        onIndexChange?.(next);
    };

    return (
        <div role="group" aria-label={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} versions`} className={cx("flex items-center gap-0.5", className)}>
            <ButtonUtility
                size="xs"
                color="tertiary"
                icon={ChevronLeft}
                aria-label={`Previous ${noun}`}
                isDisabled={index <= 0}
                onPress={() => go(index - 1)}
                className="rtl:-scale-x-100"
            />
            <span aria-live="polite" className="text-tertiary min-w-10 text-center text-xs font-medium tabular-nums">
                <span className="sr-only">{`${noun.charAt(0).toUpperCase()}${noun.slice(1)} `}</span>
                {index + 1} / {count}
            </span>
            <ButtonUtility
                size="xs"
                color="tertiary"
                icon={ChevronRight}
                aria-label={`Next ${noun}`}
                isDisabled={index >= count - 1}
                onPress={() => go(index + 1)}
                className="rtl:-scale-x-100"
            />
        </div>
    );
};
