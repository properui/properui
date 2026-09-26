import type { FC } from "react";
import * as Demos from "./scroll-area.demo";

export default {
    title: "Application components/Scroll area",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const ScrollAreaExample = () => <Demos.ScrollAreaExample />;
ScrollAreaExample.storyName = "Scroll area example";

export const Horizontal = () => <Demos.Horizontal />;
Horizontal.storyName = "Horizontal";

export const BothAxes = () => <Demos.BothAxes />;
BothAxes.storyName = "Both axes";

export const FadeEdges = () => <Demos.FadeEdges />;
FadeEdges.storyName = "Fade edges";
