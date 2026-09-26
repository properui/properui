"use client";

import type { CSSProperties, ReactNode } from "react";
import { SearchLg } from "@properui/icons";
import { cx } from "../../../../utils/cx";
import { Input } from "../../../base/input/input";
import { ProperLogo } from "../../../foundations/logo/proper-logo";
import { MobileNavigationHeader } from "../base-components/mobile-header";
import { NavAccountCard } from "../base-components/nav-account-card";
import { NavItemBase } from "../base-components/nav-item";
import { NavList } from "../base-components/nav-list";
import type { NavItemType } from "../config";

export interface SidebarNavigationProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: NavItemType[];
    /** List of footer items to display. */
    footerItems?: NavItemType[];
    /** Feature card to display. */
    featureCard?: ReactNode;
    /** Whether to show the account card. */
    showAccountCard?: boolean;
    /** Whether to hide the right side border. */
    hideBorder?: boolean;
    /** Additional CSS classes to apply to the sidebar. */
    className?: string;
    /** Whether to round the account card avatar. */
    avatarRounded?: boolean;
    /** Logo rendered above the search inputs. @default <ProperLogo> */
    logo?: ReactNode;
    /**
     * The search field(s). `true` (default) renders the built-in mobile/desktop `Input` pair,
     * `false` hides search entirely, and a `ReactNode` replaces it with custom content.
     */
    search?: boolean | ReactNode;
    /** Accessible label for the `<aside>` landmark. @default "Sidebar" */
    ariaLabel?: string;
    /** Accessible label for the search input(s), when `search` is left as its default. @default "Search" */
    searchLabel?: string;
}

export const SidebarNavigationSimple = ({
    activeUrl,
    items,
    footerItems = [],
    featureCard,
    showAccountCard = true,
    hideBorder = false,
    className,
    avatarRounded,
    logo = <ProperLogo className="h-6" />,
    search = true,
    ariaLabel = "Sidebar",
    searchLabel = "Search",
}: SidebarNavigationProps) => {
    const MAIN_SIDEBAR_WIDTH = 280;

    const content = (
        <aside
            aria-label={ariaLabel}
            style={
                {
                    "--width": `${MAIN_SIDEBAR_WIDTH}px`,
                } as CSSProperties
            }
            className={cx(
                "bg-primary flex h-full w-full max-w-full flex-col justify-between overflow-auto pt-4 lg:w-(--width) lg:pt-5",
                !hideBorder && "border-secondary md:border-e",
                className,
            )}
        >
            <div className="flex flex-col gap-5 px-4 lg:px-5">
                {logo}

                {search === true ? (
                    <>
                        {/* Mobile search input */}
                        <Input size="md" aria-label={searchLabel} placeholder={searchLabel} icon={SearchLg} className="md:hidden" />

                        {/* Desktop search input */}
                        <Input shortcut size="sm" aria-label={searchLabel} placeholder={searchLabel} icon={SearchLg} className="max-md:hidden" />
                    </>
                ) : (
                    search
                )}
            </div>

            <NavList activeUrl={activeUrl} items={items} />

            <div className="mt-auto flex flex-col gap-3 px-4 py-4 lg:py-5">
                {footerItems.length > 0 && (
                    <ul className="flex flex-col">
                        {footerItems.map((item) => (
                            <li key={item.label} className="py-px">
                                <NavItemBase badge={item.badge} icon={item.icon} href={item.href} type="link" current={item.href === activeUrl}>
                                    {item.label}
                                </NavItemBase>
                            </li>
                        ))}
                    </ul>
                )}

                {featureCard}

                {showAccountCard && <NavAccountCard avatarRounded={avatarRounded} />}
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile header navigation */}
            <MobileNavigationHeader>{content}</MobileNavigationHeader>

            {/* Desktop sidebar navigation */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:start-0 lg:flex">{content}</div>

            {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
            <div
                style={{
                    paddingLeft: MAIN_SIDEBAR_WIDTH,
                }}
                className="invisible hidden lg:sticky lg:start-0 lg:top-0 lg:bottom-0 lg:block"
            />
        </>
    );
};
