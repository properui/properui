import type { FC } from "react";
import * as Demos from "./stepper.demo";

export default {
    title: "Application components/Stepper",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-center justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const CheckoutExample = () => <Demos.CheckoutExample />;
CheckoutExample.storyName = "Checkout example";

export const VerticalLayout = () => <Demos.VerticalLayout />;
VerticalLayout.storyName = "Vertical layout";

export const NonLinear = () => <Demos.NonLinear />;
NonLinear.storyName = "Non-linear";
