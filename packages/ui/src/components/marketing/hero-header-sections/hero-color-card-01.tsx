import type { SVGProps } from "react";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { HeaderDropdownSimple } from "../header-navigations/header-dropdown-simple";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Decorative brand-tinted burst used twice behind the colour card. */
const Burst = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 298 408" fill="none" aria-hidden="true" {...props}>
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {Array.from({ length: 96 }).map((_, index) => {
                const column = index % 8;
                const row = Math.floor(index / 8);
                const x = 16 + column * 38;
                const y = 16 + row * 32;

                return <line key={index} x1={x} y1={y} x2={x + 14} y2={y + 14} />;
            })}
        </g>
    </svg>
);

/** Line chart drawn inline so it inherits the brand palette in both themes. */
const UsersOverTimeChart = (props: SVGProps<SVGSVGElement>) => (
    <svg width="736" height="341" viewBox="0 0 736 341" fill="none" preserveAspectRatio="none" aria-hidden="true" {...props}>
        <path
            d="M0 300 L61 292 L123 284 L184 268 L245 262 L307 240 L368 232 L429 208 L491 186 L552 176 L613 148 L675 128 L736 96 L736 341 L0 341 Z"
            className="fill-utility-brand-500/10"
        />
        <path
            d="M0 300 L61 292 L123 284 L184 268 L245 262 L307 240 L368 232 L429 208 L491 186 L552 176 L613 148 L675 128 L736 96"
            className="stroke-utility-brand-700"
            strokeWidth="3"
            fill="none"
        />
        <path
            d="M0 214 L61 206 L123 212 L184 190 L245 196 L307 172 L368 178 L429 152 L491 144 L552 122 L613 112 L675 84 L736 70"
            className="stroke-utility-brand-500"
            strokeWidth="3"
            fill="none"
        />
        <path
            d="M0 150 L61 146 L123 152 L184 138 L245 144 L307 126 L368 132 L429 112 L491 108 L552 92 L613 86 L675 66 L736 56"
            className="stroke-utility-brand-300"
            strokeWidth="3"
            fill="none"
        />
    </svg>
);

/** Radial active-users gauge drawn inline from brand tokens. */
const ActiveUsersGauge = (props: SVGProps<SVGSVGElement>) => (
    <svg width="272" height="272" viewBox="0 0 272 272" fill="none" aria-hidden="true" {...props}>
        <circle cx="136" cy="136" r="128" className="stroke-utility-neutral-100" strokeWidth="16" fill="none" />
        <circle
            cx="136"
            cy="136"
            r="128"
            className="stroke-utility-brand-600"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="804"
            strokeDashoffset="240"
            transform="rotate(-90 136 136)"
        />
        <circle cx="136" cy="136" r="104" className="stroke-utility-neutral-100" strokeWidth="12" fill="none" />
        <circle
            cx="136"
            cy="136"
            r="104"
            className="stroke-utility-brand-400"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="654"
            strokeDashoffset="300"
            transform="rotate(-90 136 136)"
        />
    </svg>
);

const hint = (
    <span className="text-tertiary_on-brand">
        We care about your data in our{" "}
        <a href="/privacy" className="outline-focus-ring rounded-xs underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2">
            privacy policy
        </a>
        .
    </span>
);

/** Brand-coloured card hero with an email capture form and an analytics card overlapping the card's bottom edge. */
export const HeroColorCard01 = () => (
    <div className="bg-primary relative overflow-hidden">
        <HeaderDropdownSimple />

        <section className="relative overflow-hidden pb-16 md:pt-8 md:pb-24">
            <div className="absolute start-[-98px] top-1/2 hidden -translate-y-1/2 md:block">
                <Burst className="text-fg-brand-secondary hidden w-48.5 opacity-30 md:block md:w-74.5" />
            </div>
            <div className="absolute end-12 bottom-9 max-md:hidden">
                <Burst className="text-fg-brand-secondary hidden w-48.5 opacity-30 md:block md:w-74.5" />
            </div>

            <div className="max-w-container mx-auto md:px-8">
                <div className="bg-brand-section flex w-full flex-col items-center px-4 pt-16 pb-24 text-center md:rounded-3xl md:px-8 md:pt-24 md:pb-48">
                    <h1 className="text-display-md text-primary_on-brand md:text-display-lg lg:text-display-2xl max-w-3xl font-semibold">
                        Grow your users. <br />
                        <span className="text-secondary_on-brand">Smarter.</span>
                    </h1>
                    <p className="text-tertiary_on-brand mt-4 max-w-3xl text-lg text-balance md:mt-6 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                    </p>

                    <Form className="mt-10 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                        <Input
                            isRequired
                            size="lg"
                            name="email"
                            type="email"
                            wrapperClassName="py-0.5 not-focus:ring-transparent"
                            placeholder="Enter your email"
                            aria-label="Enter your email"
                            hint={hint}
                        />
                        <Button type="submit" size="xl">
                            Get started
                        </Button>
                    </Form>
                </div>

                <div className="relative mx-auto -mt-8 w-max max-w-full px-4 md:-mt-24 md:px-8 md:pb-8">
                    <div className="bg-primary ring-secondary_alt flex h-68 flex-col overflow-hidden rounded-xl p-5 shadow-2xl ring-1 md:h-90 md:p-8 lg:h-115">
                        <div className="text-primary text-sm font-semibold md:text-lg">Users over time</div>

                        <div className="relative flex min-h-0 min-w-0 flex-1 items-center">
                            <div className="absolute inset-0 flex size-full flex-col justify-between py-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <span key={index} className="bg-border-tertiary h-px w-full" />
                                ))}
                            </div>
                            <UsersOverTimeChart className="relative max-h-full w-full max-w-full" />
                        </div>

                        <ul className="flex justify-between px-2 md:px-6">
                            {months.map((month, index) => (
                                <li key={month} className={index % 2 === 1 && index !== 11 ? "text-tertiary hidden text-xs md:block" : "text-tertiary text-xs"}>
                                    {month}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="absolute -right-12 -bottom-10 md:end-[-65px] md:bottom-0">
                        <div className="relative flex size-[192px] items-center justify-center md:size-auto">
                            <ActiveUsersGauge className="h-full max-h-full w-full max-w-full" />
                            <div className="absolute flex flex-col items-center text-center md:gap-0.5">
                                <p className="text-tertiary text-xs font-medium md:text-sm">Active users</p>
                                <p className="text-primary md:text-display-xs lg:text-display-sm text-xl font-semibold">1,000</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
);
