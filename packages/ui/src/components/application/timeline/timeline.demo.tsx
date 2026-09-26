"use client";

import { CheckCircle, HomeLine, Package, Truck01 } from "@properui/icons";
import { Timeline } from "./timeline";

/** A vertical order-tracking timeline, with an icon for every step and the current one highlighted. */
export const OrderTracking = () => (
    <div className="w-full max-w-sm">
        <Timeline aria-label="Order status">
            <Timeline.Item status="completed" icon={CheckCircle} time="Mar 1, 9:03 AM" title="Order placed" description="We've received your order." />
            <Timeline.Item status="completed" icon={Package} time="Mar 1, 2:47 PM" title="Order packed" description="Your items are boxed and ready." />
            <Timeline.Item status="current" icon={Truck01} time="Mar 2, 8:15 AM" title="Out for delivery" description="On its way to you." />
            <Timeline.Item status="upcoming" icon={HomeLine} title="Delivered" description="Arrives by end of day." />
        </Timeline>
    </div>
);

/** The `alternating` variant zigzags left and right of a center line — a release history reads well this way. */
export const ReleaseHistory = () => (
    <div className="w-full max-w-lg">
        <Timeline aria-label="Release history" variant="alternating">
            <Timeline.Item status="completed" color="success" time="v2.4.0 — Mar 2026" title="Stable release" description="Rolled out to every plan." />
            <Timeline.Item status="completed" color="brand" time="v2.4.0-rc.1 — Feb 2026" title="Release candidate" description="Opt-in for early adopters." />
            <Timeline.Item status="current" color="warning" time="v2.4.0-beta.2 — Feb 2026" title="Beta" description="Behind a feature flag." />
            <Timeline.Item status="upcoming" color="gray" time="v2.4.0-alpha — Jan 2026" title="Alpha" description="Internal testing only." />
        </Timeline>
    </div>
);

/** The `horizontal` variant lays the same order-tracking entries out in a row instead of a column. */
export const Horizontal = () => (
    <div className="w-full max-w-2xl">
        <Timeline aria-label="Order status" variant="horizontal">
            <Timeline.Item status="completed" icon={CheckCircle} time="Mar 1" title="Placed" />
            <Timeline.Item status="completed" icon={Package} time="Mar 1" title="Packed" />
            <Timeline.Item status="current" icon={Truck01} time="Mar 2" title="Shipped" />
            <Timeline.Item status="upcoming" icon={HomeLine} title="Delivered" />
        </Timeline>
    </div>
);

/** Plain dots (no `icon`) with a mix of default status colors and an explicit `color` override. */
export const PlainDots = () => (
    <div className="w-full max-w-sm">
        <Timeline aria-label="Activity">
            <Timeline.Item status="completed" title="Account created" time="Jan 4, 2026" />
            <Timeline.Item status="completed" color="error" title="Payment failed" time="Feb 11, 2026" description="Card ending in 4242 declined." />
            <Timeline.Item status="current" title="Subscription active" time="Feb 12, 2026" />
        </Timeline>
    </div>
);
