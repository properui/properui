"use client";

import type { ReactNode, Ref } from "react";
import {
    Button as AriaButton,
    Group as AriaGroup,
    Input as AriaInput,
    type InputProps as AriaInputProps,
    NumberField as AriaNumberField,
    type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";
import { ChevronDown, ChevronUp, Minus, Plus } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { Button } from "../buttons/button";
import { HintText } from "../input/hint-text";
import { Label } from "../input/label";

/** How the increment/decrement buttons are arranged. */
export type NumberInputButtonVariant = "stacked" | "inline";

const styles = sortCx({
    sm: "px-3 py-2 text-sm",
    md: "px-3 py-2 text-md",
    lg: "px-3.5 py-2.5 text-md",
});

export interface NumberInputBaseProps extends Omit<AriaNumberFieldProps, "children"> {
    /**
     * Input size.
     *
     * @default "md"
     */
    size?: "sm" | "md" | "lg";
    /** Placeholder text. */
    placeholder?: string;
    /** Class name for the input. */
    inputClassName?: string;
    /** Class name for the input wrapper. */
    wrapperClassName?: string;
    ref?: Ref<HTMLInputElement>;
    groupRef?: Ref<HTMLDivElement>;
    /**
     * `"stacked"` puts a chevron-up/chevron-down pair at the end of the field, like a native
     * spinner. `"inline"` puts a full-height minus button before the value and a plus button
     * after it.
     *
     * @default "stacked"
     */
    buttonVariant?: NumberInputButtonVariant;
}

export const NumberInputBase = ({
    ref,
    groupRef,
    size = "md",
    isInvalid,
    isDisabled,
    placeholder,
    wrapperClassName,
    inputClassName,
    buttonVariant = "stacked",
    // Omit this prop to avoid an invalid HTML attribute warning on the underlying `<input>`.
    isRequired: _isRequired,
    ...inputProps
}: Omit<NumberInputBaseProps, "label" | "hint">) => {
    return (
        <AriaGroup
            {...{ isDisabled, isInvalid }}
            ref={groupRef}
            className={({ isFocusWithin, isDisabled, isInvalid }) =>
                cx(
                    "bg-primary outline-primary relative flex w-full flex-row items-stretch rounded-lg shadow-xs outline-1 -outline-offset-1 transition-all duration-100 ease-linear",

                    isFocusWithin && !isDisabled && "outline-brand outline-2 -outline-offset-2",

                    // Disabled state styles
                    isDisabled && "cursor-not-allowed opacity-50 in-data-input-wrapper:opacity-100",
                    "group-disabled:cursor-not-allowed group-disabled:opacity-50 in-data-input-wrapper:group-disabled:opacity-100",

                    // Invalid state styles
                    isInvalid && "outline-error_subtle",
                    "group-invalid:outline-error_subtle",

                    // Invalid state with focus-within styles
                    isInvalid && isFocusWithin && "outline-error outline-2 -outline-offset-2",
                    isFocusWithin && "group-invalid:outline-error group-invalid:outline-2 group-invalid:-outline-offset-2",

                    wrapperClassName,
                )
            }
        >
            {buttonVariant === "inline" && (
                <Button size={size} iconLeading={Minus} slot="decrement" color="tertiary" className="static h-full rounded-e-none" />
            )}

            <AriaInput
                {...(inputProps as AriaInputProps)}
                ref={ref}
                placeholder={placeholder}
                className={cx(
                    "text-primary placeholder:text-placeholder autofill:text-primary m-0 w-full bg-transparent ring-0 outline-hidden autofill:rounded-lg disabled:cursor-not-allowed",
                    buttonVariant === "inline" && "text-center",
                    styles[size],
                    inputClassName,
                )}
            />

            {buttonVariant === "inline" && <Button size={size} iconLeading={Plus} slot="increment" color="tertiary" className="static h-full rounded-s-none" />}

            {buttonVariant === "stacked" && (
                <div className={cx("border-primary flex w-7 shrink-0 flex-col border-s", size === "lg" && "w-7.5")}>
                    <AriaButton
                        slot="increment"
                        className="text-fg-quaternary outline-brand hover:bg-primary_hover hover:text-fg-quaternary_hover flex flex-1 cursor-pointer items-center justify-center transition duration-100 ease-linear disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronUp className={cx("size-3 stroke-3", size === "lg" && "size-3.5 stroke-[2.57px]")} />
                    </AriaButton>
                    <AriaButton
                        slot="decrement"
                        className="border-primary text-fg-quaternary outline-brand hover:bg-primary_hover hover:text-fg-quaternary_hover flex flex-1 cursor-pointer items-center justify-center border-t transition duration-100 ease-linear disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronDown className={cx("size-3 stroke-3", size === "lg" && "size-3.5 stroke-[2.57px]")} />
                    </AriaButton>
                </div>
            )}
        </AriaGroup>
    );
};

NumberInputBase.displayName = "NumberInputBase";

export interface NumberInputProps extends NumberInputBaseProps {
    /** Label text for the input. */
    label?: string;
    /** Helper text displayed below the input. */
    hint?: ReactNode;
    /** Tooltip message shown via a help icon next to the label. */
    tooltip?: string;
    /** Whether to hide the required indicator from the label. */
    hideRequiredIndicator?: boolean;
}

/**
 * A numeric field built on React Aria's `NumberField`, with increment/decrement buttons, optional
 * `min`/`max`/`step` clamping, and `formatOptions` (an `Intl.NumberFormatOptions`) for currency,
 * percentage or unit display — the value itself stays a plain number regardless of formatting.
 */
export const NumberInput = ({
    size = "md",
    placeholder,
    label,
    hint,
    tooltip,
    hideRequiredIndicator,
    className,
    ref,
    groupRef,
    inputClassName,
    wrapperClassName,
    buttonVariant = "stacked",
    ...props
}: NumberInputProps) => {
    return (
        <AriaNumberField
            {...props}
            className={(state) =>
                cx("group flex h-max w-full flex-col items-start justify-start gap-1.5", typeof className === "function" ? className(state) : className)
            }
        >
            {({ isInvalid, isRequired }) => (
                <>
                    {label && (
                        <Label isRequired={hideRequiredIndicator ? !hideRequiredIndicator : isRequired} isInvalid={isInvalid} tooltip={tooltip}>
                            {label}
                        </Label>
                    )}

                    <NumberInputBase
                        {...{
                            ref,
                            groupRef,
                            size,
                            placeholder,
                            inputClassName,
                            wrapperClassName,
                            buttonVariant,
                        }}
                    />

                    {hint && (
                        <HintText isInvalid={isInvalid} className={cx(size === "sm" && "text-xs")}>
                            {hint}
                        </HintText>
                    )}
                </>
            )}
        </AriaNumberField>
    );
};

NumberInput.displayName = "NumberInput";
