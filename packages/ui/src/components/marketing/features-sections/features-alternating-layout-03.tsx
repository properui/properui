import type { FC, ReactNode } from "react";
import { ChartBreakoutSquare, CheckCircle, MessageSmileCircle, Zap } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { IMAGES } from "../../../utils/demo-assets";
import { FeaturedIcon } from "../../foundations/featured-icon/featured-icon";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

const styles = sortCx({
    section: "flex flex-col gap-12 overflow-hidden bg-primary py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24",
    container: "mx-auto w-full max-w-container px-4 md:px-8",
    row: "grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24",
    copy: "max-w-xl flex-1 self-center",
    checkIcon: "size-7 shrink-0 text-fg-brand-primary",
    checkLabel: "pt-0.5 text-md text-tertiary md:pt-0 md:text-lg",
    screenshot: "w-full rounded object-contain object-left-top ring-4 ring-screen-mockup-border md:h-[120%] md:w-auto md:rounded-[10px]",
});

type Row = { icon: FC<{ className?: string }>; title: string; subtitle: string; bullets: string[]; media: ReactNode; reversed?: boolean };

const CopyColumn = ({ row }: { row: Row }) => (
    <div className={cx(styles.copy, row.reversed && "lg:order-last")}>
        <FeaturedIcon icon={row.icon} size="lg" theme="light" color="brand" />

        <h2 className="text-display-xs text-primary md:text-display-sm mt-5 font-semibold">{row.title}</h2>
        <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">{row.subtitle}</p>

        <ul className="mt-8 flex flex-col gap-4 ps-2 md:gap-5 md:ps-4">
            {row.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                    <CheckCircle className={styles.checkIcon} aria-hidden="true" />
                    <span className={styles.checkLabel}>{bullet}</span>
                </li>
            ))}
        </ul>
    </div>
);

const rows: Row[] = [
    {
        icon: MessageSmileCircle,
        title: "Share team inboxes",
        subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
        bullets: ["Leverage automation to move fast", "Always give customers a human to chat to", "Automate customer support and close leads faster"],
        media: (
            <div className="bg-tertiary relative -ms-4 w-screen flex-1 px-4 py-6 md:ms-0 md:min-h-128 md:w-full md:overflow-hidden md:p-0 lg:overflow-visible">
                <div className="bg-tertiary start-0 top-0 md:absolute md:h-full md:w-screen lg:overflow-hidden">
                    <img
                        alt="Dashboard mockup showing application interface"
                        src={IMAGES.landscape[0].src}
                        className={cx(styles.screenshot, "start-12 top-12 md:absolute md:max-w-5xl lg:max-w-3xl")}
                    />
                </div>
            </div>
        ),
    },
    {
        icon: Zap,
        title: "Deliver instant answers",
        subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
        bullets: [
            "Keep your customers in the loop with live chat",
            "Embed help articles right on your website",
            "Customers never have to leave the page to find an answer",
        ],
        reversed: true,
        media: (
            <div className="bg-tertiary relative -ms-4 h-90 w-screen overflow-hidden px-4 pt-6 md:ms-0 md:min-h-128 md:w-full md:flex-1 md:overflow-hidden md:p-0 md:px-12 lg:overflow-visible">
                <div className="bg-tertiary end-0 top-0 h-full md:absolute md:w-screen lg:overflow-hidden">
                    <IPhoneMockup
                        image={IMAGES.landscape[1].src}
                        className="absolute top-28 right-1/2 hidden w-full translate-x-[30%] md:block md:w-78.5 md:max-w-none lg:end-62 lg:translate-x-0"
                    />
                    <IPhoneMockup
                        image={IMAGES.landscape[2].src}
                        className="drop-shadow-iphone-mockup top-12 right-1/2 mx-auto w-71 md:absolute md:mx-0 md:w-78.5 md:max-w-none md:translate-x-[70%] lg:end-12 lg:translate-x-0"
                    />
                </div>
            </div>
        ),
    },
    {
        icon: ChartBreakoutSquare,
        title: "Manage your team with reports",
        subtitle: "Measure what matters with Proper UI's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
        bullets: [
            "Filter, export, and drilldown on the data quickly",
            "Save, schedule, and automate reports to your inbox",
            "Connect the tools you already use with 100+ integrations",
        ],
        media: (
            <div className="bg-tertiary relative -ms-4 h-90 w-screen overflow-hidden px-4 pt-6 md:ms-0 md:min-h-128 md:w-full md:flex-1 md:overflow-hidden md:p-0 md:px-12 lg:overflow-visible">
                <div className="bg-tertiary start-0 top-0 md:absolute md:h-full md:w-screen lg:overflow-hidden">
                    <img
                        alt="Dashboard mockup showing application interface"
                        src={IMAGES.landscape[3].src}
                        className={cx(styles.screenshot, "absolute start-50 top-12 max-md:hidden md:max-w-3xl")}
                    />
                    <IPhoneMockup
                        image={IMAGES.landscape[4].src}
                        className="drop-shadow-iphone-mockup start-12 top-28 mx-auto w-71 object-contain shadow-2xl md:absolute md:mx-0 md:w-78.5 md:max-w-none"
                    />
                </div>
            </div>
        ),
    },
];

/** Three alternating rows, each pairing a checklist of benefits with a device or screenshot panel. */
export const FeaturesAlternatingLayout03 = () => (
    <section className={styles.section}>
        <div className={styles.container}>
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                <span className="text-brand-secondary md:text-md text-sm font-semibold">Features</span>
                <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">Beautiful analytics to grow smarter</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
                    Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                </p>
            </div>
        </div>

        <div className="max-w-container mx-auto flex w-full flex-col gap-12 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24">
            {rows.map((row) => (
                <div key={row.title} className={styles.row}>
                    <CopyColumn row={row} />
                    {row.media}
                </div>
            ))}
        </div>
    </section>
);
