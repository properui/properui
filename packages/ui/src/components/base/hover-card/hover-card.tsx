"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useHover } from "react-aria";
import {
    Button as AriaButton,
    type ButtonProps as AriaButtonProps,
    Dialog as AriaDialog,
    OverlayArrow as AriaOverlayArrow,
    Popover as AriaPopover,
    type PopoverProps as AriaPopoverProps,
} from "react-aria-components";
import { cx, sortCx } from "../../../utils/cx";

const styles = sortCx({
    root: "bg-primary ring-secondary_alt w-max max-w-sm origin-(--trigger-anchor-point) rounded-xl p-4 shadow-lg ring-1 outline-hidden will-change-transform",
});

export interface HoverCardProps extends Omit<
    AriaPopoverProps,
    "children" | "className" | "isOpen" | "defaultOpen" | "onOpenChange" | "triggerRef" | "trigger"
> {
    /**
     * The element that opens the card on hover or keyboard focus, e.g. an avatar or a name.
     * Wrap a non-interactive trigger (a plain avatar, with no link or button of its own) in
     * `HoverCardTrigger` to make it keyboard reachable.
     */
    trigger: ReactNode;
    /** The rich content rendered inside the card — an avatar, a name, a bio, actions, anything. */
    children: ReactNode;
    /**
     * Where the card renders relative to its trigger.
     *
     * @default "bottom"
     */
    placement?: AriaPopoverProps["placement"];
    /**
     * Delay in milliseconds, after the pointer enters the trigger, before the card opens.
     * Keyboard focus opens the card immediately, without this delay.
     *
     * @default 400
     */
    openDelay?: number;
    /**
     * Delay in milliseconds, after the pointer leaves the trigger (or the card itself), before
     * the card closes — long enough to let the pointer travel from one to the other.
     *
     * @default 200
     */
    closeDelay?: number;
    /**
     * Whether to show the arrow pointing at the trigger.
     *
     * @default true
     */
    arrow?: boolean;
    /** Whether the card is open. Omit to let it manage its own state. */
    isOpen?: boolean;
    /** Whether the card is open by default, for uncontrolled usage. */
    defaultOpen?: boolean;
    /** Called when the open state changes, whether by hover, focus, Escape or an outside press. */
    onOpenChange?: (isOpen: boolean) => void;
    /** Additional classes merged onto the card surface. */
    className?: string;
    /** Accessible label for the card content, when it has no visible heading. */
    "aria-label"?: string;
    /** Id of an element that labels the card content. */
    "aria-labelledby"?: string;
}

/**
 * A rich preview that opens next to a trigger on hover or focus — a user profile card, a link
 * preview, anything more elaborate than a `Tooltip`'s plain text. Built from the same `Popover`
 * primitive as every other overlay in the library, so it dismisses on <kbd>Escape</kbd> and on an
 * outside press exactly like `Popover`/`Dropdown` do; the difference is entirely in how it opens.
 */
export const HoverCard = ({
    trigger,
    children,
    placement = "bottom",
    openDelay = 400,
    closeDelay = 200,
    arrow = true,
    isOpen: isOpenProp,
    defaultOpen = false,
    onOpenChange,
    className,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...popoverProps
}: HoverCardProps) => {
    const triggerRef = useRef<HTMLSpanElement>(null);
    const openTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const closeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = isOpenProp ?? internalOpen;

    const setOpen = useCallback(
        (next: boolean) => {
            if (isOpenProp === undefined) setInternalOpen(next);
            onOpenChange?.(next);
        },
        [isOpenProp, onOpenChange],
    );

    useEffect(
        () => () => {
            clearTimeout(openTimeout.current);
            clearTimeout(closeTimeout.current);
        },
        [],
    );

    const scheduleOpen = useCallback(() => {
        clearTimeout(closeTimeout.current);
        openTimeout.current = setTimeout(() => setOpen(true), openDelay);
    }, [openDelay, setOpen]);

    const openNow = useCallback(() => {
        clearTimeout(openTimeout.current);
        clearTimeout(closeTimeout.current);
        setOpen(true);
    }, [setOpen]);

    const scheduleClose = useCallback(() => {
        clearTimeout(openTimeout.current);
        closeTimeout.current = setTimeout(() => setOpen(false), closeDelay);
    }, [closeDelay, setOpen]);

    const cancelClose = useCallback(() => clearTimeout(closeTimeout.current), []);

    const { hoverProps: triggerHoverProps } = useHover({ onHoverStart: scheduleOpen, onHoverEnd: scheduleClose });
    const { hoverProps: cardHoverProps } = useHover({ onHoverStart: cancelClose, onHoverEnd: scheduleClose });

    return (
        <>
            <span ref={triggerRef} {...triggerHoverProps} onFocus={openNow} onBlur={scheduleClose} className="inline-flex align-middle outline-hidden">
                {trigger}
            </span>

            <AriaPopover
                {...popoverProps}
                triggerRef={triggerRef}
                isOpen={isOpen}
                isNonModal
                onOpenChange={setOpen}
                placement={placement}
                className={(state) =>
                    cx(
                        styles.root,
                        state.isEntering &&
                            "animate-in fade-in zoom-in-95 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5 placement-left:slide-in-from-right-0.5 placement-right:slide-in-from-left-0.5 duration-150 ease-out",
                        state.isExiting &&
                            "animate-out fade-out zoom-out-95 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5 placement-left:slide-out-to-right-0.5 placement-right:slide-out-to-left-0.5 duration-100 ease-in",
                        className,
                    )
                }
            >
                <AriaDialog
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledby}
                    className="outline-hidden"
                    // Spread only the specific handlers `useHover` produces rather than the whole
                    // `hoverProps` object — its `DOMAttributes` type includes a generic `role`,
                    // which conflicts with `Dialog`'s narrower `"dialog" | "alertdialog"` role.
                    onPointerEnter={cardHoverProps.onPointerEnter}
                    onPointerLeave={cardHoverProps.onPointerLeave}
                    onMouseEnter={cardHoverProps.onMouseEnter}
                    onMouseLeave={cardHoverProps.onMouseLeave}
                >
                    {arrow && (
                        <AriaOverlayArrow>
                            <svg
                                viewBox="0 0 100 100"
                                className="fill-bg-primary in-placement-left:-rotate-90 in-placement-right:rotate-90 in-placement-top:rotate-0 in-placement-bottom:rotate-180 size-2.5"
                            >
                                <path d="M0,0 L35.858,35.858 Q50,50 64.142,35.858 L100,0 Z" />
                            </svg>
                        </AriaOverlayArrow>
                    )}

                    {children}
                </AriaDialog>
            </AriaPopover>
        </>
    );
};
HoverCard.displayName = "HoverCard";

export type HoverCardTriggerProps = AriaButtonProps;

/**
 * A focusable wrapper for a hover-card trigger that isn't already interactive on its own (a plain
 * avatar or a span of text). Skip it when the trigger is already a link or a button — wrapping an
 * already-interactive element would add a redundant tab stop.
 */
export const HoverCardTrigger = ({ children, className, ...buttonProps }: HoverCardTriggerProps) => (
    <AriaButton
        {...buttonProps}
        className={(values) => cx("h-max w-max cursor-default outline-hidden", typeof className === "function" ? className(values) : className)}
    >
        {children}
    </AriaButton>
);
HoverCardTrigger.displayName = "HoverCardTrigger";
