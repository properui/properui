"use client";

import { type ComponentType, type HTMLAttributes, type ReactNode, type Ref, createContext, useContext } from "react";
import type { DateInputProps as AriaDateInputProps } from "react-aria-components";
import {
    DateField as AriaDateField,
    type DateFieldProps as AriaDateFieldProps,
    DateInput as AriaDateInput,
    DateSegment as AriaDateSegment,
    type DateValue as AriaDateValue,
    Group as AriaGroup,
} from "react-aria-components";
import { HelpCircle, InfoCircle } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { Tooltip, TooltipTrigger } from "../tooltip/tooltip";
import { HintText } from "./hint-text";
import { Label } from "./label";

const DateFieldContext = createContext<{
    size?: "sm" | "md" | "lg";
    wrapperClassName?: string;
    iconClassName?: string;
    tooltipClassName?: string;
    inputClassName?: string;
}>({});

export interface InputDateBaseProps extends Omit<AriaDateInputProps, "children"> {
    /** Tooltip message on hover. */
    tooltip?: string;
    /**
     * Input size.
     * @default "sm"
     */
    size?: "sm" | "md" | "lg";
    /** Placeholder text. */
    placeholder?: string;
    /** Class name for the icon. */
    iconClassName?: string;
    /** Class name for the input wrapper. */
    wrapperClassName?: string;
    /** Class name for the tooltip. */
    tooltipClassName?: string;
    /** Keyboard shortcut to display. */
    shortcut?: string | boolean;
    ref?: Ref<HTMLInputElement>;
    groupRef?: Ref<HTMLDivElement>;
    /** Icon component to display on the left side of the input. */
    icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
    isInvalid?: boolean;
    isDisabled?: boolean;
}

export const InputDateBase = ({
    tooltip,
    shortcut,
    groupRef,
    size = "md",
    isInvalid,
    isDisabled,
    icon: Icon,
    wrapperClassName,
    tooltipClassName,
    iconClassName,
    ...inputProps
}: Omit<InputDateBaseProps, "label" | "hint">) => {
    // Check if the input has a leading icon or tooltip
    const hasTrailingIcon = tooltip || isInvalid;
    const hasLeadingIcon = Icon;

    // If the input is inside a `TextFieldContext`, use its context to simplify applying styles
    const context = useContext(DateFieldContext);

    const inputSize = context?.size || size;

    const sizes = sortCx({
        sm: {
            root: cx("px-3 py-2 text-sm", hasTrailingIcon && "pe-9", hasLeadingIcon && "ps-8.5"),
            iconLeading: "start-3 size-4 stroke-[2.25px]",
            iconTrailing: "end-3",
            shortcut: "pe-2.5",
        },
        md: {
            root: cx("px-3 py-2 text-md", hasTrailingIcon && "pe-9", hasLeadingIcon && "ps-10"),
            iconLeading: "start-3 size-5",
            iconTrailing: "end-3",
            shortcut: "pe-2.5",
        },
        lg: {
            root: cx("px-3.5 py-2.5 text-md", hasTrailingIcon && "pe-9.5", hasLeadingIcon && "ps-10.5"),
            iconLeading: "start-3.5 size-5",
            iconTrailing: "end-3.5",
            shortcut: "pe-3",
        },
    });

    return (
        <AriaGroup
            {...{ isDisabled, isInvalid }}
            ref={groupRef}
            className={({ isFocusWithin, isDisabled, isInvalid }) =>
                cx(
                    "group/input bg-primary ring-primary relative flex w-full flex-row place-content-center place-items-center rounded-lg shadow-xs ring-1 transition-shadow duration-100 ease-linear ring-inset",

                    isFocusWithin && !isDisabled && "ring-brand ring-2",

                    // Disabled state styles
                    isDisabled && "cursor-not-allowed opacity-50 in-data-input-wrapper:opacity-100",
                    "group-disabled:cursor-not-allowed group-disabled:opacity-50 in-data-input-wrapper:group-disabled:opacity-100",

                    // Invalid state styles
                    isInvalid && "ring-error_subtle",
                    "group-invalid:ring-error_subtle",

                    // Invalid state with focus-within styles
                    isInvalid && isFocusWithin && "ring-error ring-2",
                    isFocusWithin && "group-invalid:ring-error group-invalid:ring-2",

                    context?.wrapperClassName,
                    wrapperClassName,
                )
            }
        >
            {/* Leading icon and Payment icon */}
            {Icon && (
                <Icon className={cx("text-fg-quaternary pointer-events-none absolute", sizes[inputSize].iconLeading, context?.iconClassName, iconClassName)} />
            )}

            {/* Input field */}
            <AriaDateInput {...inputProps} className={cx("flex w-full", sizes[size].root, typeof inputProps.className === "string" && inputProps.className)}>
                {(segment) => (
                    <AriaDateSegment
                        segment={segment}
                        className={cx(
                            "text-primary focus:bg-brand-solid rounded px-0.5 tabular-nums caret-transparent focus:font-medium focus:text-white focus:outline-hidden",
                            // The placeholder segment.
                            segment.isPlaceholder && "text-placeholder uppercase",
                            // The separator "/" segment.
                            segment.type === "literal" && "text-fg-quaternary",
                        )}
                    />
                )}
            </AriaDateInput>

            {/* Tooltip and help icon */}
            {tooltip && (
                <Tooltip title={tooltip} placement="top">
                    <TooltipTrigger
                        aria-label="More information"
                        className={cx(
                            "text-fg-quaternary hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover absolute cursor-pointer transition duration-200 group-invalid/input:hidden",
                            sizes[inputSize].iconTrailing,
                            context?.tooltipClassName,
                            tooltipClassName,
                        )}
                    >
                        <HelpCircle className="size-4 stroke-[2.25px]" />
                    </TooltipTrigger>
                </Tooltip>
            )}

            {/* Invalid icon */}
            <InfoCircle
                className={cx(
                    "text-fg-error-secondary pointer-events-none absolute hidden size-4 stroke-[2.25px] group-invalid/input:block",
                    sizes[inputSize].iconTrailing,
                    context?.tooltipClassName,
                    tooltipClassName,
                )}
            />

            {/* Shortcut */}
            {shortcut && (
                <div
                    className={cx(
                        "to-bg-primary pointer-events-none absolute inset-y-0.5 end-0.5 z-10 flex items-center rounded-e-[inherit] bg-linear-to-r from-transparent to-40% ps-8",
                        sizes[inputSize].shortcut,
                    )}
                >
                    <span
                        aria-hidden="true"
                        className="text-quaternary ring-secondary pointer-events-none rounded px-1 py-px text-xs font-medium ring-1 select-none ring-inset"
                    >
                        {typeof shortcut === "string" ? shortcut : "⌘K"}
                    </span>
                </div>
            )}
        </AriaGroup>
    );
};

interface InputProps
    extends
        AriaDateFieldProps<AriaDateValue>,
        Pick<
            InputDateBaseProps,
            "ref" | "size" | "placeholder" | "icon" | "shortcut" | "tooltip" | "groupRef" | "iconClassName" | "wrapperClassName" | "tooltipClassName"
        > {
    /** Label text for the input */
    label?: string;
    /** Helper text displayed below the input */
    hint?: ReactNode;
    /** Whether to hide required indicator from label */
    hideRequiredIndicator?: boolean;
    /** Class name for the input. */
    inputClassName?: string;
}

export const InputDate = ({
    size = "md",
    placeholder,
    icon: Icon,
    label,
    hint,
    shortcut,
    hideRequiredIndicator,
    className,
    ref,
    groupRef,
    tooltip,
    iconClassName,
    inputClassName,
    wrapperClassName,
    tooltipClassName,
    ...props
}: InputProps) => {
    return (
        <AriaDateField
            {...props}
            className={(state) =>
                cx("group flex h-max w-full flex-col items-start justify-start gap-1.5", typeof className === "function" ? className(state) : className)
            }
        >
            {({ isInvalid, state }) => (
                <>
                    {label && (
                        <Label isRequired={hideRequiredIndicator ? !hideRequiredIndicator : state.isRequired} isInvalid={isInvalid}>
                            {label}
                        </Label>
                    )}

                    <InputDateBase
                        className={inputClassName}
                        {...{
                            ref,
                            groupRef,
                            size,
                            placeholder,
                            icon: Icon,
                            shortcut,
                            iconClassName,
                            wrapperClassName,
                            tooltipClassName,
                            tooltip,
                        }}
                    />

                    {hint && (
                        <HintText isInvalid={isInvalid} className={cx(size === "sm" && "text-xs")}>
                            {hint}
                        </HintText>
                    )}
                </>
            )}
        </AriaDateField>
    );
};
