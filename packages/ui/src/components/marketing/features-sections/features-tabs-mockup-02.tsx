"use client";

import { Tab as AriaTab, TabList as AriaTabList, TabPanel as AriaTabPanel, Tabs as AriaTabs } from "react-aria-components";
import { cx } from "../../../utils/cx";
import { IMAGES } from "../../../utils/demo-assets";
import { Badge } from "../../base/badges/badges";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

const tabs = [
    {
        id: "team-inboxes",
        title: "Share team inboxes",
        subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
        frontImage: IMAGES.square[0],
        backImage: IMAGES.square[1],
    },
    {
        id: "instant-answers",
        title: "Deliver instant answers",
        subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
        frontImage: IMAGES.square[1],
        backImage: IMAGES.square[2],
    },
    {
        id: "reports",
        title: "Manage your team with reports",
        subtitle: "Measure what matters with Proper UI's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
        frontImage: IMAGES.square[2],
        backImage: IMAGES.square[3],
    },
];

export const FeaturesTabsMockup02 = () => (
    <section className="bg-primary py-16 md:py-24">
        <div className="max-w-container mx-auto w-full px-4 md:px-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                <Badge type="pill-color" color="brand" size="lg" className="hidden md:inline-flex">
                    Features
                </Badge>
                <Badge type="pill-color" color="brand" size="md" className="inline-flex md:hidden">
                    Features
                </Badge>
                <h2 className="text-display-sm text-primary md:text-display-md mt-4 font-semibold">Cutting-edge features for advanced analytics</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
                    Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                </p>
            </div>
        </div>

        {/* The tab list is rendered before the panels so React Aria can wire `aria-controls`;
            `order-*` puts the mockup back above the tabs visually. */}
        <AriaTabs defaultSelectedKey="team-inboxes" className="flex flex-col">
            <div className="max-w-container order-2 mx-auto mt-12 w-full px-4 md:mt-20 md:px-8">
                <AriaTabList aria-label="Features" className="flex flex-1 flex-wrap justify-center gap-y-11 lg:flex-nowrap">
                    {tabs.map((tab) => (
                        <AriaTab
                            key={tab.id}
                            id={tab.id}
                            className={({ isSelected }) =>
                                cx(
                                    "outline-focus-ring hover:border-brand relative flex max-w-101 cursor-pointer flex-col items-center gap-4 border-t-4 pt-5 text-center transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2 md:gap-5 md:px-4",
                                    isSelected ? "border-brand" : "border-tertiary",
                                )
                            }
                        >
                            <div>
                                <h3 className="text-primary text-lg font-semibold">{tab.title}</h3>
                                <p className="text-md text-tertiary mt-1">{tab.subtitle}</p>
                            </div>
                        </AriaTab>
                    ))}
                </AriaTabList>
            </div>

            <div className="max-w-container order-1 mx-auto w-full overflow-hidden px-4 pt-12 md:px-8 md:pt-16">
                <div className="flex h-104 w-full items-start justify-center md:h-128">
                    {tabs.map((tab) => (
                        <AriaTabPanel key={tab.id} id={tab.id} className="relative flex w-144 justify-center">
                            <IPhoneMockup
                                image={tab.frontImage.src}
                                className="drop-shadow-iphone-mockup absolute start-0 top-16 hidden w-71 md:block md:w-[313px]"
                            />
                            <IPhoneMockup image={tab.backImage.src} className="drop-shadow-iphone-mockup w-71 md:absolute md:end-0 md:w-[313px]" />
                        </AriaTabPanel>
                    ))}
                </div>
            </div>
        </AriaTabs>
    </section>
);
