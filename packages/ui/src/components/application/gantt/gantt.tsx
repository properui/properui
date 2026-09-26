"use client";

import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useId, useMemo, useRef, useState } from "react";
import type { CalendarDate, DateDuration } from "@internationalized/date";
import { endOfMonth, endOfWeek, endOfYear, getLocalTimeZone, today as getToday, isWeekend, minDate } from "@internationalized/date";
import { useDateFormatter, useLocale } from "react-aria";
import { cx, sortCx } from "../../../utils/cx";
import { Avatar } from "../../base/avatar/avatar";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

/** The time scale of the chart. Each zoom level sets the pixel width of a day and the keyboard step. */
export type GanttZoom = "day" | "week" | "month";

/** The colour of a feature bar, mapped to the semantic `utility-*` tokens. */
export type GanttColor = "brand" | "blue" | "green" | "orange" | "pink" | "purple" | "gray";

export interface GanttOwner {
    /** Full name, used for the avatar's accessible text and the bar's accessible name. */
    name: string;
    /** Avatar image source. */
    src?: string;
    /** Initials shown when no image is available. */
    initials?: string;
}

export interface GanttFeatureData {
    /** Unique id of the feature. Referenced by `dependencies` and passed back in callbacks. */
    id: string;
    /** The feature's name, shown in the sidebar and on the bar. */
    name: string;
    /** First day of the feature (inclusive). */
    startAt: CalendarDate;
    /** Last day of the feature (inclusive). Ignored for milestones. */
    endAt: CalendarDate;
    /** Completion, from 0 to 100. Drawn as a fill inside the bar. */
    progress?: number;
    /** Bar colour. @default "brand" */
    color?: GanttColor;
    /** The person who owns the feature, shown as an avatar in the sidebar. */
    owner?: GanttOwner;
    /** Ids of the features that must finish before this one starts. Drawn as arrows. */
    dependencies?: string[];
    /** Renders the feature as a single-day diamond instead of a bar. */
    isMilestone?: boolean;
}

export interface GanttGroupData {
    /** Unique id of the group. */
    id: string;
    /** The group's name, shown as a heading row in the sidebar. */
    name: string;
    /** The features in this group, one row each. */
    features: GanttFeatureData[];
}

export interface GanttMarkerData {
    /** Unique id of the marker. */
    id: string;
    /** The day the marker sits on. */
    date: CalendarDate;
    /** Short text shown in the marker's label. */
    label: string;
}

/** Payload of `onMove` and `onResize`: the feature and its proposed new dates. */
export interface GanttChangeEvent {
    /** Id of the feature being changed. */
    id: string;
    /** The proposed first day. */
    startAt: CalendarDate;
    /** The proposed last day. */
    endAt: CalendarDate;
    /** Whether the change came from a pointer drag or the keyboard. */
    source: "pointer" | "keyboard";
}

/* -------------------------------------------------------------------------------------------------
 * Styles
 * -----------------------------------------------------------------------------------------------*/

/** Row heights in pixels. They must stay in sync with the `h-*` classes below. */
const GROUP_ROW_HEIGHT = 36; // h-9
const ROW_HEIGHT = 44; // h-11
const MILESTONE_SIZE = 24; // size-6

/** Pixel width of a single day at each zoom level. */
const DAY_WIDTH: Record<GanttZoom, number> = { day: 40, week: 20, month: 6 };

/** What one arrow-key press moves a bar by, per zoom level. */
const ZOOM_UNIT: Record<GanttZoom, DateDuration> = { day: { days: 1 }, week: { weeks: 1 }, month: { months: 1 } };
const ZOOM_UNIT_NAME: Record<GanttZoom, string> = { day: "day", week: "week", month: "month" };

export const styles = sortCx({
    root: "relative overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary",
    scroller: "relative overflow-auto",
    content: "flex w-max min-w-full",
    sidebar: {
        root: "sticky start-0 z-30 shrink-0 border-e border-secondary bg-primary",
        header: "sticky top-0 z-10 flex h-16 items-end border-b border-secondary bg-secondary px-4 pb-2 text-xs font-semibold text-tertiary",
        group: "flex h-9 items-center justify-between gap-2 border-b border-secondary bg-secondary_alt px-4 text-xs font-semibold text-secondary",
        count: "rounded-full bg-primary px-1.5 text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset",
        item: "flex h-11 items-center gap-2 border-b border-secondary px-4",
        name: "min-w-0 flex-1 truncate text-sm font-medium text-secondary",
    },
    timeline: {
        root: "relative shrink-0",
        header: "sticky top-0 z-20 flex h-16 flex-col border-b border-secondary bg-secondary",
        headerRow: "relative flex-1",
        headerCell: "absolute inset-y-0 flex items-center overflow-hidden border-e border-secondary px-2 text-xs whitespace-nowrap",
        body: "relative overflow-hidden",
        groupRow: "relative h-9 border-b border-secondary bg-secondary_alt",
        row: "relative h-11 border-b border-secondary",
        gridLine: "absolute inset-y-0 border-e border-secondary",
        weekend: "absolute inset-y-0 bg-secondary_alt",
        today: "absolute inset-y-0 w-px bg-brand-solid",
        todayLabel: "absolute top-2 -translate-x-1/2 rounded-full bg-brand-solid px-1.5 text-xs font-semibold text-white rtl:translate-x-1/2",
        marker: "absolute inset-y-0 border-s border-dashed border-utility-orange-500",
        markerLabel:
            "absolute top-2 ms-1 rounded-md bg-utility-orange-50 px-1.5 text-xs font-medium whitespace-nowrap text-utility-orange-700 ring-1 ring-utility-orange-200 ring-inset",
        arrows: "pointer-events-none absolute inset-0 overflow-visible rtl:-scale-x-100",
    },
    feature: {
        bar: "group/gantt-bar absolute top-2 flex h-7 cursor-grab items-center overflow-hidden rounded-md px-2 text-start text-xs font-semibold ring-1 outline-focus-ring transition-shadow duration-100 ease-linear ring-inset select-none focus-visible:outline-2 focus-visible:outline-offset-2 active:cursor-grabbing",
        readOnly: "cursor-pointer",
        dragging: "z-10 shadow-lg",
        progress: "absolute inset-y-0 start-0",
        label: "relative min-w-0 truncate",
        handle: "absolute inset-y-0 w-2 cursor-ew-resize opacity-0 transition-opacity duration-100 group-hover/gantt-bar:opacity-100",
        handleGrip: "absolute inset-y-1.5 start-1/2 w-0.5 rounded-full bg-current opacity-50",
        milestone:
            "absolute top-2.5 flex size-6 cursor-grab items-center justify-center rounded-sm outline-focus-ring select-none focus-visible:outline-2 focus-visible:outline-offset-2",
        milestoneDiamond: "size-3.5 rotate-45 rounded-xs shadow-xs",
        milestoneLabel: "absolute start-full ms-1 text-xs font-medium whitespace-nowrap text-secondary",
    },
    colors: {
        brand: { bar: "bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200", fill: "bg-utility-brand-200", solid: "bg-utility-brand-600" },
        blue: { bar: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200", fill: "bg-utility-blue-200", solid: "bg-utility-blue-600" },
        green: { bar: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200", fill: "bg-utility-green-200", solid: "bg-utility-green-600" },
        orange: { bar: "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200", fill: "bg-utility-orange-200", solid: "bg-utility-orange-600" },
        pink: { bar: "bg-utility-pink-50 text-utility-pink-700 ring-utility-pink-200", fill: "bg-utility-pink-200", solid: "bg-utility-pink-600" },
        purple: { bar: "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200", fill: "bg-utility-purple-200", solid: "bg-utility-purple-600" },
        gray: {
            bar: "bg-utility-neutral-50 text-utility-neutral-700 ring-utility-neutral-200",
            fill: "bg-utility-neutral-200",
            solid: "bg-utility-neutral-600",
        },
    },
});

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface DatePreview {
    id: string;
    startAt: CalendarDate;
    endAt: CalendarDate;
}

interface GanttContextValue {
    groups: GanttGroupData[];
    startDate: CalendarDate;
    endDate: CalendarDate;
    zoom: GanttZoom;
    today: CalendarDate | null;
    markers: GanttMarkerData[];
    dayWidth: number;
    totalWidth: number;
    bodyHeight: number;
    rowTops: Map<string, number>;
    featureOrder: string[];
    isReadOnly: boolean;
    showWeekends: boolean;
    showDependencies: boolean;
    label: string;
    instructionsId: string;
    activeId: string | undefined;
    setActiveId: (id: string) => void;
    preview: DatePreview | null;
    setPreview: (preview: DatePreview | null) => void;
    commit: (kind: "move" | "resize", feature: GanttFeatureData, dates: { startAt: CalendarDate; endAt: CalendarDate }, source: "pointer" | "keyboard") => void;
    onFeaturePress?: (feature: GanttFeatureData) => void;
}

const GanttContext = createContext<GanttContextValue | null>(null);

const useGantt = () => {
    const context = useContext(GanttContext);

    if (!context) {
        throw new Error("Gantt components must be rendered inside <Gantt.Provider>.");
    }

    return context;
};

/** The number of days from `from` to `to`; negative when `to` is earlier. */
const daysBetween = (from: CalendarDate, to: CalendarDate) => to.compare(from);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Whether any day of the feature falls inside the visible range. */
const isInRange = (feature: GanttFeatureData, rangeStart: CalendarDate, rangeEnd: CalendarDate) =>
    (feature.isMilestone ? feature.startAt : feature.endAt).compare(rangeStart) >= 0 && feature.startAt.compare(rangeEnd) <= 0;

/** The dates a feature currently renders at: its drag preview when one is active. */
const getRenderedDates = (feature: GanttFeatureData, preview: DatePreview | null) => {
    const dates = preview?.id === feature.id ? preview : feature;

    return { startAt: dates.startAt, endAt: feature.isMilestone ? dates.startAt : dates.endAt };
};

/**
 * Shifts both ends by `days`, clamped so the feature never leaves the visible range. A feature
 * that already overhangs an edge may still move back in, but not further out.
 */
const shiftDates = (feature: GanttFeatureData, days: number, rangeStart: CalendarDate, rangeEnd: CalendarDate) => {
    const endAt = feature.isMilestone ? feature.startAt : feature.endAt;
    const delta = clamp(days, Math.min(0, daysBetween(feature.startAt, rangeStart)), Math.max(0, daysBetween(endAt, rangeEnd)));

    return { startAt: feature.startAt.add({ days: delta }), endAt: endAt.add({ days: delta }) };
};

/** Moves one end by `days`, never letting the feature shrink below a single day. */
const resizeDates = (feature: GanttFeatureData, edge: "start" | "end", days: number, rangeStart: CalendarDate, rangeEnd: CalendarDate) => {
    if (edge === "end") {
        const delta = clamp(days, daysBetween(feature.endAt, feature.startAt), Math.max(0, daysBetween(feature.endAt, rangeEnd)));
        return { startAt: feature.startAt, endAt: feature.endAt.add({ days: delta }) };
    }

    const delta = clamp(days, Math.min(0, daysBetween(feature.startAt, rangeStart)), daysBetween(feature.startAt, feature.endAt));
    return { startAt: feature.startAt.add({ days: delta }), endAt: feature.endAt };
};

/* -------------------------------------------------------------------------------------------------
 * Provider
 * -----------------------------------------------------------------------------------------------*/

export interface GanttProviderProps {
    /** The groups of features to chart, in display order. */
    groups: GanttGroupData[];
    /** First day of the visible range (inclusive). */
    startDate: CalendarDate;
    /** Last day of the visible range (inclusive). */
    endDate: CalendarDate;
    /** The time scale. Also sets how far one arrow-key press moves a bar. @default "week" */
    zoom?: GanttZoom;
    /** Where to draw the "today" line. Pass `null` to hide it. @default today in the local time zone */
    today?: CalendarDate | null;
    /** Labelled vertical lines drawn across the timeline, such as a release date. */
    markers?: GanttMarkerData[];
    /** Whether to shade weekend days (at `day` and `week` zoom). @default true */
    showWeekends?: boolean;
    /** Whether to draw arrows between dependent features. @default true */
    showDependencies?: boolean;
    /** Disables dragging, resizing and keyboard date changes. Bars stay focusable. @default false */
    isReadOnly?: boolean;
    /** Called with the proposed dates when a bar is dragged or moved with the arrow keys. */
    onMove?: (event: GanttChangeEvent) => void;
    /** Called with the proposed dates when a bar edge is dragged or Shift+arrow is pressed. */
    onResize?: (event: GanttChangeEvent) => void;
    /** Called when a bar is activated with a click, Enter or Space (without dragging). */
    onFeaturePress?: (feature: GanttFeatureData) => void;
    /** Maximum height of the scrollable chart. Rows beyond it scroll vertically. */
    maxHeight?: CSSProperties["maxHeight"];
    /** Accessible name of the timeline grid. @default "Gantt chart" */
    "aria-label"?: string;
    /** Usually `<Gantt.Sidebar />` followed by `<Gantt.Timeline />`. */
    children: ReactNode;
    className?: string;
}

/**
 * Holds the date range, zoom and features for a Gantt chart and lays out its children
 * (`Gantt.Sidebar`, `Gantt.Timeline`) inside a single scroll container. Because the header,
 * the body and the sidebar share that one scroller, horizontal scrolling keeps the header
 * and body in sync by construction, and the sidebar stays pinned with `position: sticky`.
 */
export const GanttProvider = ({
    groups,
    startDate,
    endDate,
    zoom = "week",
    today,
    markers = [],
    showWeekends = true,
    showDependencies = true,
    isReadOnly = false,
    onMove,
    onResize,
    onFeaturePress,
    maxHeight,
    "aria-label": label = "Gantt chart",
    children,
    className,
}: GanttProviderProps) => {
    const instructionsId = useId();
    const [focusedId, setFocusedId] = useState<string>();
    const [preview, setPreview] = useState<DatePreview | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const rangeFormatter = useDateFormatter({ month: "short", day: "numeric", year: "numeric" });

    const resolvedToday = today === undefined ? getToday(getLocalTimeZone()) : today;
    const dayWidth = DAY_WIDTH[zoom];
    const totalWidth = (daysBetween(startDate, endDate) + 1) * dayWidth;

    const { rowTops, featureOrder, bodyHeight } = useMemo(() => {
        const tops = new Map<string, number>();
        const order: string[] = [];
        let y = 0;

        for (const group of groups) {
            y += GROUP_ROW_HEIGHT;

            for (const feature of group.features) {
                tops.set(feature.id, y);
                // Only features with a bar on screen take part in the roving tab stop.
                if (isInRange(feature, startDate, endDate)) order.push(feature.id);
                y += ROW_HEIGHT;
            }
        }

        return { rowTops: tops, featureOrder: order, bodyHeight: y };
    }, [groups, startDate, endDate]);

    const activeId = focusedId && featureOrder.includes(focusedId) ? focusedId : featureOrder[0];

    const commit = useCallback<GanttContextValue["commit"]>(
        (kind, feature, dates, source) => {
            const event = { id: feature.id, startAt: dates.startAt, endAt: dates.endAt, source };

            if (kind === "move") onMove?.(event);
            else onResize?.(event);

            if (source === "keyboard") {
                const tz = getLocalTimeZone();
                const range = feature.isMilestone
                    ? rangeFormatter.format(dates.startAt.toDate(tz))
                    : rangeFormatter.formatRange(dates.startAt.toDate(tz), dates.endAt.toDate(tz));
                setAnnouncement(`${feature.name} ${kind === "move" ? "moved to" : "resized to"} ${range}`);
            }
        },
        [onMove, onResize, rangeFormatter],
    );

    const value: GanttContextValue = {
        groups,
        startDate,
        endDate,
        zoom,
        today: resolvedToday,
        markers,
        dayWidth,
        totalWidth,
        bodyHeight,
        rowTops,
        featureOrder,
        isReadOnly,
        showWeekends,
        showDependencies,
        label,
        instructionsId,
        activeId,
        setActiveId: setFocusedId,
        preview,
        setPreview,
        commit,
        onFeaturePress,
    };

    const unit = ZOOM_UNIT_NAME[zoom];

    return (
        <GanttContext.Provider value={value}>
            <div className={cx(styles.root, className)}>
                <div className={styles.scroller} style={{ maxHeight }}>
                    <div className={styles.content}>{children}</div>
                </div>

                <span id={instructionsId} hidden>
                    {isReadOnly
                        ? "Use the up and down arrow keys to move between tasks."
                        : `Use the up and down arrow keys to move between tasks. Left and right arrow keys move the task by one ${unit}; hold Shift to change its end date instead.`}
                </span>
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {announcement}
                </div>
            </div>
        </GanttContext.Provider>
    );
};

/* -------------------------------------------------------------------------------------------------
 * Sidebar
 * -----------------------------------------------------------------------------------------------*/

export interface GanttSidebarProps {
    /** Heading shown above the task list. @default "Tasks" */
    title?: ReactNode;
    /** Width of the sidebar in pixels. @default 256 */
    width?: number;
    /** Whether to show each feature owner's avatar. @default true */
    showAvatars?: boolean;
    className?: string;
}

/** The grouped task list pinned to the inline start of the chart. */
export const GanttSidebar = ({ title = "Tasks", width = 256, showAvatars = true, className }: GanttSidebarProps) => {
    const { groups, label } = useGantt();

    return (
        <div className={cx(styles.sidebar.root, className)} style={{ width }}>
            <div className={styles.sidebar.header}>{title}</div>

            <ul aria-label={`${label} tasks`}>
                {groups.map((group) => (
                    <li key={group.id}>
                        <div className={styles.sidebar.group}>
                            <span className="truncate">{group.name}</span>
                            <span className={styles.sidebar.count}>{group.features.length}</span>
                        </div>

                        <ul aria-label={group.name}>
                            {group.features.map((feature) => (
                                <li key={feature.id} className={styles.sidebar.item}>
                                    {showAvatars && feature.owner && (
                                        <Avatar size="xs" src={feature.owner.src} alt={feature.owner.name} initials={feature.owner.initials} />
                                    )}
                                    <span className={styles.sidebar.name}>{feature.name}</span>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/* -------------------------------------------------------------------------------------------------
 * Timeline
 * -----------------------------------------------------------------------------------------------*/

interface Segment {
    start: CalendarDate;
    end: CalendarDate;
}

/** Splits the range into consecutive calendar units, clipped to the range at both ends. */
const getSegments = (rangeStart: CalendarDate, rangeEnd: CalendarDate, unit: "year" | "month" | "week" | "day", locale: string) => {
    const segments: Segment[] = [];
    let cursor = rangeStart;

    while (cursor.compare(rangeEnd) <= 0) {
        const unitEnd = unit === "year" ? endOfYear(cursor) : unit === "month" ? endOfMonth(cursor) : unit === "week" ? endOfWeek(cursor, locale) : cursor;
        const end = minDate(unitEnd, rangeEnd) as CalendarDate;

        segments.push({ start: cursor, end });
        cursor = end.add({ days: 1 });
    }

    return segments;
};

export interface GanttTimelineProps {
    /**
     * Renders each feature. Defaults to `<Gantt.Feature feature={feature} />`; pass a function
     * to customise one bar without re-implementing the layout.
     */
    children?: (feature: GanttFeatureData) => ReactNode;
    className?: string;
}

/** The date header and the grid of feature rows. */
export const GanttTimeline = ({ children, className }: GanttTimelineProps) => {
    const { groups, startDate, endDate, zoom, today, markers, dayWidth, totalWidth, bodyHeight, rowTops, preview, showWeekends, showDependencies, label } =
        useGantt();
    const { locale } = useLocale();
    const arrowId = useId();

    const longMonth = useDateFormatter({ month: "long", year: "numeric" });
    const shortMonth = useDateFormatter({ month: "short" });
    const yearFormatter = useDateFormatter({ year: "numeric" });
    const weekFormatter = useDateFormatter({ month: "short", day: "numeric" });
    const dayFormatter = useDateFormatter({ day: "numeric" });
    const markerFormatter = useDateFormatter({ month: "long", day: "numeric", year: "numeric" });

    const tz = getLocalTimeZone();
    const offsetOf = (date: CalendarDate) => daysBetween(startDate, date) * dayWidth;
    const widthOf = (segment: Segment) => (daysBetween(segment.start, segment.end) + 1) * dayWidth;

    const primary = getSegments(startDate, endDate, zoom === "month" ? "year" : "month", locale);
    const secondary = getSegments(startDate, endDate, zoom === "day" ? "day" : zoom === "week" ? "week" : "month", locale);

    const formatPrimary = (segment: Segment) => (zoom === "month" ? yearFormatter : longMonth).format(segment.start.toDate(tz));
    const formatSecondary = (segment: Segment) =>
        (zoom === "day" ? dayFormatter : zoom === "week" ? weekFormatter : shortMonth).format(segment.start.toDate(tz));

    const weekendDays = useMemo(() => {
        if (!showWeekends || zoom === "month") return [];

        const days: CalendarDate[] = [];
        for (let day = startDate; day.compare(endDate) <= 0; day = day.add({ days: 1 })) {
            if (isWeekend(day, locale)) days.push(day);
        }
        return days;
    }, [showWeekends, zoom, startDate, endDate, locale]);

    const features = groups.flatMap((group) => group.features);
    const featureById = new Map(features.map((feature) => [feature.id, feature]));

    /** Pixel span of a feature on the x axis, using its preview dates while dragging. */
    const spanOf = (feature: GanttFeatureData) => {
        const { startAt, endAt } = getRenderedDates(feature, preview);

        if (feature.isMilestone) {
            const center = offsetOf(startAt) + dayWidth / 2;
            return { x1: center - MILESTONE_SIZE / 2, x2: center + MILESTONE_SIZE / 2 };
        }

        return { x1: offsetOf(startAt), x2: offsetOf(endAt) + dayWidth };
    };

    const arrows = showDependencies
        ? features.flatMap((feature) =>
              (feature.dependencies ?? []).flatMap((dependencyId) => {
                  const predecessor = featureById.get(dependencyId);
                  const fromTop = rowTops.get(dependencyId);
                  const toTop = rowTops.get(feature.id);
                  if (!predecessor || fromTop === undefined || toTop === undefined) return [];
                  if (!isInRange(predecessor, startDate, endDate) || !isInRange(feature, startDate, endDate)) return [];

                  const x1 = spanOf(predecessor).x2;
                  const x2 = spanOf(feature).x1;
                  const y1 = fromTop + ROW_HEIGHT / 2;
                  const y2 = toTop + ROW_HEIGHT / 2;

                  // Room for a simple elbow; otherwise route back along the row boundary.
                  const d =
                      x2 - x1 >= 16
                          ? `M ${x1} ${y1} H ${x1 + 8} V ${y2} H ${x2 - 2}`
                          : `M ${x1} ${y1} H ${x1 + 8} V ${y2 > y1 ? toTop : toTop + ROW_HEIGHT} H ${x2 - 10} V ${y2} H ${x2 - 2}`;

                  return [{ id: `${dependencyId}-${feature.id}`, d }];
              }),
          )
        : [];

    const isTodayVisible = today && today.compare(startDate) >= 0 && today.compare(endDate) <= 0;

    return (
        <div className={cx(styles.timeline.root, className)} style={{ width: totalWidth }}>
            {/* The scale is decorative: every bar's accessible name carries its own dates. */}
            <div aria-hidden="true" className={styles.timeline.header}>
                {[primary, secondary].map((segments, rowIndex) => (
                    <div key={rowIndex} className={cx(styles.timeline.headerRow, rowIndex === 0 && "border-secondary border-b")}>
                        {segments.map((segment) => {
                            const isWeekendDay = zoom === "day" && showWeekends && isWeekend(segment.start, locale);

                            return (
                                <div
                                    key={segment.start.toString()}
                                    className={cx(
                                        styles.timeline.headerCell,
                                        rowIndex === 0 ? "text-secondary font-semibold" : "text-tertiary",
                                        zoom === "day" && rowIndex === 1 && "justify-center px-0",
                                        isWeekendDay && "bg-secondary_alt text-quaternary",
                                    )}
                                    style={{ insetInlineStart: offsetOf(segment.start), width: widthOf(segment) }}
                                >
                                    {rowIndex === 0 ? formatPrimary(segment) : formatSecondary(segment)}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div role="grid" aria-label={label} aria-rowcount={groups.length + features.length} className={styles.timeline.body} style={{ height: bodyHeight }}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                    {weekendDays.map((day) => (
                        <div key={day.toString()} className={styles.timeline.weekend} style={{ insetInlineStart: offsetOf(day), width: dayWidth }} />
                    ))}
                    {secondary.map((segment) => (
                        <div
                            key={segment.start.toString()}
                            className={styles.timeline.gridLine}
                            style={{ insetInlineStart: offsetOf(segment.start), width: widthOf(segment) }}
                        />
                    ))}
                </div>

                {groups.map((group) => (
                    <div key={group.id} role="rowgroup">
                        <div role="row" className={styles.timeline.groupRow}>
                            <div role="gridcell" className="sr-only">
                                {group.name}
                            </div>
                        </div>

                        {group.features.map((feature) => (
                            <div key={feature.id} role="row" className={styles.timeline.row}>
                                <div role="gridcell" className="absolute inset-0">
                                    {isInRange(feature, startDate, endDate) && (children ? children(feature) : <GanttFeature feature={feature} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Drawn after the rows so the lines stay visible across the group headings. */}
                {(isTodayVisible || markers.length > 0) && (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                        {markers.map((marker) => (
                            <div key={marker.id} className={styles.timeline.marker} style={{ insetInlineStart: offsetOf(marker.date) + dayWidth / 2 }}>
                                <span className={styles.timeline.markerLabel}>{marker.label}</span>
                            </div>
                        ))}
                        {isTodayVisible && (
                            <>
                                <div className={styles.timeline.today} style={{ insetInlineStart: offsetOf(today) + dayWidth / 2 }} />
                                <span className={styles.timeline.todayLabel} style={{ insetInlineStart: offsetOf(today) + dayWidth / 2 }}>
                                    Today
                                </span>
                            </>
                        )}
                    </div>
                )}

                {arrows.length > 0 && (
                    <svg aria-hidden="true" className={styles.timeline.arrows} width={totalWidth} height={bodyHeight}>
                        <defs>
                            <marker id={arrowId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 8 4 L 0 8 z" className="fill-fg-quaternary" />
                            </marker>
                        </defs>
                        {arrows.map((arrow) => (
                            <path key={arrow.id} d={arrow.d} fill="none" strokeWidth={1.5} className="stroke-fg-quaternary" markerEnd={`url(#${arrowId})`} />
                        ))}
                    </svg>
                )}
            </div>

            {markers.length > 0 && (
                <ul aria-label={`${label} markers`} className="sr-only">
                    {markers.map((marker) => (
                        <li key={marker.id}>
                            {marker.label}: {markerFormatter.format(marker.date.toDate(tz))}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

/* -------------------------------------------------------------------------------------------------
 * Feature
 * -----------------------------------------------------------------------------------------------*/

type DragMode = "move" | "resize-start" | "resize-end";

interface DragState {
    mode: DragMode;
    originX: number;
    isRtl: boolean;
    delta: number;
}

export interface GanttFeatureProps {
    /** The feature to draw. */
    feature: GanttFeatureData;
    className?: string;
}

/**
 * One focusable bar (or milestone diamond). Drag to move, drag an edge to resize; with the
 * keyboard, arrow keys move by one zoom unit and Shift+arrow keys change the end date.
 */
export const GanttFeature = ({ feature, className }: GanttFeatureProps) => {
    const { startDate, endDate, zoom, dayWidth, isReadOnly, instructionsId, activeId, setActiveId, preview, setPreview, commit, onFeaturePress } = useGantt();
    const rangeFormatter = useDateFormatter({ month: "short", day: "numeric", year: "numeric" });
    const dragRef = useRef<DragState | null>(null);
    const suppressClickRef = useRef(false);

    const { startAt, endAt } = getRenderedDates(feature, preview);
    const isDragging = preview?.id === feature.id;
    const color = styles.colors[feature.color ?? "brand"];
    const progress = clamp(feature.progress ?? 0, 0, 100);

    const tz = getLocalTimeZone();
    const dateText = feature.isMilestone
        ? `milestone, ${rangeFormatter.format(startAt.toDate(tz))}`
        : rangeFormatter.formatRange(startAt.toDate(tz), endAt.toDate(tz));
    const accessibleName = [
        feature.name,
        dateText,
        !feature.isMilestone && feature.progress !== undefined ? `${progress}% complete` : null,
        feature.owner ? `owner ${feature.owner.name}` : null,
    ]
        .filter(Boolean)
        .join(", ");

    const datesFor = (mode: DragMode, days: number) =>
        mode === "move"
            ? shiftDates(feature, days, startDate, endDate)
            : resizeDates(feature, mode === "resize-start" ? "start" : "end", days, startDate, endDate);

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        const target = event.currentTarget;

        if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Home" || event.key === "End") {
            const bars = Array.from(target.closest("[role='grid']")?.querySelectorAll<HTMLElement>("[data-gantt-feature]") ?? []);
            const index = bars.indexOf(target);
            const next = event.key === "Home" ? bars[0] : event.key === "End" ? bars[bars.length - 1] : bars[index + (event.key === "ArrowDown" ? 1 : -1)];

            event.preventDefault();
            next?.focus();
            return;
        }

        if (isReadOnly || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;

        event.preventDefault();

        const isRtl = getComputedStyle(target).direction === "rtl";
        const forward = (event.key === "ArrowRight") !== isRtl;
        const isResize = event.shiftKey && !feature.isMilestone;
        const anchor = isResize ? feature.endAt : feature.startAt;
        const unit = ZOOM_UNIT[zoom];
        const days = forward ? daysBetween(anchor, anchor.add(unit)) : -daysBetween(anchor.subtract(unit), anchor);
        const next = datesFor(isResize ? "resize-end" : "move", days);

        if (next.startAt.compare(feature.startAt) === 0 && next.endAt.compare(feature.endAt) === 0) return;

        commit(isResize ? "resize" : "move", feature, next, "keyboard");
    };

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        if (isReadOnly || event.button !== 0) return;

        const handle = (event.target as HTMLElement).closest("[data-handle]")?.getAttribute("data-handle");
        const mode: DragMode = feature.isMilestone || !handle ? "move" : handle === "start" ? "resize-start" : "resize-end";

        dragRef.current = { mode, originX: event.clientX, isRtl: getComputedStyle(event.currentTarget).direction === "rtl", delta: 0 };
        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current;
        if (!drag) return;

        const dx = (event.clientX - drag.originX) * (drag.isRtl ? -1 : 1);
        const delta = Math.round(dx / dayWidth);
        if (delta === drag.delta) return;

        drag.delta = delta;
        setPreview({ id: feature.id, ...datesFor(drag.mode, delta) });
    };

    const endDrag = (event: PointerEvent<HTMLButtonElement>, shouldCommit: boolean) => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        setPreview(null);

        if (shouldCommit && drag.delta !== 0) {
            suppressClickRef.current = true;
            commit(drag.mode === "move" ? "move" : "resize", feature, datesFor(drag.mode, drag.delta), "pointer");
        }
    };

    const sharedProps = {
        type: "button" as const,
        "data-gantt-feature": feature.id,
        tabIndex: activeId === feature.id ? 0 : -1,
        "aria-label": accessibleName,
        "aria-describedby": instructionsId,
        onFocus: () => setActiveId(feature.id),
        onKeyDown: handleKeyDown,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: (event: PointerEvent<HTMLButtonElement>) => endDrag(event, true),
        onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => endDrag(event, false),
        onClick: () => {
            if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
            }
            onFeaturePress?.(feature);
        },
    };

    const offset = daysBetween(startDate, startAt) * dayWidth;

    if (feature.isMilestone) {
        return (
            <button
                {...sharedProps}
                className={cx(styles.feature.milestone, !isReadOnly && "touch-none", isReadOnly && "cursor-pointer", className)}
                style={{ insetInlineStart: offset + dayWidth / 2 - MILESTONE_SIZE / 2 }}
            >
                <span aria-hidden="true" className={cx(styles.feature.milestoneDiamond, color.solid, isDragging && "shadow-lg")} />
                <span aria-hidden="true" className={styles.feature.milestoneLabel}>
                    {feature.name}
                </span>
            </button>
        );
    }

    return (
        <button
            {...sharedProps}
            className={cx(styles.feature.bar, color.bar, isReadOnly ? styles.feature.readOnly : "touch-none", isDragging && styles.feature.dragging, className)}
            style={{ insetInlineStart: offset, width: (daysBetween(startAt, endAt) + 1) * dayWidth }}
        >
            {progress > 0 && <span aria-hidden="true" className={cx(styles.feature.progress, color.fill)} style={{ width: `${progress}%` }} />}
            <span aria-hidden="true" className={styles.feature.label}>
                {feature.name}
            </span>

            {!isReadOnly && (
                <>
                    <span aria-hidden="true" data-handle="start" className={cx(styles.feature.handle, "start-0")}>
                        <span className={styles.feature.handleGrip} />
                    </span>
                    <span aria-hidden="true" data-handle="end" className={cx(styles.feature.handle, "end-0")}>
                        <span className={styles.feature.handleGrip} />
                    </span>
                </>
            )}
        </button>
    );
};

/* -------------------------------------------------------------------------------------------------
 * Compound export
 * -----------------------------------------------------------------------------------------------*/

/**
 * A Gantt chart built from `Gantt.Provider`, `Gantt.Sidebar`, `Gantt.Timeline` and `Gantt.Feature`.
 */
export const Gantt = {
    Provider: GanttProvider,
    Sidebar: GanttSidebar,
    Timeline: GanttTimeline,
    Feature: GanttFeature,
};
