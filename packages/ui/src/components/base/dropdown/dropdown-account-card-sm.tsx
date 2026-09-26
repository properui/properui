"use client";

import { useState } from "react";
import type { Selection as AriaSelection } from "react-aria-components";
import { Button as AriaButton, SubmenuTrigger as AriaSubmenuTrigger } from "react-aria-components";
import { ChevronDown, HelpCircle, LogOut01, Moon01, Plus, Settings01, User01 } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { avatar } from "../../../utils/demo-assets";
import { Avatar } from "../avatar/avatar";
import { Dropdown } from "./dropdown";

const primaryAccount = avatar(0);
const secondaryAccount = avatar(1);

export const DropdownAccountCardSM = () => {
    const [selectedAccount, setSelectedAccount] = useState<AriaSelection>(new Set([primaryAccount.username]));
    const [selectedTheme, setSelectedTheme] = useState<AriaSelection>(new Set(["light-mode"]));

    return (
        <Dropdown.Root>
            <AriaButton
                className={({ isPressed, isFocused }) =>
                    cx(
                        "bg-primary_alt inset-ring-border-secondary outline-focus-ring relative flex w-42 cursor-pointer items-center gap-2 rounded-lg p-1.5 text-start inset-ring-1 outline-offset-2",
                        (isPressed || isFocused) && "outline-2",
                    )
                }
            >
                <Avatar border size="sm" src={primaryAccount.src} alt="" status="online" />

                <p className="text-primary text-sm font-semibold">{primaryAccount.name}</p>

                <div className="absolute end-2 top-2 flex size-7 items-center justify-center rounded-md">
                    <ChevronDown className="text-fg-quaternary size-4 shrink-0 stroke-[2.25px]" />
                </div>
            </AriaButton>

            <Dropdown.Popover className="w-60">
                <div className="border-secondary flex flex-col border-b px-4 py-3">
                    <p className="text-primary text-sm font-semibold">PRO account</p>
                    <p className="text-tertiary text-sm">{primaryAccount.email}</p>
                </div>
                <Dropdown.Menu>
                    <Dropdown.Item icon={User01} addon="⌘K->P">
                        View profile
                    </Dropdown.Item>
                    <Dropdown.Item icon={Settings01} addon="⌘S">
                        Settings
                    </Dropdown.Item>
                    <Dropdown.Section selectionMode="single" selectedKeys={selectedTheme} onSelectionChange={setSelectedTheme}>
                        <Dropdown.Item id="dark-mode" icon={Moon01} selectionIndicator="toggle">
                            Dark mode
                        </Dropdown.Item>
                    </Dropdown.Section>

                    <AriaSubmenuTrigger>
                        <Dropdown.Item icon={HelpCircle}>Support</Dropdown.Item>

                        <Dropdown.Popover placement="right top" offset={-6}>
                            <Dropdown.Menu>
                                <Dropdown.Item>Help center</Dropdown.Item>
                                <Dropdown.Item>Contact support</Dropdown.Item>
                                <Dropdown.Item>Send feedback</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </AriaSubmenuTrigger>

                    <Dropdown.Separator />

                    <Dropdown.Section selectionMode="single" selectedKeys={selectedAccount} onSelectionChange={setSelectedAccount}>
                        <Dropdown.SectionHeader className="text-brand-secondary px-4 pt-1.5 pb-0.5 text-xs font-semibold">
                            Switch Account
                        </Dropdown.SectionHeader>

                        <Dropdown.Item id={primaryAccount.username} avatarUrl={primaryAccount.src} selectionIndicator="radio">
                            {primaryAccount.name}
                        </Dropdown.Item>
                        <Dropdown.Item id={secondaryAccount.username} avatarUrl={secondaryAccount.src} selectionIndicator="radio">
                            {secondaryAccount.name}
                        </Dropdown.Item>
                    </Dropdown.Section>

                    <Dropdown.Item icon={Plus}>Add account</Dropdown.Item>

                    <Dropdown.Separator />

                    <AriaSubmenuTrigger>
                        <Dropdown.Item icon={LogOut01}>Sign out</Dropdown.Item>

                        <Dropdown.Popover placement="right top" offset={-6}>
                            <Dropdown.Menu>
                                <Dropdown.Item>Current device</Dropdown.Item>
                                <Dropdown.Item>All devices</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </AriaSubmenuTrigger>
                </Dropdown.Menu>
                <div className="border-secondary flex justify-between border-t px-4 py-3">
                    <span className="text-quaternary truncate text-sm">&copy; Proper UI</span>
                    <span className="text-quaternary text-sm">v12.6.8</span>
                </div>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};
