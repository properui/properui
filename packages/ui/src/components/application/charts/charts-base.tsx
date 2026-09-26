"use client";

import type { CSSProperties } from "react";
import type { TooltipProps } from "recharts";
import type { Props as LegendContentProps } from "recharts/types/component/DefaultLegendContent";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { Props as DotProps } from "recharts/types/shape/Dot";
import { cx } from "../../../utils/cx";

/**
 * Ordered semantic color tokens (bare keys into `theme.css`'s utility color scale, e.g.
 * `"brand-600"` resolves to `--color-utility-brand-600`) for coloring an unknown number of
 * categorical chart series. Assign colors by index — `chartColorTokens[i % chartColorTokens.length]`
 * — rather than hand-picking one token per series.
 *
 * The order is deliberate:
 * 1. `brand-600` leads: a chart's first, "primary" series should read as the product's own color.
 * 2. The rest alternate a cool hue with a warm one (blue, purple, orange, green, pink, indigo,
 *    amber, sky, fuchsia), so two adjacent series never sit close on the color wheel.
 * 3. `red-*` is deliberately left out of this order. Red is reserved for negative values, errors
 *    and destructive actions elsewhere in the library (`text-fg-error-secondary`, `border-error`,
 *    …), so a chart that truly needs a danger-coded series should reach for it explicitly instead
 *    of it being whatever color a loop happens to land on.
 * 4. `slate`/`neutral` are left out too. They read as muted or disabled (the same
 *    `text-utility-neutral-*` tokens color gridlines and axes throughout this folder), so pull one
 *    in only for an explicit "other"/"unknown" bucket, never as one of the numbered series.
 */
export const chartColorTokens = [
    "brand-600",
    "blue-500",
    "purple-500",
    "orange-500",
    "green-500",
    "pink-500",
    "indigo-500",
    "amber-500",
    "sky-500",
    "fuchsia-500",
] as const;

/**
 * `chartColorTokens`, each resolved to its CSS variable reference (e.g.
 * `"var(--color-utility-brand-600)"`). Use these directly as a `fill`/`stroke` SVG attribute or an
 * inline `style.color`, for charts that assign color programmatically — a variable number of
 * scatter categories, funnel stages, a small-multiples grid — rather than one `<Area>`/`<Bar>` per
 * series with a fixed, hand-picked `className`. Reading the variable at paint time is what re-tints
 * the color under `.dark-mode`, the same as any `bg-*`/`text-*` utility class does.
 */
export const chartColors: string[] = chartColorTokens.map((token) => `var(--color-utility-${token})`);

/**
 * Builds a single-hue, light-to-dark color scale from one of `theme.css`'s utility color
 * families, for a series that is ordered or quantitative rather than categorical — small
 * multiples of the same metric, a funnel's stages.
 * @param tokenPrefix - The utility color family, e.g. `"blue"`, `"brand"`.
 * @param shades - Which shade steps to include, lightest to darkest. Defaults to the six shades
 * every utility family has (`brand` and `neutral` go further in `theme.css`; pass a longer list to
 * reach those).
 * @returns CSS variable references, e.g. `["var(--color-utility-blue-200)", …]`.
 */
export const sequentialScale = (tokenPrefix: string, shades: number[] = [200, 300, 400, 500, 600, 700]): string[] =>
    shades.map((shade) => `var(--color-utility-${tokenPrefix}-${shade})`);

/**
 * Selects evenly spaced items from an array. Used for rendering
 * certain number of x-axis labels.
 * @param dataArray - The array of items to select from.
 * @param count - The number of items to select.
 * @returns The selected items.
 */
export const selectEvenlySpacedItems = <T extends readonly unknown[]>(dataArray: T, count: number): Array<T[number]> => {
    if (!dataArray || dataArray.length === 0) {
        return [];
    }

    const selectedItems: Array<T[number]> = [];

    if (dataArray.length === 1) {
        for (let i = 0; i < count; i++) {
            selectedItems.push(dataArray[0]);
        }
        return selectedItems;
    }

    for (let i = 0; i < count; i++) {
        const targetIndex = Math.round((i * (dataArray.length - 1)) / (count - 1));
        const boundedIndex = Math.max(0, Math.min(targetIndex, dataArray.length - 1));
        selectedItems.push(dataArray[boundedIndex]);
    }

    return selectedItems;
};

/**
 * Renders the legend content for a chart.
 * @param reversed - Whether to reverse the payload.
 * @param payload - The payload of the legend.
 * @param align - The alignment of the legend.
 * @param layout - The layout of the legend.
 * @param className - The class name of the legend.
 * @returns The legend content.
 */
export const ChartLegendContent = ({ reversed, payload, align, layout, className }: LegendContentProps & { reversed?: boolean; className?: string }) => {
    payload = reversed ? payload?.slice().reverse() : payload;

    return (
        <ul
            className={cx(
                "flex",
                layout === "vertical"
                    ? `flex-col gap-1 ps-4 ${align === "center" ? "items-center" : align === "right" ? "items-start" : "items-start"}`
                    : `flex-row gap-3 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`,
                className,
            )}
        >
            {payload?.map((entry, index) => {
                // A series colored through `chartColorTokens`/`chartColors` (an unknown number of
                // categorical entries) carries its swatch color as an inline style rather than a
                // fixed `className`; a series colored with a hand-picked `text-utility-*` class
                // carries `className` instead. Either is read here so both patterns render a
                // correctly tinted swatch.
                const swatchPayload = entry.payload as { className?: string; style?: CSSProperties } | undefined;

                return (
                    <li className="text-tertiary flex items-center gap-2 text-sm" key={index}>
                        <span
                            className={cx("block size-2 rounded-full bg-current ring-[0.5px] ring-black/10 ring-inset", swatchPayload?.className)}
                            style={swatchPayload?.style?.color ? { color: swatchPayload.style.color } : undefined}
                        />
                        {entry.value}
                    </li>
                );
            })}
        </ul>
    );
};

interface ChartTooltipContentProps extends TooltipProps<ValueType, NameType> {
    isRadialChart?: boolean;
    isPieChart?: boolean;
    label?: string;
    // We have to use `any` here because the `payload` prop is not typed correctly in the `recharts` library.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
}

export const ChartTooltipContent = ({ active, payload, label, isRadialChart, isPieChart, formatter, labelFormatter }: ChartTooltipContentProps) => {
    const canRender = active && payload && payload.length;

    if (!canRender) {
        return null;
    }

    const isSingleDataPoint = payload.length === 1;

    // If it's a single data point, we use the value as the title and
    // the name as the secondary title.
    let title = isSingleDataPoint ? (isRadialChart ? payload[0].value : isPieChart ? payload[0].value : payload[0].value) : label;
    let secondaryTitle = isSingleDataPoint ? (isRadialChart ? payload[0].payload.name : isPieChart ? payload[0].name : label) : payload;

    title =
        isSingleDataPoint && formatter
            ? formatter(title, payload?.[0].name || label, payload[0], 0, payload)
            : labelFormatter
              ? labelFormatter(title, payload)
              : title;
    secondaryTitle = isSingleDataPoint && labelFormatter ? labelFormatter(secondaryTitle, payload) : secondaryTitle;

    return (
        <div className="bg-primary-solid flex flex-col gap-0.5 rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs font-semibold text-white">{title}</p>

            {!secondaryTitle ? null : Array.isArray(secondaryTitle) ? (
                <div>
                    {secondaryTitle.map((entry, index) => (
                        <p key={index} className={cx("text-tooltip-supporting-text text-xs")}>
                            {`${entry.name}: ${formatter ? formatter(entry.value, entry.name, entry, index, entry.payload) : entry.value}`}
                        </p>
                    ))}
                </div>
            ) : (
                <p className="text-tooltip-supporting-text text-xs">{secondaryTitle}</p>
            )}
        </div>
    );
};

interface ChartActiveDotProps extends DotProps {
    // We have to use `any` here because the `payload` prop is not typed correctly in the `recharts` library.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
}

export const ChartActiveDot = ({ cx = 0, cy = 0 }: ChartActiveDotProps) => {
    const size = 12;

    return (
        <svg x={cx - size / 2} y={cy - size / 2} width={size} height={size} viewBox="0 0 12 12" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="6" className="fill-bg-primary stroke-utility-brand-600" strokeWidth="2" />
        </svg>
    );
};
