import { IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { BackgroundPattern } from "../../shared-assets/background-patterns";
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

/** The hand-drawn arrow that points from the photo back to the sign-up form. */
const CurvedArrow = ({ className }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 305 297" fill="none" width="305" height="297" className={className}>
        <path d="M292 190c-40 55-108 82-176 74-33-4-64-16-89-34" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M27 230l4-40M27 230l38 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
);

/**
 * Hero split image 06 — an email capture hero with a full-height portrait anchored to the
 * right edge and a hand-drawn arrow tying the two together.
 */
export const HeroSplitImage06 = () => (
    <div className="bg-primary relative overflow-hidden">
        <BackgroundPattern pattern="grid" size="md" className="absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block" />
        <BackgroundPattern pattern="grid" size="sm" className="absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden" />

        <MarketingHeader items={navItems} />

        <section className="py-16 md:pb-24">
            <div className="max-w-container relative mx-auto grid grid-cols-1 gap-16 px-4 md:px-8 lg:min-h-160 lg:items-center">
                <div className="z-10 flex max-w-200 flex-col items-start">
                    <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
                        Customer service software for customer-first teams
                    </h1>
                    <p className="text-tertiary mt-4 max-w-xl text-lg text-balance md:mt-6 md:text-xl">
                        The best customer service software for customer-first teams. Industry-leading email and live chat support.
                    </p>

                    <Form className="mt-8 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                        <Input
                            isRequired
                            size="lg"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            wrapperClassName="py-0.5"
                            hint={
                                <span>
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

                <div className="relative lg:absolute lg:end-8 lg:top-0 lg:h-full lg:w-140">
                    <CurvedArrow className="text-fg-brand-secondary absolute start-4 -bottom-2 hidden -translate-x-1/2 lg:block" />
                    <img src={IMAGES.square[1].src} alt={IMAGES.square[1].alt} className="inset-0 h-60 w-full object-cover md:h-110 lg:h-full" />
                </div>
            </div>
        </section>
    </div>
);
