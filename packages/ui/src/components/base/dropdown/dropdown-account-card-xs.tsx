"use client";

import { useState } from "react";
import type { Selection as AriaSelection } from "react-aria-components";
import { Button as AriaButton, SubmenuTrigger as AriaSubmenuTrigger } from "react-aria-components";
import { ChevronDown, LogOut01, Moon01, Plus, Settings01 } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { avatar } from "../../../utils/demo-assets";
import { Avatar } from "../avatar/avatar";
import { Dropdown } from "./dropdown";

const primaryAccount = avatar(0);
const secondaryAccount = avatar(1);

export const DropdownAccountCardXS = () => {
    const [selectedAccount, setSelectedAccount] = useState<AriaSelection>(new Set([primaryAccount.username]));
    const [selectedTheme, setSelectedTheme] = useState<AriaSelection>(new Set(["light-mode"]));

    return (
        <Dropdown.Root>
            <AriaButton
                className={({ isPressed, isFocused }) =>
                    cx(
                        "bg-primary_alt inset-ring-border-secondary outline-focus-ring relative flex w-38 cursor-pointer items-center gap-1.5 rounded-lg p-2 text-start inset-ring-1 outline-offset-2",
                        (isPressed || isFocused) && "outline-2",
                    )
                }
            >
                <Avatar size="xs" src={primaryAccount.src} alt="" className="size-5" />

                <p className="text-primary text-sm font-semibold">{primaryAccount.name}</p>

                <div className="absolute end-1 top-1 flex size-7 items-center justify-center rounded-md">
                    <ChevronDown className="text-fg-quaternary size-4 shrink-0 stroke-[2.25px]" />
                </div>
            </AriaButton>

            <Dropdown.Popover className="w-50">
                <Dropdown.Menu>
                    <Dropdown.Item icon={Settings01} addon="⌘S">
                        Settings
                    </Dropdown.Item>
                    <Dropdown.Section selectionMode="single" selectedKeys={selectedTheme} onSelectionChange={setSelectedTheme}>
                        <Dropdown.Item id="dark-mode" icon={Moon01} selectionIndicator="toggle">
                            Dark mode
                        </Dropdown.Item>
                    </Dropdown.Section>

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
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};
