"use client";

import type { TooltipProps } from "recharts";
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Funnel,
    FunnelChart,
    Label,
    LabelList,
    Legend,
    Line,
    BarChart as RechartsBarChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartLegendContent, ChartTooltipContent, chartColors } from "./charts-base";

// New customers per month, plus the running cumulative total.
const newCustomersData = [
    { month: new Date(2026, 0, 1), newCustomers: 80, cumulative: 80 },
    { month: new Date(2026, 1, 1), newCustomers: 95, cumulative: 175 },
    { month: new Date(2026, 2, 1), newCustomers: 110, cumulative: 285 },
    { month: new Date(2026, 3, 1), newCustomers: 90, cumulative: 375 },
    { month: new Date(2026, 4, 1), newCustomers: 130, cumulative: 505 },
    { month: new Date(2026, 5, 1), newCustomers: 150, cumulative: 655 },
    { month: new Date(2026, 6, 1), newCustomers: 140, cumulative: 795 },
    { month: new Date(2026, 7, 1), newCustomers: 170, cumulative: 965 },
    { month: new Date(2026, 8, 1), newCustomers: 160, cumulative: 1125 },
    { month: new Date(2026, 9, 1), newCustomers: 190, cumulative: 1315 },
    { month: new Date(2026, 10, 1), newCustomers: 210, cumulative: 1525 },
    { month: new Date(2026, 11, 1), newCustomers: 230, cumulative: 1755 },
];

// Sessions (left axis, thousands) against conversion rate (right axis, %).
const dualAxisData = [
    { month: new Date(2026, 0, 1), sessions: 12, conversionRate: 2.1 },
    { month: new Date(2026, 1, 1), sessions: 13, conversionRate: 2.3 },
    { month: new Date(2026, 2, 1), sessions: 15, conversionRate: 2.2 },
    { month: new Date(2026, 3, 1), sessions: 14, conversionRate: 2.6 },
    { month: new Date(2026, 4, 1), sessions: 17, conversionRate: 2.8 },
    { month: new Date(2026, 5, 1), sessions: 19, conversionRate: 2.7 },
    { month: new Date(2026, 6, 1), sessions: 18, conversionRate: 3.1 },
    { month: new Date(2026, 7, 1), sessions: 21, conversionRate: 3.3 },
    { month: new Date(2026, 8, 1), sessions: 23, conversionRate: 3.2 },
    { month: new Date(2026, 9, 1), sessions: 22, conversionRate: 3.6 },
    { month: new Date(2026, 10, 1), sessions: 25, conversionRate: 3.8 },
    { month: new Date(2026, 11, 1), sessions: 27, conversionRate: 4.0 },
];

const monthlySalesTarget = 500;

// Units sold per month, tracked against a fixed target.
const salesVsTarget = [
    { month: new Date(2026, 0, 1), sales: 380 },
    { month: new Date(2026, 1, 1), sales: 420 },
    { month: new Date(2026, 2, 1), sales: 460 },
    { month: new Date(2026, 3, 1), sales: 410 },
    { month: new Date(2026, 4, 1), sales: 510 },
    { month: new Date(2026, 5, 1), sales: 540 },
    { month: new Date(2026, 6, 1), sales: 495 },
    { month: new Date(2026, 7, 1), sales: 560 },
    { month: new Date(2026, 8, 1), sales: 520 },
    { month: new Date(2026, 9, 1), sales: 580 },
    { month: new Date(2026, 10, 1), sales: 610 },
    { month: new Date(2026, 11, 1), sales: 590 },
];

interface WaterfallStep {
    name: string;
    /** An absolute total — starts or ends the bridge. Mutually exclusive with `delta`. */
    value?: number;
    /** A signed change from the running total. Mutually exclusive with `value`. */
    delta?: number;
}

interface WaterfallDatum {
    name: string;
    /** Invisible bar stacked underneath `total`, floating it at the right height. */
    base: number;
    /** The visible bar height — the total itself, or the absolute size of the change. */
    total: number;
    /** Formatted for the bar's label, with the change's sign kept (`"+150"`, `"-30"`). */
    displayValue: string;
    isTotal: boolean;
    isIncrease: boolean;
}

/**
 * Turns a list of totals and signed deltas into a waterfall's stacked-bar data: an invisible
 * `base` floating each visible `total` bar at the right height.
 * @param steps - Totals (`value`) and changes from the running total (`delta`), in order.
 */
const buildWaterfallData = (steps: WaterfallStep[]): WaterfallDatum[] => {
    let running = 0;

    return steps.map((step) => {
        if (step.value !== undefined) {
            running = step.value;
            return { name: step.name, base: 0, total: step.value, displayValue: `$${step.value}`, isTotal: true, isIncrease: true };
        }

        const delta = step.delta ?? 0;
        const start = running;
        running += delta;

        return {
            name: step.name,
            base: Math.min(start, running),
            total: Math.abs(delta),
            displayValue: delta >= 0 ? `+$${delta}` : `-$${Math.abs(delta)}`,
            isTotal: false,
            isIncrease: delta >= 0,
        };
    });
};

const waterfallData = buildWaterfallData([
    { name: "Starting cash", value: 200 },
    { name: "New revenue", delta: 150 },
    { name: "Refunds", delta: -30 },
    { name: "COGS", delta: -60 },
    { name: "Opex", delta: -50 },
    { name: "Ending cash", value: 210 },
]);

const waterfallColors = { total: chartColors[0], increase: chartColors[4], decrease: "var(--color-utility-red-500)" };

interface WaterfallTooltipContentProps extends TooltipProps<ValueType, NameType> {
    // `payload` is mistyped upstream in `recharts` (see `charts-base`'s `ChartTooltipContentProps`).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
}

/**
 * The waterfall stacks an invisible `base` bar underneath the visible `total` — only `total`
 * should ever reach the tooltip, shown as the step's signed change rather than its bar height.
 */
const WaterfallTooltipContent = (props: WaterfallTooltipContentProps) => (
    <ChartTooltipContent
        {...props}
        payload={props.payload?.filter((entry: { dataKey?: string }) => entry.dataKey === "total")}
        formatter={(_value, _name, entry) => (entry as { payload?: WaterfallDatum })?.payload?.displayValue}
    />
);

const funnelStages = [
    { name: "Visitors", value: 4200 },
    { name: "Signups", value: 2600 },
    { name: "Trials started", value: 1400 },
    { name: "Paid customers", value: 640 },
].map((stage, index) => ({ ...stage, style: { color: chartColors[index % chartColors.length] } }));

/** A bar series and a line series sharing one axis. */
export const BarLineComposed = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <ComposedChart data={newCustomersData} className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 0, top: 12, bottom: 18 }}>
                <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                <Legend verticalAlign="top" align="right" layout="vertical" content={<ChartLegendContent className="-translate-y-2" />} />

                <XAxis
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={11}
                    interval="preserveStartEnd"
                    dataKey="month"
                    tickFormatter={(value) => value.toLocaleDateString(undefined, { month: "short" })}
                >
                    <Label value="Month" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                </XAxis>

                <YAxis
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => Number(value).toLocaleString()}
                >
                    <Label
                        value="Customers"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <Tooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => Number(value).toLocaleString()}
                    labelFormatter={(value) => new Date(value as string | number | Date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    cursor={{ className: "fill-utility-neutral-200/20" }}
                />

                <Bar
                    isAnimationActive={false}
                    style={{ color: chartColors[0] }}
                    dataKey="newCustomers"
                    name="New customers"
                    fill="currentColor"
                    maxBarSize={24}
                    radius={[4, 4, 0, 0]}
                />
                <Line
                    isAnimationActive={false}
                    style={{ color: chartColors[6] }}
                    dataKey="cumulative"
                    name="Cumulative total"
                    type="monotone"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

/** Sessions on the left axis, conversion rate on the right. */
export const DualAxisChart = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <ComposedChart data={dualAxisData} className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 4, top: 12, bottom: 18 }}>
                <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                <Legend verticalAlign="top" align="right" layout="vertical" content={<ChartLegendContent className="-translate-y-2" />} />

                <XAxis
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={11}
                    interval="preserveStartEnd"
                    dataKey="month"
                    tickFormatter={(value) => value.toLocaleDateString(undefined, { month: "short" })}
                >
                    <Label value="Month" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                </XAxis>

                <YAxis
                    yAxisId="left"
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => `${Number(value).toLocaleString()}k`}
                >
                    <Label
                        value="Sessions"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <YAxis
                    yAxisId="right"
                    orientation="right"
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => `${value}%`}
                >
                    <Label
                        value="Conversion rate"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={90}
                        position="insideRight"
                    />
                </YAxis>

                <Tooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => (name === "Conversion rate" ? `${value}%` : `${Number(value).toLocaleString()}k`)}
                    labelFormatter={(value) => new Date(value as string | number | Date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    cursor={{ className: "fill-utility-neutral-200/20" }}
                />

                <Bar
                    isAnimationActive={false}
                    yAxisId="left"
                    style={{ color: chartColors[0] }}
                    dataKey="sessions"
                    name="Sessions"
                    fill="currentColor"
                    maxBarSize={24}
                    radius={[4, 4, 0, 0]}
                />
                <Line
                    isAnimationActive={false}
                    yAxisId="right"
                    style={{ color: chartColors[3] }}
                    dataKey="conversionRate"
                    name="Conversion rate"
                    type="monotone"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

/** Monthly sales bars against a fixed target drawn with `ReferenceLine`. */
export const BarWithTargetLine = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <RechartsBarChart data={salesVsTarget} className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 12, top: 12, bottom: 18 }}>
                <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                <XAxis
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={11}
                    interval="preserveStartEnd"
                    dataKey="month"
                    tickFormatter={(value) => value.toLocaleDateString(undefined, { month: "short" })}
                >
                    <Label value="Month" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                </XAxis>

                <YAxis
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => Number(value).toLocaleString()}
                >
                    <Label
                        value="Units sold"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <Tooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => Number(value).toLocaleString()}
                    labelFormatter={(value) => new Date(value as string | number | Date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    cursor={{ className: "fill-utility-neutral-200/20" }}
                />

                <ReferenceLine
                    y={monthlySalesTarget}
                    stroke="currentColor"
                    className="text-utility-neutral-500"
                    strokeDasharray="6 4"
                    label={<Label value="Target" position="insideTopRight" fill="currentColor" className="text-utility-neutral-500 text-xs! font-medium" />}
                />

                <Bar
                    isAnimationActive={false}
                    style={{ color: chartColors[0] }}
                    dataKey="sales"
                    name="Units sold"
                    fill="currentColor"
                    maxBarSize={24}
                    radius={[4, 4, 0, 0]}
                >
                    {salesVsTarget.map((point, index) => (
                        <Cell key={index} style={{ color: point.sales >= monthlySalesTarget ? chartColors[4] : chartColors[0] }} />
                    ))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    </div>
);

/** A cash bridge built from two stacked bars per step: an invisible `base` floating a colored `total`. */
export const WaterfallChart = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <RechartsBarChart data={waterfallData} className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 0, top: 24, bottom: 18 }}>
                <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                <XAxis dataKey="name" fill="currentColor" axisLine={false} tickLine={false} tickMargin={11} interval={0} />

                <YAxis fill="currentColor" axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value).toLocaleString()}`}>
                    <Label
                        value="Cash"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <Tooltip content={<WaterfallTooltipContent />} cursor={{ className: "fill-utility-neutral-200/20" }} />

                <Bar dataKey="base" stackId="waterfall" isAnimationActive={false} fill="transparent" legendType="none" />

                <Bar dataKey="total" name="total" stackId="waterfall" isAnimationActive={false} fill="currentColor" maxBarSize={48} radius={[3, 3, 3, 3]}>
                    {waterfallData.map((step, index) => (
                        <Cell
                            key={index}
                            style={{ color: step.isTotal ? waterfallColors.total : step.isIncrease ? waterfallColors.increase : waterfallColors.decrease }}
                        />
                    ))}
                    <LabelList dataKey="displayValue" position="top" className="fill-utility-neutral-700 text-xs font-medium" />
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    </div>
);

/** Visitors narrowing down to paid customers, colored by index from `chartColors`. */
export const FunnelChartExample = () => (
    <div className="flex h-80 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <FunnelChart className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 0, right: 60, top: 8, bottom: 8 }}>
                <Legend verticalAlign="bottom" align="center" layout="horizontal" content={<ChartLegendContent />} />

                <Tooltip content={<ChartTooltipContent isPieChart />} formatter={(value) => Number(value).toLocaleString()} />

                <Funnel isAnimationActive={false} data={funnelStages} dataKey="value" nameKey="name" fill="currentColor">
                    <LabelList dataKey="name" position="right" className="fill-utility-neutral-700 text-xs font-medium" stroke="none" />
                </Funnel>
            </FunnelChart>
        </ResponsiveContainer>
    </div>
);

// The hero preview at the top of the docs page reuses the bar + line combo.
export const CombinedChartExample = BarLineComposed;
