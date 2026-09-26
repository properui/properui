import { IMAGES } from "../../../utils/demo-assets";
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

/** A field of hand-drawn dashes used as a decorative flourish either side of the card. */
const DashField = ({ className }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 298 408" fill="none" className={className}>
        {Array.from({ length: 8 }).map((_, column) =>
            Array.from({ length: 11 }).map((__, row) => (
                <line
                    key={`${column}-${row}`}
                    x1={12 + column * 38}
                    y1={14 + row * 36}
                    x2={26 + column * 38}
                    y2={34 + row * 36}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            )),
        )}
    </svg>
);

/**
 * Hero color card 03 — a centred brand-coloured card with an email capture form and a
 * screen mockup breaking out of the bottom edge.
 */
export const HeroColorCard03 = () => (
    <div className="bg-secondary relative overflow-hidden">
        <MarketingHeader items={navItems} />

        <section className="relative overflow-hidden pb-16 md:pt-8 md:pb-24">
            <div className="absolute start-[-98px] top-1/2 hidden -translate-y-1/2 md:block">
                <DashField className="text-fg-brand-secondary hidden w-48.5 opacity-30 md:block md:w-74.5" />
            </div>
            <div className="absolute end-12 bottom-14 max-md:hidden">
                <DashField className="text-fg-brand-secondary hidden w-48.5 opacity-30 md:block md:w-74.5" />
            </div>

            <div className="max-w-container mx-auto md:px-8">
                <div className="bg-brand-section flex w-full flex-col items-center px-4 pt-16 pb-24 text-center md:rounded-3xl md:px-8 md:pt-24 md:pb-48">
                    <h1 className="text-display-md text-primary_on-brand md:text-display-lg lg:text-display-2xl max-w-3xl font-semibold">
                        Grow your users. <br />
                        <span className="text-secondary_on-brand">Smarter.</span>
                    </h1>
                    <p className="text-tertiary_on-brand mt-4 max-w-3xl text-lg text-balance md:mt-6 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users.{" "}
                        <span className="max-md:hidden">Trusted by over 4,000 startups.</span>
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

                <div className="relative mx-auto -mt-8 w-max max-w-full px-4 md:-mt-24 md:px-8">
                    <div className="relative rounded ring-6 ring-white/50 md:rounded-[10px] md:ring-8">
                        <div aria-hidden="true" className="md:shadow-3xl absolute inset-x-4 inset-y-0 h-full shadow-xl md:inset-x-7" />
                        <img
                            alt={IMAGES.landscape[3].alt}
                            src={IMAGES.landscape[3].src}
                            className="relative rounded object-cover md:rounded-[10px] lg:max-w-3xl"
                        />
                    </div>
                </div>
            </div>
        </section>
    </div>
);
