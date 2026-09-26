import type { FC } from "react";
import * as Demos from "./menubar.demo";

export default {
    title: "Base components/Menubar",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-start justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const MenubarExample = () => <Demos.MenubarExample />;
MenubarExample.storyName = "Menubar example";

export const WithDisabledItems = () => <Demos.WithDisabledItems />;
WithDisabledItems.storyName = "With disabled items";

export const Minimal = () => <Demos.Minimal />;
Minimal.storyName = "Minimal";
