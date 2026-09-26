import type { FC } from "react";
import * as Demos from "./gantt.demo";

export default {
    title: "Application components/Gantt",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-start justify-center p-8">
                <div className="w-full max-w-6xl">
                    <Story />
                </div>
            </div>
        ),
    ],
};

export const GanttExample = () => <Demos.GanttExample />;
GanttExample.storyName = "Gantt example";

export const DayZoom = () => <Demos.DayZoom />;
DayZoom.storyName = "Day zoom";

export const MonthZoomWithMarkers = () => <Demos.MonthZoomWithMarkers />;
MonthZoomWithMarkers.storyName = "Month zoom with markers";

export const ReadOnly = () => <Demos.ReadOnly />;
ReadOnly.storyName = "Read-only";
