"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import { Button as AriaButton, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { DotsVertical, LifeBuoy01, Settings01 } from "@properui/icons";
import { cx } from "../../../../utils/cx";
import { avatar } from "../../../../utils/demo-assets";
import { Avatar } from "../../../base/avatar/avatar";
import { ButtonUtility } from "../../../base/buttons/button-utility";
import { ProperLogo } from "../../../foundations/logo/proper-logo";
import { ProperLogoMinimal } from "../../../foundations/logo/proper-logo-minimal";
import { MobileNavigationHeader } from "../base-components/mobile-header";
import { NavAccountCard, NavAccountMenu } from "../base-components/nav-account-card";
import { NavButton } from "../base-components/nav-button";
import { NavItemBase } from "../base-components/nav-item";
import { NavList } from "../base-components/nav-list";
import type { NavItemType } from "../config";

const account = avatar(0);

export interface SidebarNavigationSlimProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: (NavItemType & { icon: FC<{ className?: string }> })[];
    /** List of footer items to display. */
    footerItems?: (NavItemType & { icon: FC<{ className?: string }> })[];
    /** Whether to hide the border. */
    hideBorder?: boolean;
    /** Whether to hide the right side border. */
    hideRightBorder?: boolean;
    /** Logo rendered in the desktop rail. @default <ProperLogoMinimal> */
    logo?: ReactNode;
    /** Logo rendered in the mobile header/menu. @default <ProperLogo> */
    mobileLogo?: ReactNode;
    /** Accessible label for the desktop `<aside>` landmark. @default "Sidebar" */
    ariaLabel?: string;
}

export const SidebarNavigationSlim = ({
    activeUrl,
    items,
    footerItems = [],
    hideBorder,
    hideRightBorder,
    logo = <ProperLogoMinimal className="size-6" />,
    mobileLogo = <ProperLogo className="h-6" />,
    ariaLabel = "Sidebar",
}: SidebarNavigationSlimProps) => {
    const activeItem = [...items, ...footerItems].find((item) => item.href === activeUrl || item.items?.some((subItem) => subItem.href === activeUrl));
    const [currentItem, setCurrentItem] = useState(activeItem ?? items[1] ?? items[0]);
    const [isHovering, setIsHovering] = useState(false);

    const isSecondarySidebarVisible = isHovering && Boolean(currentItem?.items?.length);

    const MAIN_SIDEBAR_WIDTH = 68;
    const SECONDARY_SIDEBAR_WIDTH = 256;

    const mainSidebar = (
        <aside
            aria-label={ariaLabel}
            style={{
                width: MAIN_SIDEBAR_WIDTH,
            }}
            className={cx(
                "group flex h-full max-h-full max-w-full overflow-y-auto py-1 ps-1 transition duration-100 ease-linear",
                isSecondarySidebarVisible && "bg-primary",
            )}
        >
            <div
                className={cx(
                    "bg-primary ring-secondary flex w-auto flex-col justify-between rounded-xl pt-5 ring-1 transition duration-300 ring-inset",
                    hideBorder && !isSecondarySidebarVisible && "ring-transparent",
                )}
            >
                <div className="flex justify-center px-3">{logo}</div>

                <ul className="mt-5 flex flex-col gap-0.5 px-3.5">
                    {items.map((item) => (
                        <li key={item.label}>
                            <NavButton
                                current={currentItem?.href === item.href}
                                href={item.href}
                                label={item.label || ""}
                                icon={item.icon}
                                onClick={() => setCurrentItem(item)}
                            />
                        </li>
                    ))}
                </ul>
                <div className="mt-auto flex flex-col items-center gap-3 px-3 py-4">
                    {footerItems.length > 0 && (
                        <ul className="flex flex-col gap-0.5">
                            {footerItems.map((item) => (
                                <li key={item.label}>
                                    <NavButton
                                        current={currentItem?.href === item.href}
                                        label={item.label || ""}
                                        href={item.href}
                                        icon={item.icon}
                                        onClick={() => setCurrentItem(item)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    <AriaDialogTrigger>
                        <AriaButton
                            aria-label="Open account menu"
                            className={({ isPressed, isFocused }) =>
                                cx("group relative inline-flex rounded-full", (isPressed || isFocused) && "outline-focus-ring outline-2 outline-offset-2")
                            }
                        >
                            <Avatar border status="online" src={account.src} size="md" alt={account.name} />
                        </AriaButton>
                        <AriaPopover
                            placement="right bottom"
                            offset={8}
                            crossOffset={6}
                            className={({ isEntering, isExiting }) =>
                                cx(
                                    "will-change-transform",
                                    isEntering &&
                                        "animate-in fade-in placement-right:slide-in-from-left-2 placement-top:slide-in-from-bottom-2 placement-bottom:slide-in-from-top-2 duration-300 ease-out",
                                    isExiting &&
                                        "animate-out fade-out placement-right:slide-out-to-left-2 placement-top:slide-out-to-bottom-2 placement-bottom:slide-out-to-top-2 duration-150 ease-in",
                                )
                            }
                        >
                            <NavAccountMenu />
                        </AriaPopover>
                    </AriaDialogTrigger>
                </div>
            </div>
        </aside>
    );

    const secondarySidebar = currentItem && (
        <div
            inert={!isSecondarySidebarVisible}
            aria-hidden={!isSecondarySidebarVisible}
            style={{ width: isSecondarySidebarVisible ? SECONDARY_SIDEBAR_WIDTH : 0 }}
            className={cx(
                "bg-primary relative h-full overflow-x-hidden overflow-y-auto border-transparent transition-[width,border-color] duration-300 ease-out",
                !(hideBorder || hideRightBorder) && "box-content border-e-[1.5px]",
                isSecondarySidebarVisible && !(hideBorder || hideRightBorder) && "border-secondary",
            )}
        >
            <div style={{ width: SECONDARY_SIDEBAR_WIDTH }} className="flex h-full flex-col px-4 pt-6">
                <h3 className="text-brand-secondary text-sm font-semibold">{currentItem.label}</h3>
                <ul className="py-2">
                    {currentItem.items?.map((item) => (
                        <li key={item.label} className="py-px">
                            <NavItemBase current={activeUrl === item.href} href={item.href} icon={item.icon} badge={item.badge} type="link">
                                {item.label}
                            </NavItemBase>
                        </li>
                    ))}
                </ul>
                <div className="bg-primary sticky bottom-0 mt-auto flex justify-between pb-5">
                    <div>
                        <p className="text-primary text-sm font-semibold">{account.name}</p>
                        <p className="text-tertiary text-sm">{account.email}</p>
                    </div>
                    <div className="absolute end-0 -top-1">
                        <ButtonUtility size="xs" color="tertiary" tooltip="Log out" icon={DotsVertical} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar navigation */}
            <div
                className="z-50 hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex"
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
            >
                {mainSidebar}
                {secondarySidebar}
            </div>

            {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
            <div
                style={{
                    paddingLeft: MAIN_SIDEBAR_WIDTH,
                }}
                className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"
            />

            {/* Mobile header navigation */}
            <MobileNavigationHeader logo={mobileLogo}>
                <aside
                    aria-label="Mobile sidebar"
                    className="group bg-primary flex h-full max-h-full w-full max-w-full flex-col justify-between overflow-y-auto pt-4"
                >
                    <div className="px-4">{mobileLogo}</div>

                    <NavList items={items} />

                    <div className="mt-auto flex flex-col gap-3 p-4">
                        <div className="flex flex-col">
                            <NavItemBase current={activeUrl === "/support"} type="link" href="/support" icon={LifeBuoy01}>
                                Support
                            </NavItemBase>
                            <NavItemBase current={activeUrl === "/settings"} type="link" href="/settings" icon={Settings01}>
                                Settings
                            </NavItemBase>
                        </div>

                        <NavAccountCard />
                    </div>
                </aside>
            </MobileNavigationHeader>
        </>
    );
};
