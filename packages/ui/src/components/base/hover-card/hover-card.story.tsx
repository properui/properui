import type { FC } from "react";
import * as Demos from "./hover-card.demo";

export default {
    title: "Base components/Hover card",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-center justify-center p-4">
                <Story />
            </div>
        ),
    ],
};

export const HoverCardExample = () => <Demos.HoverCardExample />;
HoverCardExample.storyName = "Hover card example";

export const WithInteractiveContent = () => <Demos.WithInteractiveContent />;
WithInteractiveContent.storyName = "With interactive content";

export const Placements = () => <Demos.Placements />;
Placements.storyName = "Placements";

export const CustomDelays = () => <Demos.CustomDelays />;
CustomDelays.storyName = "Custom delays";
