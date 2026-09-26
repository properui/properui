"use client";

import { type Key, type ReactNode, createContext, useContext, useState } from "react";
import {
    Button as AriaButton,
    type MenuProps as AriaMenuProps,
    MenuTrigger as AriaMenuTrigger,
    SubmenuTrigger as AriaSubmenuTrigger,
    Toolbar as AriaToolbar,
    type ToolbarProps as AriaToolbarProps,
} from "react-aria-components";
import { cx } from "../../../utils/cx";
import { Dropdown } from "../dropdown/dropdown";

interface MenubarContextValue {
    /** The id of the currently open top-level menu, or `null` when the bar is closed. */
    openId: Key | null;
    setOpenId: (id: Key | null) => void;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);

const useMenubarContext = () => {
    const context = useContext(MenubarContext);
    if (!context) throw new Error("Menubar.Menu must be rendered inside a Menubar.");
    return context;
};

export interface MenubarProps extends Omit<AriaToolbarProps, "orientation" | "children" | "className"> {
    /** Accessible name for the menu bar, e.g. `"Main menu"`. */
    "aria-label": string;
    /** `Menubar.Menu` entries, one per top-level menu (`File`, `Edit`, `View`, …). */
    children: ReactNode;
    /** Additional classes merged onto the root element. */
    className?: string;
}

/**
 * An application-style menu bar — `File`, `Edit`, `View` — built from React Aria's `Toolbar` for
 * roving-tabindex arrow-key navigation between the top-level menus, and `MenuTrigger`/`Menu` (the
 * same primitives `Dropdown` uses) for each one's contents. Once a menu is open, hovering a
 * sibling trigger switches straight to it, the way a native application menu bar or a browser's
 * own menu behaves.
 */
const MenubarRoot = ({ "aria-label": ariaLabel, className, children, ...props }: MenubarProps) => {
    const [openId, setOpenId] = useState<Key | null>(null);

    return (
        <MenubarContext.Provider value={{ openId, setOpenId }}>
            <AriaToolbar
                {...props}
                aria-label={ariaLabel}
                orientation="horizontal"
                className={cx("bg-primary ring-secondary flex w-max items-center gap-0.5 rounded-lg p-1 shadow-xs ring-1 ring-inset", className)}
            >
                {children}
            </AriaToolbar>
        </MenubarContext.Provider>
    );
};

export interface MenubarMenuProps<T extends object> extends Omit<AriaMenuProps<T>, "children" | "className"> {
    /** A unique id for this top-level menu, e.g. `"file"`. */
    id: string;
    /** The visible label of the top-level trigger, e.g. `"File"`. */
    label: ReactNode;
    /** Whether the whole menu — trigger and items — is disabled. */
    isDisabled?: boolean;
    /**
     * `Menubar.Item`/`Menubar.Section`/`Menubar.Separator` entries, or a `Menubar.SubmenuTrigger`
     * wrapping a nested `Menubar.Menu`-style popover for a submenu.
     */
    children: AriaMenuProps<T>["children"];
    /** Additional classes merged onto this menu's popover surface. */
    popoverClassName?: string;
}

const MenubarMenu = <T extends object>({ id, label, isDisabled, children, popoverClassName, ...menuProps }: MenubarMenuProps<T>) => {
    const { openId, setOpenId } = useMenubarContext();
    const isOpen = openId === id;

    return (
        <AriaMenuTrigger isOpen={isOpen} onOpenChange={(next) => setOpenId(next ? id : null)}>
            <AriaButton
                isDisabled={isDisabled}
                // Once some other menu in this bar is open, hovering a sibling trigger switches to
                // it immediately, without requiring a press — matching a native application menu bar.
                onHoverStart={() => {
                    if (openId !== null && openId !== id) setOpenId(id);
                }}
                className={(state) =>
                    cx(
                        "text-secondary outline-focus-ring cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition duration-100 ease-linear",
                        !state.isDisabled && "hover:bg-primary_hover hover:text-secondary_hover",
                        (state.isPressed || isOpen) && "bg-primary_hover text-secondary_hover",
                        state.isFocusVisible && "outline-2 outline-offset-2",
                        state.isDisabled && "cursor-not-allowed opacity-50",
                    )
                }
            >
                {label}
            </AriaButton>

            <Dropdown.Popover placement="bottom start" className={popoverClassName}>
                <Dropdown.Menu aria-label={typeof label === "string" ? label : undefined} {...menuProps}>
                    {children}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </AriaMenuTrigger>
    );
};

export const Menubar = Object.assign(MenubarRoot, {
    /** A top-level menu, e.g. `File` — a `Menubar.Item` trigger plus its `Dropdown.Menu` of contents. */
    Menu: MenubarMenu,
    Item: Dropdown.Item,
    Section: Dropdown.Section,
    SectionHeader: Dropdown.SectionHeader,
    Separator: Dropdown.Separator,
    /**
     * Wraps a `Menubar.Item` (the trigger) and a `Dropdown.Popover` containing a plain
     * `Dropdown.Menu`, for a submenu — identical to how `Dropdown` itself nests submenus, since
     * both are built on the same React Aria `Menu`/`Popover` primitives.
     */
    SubmenuTrigger: AriaSubmenuTrigger,
});
