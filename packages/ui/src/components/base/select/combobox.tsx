"use client";

import type { FC, FocusEventHandler, PointerEventHandler, ReactNode, Ref, RefAttributes } from "react";
import { isValidElement, useCallback, useContext, useRef, useState } from "react";
import type { ComboBoxProps as AriaComboBoxProps, GroupProps as AriaGroupProps, ListBoxProps as AriaListBoxProps } from "react-aria-components";
import {
    ComboBox as AriaComboBox,
    ComboBoxStateContext as AriaComboBoxStateContext,
    Group as AriaGroup,
    Input as AriaInput,
    ListBox as AriaListBox,
} from "react-aria-components";
import { SearchLg } from "@properui/icons";
import { useResizeObserver } from "../../../hooks/use-resize-observer";
import { cx } from "../../../utils/cx";
import { isReactComponent } from "../../../utils/is-react-component";
import { HintText } from "../input/hint-text";
import { Label } from "../input/label";
import { Popover } from "./popover";
import { type CommonProps, SelectContext, type SelectItemType, sizes } from "./select-shared";

interface ComboBoxProps extends Omit<AriaComboBoxProps<SelectItemType>, "children" | "items">, RefAttributes<HTMLDivElement>, CommonProps {
    shortcut?: boolean;
    items?: SelectItemType[];
    popoverClassName?: string;
    shortcutClassName?: string;
    /** Leading icon component displayed before the input. */
    icon?: FC | ReactNode;
    children: AriaListBoxProps<SelectItemType>["children"];
    /**
     * What interaction opens the popover.
     *
     * - `"focus"` (default here) opens it as soon as the input is focused.
     * - `"input"` opens it only once the user starts typing.
     * - `"manual"` never opens it automatically — useful paired with a controlled `isOpen`.
     *
     * @default "focus"
     */
    menuTrigger?: "focus" | "input" | "manual";
    /**
     * Whether the popover stays open (showing an empty state) when no items match instead of
     * closing itself.
     */
    allowsEmptyCollection?: boolean;
}

interface ComboBoxValueProps extends AriaGroupProps {
    size: "sm" | "md" | "lg";
    shortcut: boolean;
    placeholder?: string;
    shortcutClassName?: string;
    icon?: FC | ReactNode;
    onFocus?: FocusEventHandler;
    onPointerEnter?: PointerEventHandler;
    ref?: Ref<HTMLDivElement>;
}

const ComboBoxValue = ({ size, shortcut, placeholder, shortcutClassName, icon: IconProp, ref, ...otherProps }: ComboBoxValueProps) => {
    const state = useContext(AriaComboBoxStateContext);

    const value = state?.selectedItem?.value || null;
    const inputValue = state?.inputValue || null;

    const first = inputValue?.split(value?.supportingText)?.[0] || "";
    const last = inputValue?.split(first)[1];

    return (
        <AriaGroup
            ref={ref}
            {...otherProps}
            className={({ isFocusWithin, isDisabled }) =>
                cx(
                    "bg-primary ring-primary relative flex w-full items-center gap-2 rounded-lg shadow-xs ring-1 outline-hidden transition-shadow duration-100 ease-linear ring-inset",
                    isDisabled && "cursor-not-allowed opacity-50",
                    isFocusWithin && "ring-brand ring-2",

                    // Icon styles
                    "*:data-icon:text-fg-quaternary *:data-icon:shrink-0",

                    sizes[size].root,
                )
            }
        >
            {isReactComponent(IconProp) ? (
                <IconProp data-icon className="pointer-events-none" aria-hidden="true" />
            ) : isValidElement(IconProp) ? (
                IconProp
            ) : (
                <SearchLg data-icon className="pointer-events-none" aria-hidden="true" />
            )}

            <div className="relative flex w-full items-center">
                {inputValue && (
                    <span className={cx("absolute top-1/2 z-0 inline-flex w-full -translate-y-1/2 truncate", sizes[size].textContainer)} aria-hidden="true">
                        <p className={cx("text-primary font-medium", sizes[size].text)}>{first}</p>
                        {last && <p className={cx("text-tertiary -ms-0.75", sizes[size].text)}>{last}</p>}
                    </span>
                )}

                <AriaInput
                    placeholder={placeholder}
                    className={cx(
                        "caret-alpha-black/90 placeholder:text-placeholder z-10 w-full appearance-none bg-transparent text-transparent focus:outline-hidden disabled:cursor-not-allowed",
                        sizes[size].text,
                    )}
                />
            </div>

            {shortcut && (
                <div
                    className={cx(
                        "to-bg-primary absolute inset-y-0.5 end-0.5 z-10 hidden items-center rounded-e-[inherit] bg-linear-to-r from-transparent to-40% ps-8 md:flex",
                        sizes[size].shortcut,
                        shortcutClassName,
                    )}
                >
                    <span
                        className="text-quaternary ring-secondary pointer-events-none rounded px-1 py-px text-xs font-medium ring-1 select-none ring-inset"
                        aria-hidden="true"
                    >
                        ⌘K
                    </span>
                </div>
            )}
        </AriaGroup>
    );
};

/**
 * `ComboBox` still filters its items with React Aria's own `contains` matcher, even though this
 * component narrows `items` for you — passing an already-filtered (e.g. app-side, diacritics- or
 * fuzzy-matched) list does *not* opt out of it, and the built-in filter can filter that list down
 * to zero results. Pass `defaultFilter={() => true}` to disable RAC's filtering and rely entirely
 * on the `items`/`inputValue` you control.
 *
 * To open the popover in a jsdom test, see the Testing page (`docs/testing`):
 * `fireEvent.click(trigger)` or `focus` + `ArrowDown` — `userEvent.click` alone toggles it shut,
 * because it fires both a focus and a click in the same tick.
 */
export const ComboBox = ({
    placeholder = "Search",
    shortcut = true,
    size = "md",
    children,
    items,
    shortcutClassName,
    icon,
    hideRequiredIndicator,
    menuTrigger = "focus",
    ...otherProps
}: ComboBoxProps) => {
    const placeholderRef = useRef<HTMLDivElement>(null);
    const [popoverWidth, setPopoverWidth] = useState("");

    // Resize observer for popover width
    const onResize = useCallback(() => {
        if (!placeholderRef.current) return;

        const divRect = placeholderRef.current?.getBoundingClientRect();

        setPopoverWidth(divRect.width + "px");
    }, [placeholderRef, setPopoverWidth]);

    useResizeObserver({
        ref: placeholderRef,
        box: "border-box",
        onResize,
    });

    return (
        <SelectContext.Provider value={{ size }}>
            <AriaComboBox menuTrigger={menuTrigger} {...otherProps}>
                {(state) => (
                    <div className="flex flex-col gap-1.5">
                        {otherProps.label && (
                            <Label isRequired={hideRequiredIndicator ? false : state.isRequired} tooltip={otherProps.tooltip}>
                                {otherProps.label}
                            </Label>
                        )}

                        <ComboBoxValue
                            ref={placeholderRef}
                            placeholder={placeholder}
                            shortcut={shortcut}
                            shortcutClassName={shortcutClassName}
                            icon={icon}
                            size={size}
                            // This is a workaround to correctly calculating the trigger width
                            // while using ResizeObserver wasn't 100% reliable.
                            onFocus={onResize}
                            onPointerEnter={onResize}
                        />

                        <Popover size={size} triggerRef={placeholderRef} style={{ width: popoverWidth }} className={otherProps.popoverClassName}>
                            <AriaListBox items={items} className="size-full outline-hidden">
                                {children}
                            </AriaListBox>
                        </Popover>

                        {otherProps.hint && (
                            <HintText isInvalid={state.isInvalid} className={cx(size === "sm" && "text-xs")}>
                                {otherProps.hint}
                            </HintText>
                        )}
                    </div>
                )}
            </AriaComboBox>
        </SelectContext.Provider>
    );
};
