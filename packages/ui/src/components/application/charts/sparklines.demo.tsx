"use client";

import { MetricSimple } from "../metrics/metrics";
import { Table, TableCard } from "../table/table";
import { chartColorTokens } from "./charts-base";
import { Sparkline } from "./sparkline";

const risingSignups = [12, 14, 13, 16, 18, 17, 20, 22, 21, 24, 26, 25, 28, 30, 32];
const risingRevenue = [4.2, 4.4, 4.1, 4.8, 5.2, 5.0, 5.6, 6.1, 5.9, 6.4, 6.8, 7.2];
const fallingChurn = [3.4, 3.2, 3.6, 3.1, 2.8, 3.0, 2.5, 2.3, 2.6, 2.1, 1.9, 1.8];

interface MetricRow {
    name: string;
    value: string;
    data: number[];
    type: "line" | "area" | "bar";
    color: string;
}

const metricRows: MetricRow[] = [
    { name: "Revenue", value: "$7.2k", data: risingRevenue, type: "area", color: "green-600" },
    { name: "Signups", value: "1,204", data: risingSignups, type: "line", color: chartColorTokens[0] },
    { name: "Churn", value: "1.8%", data: fallingChurn, type: "line", color: "red-500" },
    { name: "Weekly orders", value: "312", data: [8, 12, 6, 14, 10, 18, 9, 15, 20, 11, 17, 13], type: "bar", color: chartColorTokens[2] },
    { name: "Page views", value: "48.9k", data: [30, 34, 33, 38, 42, 40, 44, 46, 45, 50, 52, 55], type: "area", color: chartColorTokens[4] },
];

/** A single rising-line sparkline, the final point ringed. */
export const LineSparkline = () => (
    <div className="flex w-full max-w-70 flex-col gap-2">
        <p className="text-tertiary text-sm font-medium">Weekly signups</p>
        <Sparkline data={risingSignups} type="line" color={chartColorTokens[0]} showLast height={40} />
    </div>
);

/** A gradient-filled area sparkline, the final point ringed. */
export const AreaSparkline = () => (
    <div className="flex w-full max-w-70 flex-col gap-2">
        <p className="text-tertiary text-sm font-medium">Revenue</p>
        <Sparkline data={risingRevenue} type="area" color="green-600" showLast height={40} />
    </div>
);

/** A bar sparkline; `showLast` dims every bar but the most recent one. */
export const BarSparkline = () => (
    <div className="flex w-full max-w-70 flex-col gap-2">
        <p className="text-tertiary text-sm font-medium">Weekly orders</p>
        <Sparkline data={[8, 12, 6, 14, 10, 18, 9, 15, 20, 11, 17, 13]} type="bar" color={chartColorTokens[2]} showLast height={40} />
    </div>
);

/** A falling line sparkline colored with the semantic `red-500` token — a metric where "up" reads as bad. */
export const NegativeTrendSparkline = () => (
    <div className="flex w-full max-w-70 flex-col gap-2">
        <p className="text-tertiary text-sm font-medium">Churn</p>
        <Sparkline data={fallingChurn} type="line" color="red-500" showLast height={40} />
    </div>
);

/** One sparkline per row of a table, each a different type and color token. */
export const SparklineTableCells = () => (
    <TableCard.Root size="sm" className="w-full max-w-2xl">
        <Table aria-label="Metrics" selectionMode="none">
            <Table.Header>
                <Table.Head id="name" label="Metric" isRowHeader className="w-1/3" />
                <Table.Head id="value" label="Value" />
                <Table.Head id="trend" label="Last 12 weeks" />
            </Table.Header>

            <Table.Body items={metricRows}>
                {(row) => (
                    <Table.Row id={row.name}>
                        <Table.Cell className="text-primary font-medium">{row.name}</Table.Cell>
                        <Table.Cell>{row.value}</Table.Cell>
                        <Table.Cell>
                            <Sparkline data={row.data} type={row.type} color={row.color} showLast height={28} className="w-24" />
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    </TableCard.Root>
);

/** `Sparkline` dropped into the footer of three existing `MetricSimple` cards. */
export const SparklineInMetricCards = () => (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricSimple
            title="Revenue"
            value="$7.2k"
            change="24%"
            trend="positive"
            footer={
                <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-tertiary text-xs">Last 12 weeks</span>
                    <Sparkline data={risingRevenue} type="area" color="green-600" showLast height={32} className="w-24" />
                </div>
            }
        />
        <MetricSimple
            title="Weekly orders"
            value="312"
            change="8%"
            trend="positive"
            footer={
                <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-tertiary text-xs">Last 12 weeks</span>
                    <Sparkline
                        data={[8, 12, 6, 14, 10, 18, 9, 15, 20, 11, 17, 13]}
                        type="bar"
                        color={chartColorTokens[2]}
                        showLast
                        height={32}
                        className="w-24"
                    />
                </div>
            }
        />
        <MetricSimple
            title="Churn"
            value="1.8%"
            change="42%"
            trend="positive"
            footer={
                <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-tertiary text-xs">Last 12 weeks</span>
                    <Sparkline data={fallingChurn} type="line" color="red-500" showLast height={32} className="w-24" />
                </div>
            }
        />
    </div>
);

// The hero preview at the top of the docs page reuses the line sparkline.
export const SparklineExample = LineSparkline;
