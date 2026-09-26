"use client";

import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent, Ref } from "react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cx, sortCx } from "../../../utils/cx";

const styles = sortCx({
    root: "relative flex overflow-hidden",
    viewport: "size-full scrollbar-hide outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
    track: {
        root: "absolute z-10 flex touch-none transition-opacity duration-150 ease-linear select-none",
        vertical: "top-0 end-0 bottom-0 w-2.5",
        horizontal: "start-0 end-0 bottom-0 h-2.5",
        visible: "opacity-100",
        hidden: "pointer-events-none opacity-0",
    },
    rail: "absolute inset-0.5",
    thumb: {
        root: "absolute rounded-full bg-border-primary transition-colors duration-100 ease-linear hover:bg-fg-quaternary data-dragging:bg-fg-quaternary",
        vertical: "inset-x-0 top-0",
        horizontal: "inset-y-0 start-0",
    },
});

/** Which axes scroll. */
export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";
/** When the custom scrollbars show. */
export type ScrollAreaType = "auto" | "always" | "hover";

/** The smallest thumb length in pixels, so a very long list keeps a grabbable thumb. */
const MIN_THUMB = 20;
/** How long each faded edge is. */
const FADE = "calc(var(--spacing) * 8)";

interface Metrics {
    hasX: boolean;
    hasY: boolean;
    atTop: boolean;
    atBottom: boolean;
    atStart: boolean;
    atEnd: boolean;
    isRtl: boolean;
}

const initialMetrics: Metrics = { hasX: false, hasY: false, atTop: true, atBottom: true, atStart: true, atEnd: true, isRtl: false };

const sameMetrics = (a: Metrics, b: Metrics) => (Object.keys(a) as (keyof Metrics)[]).every((key) => a[key] === b[key]);

const isRtlElement = (element: HTMLElement) =>
    (typeof window !== "undefined" && window.getComputedStyle(element).direction === "rtl") || element.closest("[dir]")?.getAttribute("dir") === "rtl";

/** A gradient that fades whichever edges still have content beyond them. */
const fadeMask = (metrics: Metrics): CSSProperties => {
    const layers: string[] = [];
    const gradient = (direction: string, start: boolean, end: boolean) =>
        `linear-gradient(${direction}, transparent 0, black ${start ? "0px" : FADE}, black calc(100% - ${end ? "0px" : FADE}), transparent 100%)`;

    if (metrics.hasY) layers.push(gradient("to bottom", metrics.atTop, metrics.atBottom));
    if (metrics.hasX) layers.push(gradient(metrics.isRtl ? "to left" : "to right", metrics.atStart, metrics.atEnd));
    if (!layers.length) return {};

    const image = layers.join(", ");
    return { maskImage: image, WebkitMaskImage: image, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
};

export interface ScrollAreaProps {
    /**
     * Which axes scroll.
     *
     * @default "vertical"
     */
    orientation?: ScrollAreaOrientation;
    /**
     * When the scrollbars show: `hover` while the pointer is over the area or it is scrolling,
     * `auto` whenever the content overflows, `always` even when it does not.
     *
     * @default "hover"
     */
    type?: ScrollAreaType;
    /** Whether to fade the edges that still have content beyond them. */
    fadeEdges?: boolean;
    /**
     * How long, in milliseconds, `hover` scrollbars stay after scrolling stops.
     *
     * @default 600
     */
    scrollHideDelay?: number;
    /** The accessible label of the scrolling region. Pass this or `aria-labelledby`. */
    "aria-label"?: string;
    /** The id of an element that labels the scrolling region. */
    "aria-labelledby"?: string;
    /** A ref to the scrolling viewport element. */
    viewportRef?: Ref<HTMLDivElement>;
    /** The class name applied to the outer element. Give it a height or width to make it scroll. */
    className?: string;
    /** The class name applied to the scrolling viewport. */
    viewportClassName?: string;
    /** The scrolling content. */
    children: ReactNode;
}

/**
 * A native scrolling region with token-styled scrollbars. The viewport stays a real scrolling
 * element — focusable, keyboard and wheel scrollable, and labelled as a region.
 */
export const ScrollArea = ({
    orientation = "vertical",
    type = "hover",
    fadeEdges = false,
    scrollHideDelay = 600,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    viewportRef: viewportRefProp,
    className,
    viewportClassName,
    children,
}: ScrollAreaProps) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const railY = useRef<HTMLDivElement>(null);
    const railX = useRef<HTMLDivElement>(null);
    const thumbY = useRef<HTMLDivElement>(null);
    const thumbX = useRef<HTMLDivElement>(null);
    const drag = useRef<{ axis: "x" | "y"; pointer: number; scroll: number; ratio: number } | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
    const [isHovered, setIsHovered] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [draggingAxis, setDraggingAxis] = useState<"x" | "y" | null>(null);

    // The viewport mounts with the component, so the handle is set by the time anyone reads it.
    useImperativeHandle(viewportRefProp, () => viewportRef.current as HTMLDivElement, []);

    const allowsY = orientation !== "horizontal";
    const allowsX = orientation !== "vertical";

    /** Sizes and places the thumbs, and records which edges still have content beyond them. */
    const update = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const { scrollTop, scrollHeight, clientHeight, scrollWidth, clientWidth } = viewport;
        const left = Math.abs(viewport.scrollLeft);
        const maxY = scrollHeight - clientHeight;
        const maxX = scrollWidth - clientWidth;

        const place = (rail: HTMLDivElement | null, thumb: HTMLDivElement | null, axis: "x" | "y") => {
            if (!rail || !thumb) return;
            const railSize = axis === "y" ? rail.clientHeight : rail.clientWidth;
            const [client, scroll, max, position] = axis === "y" ? [clientHeight, scrollHeight, maxY, scrollTop] : [clientWidth, scrollWidth, maxX, left];
            const size = max > 0 ? Math.max((client / scroll) * railSize, MIN_THUMB) : railSize;
            const offset = max > 0 ? (position / max) * (railSize - size) : 0;

            if (axis === "y") {
                thumb.style.height = `${size}px`;
                thumb.style.transform = `translateY(${offset}px)`;
            } else {
                thumb.style.width = `${size}px`;
                thumb.style.insetInlineStart = `${offset}px`;
            }
        };

        place(railY.current, thumbY.current, "y");
        place(railX.current, thumbX.current, "x");

        const next: Metrics = {
            hasY: allowsY && maxY > 1,
            hasX: allowsX && maxX > 1,
            atTop: scrollTop <= 1,
            atBottom: scrollTop >= maxY - 1,
            atStart: left <= 1,
            atEnd: left >= maxX - 1,
            isRtl: isRtlElement(viewport),
        };
        setMetrics((current) => (sameMetrics(current, next) ? current : next));
    }, [allowsX, allowsY]);

    useEffect(() => {
        update();
        const observer = new ResizeObserver(update);
        if (viewportRef.current) observer.observe(viewportRef.current);
        if (contentRef.current) observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [update]);

    // The thumbs mount only once overflow is known, so place them as soon as they exist.
    useEffect(update, [update, metrics.hasX, metrics.hasY]);

    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const onScroll = () => {
        update();
        if (type !== "hover") return;
        setIsScrolling(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setIsScrolling(false), scrollHideDelay);
    };

    const onThumbPointerDown = (axis: "x" | "y") => (event: ReactPointerEvent<HTMLDivElement>) => {
        const viewport = viewportRef.current;
        const rail = axis === "y" ? railY.current : railX.current;
        if (event.button !== 0 || !viewport || !rail) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);

        const railSize = axis === "y" ? rail.clientHeight : rail.clientWidth;
        const thumbSize = axis === "y" ? event.currentTarget.offsetHeight : event.currentTarget.offsetWidth;
        const max = axis === "y" ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;

        drag.current = {
            axis,
            pointer: axis === "y" ? event.clientY : event.clientX,
            scroll: axis === "y" ? viewport.scrollTop : viewport.scrollLeft,
            ratio: max / Math.max(railSize - thumbSize, 1),
        };
        setDraggingAxis(axis);
    };

    const onThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const state = drag.current;
        const viewport = viewportRef.current;
        if (!state || !viewport) return;

        // `scrollLeft` is physical in both directions (negative in right-to-left), so the same formula holds.
        const delta = ((state.axis === "y" ? event.clientY : event.clientX) - state.pointer) * state.ratio;
        if (state.axis === "y") viewport.scrollTop = state.scroll + delta;
        else viewport.scrollLeft = state.scroll + delta;
    };

    const onThumbPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        setDraggingAxis(null);
    };

    /** Clicking the track jumps so the thumb centres on the pointer. */
    const onTrackPointerDown = (axis: "x" | "y") => (event: ReactPointerEvent<HTMLDivElement>) => {
        const viewport = viewportRef.current;
        const rail = axis === "y" ? railY.current : railX.current;
        const thumb = axis === "y" ? thumbY.current : thumbX.current;
        if (event.button !== 0 || !viewport || !rail || !thumb) return;

        const rect = rail.getBoundingClientRect();
        if (axis === "y") {
            const size = thumb.offsetHeight;
            const max = viewport.scrollHeight - viewport.clientHeight;
            viewport.scrollTop = ((event.clientY - rect.top - size / 2) / Math.max(rect.height - size, 1)) * max;
        } else {
            const size = thumb.offsetWidth;
            const max = viewport.scrollWidth - viewport.clientWidth;
            const fromStart = metrics.isRtl ? rect.right - event.clientX : event.clientX - rect.left;
            const position = ((fromStart - size / 2) / Math.max(rect.width - size, 1)) * max;
            viewport.scrollLeft = metrics.isRtl ? -position : position;
        }
    };

    const isVisible = (hasOverflow: boolean) =>
        type === "always" || (type === "auto" && hasOverflow) || (type === "hover" && hasOverflow && (isHovered || isScrolling || draggingAxis !== null));

    const showY = allowsY && (metrics.hasY || type === "always");
    const showX = allowsX && (metrics.hasX || type === "always");

    const scrollbar = (axis: "x" | "y") => {
        const isY = axis === "y";
        return (
            <div
                aria-hidden="true"
                data-scrollbar={isY ? "vertical" : "horizontal"}
                data-visible={isVisible(isY ? metrics.hasY : metrics.hasX) ? "" : undefined}
                onPointerDown={onTrackPointerDown(axis)}
                className={cx(
                    styles.track.root,
                    isY ? styles.track.vertical : styles.track.horizontal,
                    // Leave the corner free when both scrollbars show.
                    isY && showX && "bottom-2.5",
                    !isY && showY && "end-2.5",
                    isVisible(isY ? metrics.hasY : metrics.hasX) ? styles.track.visible : styles.track.hidden,
                )}
            >
                <div ref={isY ? railY : railX} className={styles.rail}>
                    <div
                        ref={isY ? thumbY : thumbX}
                        data-dragging={draggingAxis === axis ? "" : undefined}
                        onPointerDown={onThumbPointerDown(axis)}
                        onPointerMove={onThumbPointerMove}
                        onPointerUp={onThumbPointerUp}
                        onPointerCancel={onThumbPointerUp}
                        className={cx(styles.thumb.root, isY ? styles.thumb.vertical : styles.thumb.horizontal)}
                    />
                </div>
            </div>
        );
    };

    const isLabelled = Boolean(ariaLabel || ariaLabelledby);

    return (
        <div
            data-scroll-area=""
            data-orientation={orientation}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            className={cx(styles.root, className)}
        >
            <div
                ref={viewportRef}
                data-scroll-viewport=""
                // A focusable region lets keyboard users scroll content that has nothing focusable inside.
                tabIndex={0}
                role={isLabelled ? "region" : undefined}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                onScroll={onScroll}
                style={fadeEdges ? fadeMask(metrics) : undefined}
                className={cx(
                    styles.viewport,
                    orientation === "vertical" && "overflow-x-hidden overflow-y-auto",
                    orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
                    orientation === "both" && "overflow-auto",
                    viewportClassName,
                )}
            >
                <div ref={contentRef} className={orientation === "vertical" ? undefined : "w-max min-w-full"}>
                    {children}
                </div>
            </div>
            {showY && scrollbar("y")}
            {showX && scrollbar("x")}
        </div>
    );
};
