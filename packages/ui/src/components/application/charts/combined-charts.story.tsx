import type { FC } from "react";
import * as Charts from "./combined-charts.demo";

export default {
    title: "Application components/Charts",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen items-center justify-center py-8">
                <div className="w-full max-w-5xl">
                    <Story />
                </div>
            </div>
        ),
    ],
};

export const CombinedChartExample = () => <Charts.CombinedChartExample />;
CombinedChartExample.storyName = "Combined chart example";

export const BarLineComposed = () => <Charts.BarLineComposed />;
BarLineComposed.storyName = "Bar + line composed";

export const DualAxisChart = () => <Charts.DualAxisChart />;
DualAxisChart.storyName = "Dual y-axes";

export const BarWithTargetLine = () => <Charts.BarWithTargetLine />;
BarWithTargetLine.storyName = "Bar with target line";

export const WaterfallChart = () => <Charts.WaterfallChart />;
WaterfallChart.storyName = "Waterfall chart";

export const FunnelChartExample = () => <Charts.FunnelChartExample />;
FunnelChartExample.storyName = "Funnel chart";
