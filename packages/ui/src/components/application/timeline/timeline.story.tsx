import type { FC } from "react";
import * as Demos from "./timeline.demo";

export default {
    title: "Application components/Timeline",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-center justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const OrderTracking = () => <Demos.OrderTracking />;
OrderTracking.storyName = "Order tracking";

export const ReleaseHistory = () => <Demos.ReleaseHistory />;
ReleaseHistory.storyName = "Release history";

export const Horizontal = () => <Demos.Horizontal />;
Horizontal.storyName = "Horizontal";

export const PlainDots = () => <Demos.PlainDots />;
PlainDots.storyName = "Plain dots";
