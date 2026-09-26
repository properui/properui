import { sortCx } from "../../../utils/cx";
import { IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { BackgroundPattern } from "../../shared-assets/background-patterns";
import type { MarketingNavItemType } from "../header-navigations/base-components/header";
import { MarketingHeader } from "../header-navigations/base-components/header";
import { SimpleResourcesMenu } from "../header-navigations/base-components/menus";

// TODO(orchestrator): candidate for components/shared-assets/mockups — the screen/mobile frame recipe is repeated across hero variants.
const styles = sortCx({
    desktopFrame: {
        outer: "rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-neutral-300 ring-inset md:rounded-[26.91px] md:p-[3px] md:ring-[1.68px]",
        inner: "rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[23.58px] md:p-1 md:shadow-modern-mockup-inner-lg",
        screen: "relative overflow-hidden rounded-[6.77px] bg-utility-neutral-50 ring-[0.56px] ring-utility-neutral-200 md:rounded-[20.21px] md:ring-[1.68px]",
    },
    mobileFrame: {
        outer: "max-w-70 rounded-[23.89px] bg-primary p-[3px] shadow-lg ring-[1.5px] ring-utility-neutral-300 ring-inset",
        inner: "size-full rounded-[20.91px] bg-primary p-1 shadow-modern-mockup-inner-md md:shadow-modern-mockup-inner-lg",
        screen: "relative size-full overflow-hidden rounded-[17.92px] bg-utility-neutral-50 ring-[1.5px] ring-utility-neutral-200",
    },
});

const navItems: MarketingNavItemType[] = [
    { label: "Products", menu: <SimpleResourcesMenu /> },
    { label: "Services", menu: <SimpleResourcesMenu /> },
    { label: "Pricing", href: "/pricing" },
    { label: "Resources", menu: <SimpleResourcesMenu /> },
    { label: "About", href: "/about" },
];

/**
 * Hero iPhone mockup 03 — a "text me a link" phone capture form beside overlapping
 * desktop and mobile app frames.
 */
export const HeroIphoneMockup03 = () => (
    <div className="bg-primary relative overflow-hidden">
        <BackgroundPattern pattern="grid" size="md" className="absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block" />
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
                        <div className={styles.desktopFrame.outer}>
                            <div className={styles.desktopFrame.inner}>
                                <div className={styles.desktopFrame.screen}>
                                    <img alt={IMAGES.landscape[1].alt} src={IMAGES.landscape[1].src} className="max-w-5xl object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="start-0 top-26 lg:absolute">
                        <div className={styles.mobileFrame.outer}>
                            <div className={styles.mobileFrame.inner}>
                                <div className={styles.mobileFrame.screen}>
                                    <img alt={IMAGES.square[0].alt} src={IMAGES.square[0].src} className="size-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
);
