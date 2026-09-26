"use client";

import type { FC, ReactNode } from "react";
import { createContext, useContext } from "react";
import { cx, sortCx } from "../../../utils/cx";

/** How the entries are laid out. */
export type TimelineVariant = "vertical" | "alternating" | "horizontal";

/** How far along an entry is. */
export type TimelineItemStatus = "completed" | "current" | "upcoming";

/** An explicit semantic color for the dot, overriding the default that `status` picks. */
export type TimelineItemColor = "brand" | "success" | "warning" | "error" | "gray";

const styles = sortCx({
    status: {
        completed: { dot: "bg-success-solid text-fg-white", connector: "bg-success-solid", title: "text-secondary" },
        current: {
            dot: "bg-brand-solid text-fg-white ring-2 ring-focus-ring ring-offset-2 ring-offset-bg-primary",
            connector: "bg-border-secondary",
            title: "text-brand-secondary",
        },
        upcoming: { dot: "bg-primary text-quaternary ring-1 ring-secondary ring-inset", connector: "bg-border-secondary", title: "text-tertiary" },
    },
    color: {
        brand: "bg-brand-solid text-fg-white",
        success: "bg-success-solid text-fg-white",
        warning: "bg-warning-solid text-fg-white",
        error: "bg-error-solid text-fg-white",
        gray: "bg-fg-quaternary text-fg-white",
    },
});

const TimelineContext = createContext<TimelineVariant>("vertical");

export interface TimelineProps {
    /**
     * How the entries are laid out: a single column, a column alternating left and right of a
     * center line, or a row.
     *
     * @default "vertical"
     */
    variant?: TimelineVariant;
    /** The accessible label of the list. */
    "aria-label"?: string;
    /** `Timeline.Item` entries, in order. */
    children: ReactNode;
    /** Additional classes merged onto the list element. */
    className?: string;
}

const TimelineRoot = ({ variant = "vertical", "aria-label": ariaLabel, children, className }: TimelineProps) => (
    <TimelineContext.Provider value={variant}>
        <ol aria-label={ariaLabel} className={cx(variant === "horizontal" ? "flex w-full items-start" : "flex flex-col", className)}>
            {children}
        </ol>
    </TimelineContext.Provider>
);

export interface TimelineItemProps {
    /**
     * How far along the entry is — colors the dot and the connector leading into the next entry.
     *
     * @default "upcoming"
     */
    status?: TimelineItemStatus;
    /** Overrides the dot's color regardless of `status` — useful when the timeline's color is telling a different story than progress (e.g. a release's channel). */
    color?: TimelineItemColor;
    /** An icon rendered inside the dot instead of a plain filled circle. */
    icon?: FC<{ className?: string }>;
    /** A timestamp rendered above the title, e.g. `"2 hours ago"` or `"Mar 3, 2026"`. */
    time?: ReactNode;
    /** The entry's title. */
    title: ReactNode;
    /** A supporting description rendered below the title. */
    description?: ReactNode;
    /** Extra content rendered under the description — an attachment, a badge, anything. */
    children?: ReactNode;
    /** Additional classes merged onto the list item. */
    className?: string;
}

const TimelineItem = ({ status = "upcoming", color, icon: Icon, time, title, description, children, className }: TimelineItemProps) => {
    const variant = useContext(TimelineContext);
    const dotColor = color ? styles.color[color] : styles.status[status].dot;

    const dot = (
        <span
            className={cx(
                "z-10 flex shrink-0 items-center justify-center rounded-full",
                Icon ? "size-6" : status === "current" ? "size-3" : "size-2.5",
                dotColor,
            )}
        >
            {Icon && <Icon aria-hidden="true" className="size-3.5 stroke-[2.25px]" />}
        </span>
    );

    // Hidden on the last item via `group-last/item:hidden` rather than a prop, so a consumer that
    // conditionally renders items (or a list whose length changes) never has to keep an `isLast`
    // flag in sync by hand.
    const connector = (
        <span
            aria-hidden="true"
            className={cx(
                "rounded-full group-last/item:hidden",
                variant === "horizontal" ? "absolute start-[53%] top-1/2 z-0 h-0.5 w-full -translate-y-1/2" : "my-1 w-0.5 flex-1",
                styles.status[status].connector,
            )}
        />
    );

    const content = (
        <div className={cx("flex flex-col gap-0.5", variant === "horizontal" && "items-center text-center")}>
            {time && <time className="text-tertiary text-xs font-medium">{time}</time>}
            <p className={cx("text-sm font-semibold", styles.status[status].title)}>{title}</p>
            {description && <p className={cx("text-tertiary text-sm", variant === "horizontal" && "max-w-40")}>{description}</p>}
            {children}
        </div>
    );

    if (variant === "horizontal") {
        return (
            <li aria-current={status === "current" ? "step" : undefined} className={cx("group/item flex flex-1 flex-col items-center gap-3", className)}>
                <div className="relative flex w-full items-center justify-center">
                    {dot}
                    {connector}
                </div>
                {content}
            </li>
        );
    }

    if (variant === "alternating") {
        return (
            <li
                aria-current={status === "current" ? "step" : undefined}
                className={cx("group/item relative flex w-full items-stretch justify-center", className)}
            >
                <div className="hidden w-1/2 flex-col items-end pe-6 pb-8 text-end group-last/item:pb-0 group-odd/item:flex">{content}</div>

                <div className="flex flex-col items-center">
                    {dot}
                    {connector}
                </div>

                <div className="hidden w-1/2 flex-col items-start ps-6 pb-8 text-start group-last/item:pb-0 group-even/item:flex">{content}</div>
            </li>
        );
    }

    return (
        <li aria-current={status === "current" ? "step" : undefined} className={cx("group/item flex items-start gap-3", className)}>
            <div className="flex flex-col items-center self-stretch">
                {dot}
                {connector}
            </div>
            <div className="pb-8 group-last/item:pb-0">{content}</div>
        </li>
    );
};

export const Timeline = Object.assign(TimelineRoot, {
    Item: TimelineItem,
});
