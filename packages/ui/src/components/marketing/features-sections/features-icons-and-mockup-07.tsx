"use client";

import type { FC } from "react";
import { ArrowRight, ChartBreakoutSquare, MessageSmileCircle, Zap } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { AVATARS } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { FeaturedIcon } from "../../foundations/featured-icon/featured-icon";
import { CreditCard } from "../../shared-assets/credit-card/credit-card";

const styles = sortCx({
    section: "overflow-hidden bg-primary py-16 md:py-24",
    container: "mx-auto w-full max-w-container px-4 md:px-8",
    cardScale: "relative [--scale:1.13] md:[--scale:1.641]",
});

const CARD_TRANSFORM = "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)";

const features: { icon: FC<{ className?: string }>; title: string; subtitle: string }[] = [
    {
        icon: MessageSmileCircle,
        title: "Share team inboxes",
        subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
    },
    {
        icon: Zap,
        title: "Deliver instant answers",
        subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
    },
    {
        icon: ChartBreakoutSquare,
        title: "Manage your team with reports",
        subtitle: "Measure what matters with Proper UI's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
    },
];

/** A stacked icon-and-copy list beside a tilted stack of four credit cards on a tinted panel. */
export const FeaturesIconsAndMockup07 = () => (
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
                <ul className="grid grid-cols-1 gap-x-8 gap-y-10 md:gap-y-12">
                    {features.map((feature) => (
                        <li key={feature.title}>
                            <div className="flex max-w-140 gap-4">
                                <FeaturedIcon icon={feature.icon} size="lg" theme="modern" color="gray" className="hidden md:flex" />
                                <FeaturedIcon icon={feature.icon} size="md" theme="modern" color="gray" className="flex md:hidden" />

                                <div className="flex flex-col items-start gap-4">
                                    <div>
                                        <h3 className="text-primary mt-1.5 text-lg font-semibold md:mt-2.5">{feature.title}</h3>
                                        <p className="text-md text-tertiary mt-1">{feature.subtitle}</p>
                                    </div>

                                    <Button color="link-color" size="lg" href="#" iconTrailing={ArrowRight}>
                                        Learn more
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="bg-tertiary relative -mx-4 flex h-80 items-center justify-center md:me-0 md:h-120 md:rounded-2xl lg:h-140" aria-hidden="true">
                    <div className="-space-y-[146px] md:-translate-x-2 md:translate-y-3.5 md:-space-y-[126px]">
                        <div className={cx(styles.cardScale, "z-4")} style={{ transform: CARD_TRANSFORM }}>
                            <CreditCard type="transparent-gradient" company="Proper UI" cardHolder={AVATARS[3].name} />
                        </div>
                        <div className={cx(styles.cardScale, "z-3")} style={{ transform: CARD_TRANSFORM }}>
                            <CreditCard type="brand-dark" company="Proper UI" cardHolder={AVATARS[2].name} />
                        </div>
                        <div className={cx(styles.cardScale, "z-2")} style={{ transform: CARD_TRANSFORM }}>
                            <CreditCard type="transparent" company="Proper UI" cardHolder={AVATARS[0].name} />
                        </div>
                        <div className={cx(styles.cardScale, "z-1")} style={{ transform: CARD_TRANSFORM }}>
                            <CreditCard type="gray-dark" company="Proper UI" cardHolder={AVATARS[1].name} />
                        </div>
                        <div className={cx(styles.cardScale, "z-0")} style={{ transform: CARD_TRANSFORM }}>
                            <div className="bg-primary-solid h-47.5 w-79 rounded-2xl opacity-15 blur-md" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
