import { cx } from "../../../utils/cx";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import type { MarketingNavItemType } from "../header-navigations/base-components/header";
import { MarketingHeader } from "../header-navigations/base-components/header";
import { SimpleResourcesMenu } from "../header-navigations/base-components/menus";

const navItems: MarketingNavItemType[] = [
    { label: "Products", menu: <SimpleResourcesMenu /> },
    { label: "Services", menu: <SimpleResourcesMenu /> },
    { label: "Pricing", href: "/pricing" },
    { label: "Resources", menu: <SimpleResourcesMenu /> },
    { label: "About", href: "/about" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The two decorative trend lines inside the "Users over time" card. */
const TrendLines = () => (
    <svg
        aria-hidden="true"
        viewBox="0 0 736 341"
        fill="none"
        preserveAspectRatio="none"
        className="text-fg-brand-primary relative max-h-full w-full max-w-full"
    >
        <path
            d="M0 236 L61 228 L123 233 L184 213 L245 205 L307 196 L368 178 L429 168 L491 141 L552 128 L613 104 L675 74 L736 52"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M0 313 L61 305 L123 296 L184 300 L245 271 L307 268 L368 255 L429 260 L491 226 L552 213 L613 219 L675 190 L736 176"
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/** The concentric progress rings sitting over the corner of the chart card. */
const ProgressRings = () => (
    <svg aria-hidden="true" viewBox="0 0 272 272" fill="none" className="h-full max-h-full w-full max-w-full">
        <circle cx="136" cy="136" r="126" className="fill-bg-primary" />
        <circle cx="136" cy="136" r="112" strokeWidth="16" className="stroke-bg-secondary" />
        <circle
            cx="136"
            cy="136"
            r="112"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="704"
            strokeDashoffset="215"
            transform="rotate(-90 136 136)"
            className="stroke-utility-brand-600"
        />
        <circle cx="136" cy="136" r="90" strokeWidth="16" className="stroke-bg-secondary" />
        <circle
            cx="136"
            cy="136"
            r="90"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="566"
            strokeDashoffset="255"
            transform="rotate(-90 136 136)"
            className="stroke-utility-brand-400"
        />
        <circle cx="136" cy="136" r="68" strokeWidth="16" className="stroke-bg-secondary" />
        <circle
            cx="136"
            cy="136"
            r="68"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="428"
            strokeDashoffset="235"
            transform="rotate(-90 136 136)"
            className="stroke-utility-brand-300"
        />
    </svg>
);

/** The "Users over time" chart card — reused at two sizes for mobile and desktop. */
const ChartCard = ({ className }: { className?: string }) => (
    <div className={cx("bg-primary ring-secondary_alt flex h-68 flex-col overflow-hidden rounded-xl p-5 shadow-2xl ring-1 md:p-8", className)}>
        <div className="text-primary text-sm font-semibold md:text-lg">Users over time</div>
        <div className="relative flex min-h-0 min-w-0 flex-1 items-center">
            <div aria-hidden="true" className="absolute inset-0 flex size-full flex-col justify-between py-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <span key={index} className="bg-border-tertiary h-px w-full" />
                ))}
            </div>
            <TrendLines />
        </div>
        <ul className="flex justify-between px-2 md:px-6">
            {months.map((month, index) => (
                <li key={month} className={cx("text-tertiary text-xs", index % 2 === 1 && index !== 11 && "hidden md:block")}>
                    {month}
                </li>
            ))}
        </ul>
    </div>
);

/** The ring metric that overlaps the chart card. */
const ActiveUsersMetric = ({ className }: { className?: string }) => (
    <div className={cx("flex items-center justify-center", className)}>
        <ProgressRings />
        <div className="absolute flex flex-col items-center text-center md:gap-0.5">
            <p className="text-tertiary text-xs font-medium md:text-sm">Active users</p>
            <p className="text-primary md:text-display-xs lg:text-display-sm text-xl font-semibold">1,000</p>
        </div>
    </div>
);

/**
 * Hero color card 02 — a brand-coloured card holding a split layout: email capture on the
 * left, an analytics chart card with an overlapping ring metric on the right.
 */
export const HeroColorCard02 = () => (
    <div className="bg-primary relative overflow-hidden">
        <MarketingHeader items={navItems} />

        <section className="relative overflow-hidden pb-16 md:pt-8 md:pb-24">
            <div className="max-w-container mx-auto md:px-8">
                <div className="bg-brand-section grid w-full grid-cols-1 items-center overflow-hidden px-4 pt-16 pb-24 md:rounded-3xl md:px-8 md:pb-40 lg:grid-cols-2 lg:gap-8 lg:pt-0 lg:pb-0">
                    <div className="flex flex-col items-center text-center lg:block lg:px-8 lg:text-start">
                        <h1 className="text-display-md text-primary_on-brand md:text-display-lg lg:text-display-2xl max-w-3xl font-semibold">
                            Grow your users.
                            <br className="md:hidden" />
                            <span className="text-secondary_on-brand md:ms-3">Smarter.</span>
                        </h1>
                        <p className="text-tertiary_on-brand mt-4 max-w-3xl text-lg text-balance md:mt-6 md:text-xl">
                            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more.
                        </p>

                        <Form className="mt-10 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                            <Input
                                isRequired
                                size="lg"
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                wrapperClassName="py-0.5 not-focus:ring-transparent"
                                hint={
                                    <span className="text-tertiary_on-brand">
                                        We care about your data in our{" "}
                                        <a
                                            href="/privacy"
                                            className="outline-focus-ring rounded-xs underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2"
                                        >
                                            privacy policy
                                        </a>
                                        .
                                    </span>
                                }
                            />
                            <Button type="submit" size="xl">
                                Get started
                            </Button>
                        </Form>
                    </div>

                    <div className="hidden min-h-160 items-center lg:flex">
                        <div className="relative h-127">
                            <ChartCard className="absolute start-16 top-0 w-200 md:h-115 lg:h-115" />
                            <ActiveUsersMetric className="absolute -right-12 -bottom-10 size-[272px] md:start-2 md:bottom-2" />
                        </div>
                    </div>
                </div>

                <div className="relative mx-auto -mt-8 w-max max-w-full px-4 md:-mt-24 md:px-8 lg:hidden">
                    <ChartCard className="md:h-90 lg:h-115" />
                    <ActiveUsersMetric className="absolute -right-12 -bottom-10 size-[192px] md:end-[-65px] md:-bottom-8" />
                </div>
            </div>
        </section>
    </div>
);
