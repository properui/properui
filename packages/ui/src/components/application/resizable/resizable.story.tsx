import type { FC } from "react";
import * as Demos from "./resizable.demo";

export default {
    title: "Application components/Resizable",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const ResizableExample = () => <Demos.ResizableExample />;
ResizableExample.storyName = "Resizable example";

export const Vertical = () => <Demos.Vertical />;
Vertical.storyName = "Vertical";

export const CollapsibleSidebar = () => <Demos.CollapsibleSidebar />;
CollapsibleSidebar.storyName = "Collapsible sidebar";

export const Nested = () => <Demos.Nested />;
Nested.storyName = "Nested";
