"use client";

import { CartesianGrid, ComposedChart, Label, Legend, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartLegendContent, ChartTooltipContent, chartColors } from "./charts-base";

interface ScatterPoint {
    x: number;
    y: number;
    name?: string;
}

interface BubblePoint extends ScatterPoint {
    z: number;
}

/** Session length against pages viewed, one point per visitor session. */
const engagementData: ScatterPoint[] = [
    { x: 12, y: 2 },
    { x: 25, y: 3 },
    { x: 40, y: 4 },
    { x: 55, y: 4 },
    { x: 60, y: 6 },
    { x: 78, y: 5 },
    { x: 90, y: 7 },
    { x: 110, y: 8 },
    { x: 120, y: 6 },
    { x: 135, y: 9 },
    { x: 150, y: 8 },
    { x: 165, y: 10 },
    { x: 180, y: 9 },
    { x: 200, y: 11 },
    { x: 210, y: 10 },
    { x: 230, y: 12 },
    { x: 250, y: 13 },
    { x: 20, y: 5 },
    { x: 95, y: 4 },
    { x: 175, y: 7 },
];

/** Cost per click, conversion rate and monthly spend for each marketing channel. */
const marketingChannels: (BubblePoint & { name: string })[] = [
    { name: "Search", x: 1.8, y: 4.2, z: 2200 },
    { name: "Social", x: 0.9, y: 2.1, z: 1400 },
    { name: "Display", x: 0.5, y: 0.9, z: 900 },
    { name: "Video", x: 1.2, y: 1.6, z: 1800 },
    { name: "Email", x: 0.1, y: 6.5, z: 600 },
    { name: "Affiliate", x: 2.4, y: 3.4, z: 1100 },
    { name: "Referral", x: 0.3, y: 5.1, z: 500 },
    { name: "Retargeting", x: 1.5, y: 3.9, z: 1600 },
];

/** Ad spend against revenue, one point per campaign, with a linear trend. */
const adSpendVsRevenue: ScatterPoint[] = [
    { x: 4, y: 18 },
    { x: 6, y: 24 },
    { x: 8, y: 26 },
    { x: 10, y: 34 },
    { x: 12, y: 30 },
    { x: 14, y: 40 },
    { x: 16, y: 46 },
    { x: 18, y: 44 },
    { x: 20, y: 52 },
    { x: 22, y: 58 },
    { x: 24, y: 55 },
    { x: 26, y: 64 },
    { x: 28, y: 68 },
    { x: 30, y: 66 },
    { x: 32, y: 74 },
    { x: 34, y: 80 },
    { x: 36, y: 78 },
    { x: 38, y: 86 },
];

/**
 * Fits `y = slope * x + intercept` to a set of points with ordinary least squares.
 * @param points - The points to fit.
 * @returns The fitted slope and intercept.
 */
const fitLinearRegression = (points: ScatterPoint[]): { slope: number; intercept: number } => {
    const n = points.length;
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

const regression = fitLinearRegression(adSpendVsRevenue);
const regressionDomain = { min: Math.min(...adSpendVsRevenue.map((point) => point.x)), max: Math.max(...adSpendVsRevenue.map((point) => point.x)) };
const regressionLine: ScatterPoint[] = [
    { x: regressionDomain.min, y: regression.slope * regressionDomain.min + regression.intercept },
    { x: regressionDomain.max, y: regression.slope * regressionDomain.max + regression.intercept },
];

/** By product tier, colored by index from `chartColors`. */
const customerCohorts: { name: string; points: ScatterPoint[] }[] = [
    {
        name: "Enterprise",
        points: [
            { x: 8, y: 92 },
            { x: 12, y: 88 },
            { x: 15, y: 95 },
            { x: 10, y: 85 },
            { x: 18, y: 90 },
            { x: 14, y: 97 },
        ],
    },
    {
        name: "SMB",
        points: [
            { x: 22, y: 60 },
            { x: 28, y: 55 },
            { x: 32, y: 65 },
            { x: 25, y: 50 },
            { x: 35, y: 62 },
            { x: 30, y: 58 },
        ],
    },
    {
        name: "Startup",
        points: [
            { x: 45, y: 30 },
            { x: 50, y: 25 },
            { x: 55, y: 35 },
            { x: 48, y: 22 },
            { x: 60, y: 32 },
            { x: 52, y: 28 },
        ],
    },
];

const pointTooltipFormatter = (_value: unknown, _name: unknown, entry: unknown) => {
    const point = (entry as { payload?: ScatterPoint & Partial<BubblePoint> })?.payload;
    if (!point) return String(_value);

    const label = point.name ? `${point.name}: ` : "";
    return point.z !== undefined ? `${label}(${point.x}, ${point.y}, ${point.z.toLocaleString()})` : `${label}(${point.x}, ${point.y})`;
};

/** Session length against pages viewed. */
export const ScatterChartBasic = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <ComposedChart data={engagementData} className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 12, top: 12, bottom: 18 }}>
                <CartesianGrid stroke="currentColor" className="text-utility-neutral-100" />

                <XAxis type="number" dataKey="x" fill="currentColor" axisLine={false} tickLine={false} domain={[0, "dataMax + 10"]}>
                    <Label value="Session length (s)" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                </XAxis>

                <YAxis type="number" dataKey="y" fill="currentColor" axisLine={false} tickLine={false} domain={[0, "dataMax + 2"]}>
                    <Label
                        value="Pages viewed"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <Tooltip content={<ChartTooltipContent />} formatter={pointTooltipFormatter} cursor={{ className: "stroke-utility-brand-600 stroke-2" }} />

                <Scatter isAnimationActive={false} name="Sessions" style={{ color: chartColors[0] }} fill="currentColor" fillOpacity={0.8} />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

/** Marketing channels sized by monthly spend via `ZAxis`. */
export const BubbleChart = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <ComposedChart data={marketingChannels} className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 12, top: 12, bottom: 18 }}>
                <CartesianGrid stroke="currentColor" className="text-utility-neutral-100" />

                <XAxis
                    type="number"
                    dataKey="x"
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "dataMax + 0.3"]}
                    tickFormatter={(value) => `$${value}`}
                >
                    <Label value="Cost per click" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                </XAxis>

                <YAxis
                    type="number"
                    dataKey="y"
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "dataMax + 1"]}
                    tickFormatter={(value) => `${value}%`}
                >
                    <Label
                        value="Conversion rate"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <ZAxis type="number" dataKey="z" range={[160, 900]} name="Monthly spend" />

                <Legend verticalAlign="top" align="right" layout="vertical" content={<ChartLegendContent className="-translate-y-2" />} />

                <Tooltip content={<ChartTooltipContent />} formatter={pointTooltipFormatter} cursor={{ className: "stroke-utility-brand-600 stroke-2" }} />

                {marketingChannels.map((channel, index) => (
                    <Scatter
                        key={channel.name}
                        isAnimationActive={false}
                        data={[channel]}
                        name={channel.name}
                        style={{ color: chartColors[index % chartColors.length] }}
                        fill="currentColor"
                        fillOpacity={0.7}
                    />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

/** Ad spend against revenue, with a fitted trend line. */
export const ScatterChartRegression = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <ComposedChart className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 12, top: 12, bottom: 18 }}>
                <CartesianGrid stroke="currentColor" className="text-utility-neutral-100" />

                <XAxis
                    type="number"
                    dataKey="x"
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tickFormatter={(value) => `$${value}k`}
                >
                    <Label value="Ad spend" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                </XAxis>

                <YAxis
                    type="number"
                    dataKey="y"
                    fill="currentColor"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "dataMax + 5"]}
                    tickFormatter={(value) => `$${value}k`}
                >
                    <Label
                        value="Revenue"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <Tooltip content={<ChartTooltipContent />} formatter={pointTooltipFormatter} cursor={{ className: "stroke-utility-brand-600 stroke-2" }} />

                <Scatter
                    isAnimationActive={false}
                    data={adSpendVsRevenue}
                    name="Campaigns"
                    style={{ color: chartColors[0] }}
                    fill="currentColor"
                    fillOpacity={0.8}
                />

                <Line
                    isAnimationActive={false}
                    data={regressionLine}
                    dataKey="y"
                    name="Trend"
                    type="linear"
                    style={{ color: chartColors[6] }}
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={false}
                />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

/** Three customer cohorts, each a `Scatter` colored by index from `chartColors`. */
export const ScatterChartCategorical = () => (
    <div className="flex h-72 flex-col gap-2">
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
            <ComposedChart className="text-tertiary [&_.recharts-text]:text-xs" margin={{ left: 4, right: 12, top: 12, bottom: 18 }}>
                <CartesianGrid stroke="currentColor" className="text-utility-neutral-100" />

                <XAxis type="number" dataKey="x" fill="currentColor" axisLine={false} tickLine={false} domain={[0, "dataMax + 5"]}>
                    <Label value="Days to close" fill="currentColor" className="text-xs! font-medium" position="bottom" />
                </XAxis>

                <YAxis type="number" dataKey="y" fill="currentColor" axisLine={false} tickLine={false} domain={[0, 100]}>
                    <Label
                        value="Health score"
                        fill="currentColor"
                        className="text-xs! font-medium"
                        style={{ textAnchor: "middle" }}
                        angle={-90}
                        position="insideLeft"
                    />
                </YAxis>

                <Legend verticalAlign="top" align="right" layout="vertical" content={<ChartLegendContent className="-translate-y-2" />} />

                <Tooltip content={<ChartTooltipContent />} formatter={pointTooltipFormatter} cursor={{ className: "stroke-utility-brand-600 stroke-2" }} />

                {customerCohorts.map((cohort, index) => (
                    <Scatter
                        key={cohort.name}
                        isAnimationActive={false}
                        data={cohort.points}
                        name={cohort.name}
                        style={{ color: chartColors[index % chartColors.length] }}
                        fill="currentColor"
                        fillOpacity={0.8}
                    />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

// The hero preview at the top of the docs page reuses the basic scatter chart.
export const ScatterChartExample = ScatterChartBasic;
