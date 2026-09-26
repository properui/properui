import type { FC } from "react";
import * as Demos from "./sortable-list.demo";

export default {
    title: "Application components/Sortable list",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const SortableListExample = () => <Demos.SortableListExample />;
SortableListExample.storyName = "Sortable list example";

export const SettingsSections = () => <Demos.SettingsSections />;
SettingsSections.storyName = "Settings sections";

export const CardsVariant = () => <Demos.CardsVariant />;
CardsVariant.storyName = "Cards variant";
