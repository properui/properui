"use client";

import { PlayCircle } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { AVATARS, IMAGES } from "../../../utils/demo-assets";
import { Avatar } from "../../base/avatar/avatar";
import { Button } from "../../base/buttons/button";
import { RatingStars } from "../../foundations/rating/rating-stars";
import { BackgroundPattern } from "../../shared-assets/background-patterns";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";
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

const socialProof = AVATARS.slice(0, 5);

const notifications = [
    { avatar: AVATARS[0], body: <>followed you!</>, meta: AVATARS[0].username, opacity: "" },
    { avatar: AVATARS[4], body: <>and 2 others gave you kudos on the Clubhouse 101 post</>, meta: null, opacity: "" },
    { avatar: AVATARS[1], body: <>joined your team Melbourne Startups Growth</>, meta: null, opacity: "opacity-75" },
    { avatar: AVATARS[2], body: <>just launched The 10k users challenge</>, meta: null, opacity: "opacity-50" },
];

/**
 * Hero iPhone mockup 04 — headline, social proof and an arch-framed iPhone with a stack of
 * floating notification cards.
 */
export const HeroIphoneMockup04 = () => (
    <div className="bg-primary relative overflow-hidden">
        <BackgroundPattern pattern="grid" size="md" className="absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block" />
        <BackgroundPattern pattern="grid" size="sm" className="absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden" />

        <MarketingHeader items={navItems} />

        <section className="relative overflow-hidden pt-16 md:pb-24">
            <div className="max-w-container mx-auto flex flex-col gap-16 px-4 md:px-8 lg:flex-row lg:items-center lg:gap-8">
                <div className="w-full flex-1">
                    <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl max-w-3xl font-semibold">
                        Growth performance tracking made easy
                    </h1>
                    <p className="text-tertiary mt-4 max-w-lg text-lg text-balance md:mt-6 md:text-xl">
                        Designed by creators, for creators. Proper UI gives you the guidance, data and innovation you need to sell more and grow your digital
                        business.
                    </p>

                    <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                        <Button size="xl" color="secondary" iconLeading={PlayCircle} href="/demo">
                            Demo
                        </Button>
                        <Button size="xl" href="/signup">
                            Sign up
                        </Button>
                    </div>

                    <div className="mt-8 flex items-center gap-4 md:mt-12">
                        <div className="inline-flex -space-x-3 overflow-hidden">
                            {socialProof.map((person) => (
                                <Avatar key={person.name} size="md" src={person.src} alt={person.name} className="ring-bg-primary ring-[1.5px]" />
                            ))}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <RatingStars rating={5} className="gap-1" starClassName="relative shrink-0 grow-0" />
                                <span className="text-secondary text-md font-semibold">5.0</span>
                            </div>
                            <p className="text-tertiary text-md font-medium">from 200+ reviews</p>
                        </div>
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col items-center overflow-y-clip md:h-160 md:pt-20 lg:max-w-140">
                    <div
                        aria-hidden="true"
                        className="bg-tertiary absolute top-20 left-1/2 h-94 w-120 -translate-x-1/2 rounded-t-[320px] rounded-b-[24px] md:top-0 md:h-160 md:w-140"
                    />

                    <div className="relative flex h-104 w-max items-start justify-center md:h-140">
                        <ul aria-hidden="true" className="absolute start-[-218px] -bottom-3 z-10 hidden flex-col gap-3 md:flex">
                            {notifications.map((item) => (
                                <li
                                    key={item.avatar.name}
                                    className={cx("bg-alpha-white/90 flex w-full max-w-xs gap-3 rounded-lg p-4 backdrop-blur-lg", item.opacity)}
                                >
                                    <Avatar size="md" src={item.avatar.src} alt={item.avatar.name} />
                                    <div>
                                        <p className="text-secondary text-sm">
                                            <span className="text-brand-secondary font-medium">{item.avatar.name}</span> {item.body}
                                        </p>
                                        {item.meta && <p className="text-tertiary text-sm">{item.meta}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <IPhoneMockup
                            image={IMAGES.landscape[2].src}
                            className="drop-shadow-iphone-mockup h-[579px] w-71 md:h-auto md:w-[313px] md:drop-shadow-none"
                        />
                    </div>
                </div>
            </div>
        </section>
    </div>
);
