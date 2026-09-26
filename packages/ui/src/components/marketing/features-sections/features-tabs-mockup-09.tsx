"use client";

import { ArrowRight } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

const styles = sortCx({
    section: "overflow-hidden bg-primary pt-16 lg:py-24",
    container: "mx-auto w-full max-w-container px-4 md:px-8",
    item: "relative flex flex-col items-start gap-4 border-s-4 py-4 ps-5 transition duration-100 ease-linear",
});

const features = [
    {
        title: "Share team inboxes",
        subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
    },
    {
        title: "Deliver instant answers",
        subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
    },
    {
        title: "Manage your team with reports",
        subtitle: "Measure what matters with Proper UI's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
    },
];

/** A left-aligned feature list beside a pair of overlapping iPhone mockups. */
export const FeaturesTabsMockup09 = () => (
    <section className={styles.section}>
        <div className={styles.container}>
            <div className="flex w-full flex-col lg:max-w-3xl">
                <span className="text-brand-secondary md:text-md text-sm font-semibold">Features</span>
                <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">Overflowing with useful features</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
                    Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:gap-16 lg:grid-cols-2 lg:items-center">
                <ul className="flex flex-col">
                    {features.map((feature, index) => (
                        <li key={feature.title}>
                            <div className={cx(styles.item, index === 0 ? "border-brand" : "border-tertiary")}>
                                <div>
                                    <h3 className="text-primary text-lg font-semibold">{feature.title}</h3>
                                    <p className="text-md text-tertiary mt-1">{feature.subtitle}</p>
                                </div>

                                <Button color="link-color" size="lg" href="#" iconTrailing={ArrowRight}>
                                    Learn more
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="relative flex h-104 w-full justify-center md:h-120 lg:-ms-4 lg:h-140 lg:overflow-y-clip">
                    <IPhoneMockup
                        image={IMAGES.landscape[1].src}
                        className="drop-shadow-iphone-mockup absolute top-16 left-1/2 hidden w-78.5 -translate-x-3/4 md:block lg:start-0 lg:translate-x-0"
                    />
                    <IPhoneMockup
                        image={IMAGES.landscape[0].src}
                        className="drop-shadow-iphone-mockup h-[579px] w-71 md:absolute md:top-0 md:right-1/2 md:h-160 md:w-78.5 md:translate-x-2/3 lg:end-0 lg:translate-x-0"
                    />
                </div>
            </div>
        </div>
    </section>
);
