"use client";

import type { KeyboardEvent, PointerEvent, ReactElement, ReactNode, RefObject } from "react";
import { Children, createContext, isValidElement, useContext, useId, useRef, useState } from "react";
import { DotsVertical } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";

const styles = sortCx({
    group: {
        root: "flex size-full",
        horizontal: "flex-row",
        vertical: "flex-col",
    },
    panel: "relative min-h-0 min-w-0 overflow-auto",
    handle: {
        root: "group/handle relative z-10 flex shrink-0 touch-none items-center justify-center bg-border-secondary outline-focus-ring transition-colors duration-100 ease-linear select-none after:absolute hover:bg-border-brand focus-visible:bg-border-brand focus-visible:outline-2 data-dragging:bg-border-brand",
        horizontal: "w-px cursor-col-resize after:inset-y-0 after:-inset-x-1.5",
        vertical: "h-px cursor-row-resize after:-inset-y-1.5 after:inset-x-0",
        grip: "z-10 flex items-center justify-center rounded-sm border border-secondary bg-primary text-fg-quaternary shadow-xs transition-colors duration-100 ease-linear group-hover/handle:text-fg-quaternary_hover",
        gripHorizontal: "h-6 w-3",
        gripVertical: "h-3 w-6",
    },
});

/** The axis the panels are laid out along. */
export type ResizableDirection = "horizontal" | "vertical";

interface PanelConfig {
    id?: string;
    defaultSize?: number;
    minSize: number;
    maxSize: number;
    collapsible: boolean;
    collapsedSize: number;
    onCollapsedChange?: (isCollapsed: boolean) => void;
}

interface GroupContextValue {
    direction: ResizableDirection;
    sizes: number[];
    configs: PanelConfig[];
    panelIds: string[];
    draggingHandle: number | null;
    commit: (next: number[]) => void;
    setDraggingHandle: (index: number | null) => void;
    groupRef: RefObject<HTMLDivElement | null>;
    keyboardStep: number;
    lastExpanded: RefObject<number[]>;
}

const GroupContext = createContext<GroupContextValue | null>(null);
/** The position of a panel, or of the panel before a handle. */
const IndexContext = createContext(0);

const useGroup = () => {
    const context = useContext(GroupContext);
    if (!context) throw new Error("ResizablePanel and ResizableHandle must be direct children of ResizablePanelGroup.");
    return context;
};

const EPSILON = 0.01;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number) => Math.round(value * 100) / 100;
const isCollapsed = (config: PanelConfig, size: number) => config.collapsible && size <= config.collapsedSize + EPSILON;

/**
 * Applies a size limit. Below `minSize` a collapsible panel either snaps shut or back to its
 * minimum: at the midpoint when dragging, and only once it reaches the collapsed size otherwise.
 */
const constrain = (config: PanelConfig, size: number, snapAtMidpoint: boolean) => {
    if (config.collapsible && size < config.minSize) {
        const threshold = snapAtMidpoint ? (config.minSize + config.collapsedSize) / 2 : config.collapsedSize + EPSILON;
        return size < threshold ? config.collapsedSize : config.minSize;
    }
    return clamp(size, config.minSize, config.maxSize);
};

const fits = (config: PanelConfig, size: number) => isCollapsed(config, size) || (size >= config.minSize - EPSILON && size <= config.maxSize + EPSILON);

/** Resizes the two panels around a handle so the first one gets as close to `target` as their limits allow. */
const resolveLayout = (base: number[], configs: PanelConfig[], index: number, target: number, snapAtMidpoint: boolean) => {
    const before = configs[index];
    const after = configs[index + 1];
    const beforeBase = base[index];
    const afterBase = base[index + 1];
    if (!before || !after || beforeBase === undefined || afterBase === undefined) return base;
    const total = beforeBase + afterBase;

    const afterSize = constrain(after, total - constrain(before, target, snapAtMidpoint), snapAtMidpoint);
    const beforeSize = total - afterSize;

    if (!fits(before, beforeSize)) return base;

    const next = [...base];
    next[index] = round(beforeSize);
    next[index + 1] = round(afterSize);
    return next;
};

/** Spreads whatever the declared sizes leave over across the panels without a `defaultSize`. */
const initialLayout = (configs: PanelConfig[], defaultLayout?: number[]) => {
    if (defaultLayout?.length === configs.length) return defaultLayout;

    const declared = configs.reduce((sum, config) => sum + (config.defaultSize ?? 0), 0);
    const undeclared = configs.filter((config) => config.defaultSize === undefined).length;
    const share = undeclared ? Math.max(0, 100 - declared) / undeclared : 0;

    return configs.map((config) => round(config.defaultSize ?? share));
};

const isElementOf = <P,>(node: ReactNode, type: unknown): node is ReactElement<P> => isValidElement(node) && node.type === type;

export interface ResizablePanelGroupProps {
    /**
     * The axis the panels are laid out along. `horizontal` places them side by side.
     *
     * @default "horizontal"
     */
    direction?: ResizableDirection;
    /**
     * The starting sizes in percent, one per panel, e.g. a layout saved from `onLayoutChange`.
     * Overrides the panels' own `defaultSize`.
     */
    defaultLayout?: number[];
    /** Handler called with every panel's size in percent whenever the layout changes. Use it to persist the layout. */
    onLayoutChange?: (sizes: number[]) => void;
    /**
     * How many percent one arrow key press moves a handle.
     *
     * @default 10
     */
    keyboardStep?: number;
    /** The class name applied to the group. */
    className?: string;
    /** `ResizablePanel`s with a `ResizableHandle` between each pair, as direct children. */
    children: ReactNode;
}

/** Lays out resizable panels along one axis. Panels and handles must be its direct children. */
export const ResizablePanelGroup = ({
    direction = "horizontal",
    defaultLayout,
    onLayoutChange,
    keyboardStep = 10,
    className,
    children,
}: ResizablePanelGroupProps) => {
    const groupRef = useRef<HTMLDivElement>(null);
    const baseId = useId();
    const nodes = Children.toArray(children);
    const panels = nodes.filter((node): node is ReactElement<ResizablePanelProps> => isElementOf<ResizablePanelProps>(node, ResizablePanel));

    const configs: PanelConfig[] = panels.map(({ props }) => ({
        id: props.id,
        defaultSize: props.defaultSize,
        minSize: props.minSize ?? 0,
        maxSize: props.maxSize ?? 100,
        collapsible: props.collapsible ?? false,
        collapsedSize: props.collapsedSize ?? 0,
        onCollapsedChange: props.onCollapsedChange,
    }));

    const [sizes, setSizes] = useState(() => initialLayout(configs, defaultLayout));
    const [draggingHandle, setDraggingHandle] = useState<number | null>(null);
    const lastExpanded = useRef<number[]>([]);

    // Panels were added or removed: start over from the declared sizes.
    const layout = sizes.length === configs.length ? sizes : initialLayout(configs, defaultLayout);
    if (layout !== sizes) setSizes(layout);

    const commit = (next: number[]) => {
        if (next.every((size, index) => Math.abs(size - (layout[index] ?? 0)) < EPSILON)) return;

        next.forEach((size, index) => {
            const config = configs[index];
            const previous = layout[index];
            if (!config || previous === undefined) return;
            const was = isCollapsed(config, previous);
            const now = isCollapsed(config, size);
            if (!was && now) lastExpanded.current[index] = previous;
            if (was !== now) config.onCollapsedChange?.(now);
        });

        setSizes(next);
        onLayoutChange?.(next);
    };

    const panelIds = configs.map((config, index) => config.id ?? `${baseId}-panel-${index}`);

    // A panel gets its own position; a handle gets the position of the panel before it.
    const content: ReactNode[] = [];
    let panelIndex = -1;
    for (const [position, node] of nodes.entries()) {
        const isPanel = isElementOf(node, ResizablePanel);
        if (isPanel) panelIndex += 1;

        content.push(
            isPanel || isElementOf(node, ResizableHandle) ? (
                <IndexContext.Provider key={isValidElement(node) ? (node.key ?? position) : position} value={Math.max(panelIndex, 0)}>
                    {node}
                </IndexContext.Provider>
            ) : (
                node
            ),
        );
    }

    return (
        <GroupContext.Provider
            value={{
                direction,
                sizes: layout,
                configs,
                panelIds,
                draggingHandle,
                commit,
                setDraggingHandle,
                groupRef,
                keyboardStep,
                lastExpanded,
            }}
        >
            <div
                ref={groupRef}
                data-panel-group=""
                data-direction={direction}
                className={cx(styles.group.root, styles.group[direction], draggingHandle !== null && "select-none", className)}
            >
                {content}
            </div>
        </GroupContext.Provider>
    );
};

export interface ResizablePanelProps {
    /** The id of the panel element. The handle before it points `aria-controls` here. */
    id?: string;
    /** The starting size in percent. Panels without one share what is left. */
    defaultSize?: number;
    /**
     * The smallest size in percent.
     *
     * @default 0
     */
    minSize?: number;
    /**
     * The largest size in percent.
     *
     * @default 100
     */
    maxSize?: number;
    /**
     * Whether dragging below `minSize` (or pressing Enter on the handle) collapses the panel to `collapsedSize`.
     *
     * @default false
     */
    collapsible?: boolean;
    /**
     * The size in percent of the collapsed panel, e.g. enough for an icon rail.
     *
     * @default 0
     */
    collapsedSize?: number;
    /** Handler called when the panel collapses or expands. */
    onCollapsedChange?: (isCollapsed: boolean) => void;
    /** The class name applied to the panel. */
    className?: string;
    /** The panel content. */
    children?: ReactNode;
}

/** One resizable region. Its size is a percentage of the group. */
export const ResizablePanel = ({ className, children }: ResizablePanelProps) => {
    const { sizes, configs, panelIds } = useGroup();
    const index = useContext(IndexContext);
    const size = sizes[index] ?? 0;
    const config = configs[index];
    const collapsed = config ? isCollapsed(config, size) : false;

    return (
        <div
            id={panelIds[index]}
            data-panel=""
            data-collapsed={collapsed ? "" : undefined}
            // A fully collapsed panel keeps its content mounted but out of the tab order.
            inert={collapsed && size <= EPSILON}
            style={{ flexGrow: size, flexShrink: 1, flexBasis: 0 }}
            className={cx(styles.panel, className)}
        >
            {children}
        </div>
    );
};

export interface ResizableHandleProps {
    /** Whether to show a grip in the middle of the handle. */
    withHandle?: boolean;
    /**
     * The accessible label of the handle.
     *
     * @default "Resize"
     */
    "aria-label"?: string;
    /** The class name applied to the handle. */
    className?: string;
}

/**
 * The divider between two panels. Drag it, or focus it and use the arrow keys, Home and End.
 * Enter collapses or restores a collapsible neighbour.
 */
export const ResizableHandle = ({ withHandle = false, "aria-label": ariaLabel = "Resize", className }: ResizableHandleProps) => {
    const { direction, sizes, configs, panelIds, draggingHandle, commit, setDraggingHandle, groupRef, keyboardStep, lastExpanded } = useGroup();
    const index = useContext(IndexContext);
    const drag = useRef<{ start: number; sizes: number[]; length: number; isRtl: boolean } | null>(null);

    const before = configs[index];
    const after = configs[index + 1];
    const current = sizes[index];
    const afterSize = sizes[index + 1];
    // A trailing handle with no panel after it has nothing to resize.
    if (!before || !after || current === undefined || afterSize === undefined) return null;

    const total = current + afterSize;
    const isHorizontal = direction === "horizontal";

    const isRtl = () => groupRef.current?.closest("[dir]")?.getAttribute("dir") === "rtl";

    /** Moves the handle by `delta` percent, collapsing or expanding a neighbour when it crosses `minSize`. */
    const moveBy = (delta: number) => {
        let target = current + delta;

        if (delta < 0 && before.collapsible && !isCollapsed(before, current) && target < before.minSize) target = before.collapsedSize;
        else if (delta > 0 && isCollapsed(before, current)) target = Math.max(before.minSize, target);

        if (delta > 0 && after.collapsible && !isCollapsed(after, afterSize) && total - target < after.minSize) target = total - after.collapsedSize;
        else if (delta < 0 && isCollapsed(after, afterSize)) target = Math.min(total - after.minSize, target);

        commit(resolveLayout(sizes, configs, index, target, false));
    };

    /** Collapses the first collapsible neighbour, or restores the size it had before. */
    const toggleCollapse = () => {
        const isBefore = before.collapsible;
        if (!isBefore && !after.collapsible) return;

        const panel = isBefore ? index : index + 1;
        const config = isBefore ? before : after;
        const size = isBefore ? current : afterSize;
        const restored = lastExpanded.current[panel] ?? Math.max(config.minSize, config.defaultSize ?? config.minSize);
        const nextSize = isCollapsed(config, size) ? restored : config.collapsedSize;
        const target = panel === index ? nextSize : total - nextSize;

        commit(resolveLayout(sizes, configs, index, target, false));
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        // Arrow keys follow the visual direction, so they flip for right-to-left layouts.
        const forward = isHorizontal ? (isRtl() ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
        const backward = isHorizontal ? (isRtl() ? "ArrowRight" : "ArrowLeft") : "ArrowUp";

        switch (event.key) {
            case forward:
                moveBy(keyboardStep);
                break;
            case backward:
                moveBy(-keyboardStep);
                break;
            case "Home":
                commit(resolveLayout(sizes, configs, index, before.collapsible ? before.collapsedSize : before.minSize, false));
                break;
            case "End":
                commit(resolveLayout(sizes, configs, index, before.maxSize, false));
                break;
            case "Enter":
                toggleCollapse();
                break;
            default:
                return;
        }
        event.preventDefault();
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !groupRef.current) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();

        const rect = groupRef.current.getBoundingClientRect();
        drag.current = {
            start: isHorizontal ? event.clientX : event.clientY,
            sizes,
            length: (isHorizontal ? rect.width : rect.height) || 1,
            isRtl: isRtl(),
        };
        setDraggingHandle(index);
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const state = drag.current;
        if (!state) return;

        const moved = (isHorizontal ? event.clientX : event.clientY) - state.start;
        const delta = ((state.isRtl && isHorizontal ? -moved : moved) / state.length) * 100;

        // Always resolve from the sizes at pointer down, so crossing a snap point and coming back is reversible.
        commit(resolveLayout(state.sizes, configs, index, (state.sizes[index] ?? current) + delta, true));
    };

    const endDrag = (event: PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        setDraggingHandle(null);
    };

    return (
        // A focusable separator is an interactive widget (the ARIA window splitter pattern), which the lint rules do not model.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
            role="separator"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            aria-label={ariaLabel}
            aria-controls={panelIds[index]}
            // The separator runs across the layout axis.
            aria-orientation={isHorizontal ? "vertical" : "horizontal"}
            aria-valuenow={Math.round(current)}
            aria-valuemin={Math.round(before.collapsible ? before.collapsedSize : before.minSize)}
            aria-valuemax={Math.round(Math.min(before.maxSize, total - (after.collapsible ? after.collapsedSize : after.minSize)))}
            data-dragging={draggingHandle === index ? "" : undefined}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDoubleClick={toggleCollapse}
            className={cx(styles.handle.root, styles.handle[direction], className)}
        >
            {withHandle && (
                <div aria-hidden="true" className={cx(styles.handle.grip, isHorizontal ? styles.handle.gripHorizontal : styles.handle.gripVertical)}>
                    <DotsVertical className={cx("size-3", !isHorizontal && "rotate-90")} />
                </div>
            )}
        </div>
    );
};
