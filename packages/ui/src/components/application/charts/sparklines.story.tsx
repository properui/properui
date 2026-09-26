import type { FC } from "react";
import * as Sparklines from "./sparklines.demo";

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

export const SparklineExample = () => <Sparklines.SparklineExample />;
SparklineExample.storyName = "Sparkline example";

export const LineSparkline = () => <Sparklines.LineSparkline />;
LineSparkline.storyName = "Line sparkline";

export const AreaSparkline = () => <Sparklines.AreaSparkline />;
AreaSparkline.storyName = "Area sparkline";

export const BarSparkline = () => <Sparklines.BarSparkline />;
BarSparkline.storyName = "Bar sparkline";

export const NegativeTrendSparkline = () => <Sparklines.NegativeTrendSparkline />;
NegativeTrendSparkline.storyName = "Negative-trend sparkline";

export const SparklineTableCells = () => <Sparklines.SparklineTableCells />;
SparklineTableCells.storyName = "Sparklines in table cells";

export const SparklineInMetricCards = () => <Sparklines.SparklineInMetricCards />;
SparklineInMetricCards.storyName = "Sparklines in metric cards";
