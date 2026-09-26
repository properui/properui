"use client";

import { cx, sortCx } from "../../../utils/cx";
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const styles = sortCx({
    card: "bg-primary ring-secondary_alt flex h-68 flex-col overflow-hidden rounded-xl p-5 shadow-2xl ring-1 md:p-8",
    monthLabel: "text-tertiary text-xs",
    dial: "flex items-center justify-center absolute",
});

/** Decorative three-series line chart. Purely illustrative — it carries no data. */
const LineChart = () => (
    <svg viewBox="0 0 736 341" fill="none" preserveAspectRatio="none" aria-hidden="true" className="relative max-h-full w-full max-w-full">
        <path
            d="M0 262 61 249 123 256 184 231 245 238 307 214 368 205 429 186 491 178 552 152 613 137 675 108 736 88"
            className="stroke-utility-brand-600"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
        />
        <path
            d="M0 305 61 296 123 302 184 284 245 289 307 268 368 274 429 249 491 256 552 226 613 231 675 196 736 178"
            className="stroke-utility-brand-400"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
        />
        <path
            d="M0 332 61 327 123 331 184 318 245 322 307 309 368 314 429 297 491 302 552 281 613 287 675 262 736 248"
            className="stroke-utility-brand-200"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
        />
    </svg>
);

/** Decorative concentric-progress dial. Purely illustrative — it carries no data. */
const Dial = () => (
    <svg viewBox="0 0 272 272" fill="none" aria-hidden="true" className="h-full max-h-full w-full max-w-full">
        <g transform="rotate(-90 136 136)" strokeLinecap="round" fill="none">
            <circle cx="136" cy="136" r="120" strokeWidth="20" className="stroke-utility-brand-50" />
            <circle cx="136" cy="136" r="120" strokeWidth="20" strokeDasharray="600 754" className="stroke-utility-brand-200" />
            <circle cx="136" cy="136" r="94" strokeWidth="20" className="stroke-utility-brand-50" />
            <circle cx="136" cy="136" r="94" strokeWidth="20" strokeDasharray="380 591" className="stroke-utility-brand-600" />
            <circle cx="136" cy="136" r="68" strokeWidth="20" className="stroke-utility-brand-50" />
            <circle cx="136" cy="136" r="68" strokeWidth="20" strokeDasharray="200 428" className="stroke-utility-brand-400" />
        </g>
    </svg>
);

const UsersOverTimeCard = ({ className }: { className?: string }) => (
    <div className={cx(styles.card, className)}>
        <div className="text-primary text-sm font-semibold md:text-lg">Users over time</div>

        <div className="relative flex min-h-0 min-w-0 flex-1 items-center">
            <div aria-hidden="true" className="absolute inset-0 flex size-full flex-col justify-between py-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <span key={index} className="bg-border-tertiary h-px w-full" />
                ))}
            </div>
            <LineChart />
        </div>

        <ul className="flex justify-between px-2 md:px-6">
            {MONTHS.map((month, index) => (
                <li key={month} className={cx(styles.monthLabel, index % 2 === 1 && index < 11 && "hidden md:block")}>
                    {month}
                </li>
            ))}
        </ul>
    </div>
);

const ActiveUsersDial = ({ className }: { className?: string }) => (
    <div className={cx(styles.dial, className)}>
        <Dial />
        <div className="absolute flex flex-col items-center text-center md:gap-0.5">
            <p className="text-tertiary text-xs font-medium md:text-sm">Active users</p>
            <p className="text-primary md:text-display-xs lg:text-display-sm text-xl font-semibold">1,000</p>
        </div>
    </div>
);

/**
 * Hero color card 02 — the whole hero sits inside a rounded brand card, with an
 * analytics card that overlaps the card's bottom edge below `lg`.
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
                                aria-label="Enter your email"
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
                            <UsersOverTimeCard className="absolute start-16 top-0 w-200 md:h-115 lg:h-115" />
                            <ActiveUsersDial className="-right-12 -bottom-10 size-[272px] md:start-2 md:bottom-2" />
                        </div>
                    </div>
                </div>

                <div className="relative mx-auto -mt-8 w-max max-w-full px-4 md:-mt-24 md:px-8 lg:hidden">
                    <UsersOverTimeCard className="md:h-90 lg:h-115" />
                    <ActiveUsersDial className="-right-12 -bottom-10 size-[192px] md:end-[-65px] md:-bottom-8" />
                </div>
            </div>
        </section>
    </div>
);
