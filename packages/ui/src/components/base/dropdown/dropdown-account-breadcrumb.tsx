"use client";

import { useState } from "react";
import { Button as AriaButton, MenuItem as AriaMenuItem } from "react-aria-components";
import { ChevronSelectorVertical } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { avatar } from "../../../utils/demo-assets";
import { Avatar } from "../avatar/avatar";
import { RadioButtonBase } from "../radio-buttons/radio-buttons";
import { Dropdown } from "./dropdown";

const accounts = [
    { id: avatar(0).username, name: avatar(0).name, email: avatar(0).email, src: avatar(0).src },
    { id: avatar(1).username, name: avatar(1).name, email: avatar(1).email, src: avatar(1).src },
] as const;

export const DropdownAccountBreadcrumb = () => {
    const [selectedAccountKey, setSelectedAccountKey] = useState<string>(accounts[0].id);

    const selectedAccount = accounts.find((account) => account.id === selectedAccountKey);

    return (
        <Dropdown.Root>
            <AriaButton
                className={({ isPressed, isFocusVisible }) =>
                    cx(
                        "outline-focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg outline-0 outline-offset-2",
                        (isPressed || isFocusVisible) && "outline-2",
                    )
                }
            >
                <div className="bg-primary ring-secondary flex rounded-lg p-0.5 ring-[0.5px] ring-inset">
                    <Avatar size="xs" src={selectedAccount?.src} alt="" className="shadow-md" contentClassName="rounded-md before:hidden" />
                </div>
                <span className="text-primary text-sm font-semibold">{selectedAccount?.name}</span>

                <ChevronSelectorVertical className="text-fg-quaternary size-3 shrink-0 stroke-3" />
            </AriaButton>

            <Dropdown.Popover className="w-62" placement="bottom left">
                <Dropdown.Menu
                    disallowEmptySelection
                    selectionMode="single"
                    selectedKeys={[selectedAccountKey]}
                    onSelectionChange={(keys) => setSelectedAccountKey(Array.from(keys).join())}
                    className="flex flex-col gap-1 px-1.5 py-1.5"
                >
                    {accounts.map((account) => (
                        <AriaMenuItem
                            id={account.id}
                            key={account.name}
                            textValue={account.name}
                            className={(state) =>
                                cx(
                                    "outline-focus-ring hover:bg-primary_hover relative w-full cursor-pointer rounded-md px-2 py-2 text-start transition duration-100 ease-linear focus:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                                    state.isSelected && "bg-primary_hover",
                                )
                            }
                        >
                            {({ isSelected }) => (
                                <>
                                    <figure className="group flex min-w-0 flex-1 items-center gap-1.5">
                                        <div className="bg-primary ring-secondary flex rounded-[10px] p-0.5 ring-[0.5px] ring-inset">
                                            <Avatar size="sm" src={account.src} alt="" className="shadow-md" contentClassName="rounded-lg before:hidden" />
                                        </div>
                                        <figcaption className="min-w-0 flex-1">
                                            <p className="text-primary text-sm font-semibold">{account.name}</p>
                                            <p className="text-tertiary truncate text-sm">{account.email}</p>
                                        </figcaption>
                                    </figure>
                                    <RadioButtonBase isSelected={isSelected} className="absolute end-2 top-2" />
                                </>
                            )}
                        </AriaMenuItem>
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};
