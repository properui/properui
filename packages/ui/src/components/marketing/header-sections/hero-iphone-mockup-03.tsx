"use client";

import { sortCx } from "../../../utils/cx";
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

// TODO(orchestrator): candidate for a shared `shared-assets/mockups/screen-mockup` primitive.
const styles = sortCx({
    desktop: {
        bezel: "bg-primary ring-utility-neutral-300 rounded-[9.03px] p-[0.9px] shadow-lg ring-[0.56px] ring-inset md:rounded-[26.91px] md:p-[3px] md:ring-[1.68px]",
        frame: "bg-primary shadow-modern-mockup-inner-md md:shadow-modern-mockup-inner-lg rounded-[7.9px] p-0.5 md:rounded-[23.58px] md:p-1",
        screen: "bg-utility-neutral-50 ring-utility-neutral-200 relative overflow-hidden rounded-[6.77px] ring-[0.56px] md:rounded-[20.21px] md:ring-[1.68px]",
    },
    phone: {
        bezel: "bg-primary ring-utility-neutral-300 max-w-70 rounded-[23.89px] p-[3px] shadow-lg ring-[1.5px] ring-inset",
        frame: "bg-primary shadow-modern-mockup-inner-md md:shadow-modern-mockup-inner-lg size-full rounded-[20.91px] p-1",
        screen: "bg-utility-neutral-50 ring-utility-neutral-200 relative size-full overflow-hidden rounded-[17.92px] ring-[1.5px]",
    },
});

/**
 * Hero iPhone mockup 03 — a "text me a link" sign-up beside a phone screenshot that
 * overlaps a wider desktop screenshot from `lg` up.
 */
export const HeroIphoneMockup03 = () => (
    <div className="bg-primary relative overflow-hidden">
        <BackgroundPattern pattern="grid" size="sm" className="absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block" />
        <BackgroundPattern pattern="grid" size="sm" className="absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden" />

        <MarketingHeader items={navItems} />

        <section className="relative overflow-hidden pt-16 md:pb-24">
            <div className="max-w-container mx-auto flex flex-col gap-16 px-4 md:px-8 lg:flex-row lg:items-center lg:gap-8">
                <div className="flex w-full max-w-3xl flex-1 flex-col">
                    <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">Banking, but for digital creators</h1>
                    <p className="text-tertiary mt-4 max-w-120 text-lg text-balance md:mt-6 md:text-xl">
                        Designed by creators, for creators. Proper UI gives you the guidance, data and innovation you need to sell more and grow your digital
                        business.
                    </p>

                    <Form className="mt-8 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                        <Input
                            isRequired
                            size="lg"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            aria-label="Phone number"
                            wrapperClassName="md:py-0.5"
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
                            Text me a link
                        </Button>
                    </Form>
                </div>

                <div className="relative flex h-90 w-full items-start justify-center lg:h-128 lg:flex-1 lg:items-center">
                    <div className="absolute start-16 top-0 max-lg:hidden">
                        <div className={styles.desktop.bezel}>
                            <div className={styles.desktop.frame}>
                                <div className={styles.desktop.screen}>
                                    <img
                                        src={IMAGES.landscape[6].src}
                                        alt="Dashboard mockup showing the application interface"
                                        className="max-w-5xl object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="start-0 top-26 lg:absolute">
                        <div className={styles.phone.bezel}>
                            <div className={styles.phone.frame}>
                                <div className={styles.phone.screen}>
                                    <img src={IMAGES.square[0].src} alt="Mobile app interface mockup" className="size-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
);
