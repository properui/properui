import type { FC } from "react";
import * as Charts from "./scatter-bubble-charts.demo";

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

export const ScatterChartExample = () => <Charts.ScatterChartExample />;
ScatterChartExample.storyName = "Scatter chart example";

export const ScatterChartBasic = () => <Charts.ScatterChartBasic />;
ScatterChartBasic.storyName = "Scatter chart basic";

export const BubbleChart = () => <Charts.BubbleChart />;
BubbleChart.storyName = "Bubble chart";

export const ScatterChartRegression = () => <Charts.ScatterChartRegression />;
ScatterChartRegression.storyName = "Scatter chart with regression line";

export const ScatterChartCategorical = () => <Charts.ScatterChartCategorical />;
ScatterChartCategorical.storyName = "Scatter chart categorical colours";
