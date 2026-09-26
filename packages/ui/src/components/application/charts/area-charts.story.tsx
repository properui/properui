import type { FC } from "react";
import * as Charts from "./area-charts.demo";

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

export const AreaChartExample = () => <Charts.AreaChartExample />;
AreaChartExample.storyName = "Area chart example";

export const AreaChartStacked = () => <Charts.AreaChartStacked />;
AreaChartStacked.storyName = "Area chart stacked";

export const AreaChartGradient = () => <Charts.AreaChartGradient />;
AreaChartGradient.storyName = "Area chart gradient";

export const AreaChartStepped = () => <Charts.AreaChartStepped />;
AreaChartStepped.storyName = "Area chart stepped";

export const AreaChartBrush = () => <Charts.AreaChartBrush />;
AreaChartBrush.storyName = "Area chart with brush";

export const AreaChartSmallMultiples = () => <Charts.AreaChartSmallMultiples />;
AreaChartSmallMultiples.storyName = "Area chart small multiples";
