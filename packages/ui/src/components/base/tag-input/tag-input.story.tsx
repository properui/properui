import type { FC } from "react";
import * as Demos from "./tag-input.demo";

export default {
    title: "Base components/Tag input",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-center justify-center p-4">
                <Story />
            </div>
        ),
    ],
};

export const TagInputExample = () => <Demos.TagInputExample />;
TagInputExample.storyName = "Tag input example";

export const Controlled = () => <Demos.Controlled />;
Controlled.storyName = "Controlled";

export const MaxTagsWithFeedback = () => <Demos.MaxTagsWithFeedback />;
MaxTagsWithFeedback.storyName = "Max tags with feedback";

export const WithValidation = () => <Demos.WithValidation />;
WithValidation.storyName = "With validation";

export const States = () => <Demos.States />;
States.storyName = "States";
