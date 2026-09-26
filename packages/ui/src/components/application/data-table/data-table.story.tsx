import type { FC } from "react";
import * as Demos from "./data-table.demo";

export default {
    title: "Application components/Data table",
    decorators: [
        (Story: FC) => (
            <div className="bg-secondary flex min-h-screen w-full justify-center p-4 md:p-8">
                <div className="w-full max-w-6xl">
                    <Story />
                </div>
            </div>
        ),
    ],
};

export const BasicSortable = () => <Demos.BasicSortable />;
BasicSortable.storyName = "Basic sortable";

export const FiltersAndColumnVisibility = () => <Demos.FiltersAndColumnVisibility />;
FiltersAndColumnVisibility.storyName = "Filters and column visibility";

export const SelectionAndBulkActions = () => <Demos.SelectionAndBulkActions />;
SelectionAndBulkActions.storyName = "Selection and bulk actions";

export const Virtualized5000Rows = () => <Demos.Virtualized5000Rows />;
Virtualized5000Rows.storyName = "Virtualized 5,000 rows";

export const ServerSideMode = () => <Demos.ServerSideMode />;
ServerSideMode.storyName = "Server-side mode";

export const PinnedColumnsStickyHeader = () => <Demos.PinnedColumnsStickyHeader />;
PinnedColumnsStickyHeader.storyName = "Pinned columns and sticky header";

export const ResizableColumns = () => <Demos.ResizableColumns />;
ResizableColumns.storyName = "Resizable columns";
