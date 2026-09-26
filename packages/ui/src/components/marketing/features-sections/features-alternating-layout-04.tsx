import { ChartBreakoutSquare, Check, MessageChatCircle, Zap } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { IMAGES } from "../../../utils/demo-assets";
import { FeaturedIcon } from "../../foundations/featured-icon/featured-icon";

const features = [
    {
        title: "Share team inboxes",
        subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
        icon: MessageChatCircle,
        image: IMAGES.landscape[0],
        bullets: ["Leverage automation to move fast", "Always give customers a human to chat to", "Automate customer support and close leads faster"],
    },
    {
        title: "Deliver instant answers",
        subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
        icon: Zap,
        image: IMAGES.landscape[1],
        bullets: [
            "Keep your customers in the loop with live chat",
            "Embed help articles right on your website",
            "Customers never have to leave the page to find an answer",
        ],
    },
    {
        title: "Manage your team with reports",
        subtitle: "Measure what matters with Proper UI's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
        icon: ChartBreakoutSquare,
        image: IMAGES.landscape[2],
        bullets: [
            "Filter, export, and drilldown on the data quickly",
            "Save, schedule, and automate reports to your inbox",
            "Connect the tools you already use with 100+ integrations",
        ],
    },
];

export const FeaturesAlternatingLayout04 = () => (
    <section className="bg-primary flex flex-col gap-12 py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24">
        <div className="max-w-container mx-auto w-full px-4 md:px-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                <span className="text-brand-secondary md:text-md text-sm font-semibold">Features</span>
                <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">Beautiful analytics to grow smarter</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
                    Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                </p>
            </div>
        </div>

        <div className="max-w-container mx-auto flex w-full flex-col gap-12 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24 lg:px-0">
            {features.map((feature, index) => {
                const isReversed = index % 2 === 1;

                return (
                    <div key={feature.title} className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-0">
                        <div className={cx("flex-1 self-center lg:py-24", isReversed ? "lg:order-last lg:ps-24 lg:pe-8" : "lg:ps-12 lg:pe-24")}>
                            <FeaturedIcon icon={feature.icon} size="lg" color="brand" theme="light" />
                            <h2 className="text-display-xs text-primary md:text-display-sm mt-5 font-semibold">{feature.title}</h2>
                            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">{feature.subtitle}</p>
                            <ul className="mt-8 flex flex-col gap-4 ps-2 md:gap-5 md:ps-4">
                                {feature.bullets.map((bullet) => (
                                    <li key={bullet} className="flex gap-3">
                                        <span className="bg-brand-primary text-featured-icon-light-fg-brand flex size-7 shrink-0 items-center justify-center rounded-full">
                                            <Check aria-hidden="true" className="size-4" />
                                        </span>
                                        <span className="text-md text-tertiary pt-0.5 md:pt-0 md:text-lg">{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative min-h-60 w-full flex-1 md:min-h-140">
                            <img
                                src={feature.image.src}
                                alt={feature.image.alt}
                                className={cx(
                                    "absolute inset-0 size-full object-cover lg:w-[50vw] lg:max-w-[50vw]",
                                    isReversed ? "lg:start-auto" : "lg:end-auto",
                                )}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    </section>
);
