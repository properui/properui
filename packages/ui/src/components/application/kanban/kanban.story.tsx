import type { FC } from "react";
import * as Demos from "./kanban.demo";

export default {
    title: "Application components/Kanban",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const KanbanExample = () => <Demos.KanbanExample />;
KanbanExample.storyName = "Kanban example";

export const CustomCards = () => <Demos.CustomCards />;
CustomCards.storyName = "Custom cards";

export const CollapsibleColumns = () => <Demos.CollapsibleColumns />;
CollapsibleColumns.storyName = "Collapsible columns";
