"use client";

import { PlayCircle } from "@properui/icons";
import { IMAGES } from "../../../utils/demo-assets";
import { FileListItemProgressBar } from "../../application/file-upload/file-upload-base";
import { Button } from "../../base/buttons/button";
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

/** A field of hand-drawn dashes used as a decorative flourish behind the photo. */
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
 * Hero split image 03 — headline and actions beside a rounded-corner photo with floating
 * upload-progress cards.
 */
export const HeroSplitImage03 = () => (
    <>
        <MarketingHeader items={navItems} className="bg-primary" />

        <section className="bg-primary overflow-hidden py-16 md:pb-24">
            <div className="max-w-container mx-auto grid grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2 lg:gap-8">
                <div className="flex max-w-3xl flex-col items-start lg:pe-8">
                    <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">People who care about your growth</h1>
                    <p className="text-tertiary mt-4 max-w-lg text-lg text-balance md:mt-6 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more.
                    </p>
                    <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start md:mt-12">
                        <Button size="xl" color="secondary" iconLeading={PlayCircle} href="/demo">
                            Demo
                        </Button>
                        <Button size="xl" href="/signup">
                            Sign up
                        </Button>
                    </div>
                </div>

                <div className="relative lg:h-full lg:min-h-160">
                    <ul className="absolute bottom-9 -left-18 z-10 hidden w-92 flex-col gap-3 select-none lg:flex">
                        <FileListItemProgressBar
                            type="mp3"
                            name="My Podcast - Episode 1.mp3"
                            size={20971520}
                            progress={100}
                            className="bg-alpha-white/90 ring-secondary_alt backdrop-blur-lg"
                        />
                        <FileListItemProgressBar
                            type="mp3"
                            name="My Podcast - Episode 2.mp3"
                            size={20971520}
                            progress={80}
                            className="bg-alpha-white/90 ring-secondary_alt backdrop-blur-lg"
                        />
                    </ul>

                    <div className="absolute end-5 top-6 z-10 translate-x-1/2 md:-top-10">
                        <DashField className="text-fg-quaternary hidden w-48.5 opacity-30 md:block md:w-74.5" />
                    </div>

                    <img
                        src={IMAGES.landscape[5].src}
                        alt={IMAGES.landscape[5].alt}
                        className="inset-0 h-70 w-full rounded-ss-[64px] object-cover md:h-110 md:rounded-ss-[92px] lg:absolute lg:h-full lg:rounded-ss-[160px]"
                    />
                </div>
            </div>
        </section>
    </>
);
