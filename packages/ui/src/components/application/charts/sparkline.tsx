"use client";

import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer } from "recharts";
import { cx } from "../../../utils/cx";

/** Visual form a `Sparkline` draws its points as. */
export type SparklineType = "line" | "area" | "bar";

/** A single plotted point. */
export interface SparklineDatum {
    /** The plotted value. */
    value: number;
}

export interface SparklineProps {
    /** Points to plot, left to right. Plain numbers are wrapped into `{ value }` automatically. */
    data: number[] | SparklineDatum[];
    /** Visual form of the chart. Defaults to `"line"`. */
    type?: SparklineType;
    /**
     * A key into `theme.css`'s utility color scale, e.g. `"brand-600"`, `"green-500"`, `"red-500"`
     * — the same family `chartColorTokens` in `charts-base` draws from. Resolved to
     * `var(--color-utility-<color>)`, so it re-tints under `.dark-mode` like any other token.
     * Defaults to `"brand-600"`.
     */
    color?: string;
    /** Marks the final point: a ringed dot for `line`/`area`, full opacity for `bar` (the rest are dimmed). */
    showLast?: boolean;
    /** Pixel height of the chart. Width fills its container. Defaults to `32`. */
    height?: number;
    className?: string;
}

const chartMargin = { top: 4, right: 2, bottom: 2, left: 2 };

const toDatums = (data: SparklineProps["data"]): SparklineDatum[] =>
    data.length > 0 && typeof data[0] === "number" ? (data as number[]).map((value) => ({ value })) : (data as SparklineDatum[]);

interface LastPointDotProps {
    cx?: number;
    cy?: number;
    index?: number;
}

/**
 * A tiny single-series chart for metric cards and table cells: a line, a
 * gradient-filled area, or a set of bars, optionally marking the final point.
 */
export const Sparkline = ({ data, type = "line", color = "brand-600", showLast = false, height = 32, className }: SparklineProps) => {
    const id = useId();
    const gradientId = `sparkline-gradient-${id}`;
    const points = toDatums(data);
    const lastIndex = points.length - 1;
    const colorValue = `var(--color-utility-${color})`;

    const renderLastDot = ({ cx, cy, index }: LastPointDotProps) =>
        index === lastIndex ? (
            <circle key={index} cx={cx} cy={cy} r={2.5} strokeWidth={1.5} className="stroke-bg-primary" style={{ fill: colorValue }} />
        ) : null;

    return (
        <div className={cx("w-full", className)} style={{ height, color: colorValue }}>
            <ResponsiveContainer initialDimension={{ width: 1, height: 1 }}>
                {type === "area" ? (
                    <AreaChart data={points} margin={chartMargin}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="currentColor" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <Area
                            isAnimationActive={false}
                            type="monotone"
                            dataKey="value"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            fill={`url(#${gradientId})`}
                            dot={showLast ? renderLastDot : false}
                            activeDot={false}
                        />
                    </AreaChart>
                ) : type === "bar" ? (
                    <BarChart data={points} margin={chartMargin}>
                        <Bar isAnimationActive={false} dataKey="value" fill="currentColor" radius={[1, 1, 0, 0]} maxBarSize={6}>
                            {showLast && points.map((_, index) => <Cell key={index} fillOpacity={index === lastIndex ? 1 : 0.35} />)}
                        </Bar>
                    </BarChart>
                ) : (
                    <LineChart data={points} margin={chartMargin}>
                        <Line
                            isAnimationActive={false}
                            type="monotone"
                            dataKey="value"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            dot={showLast ? renderLastDot : false}
                            activeDot={false}
                        />
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
};
