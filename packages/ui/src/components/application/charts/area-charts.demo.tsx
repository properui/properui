"use client";

import { Area, Brush, CartesianGrid, Label, Legend, AreaChart as RechartsAreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { ChartLegendContent, ChartTooltipContent, chartColors, selectEvenlySpacedItems } from "./charts-base";

// Traffic by acquisition channel, one point per month.
const trafficByChannel = [
    { date: new Date(2026, 0, 1), organic: 320, paid: 180, referral: 90 },
    { date: new Date(2026, 1, 1), organic: 340, paid: 190, referral: 95 },
    { date: new Date(2026, 2, 1), organic: 360, paid: 210, referral: 100 },
    { date: new Date(2026, 3, 1), organic: 300, paid: 260, referral: 110 },
    { date: new Date(2026, 4, 1), organic: 380, paid: 240, referral: 120 },
    { date: new Date(2026, 5, 1), organic: 420, paid: 250, referral: 130 },
    { date: new Date(2026, 6, 1), organic: 460, paid: 230, referral: 125 },
    { date: new Date(2026, 7, 1), organic: 500, paid: 280, referral: 140 },
    { date: new Date(2026, 8, 1), organic: 540, paid: 300, referral: 150 },
    { date: new Date(2026, 9, 1), organic: 580, paid: 290, referral: 160 },
    { date: new Date(2026, 10, 1), organic: 620, paid: 320, referral: 170 },
    { date: new Date(2026, 11, 1), organic: 680, paid: 350, referral: 190 },
];

// Revenue against cost, one point per month — plotted with its own gradient each.
const revenueVsCost = [
    { date: new Date(2026, 0, 1), revenue: 4200, cost: 2600 },
    { date: new Date(2026, 1, 1), revenue: 4400, cost: 2650 },
    { date: new Date(2026, 2, 1), revenue: 4100, cost: 2700 },
    { date: new Date(2026, 3, 1), revenue: 4800, cost: 2800 },
    { date: new Date(2026, 4, 1), revenue: 5200, cost: 2850 },
    { date: new Date(2026, 5, 1), revenue: 5000, cost: 2900 },
    { date: new Date(2026, 6, 1), revenue: 5600, cost: 3000 },
    { date: new Date(2026, 7, 1), revenue: 6100, cost: 3100 },
    { date: new Date(2026, 8, 1), revenue: 5900, cost: 3150 },
    { date: new Date(2026, 9, 1), revenue: 6400, cost: 3200 },
    { date: new Date(2026, 10, 1), revenue: 6800, cost: 3300 },
    { date: new Date(2026, 11, 1), revenue: 7200, cost: 3400 },
];

// Warehouse inventory level, one point per month — held flat between restocks,
// which is what a stepped interpolation communicates and a smooth curve would not.
const inventoryLevel = [
    { date: new Date(2026, 0, 1), units: 800 },
    { date: new Date(2026, 1, 1), units: 800 },
    { date: new Date(2026, 2, 1), units: 620 },
    { date: new Date(2026, 3, 1), units: 620 },
    { date: new Date(2026, 4, 1), units: 620 },
    { date: new Date(2026, 5, 1), units: 950 },
    { date: new Date(2026, 6, 1), units: 950 },
    { date: new Date(2026, 7, 1), units: 700 },
    { date: new Date(2026, 8, 1), units: 700 },
    { date: new Date(2026, 9, 1), units: 480 },
    { date: new Date(2026, 10, 1), units: 480 },
    { date: new Date(2026, 11, 1), units: 900 },
];

// One point per day for a full year, so there is enough range for a brush to
// usefully narrow. Dates are stored as ISO strings (not `Date` objects), so the
// evenly-spaced subset below can double as the `XAxis`'s `ticks`, which only
// accepts strings or numbers.
const dailyActiveUsers = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(2026, 0, 1 + index);
    const season = Math.sin((index / 365) * Math.PI * 2) * 120;
    const weekday = date.getDay() === 0 || date.getDay() === 6 ? -60 : 0;
    const noise = Math.sin(index * 1.7) * 40;
    return { date: date.toISOString().slice(0, 10), users: Math.round(900 + season + weekday + noise) };
});

// One short series per region for the small-multiples grid — same shape, so the
// eye can compare them at a glance.
const regionSeries: { name: string; data: { day: number; value: number }[] }[] = [
    { name: "North America", data: [10, 14, 12, 18, 22, 20, 26] },
    { name: "Europe", data: [8, 9, 11, 10, 13, 15, 14] },
    { name: "APAC", data: [4, 6, 9, 14, 18, 24, 30] },
    { name: "LATAM", data: [3, 4, 4, 5, 6, 6, 8] },
    { name: "MEA", data: [2, 3, 3, 4, 5, 5, 6] },
    { name: "Oceania", data: [1, 2, 2, 2, 3, 3, 4] },
].map((series) => ({ ...series, data: series.data.map((value, day) => ({ day, value })) }));

/** Three channels stacked into one another, colored from `chartColors` by index. */
export const AreaChartStacked = () => {
    const isDesktop = useBreakpoint("lg");

    return (
        <div className="flex h-60 flex-col gap-2">
            <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
                <RechartsAreaChart
                    data={trafficByChannel}
                    className="text-tertiary [&_.recharts-text]:text-xs"
                    margin={{ left: 4, right: 0, top: isDesktop ? 12 : 6, bottom: 18 }}
                >
                    <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                    <Legend
                        verticalAlign="top"
                        align="right"
                        layout={isDesktop ? "vertical" : "horizontal"}
                        content={<ChartLegendContent className="-translate-y-2" />}
                    />

                    <XAxis
                        fill="currentColor"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={11}
                        interval="preserveStartEnd"
                        dataKey="date"
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
                            value="Sessions"
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
                        cursor={{ className: "stroke-utility-brand-600 stroke-2" }}
                    />

                    <Area
                        isAnimationActive={false}
                        style={{ color: chartColors[0] }}
                        dataKey="organic"
                        name="Organic"
                        type="monotone"
                        stackId="channel"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="currentColor"
                        fillOpacity={0.35}
                        activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                    />
                    <Area
                        isAnimationActive={false}
                        style={{ color: chartColors[1] }}
                        dataKey="paid"
                        name="Paid"
                        type="monotone"
                        stackId="channel"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="currentColor"
                        fillOpacity={0.35}
                        activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                    />
                    <Area
                        isAnimationActive={false}
                        style={{ color: chartColors[2] }}
                        dataKey="referral"
                        name="Referral"
                        type="monotone"
                        stackId="channel"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="currentColor"
                        fillOpacity={0.35}
                        activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/** Two series, each filled with its own vertical gradient built from `chartColors`. */
export const AreaChartGradient = () => {
    const isDesktop = useBreakpoint("lg");

    return (
        <div className="flex h-60 flex-col gap-2">
            <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
                <RechartsAreaChart
                    data={revenueVsCost}
                    className="text-tertiary [&_.recharts-text]:text-xs"
                    margin={{ left: 4, right: 0, top: isDesktop ? 12 : 6, bottom: 18 }}
                >
                    <defs>
                        <linearGradient id="area-gradient-revenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.7} />
                            <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="area-gradient-cost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors[3]} stopOpacity={0.7} />
                            <stop offset="95%" stopColor={chartColors[3]} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                    <Legend
                        verticalAlign="top"
                        align="right"
                        layout={isDesktop ? "vertical" : "horizontal"}
                        content={<ChartLegendContent className="-translate-y-2" />}
                    />

                    <XAxis
                        fill="currentColor"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={11}
                        interval="preserveStartEnd"
                        dataKey="date"
                        tickFormatter={(value) => value.toLocaleDateString(undefined, { month: "short" })}
                    >
                        <Label value="Month" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                    </XAxis>

                    <YAxis
                        fill="currentColor"
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                    >
                        <Label
                            value="Amount"
                            fill="currentColor"
                            className="text-xs! font-medium"
                            style={{ textAnchor: "middle" }}
                            angle={-90}
                            position="insideLeft"
                        />
                    </YAxis>

                    <Tooltip
                        content={<ChartTooltipContent />}
                        formatter={(value) => `$${Number(value).toLocaleString()}`}
                        labelFormatter={(value) => new Date(value as string | number | Date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                        cursor={{ className: "stroke-utility-brand-600 stroke-2" }}
                    />

                    <Area
                        isAnimationActive={false}
                        style={{ color: chartColors[0] }}
                        dataKey="revenue"
                        name="Revenue"
                        type="monotone"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="url(#area-gradient-revenue)"
                        activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                    />
                    <Area
                        isAnimationActive={false}
                        style={{ color: chartColors[3] }}
                        dataKey="cost"
                        name="Cost"
                        type="monotone"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="url(#area-gradient-cost)"
                        activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/** A single series held flat between points with `type="stepAfter"`. */
export const AreaChartStepped = () => {
    const isDesktop = useBreakpoint("lg");

    return (
        <div className="flex h-60 flex-col gap-2">
            <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
                <RechartsAreaChart
                    data={inventoryLevel}
                    className="text-tertiary [&_.recharts-text]:text-xs"
                    margin={{ left: 4, right: 0, top: isDesktop ? 12 : 6, bottom: 18 }}
                >
                    <defs>
                        <linearGradient id="area-gradient-inventory" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors[4]} stopOpacity={0.5} />
                            <stop offset="95%" stopColor={chartColors[4]} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                    <XAxis
                        fill="currentColor"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={11}
                        interval="preserveStartEnd"
                        dataKey="date"
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
                            value="Units in stock"
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
                        cursor={{ className: "stroke-utility-brand-600 stroke-2" }}
                    />

                    <Area
                        isAnimationActive={false}
                        style={{ color: chartColors[4] }}
                        dataKey="units"
                        name="Units in stock"
                        type="stepAfter"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="url(#area-gradient-inventory)"
                        activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/** A year of daily data with a `Brush` underneath, so the visible range is a selection, not the whole series. */
export const AreaChartBrush = () => {
    const isDesktop = useBreakpoint("lg");

    return (
        <div className="flex h-72 flex-col gap-2">
            <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
                <RechartsAreaChart
                    data={dailyActiveUsers}
                    className="text-tertiary [&_.recharts-text]:text-xs"
                    margin={{ left: 4, right: 0, top: isDesktop ? 12 : 6, bottom: 4 }}
                >
                    <defs>
                        <linearGradient id="area-gradient-dau" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                    <XAxis
                        fill="currentColor"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={11}
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short" })}
                        ticks={selectEvenlySpacedItems(dailyActiveUsers, 12).map((item) => item.date)}
                    />

                    <YAxis
                        fill="currentColor"
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tickFormatter={(value) => Number(value).toLocaleString()}
                        width={40}
                    />

                    <Tooltip
                        content={<ChartTooltipContent />}
                        formatter={(value) => Number(value).toLocaleString()}
                        labelFormatter={(value) =>
                            new Date(value as string | number | Date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                        }
                        cursor={{ className: "stroke-utility-brand-600 stroke-2" }}
                    />

                    <Area
                        isAnimationActive={false}
                        style={{ color: chartColors[0] }}
                        dataKey="users"
                        name="Daily active users"
                        type="monotone"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="url(#area-gradient-dau)"
                        activeDot={{ className: "fill-bg-primary stroke-current stroke-2" }}
                    />

                    <Brush
                        dataKey="date"
                        height={26}
                        travellerWidth={8}
                        fill="var(--color-bg-secondary)"
                        stroke="var(--color-utility-brand-600)"
                        tickFormatter={(value) => new Date(value as string | number | Date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        startIndex={240}
                        endIndex={300}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/** The same shape of series, one small area chart per region, colored by index from `chartColors`. */
export const AreaChartSmallMultiples = () => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {regionSeries.map((series, index) => (
            <div key={series.name} className="border-secondary rounded-lg border p-3">
                <p className="text-secondary mb-2 text-sm font-medium">{series.name}</p>

                <div className="h-20">
                    <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
                        <RechartsAreaChart data={series.data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`area-gradient-multiple-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.5} />
                                    <stop offset="95%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <Tooltip
                                content={<ChartTooltipContent />}
                                formatter={(value) => Number(value).toLocaleString()}
                                labelFormatter={() => series.name}
                            />

                            <Area
                                isAnimationActive={false}
                                style={{ color: chartColors[index % chartColors.length] }}
                                dataKey="value"
                                name={series.name}
                                type="monotone"
                                stroke="currentColor"
                                strokeWidth={2}
                                fill={`url(#area-gradient-multiple-${index})`}
                                dot={false}
                                activeDot={{ className: "fill-bg-primary stroke-current stroke-2", r: 3 }}
                            />
                        </RechartsAreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        ))}
    </div>
);

// The hero preview at the top of the docs page reuses the stacked area chart.
export const AreaChartExample = AreaChartStacked;
