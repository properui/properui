import type { FC } from "react";
import * as Demos from "./number-input.demo";

export default {
    title: "Base components/Number input",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-center justify-center p-4">
                <Story />
            </div>
        ),
    ],
};

export const NumberInputExample = () => <Demos.NumberInputExample />;
NumberInputExample.storyName = "Number input example";

export const FormatOptions = () => <Demos.FormatOptions />;
FormatOptions.storyName = "Format options";

export const InlineButtons = () => <Demos.InlineButtons />;
InlineButtons.storyName = "Inline buttons";

export const Sizes = () => <Demos.Sizes />;
Sizes.storyName = "Sizes";

export const MinMaxStep = () => <Demos.MinMaxStep />;
MinMaxStep.storyName = "Min, max and step";

export const States = () => <Demos.States />;
States.storyName = "States";
