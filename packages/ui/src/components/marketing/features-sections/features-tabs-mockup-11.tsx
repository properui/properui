"use client";

import { Tab as AriaTab, TabList as AriaTabList, TabPanel as AriaTabPanel, Tabs as AriaTabs } from "react-aria-components";
import { ArrowRight } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { AVATARS } from "../../../utils/demo-assets";
import { CreditCard } from "../../shared-assets/credit-card/credit-card";

/** The isometric transform every card in the fanned stack shares. */
const cardTransform = "relative [--scale:1.13] [transform:scale(var(--scale))_rotateX(63deg)_rotateY(1deg)_rotateZ(51deg)_skewX(14deg)] md:[--scale:1.641]";

const tabs = [
    {
        id: "team-inboxes",
        title: "Share team inboxes",
        subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
        holders: [AVATARS[3].name, AVATARS[2].name, AVATARS[0].name, AVATARS[1].name],
    },
    {
        id: "instant-answers",
        title: "Deliver instant answers",
        subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
        holders: [AVATARS[4].name, AVATARS[5].name, AVATARS[6].name, AVATARS[7].name],
    },
    {
        id: "reports",
        title: "Manage your team with reports",
        subtitle: "Measure what matters with Proper UI's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
        holders: [AVATARS[8].name, AVATARS[9].name, AVATARS[10].name, AVATARS[11].name],
    },
];

const cardTypes = ["transparent-gradient", "brand-dark", "transparent-gradient", "gray-dark"] as const;

export const FeaturesTabsMockup11 = () => (
    <section className="bg-primary overflow-hidden py-16 lg:py-24">
        <div className="max-w-container mx-auto w-full px-4 md:px-8">
            <div className="flex w-full flex-col lg:max-w-3xl">
                <span className="text-brand-secondary md:text-md text-sm font-semibold">Features</span>
                <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">Overflowing with useful features</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
                    Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                </p>
            </div>

            <AriaTabs defaultSelectedKey="team-inboxes" className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:gap-16 lg:grid-cols-2 lg:items-center">
                <AriaTabList aria-label="Features" className="flex flex-col">
                    {tabs.map((tab) => (
                        <AriaTab
                            key={tab.id}
                            id={tab.id}
                            className={({ isSelected }) =>
                                cx(
                                    "outline-focus-ring hover:border-brand relative flex cursor-pointer flex-col items-start gap-4 border-s-4 py-4 ps-5 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                                    isSelected ? "border-brand" : "border-tertiary",
                                )
                            }
                        >
                            <div>
                                <h3 className="text-primary text-lg font-semibold">{tab.title}</h3>
                                <p className="text-md text-tertiary mt-1">{tab.subtitle}</p>
                            </div>
                            <span className="text-md text-brand-secondary flex items-center gap-1.5 font-semibold">
                                Learn more
                                <ArrowRight aria-hidden="true" className="text-fg-brand-secondary_alt size-5" />
                            </span>
                        </AriaTab>
                    ))}
                </AriaTabList>

                {tabs.map((tab) => (
                    <AriaTabPanel
                        key={tab.id}
                        id={tab.id}
                        className="bg-tertiary relative -mx-4 flex h-80 items-center justify-center md:me-0 md:h-120 md:rounded-2xl lg:h-140"
                    >
                        <div className="-space-y-[146px] md:-translate-x-2 md:translate-y-3.5 md:-space-y-[126px]">
                            {tab.holders.map((holder, index) => (
                                <div key={holder} className={cx(cardTransform, index === 0 ? "z-4" : index === 1 ? "z-3" : index === 2 ? "z-2" : "z-1")}>
                                    <CreditCard type={cardTypes[index]} company="Proper UI." cardHolder={holder} />
                                </div>
                            ))}
                            <div className={cx(cardTransform, "z-0")}>
                                {/* Decorative cast shadow under the fanned cards. Raw palette on purpose: it must stay the same
                                    ink in both themes, exactly like the gradients inside `shared-assets/credit-card`. */}
                                <div className="bg-primary-solid h-47.5 w-79 rounded-2xl opacity-15 blur-md" />
                            </div>
                        </div>
                    </AriaTabPanel>
                ))}
            </AriaTabs>
        </div>
    </section>
);
