"use client";

import type { FC, ReactNode } from "react";
import { isValidElement } from "react";
import type { Key } from "react-aria";
import type { PopoverProps as AriaPopoverProps } from "react-aria-components";
import {
    Button as AriaButton,
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    Popover as AriaPopover,
    Select as AriaSelect,
    SelectValue as AriaSelectValue,
    Text as AriaText,
} from "react-aria-components";
import { Check, ChevronDown } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { isReactComponent } from "../../../utils/is-react-component";
import { Badge } from "../../base/badges/badges";

export const styles = sortCx({
    root: "flex min-w-0",
    trigger: [
        "text-secondary outline-focus-ring flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold transition duration-100 ease-linear",
        "hover:bg-primary_hover hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    icon: "text-fg-quaternary size-4 shrink-0",
    popover: {
        root: "bg-primary ring-secondary_alt w-72 origin-(--trigger-anchor-point) overflow-y-auto rounded-lg py-1 shadow-lg ring-1 outline-hidden will-change-transform",
        entering: "animate-in fade-in duration-150 ease-out",
        exiting: "animate-out fade-out duration-100 ease-in",
    },
    item: "px-1.5 py-px outline-hidden",
    itemInner: "flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 transition duration-100 ease-linear",
    itemIcon: "text-fg-quaternary mt-0.5 flex size-5 shrink-0 items-center justify-center *:size-5",
    itemName: "text-primary truncate text-sm font-semibold",
    itemDescription: "text-tertiary text-sm",
    check: "text-fg-brand-primary mt-0.5 size-4 shrink-0",
});

/** A badge on a model, e.g. `Fast` or `Reasoning`. */
export interface AIModelBadge {
    /** Text of the badge. */
    label: string;
    /** Colour of the badge. @default "gray" */
    color?: "gray" | "brand" | "success" | "warning" | "error";
}

/** One selectable model. */
export interface AIModel {
    /** Unique identifier, passed to `onChange`. */
    id: string;
    /** Display name, e.g. `Large 2`. */
    name: string;
    /** Provider or family, announced with the name. */
    provider?: string;
    /** One line on what the model is good at. */
    description?: string;
    /** Provider logo or icon: a component reference or an element. */
    icon?: FC<{ className?: string }> | ReactNode;
    /** Short badges shown beside the name. Strings render as gray badges. */
    badges?: (string | AIModelBadge)[];
    /** Whether the model can be picked. */
    isDisabled?: boolean;
}

const renderIcon = (icon: AIModel["icon"], className: string) => {
    if (isReactComponent(icon)) {
        const Icon = icon as FC<{ className?: string }>;
        return <Icon aria-hidden="true" className={className} />;
    }
    if (isValidElement(icon)) {
        return (
            <span aria-hidden="true" className={className}>
                {icon}
            </span>
        );
    }
    return null;
};

export interface AIModelSelectorProps {
    /** The models to offer, in order. */
    models: AIModel[];
    /** The selected model's `id` (controlled). */
    value?: string | null;
    /** The initially selected model's `id` (uncontrolled). Defaults to the first model. */
    defaultValue?: string;
    /** Called with the newly selected model's `id`. */
    onChange?: (value: string) => void;
    /** Accessible name of the selector. @default "Model" */
    "aria-label"?: string;
    /** Whether the selector is disabled. */
    isDisabled?: boolean;
    /** Placement of the list relative to the trigger. @default "top start" */
    placement?: AriaPopoverProps["placement"];
    /** Additional classes merged onto the root. */
    className?: string;
}

/**
 * A compact model picker for a prompt input's toolbar: the selected model's icon and name on
 * the trigger, and each option's description and badges in the list.
 */
export const AIModelSelector = ({
    models,
    value,
    defaultValue,
    onChange,
    "aria-label": ariaLabel = "Model",
    isDisabled,
    placement = "top start",
    className,
}: AIModelSelectorProps) => (
    <AriaSelect
        aria-label={ariaLabel}
        value={value}
        defaultValue={defaultValue ?? models[0]?.id}
        onChange={(key: Key | null) => {
            if (key !== null) onChange?.(String(key));
        }}
        isDisabled={isDisabled}
        disabledKeys={models.filter((model) => model.isDisabled).map((model) => model.id)}
        className={cx(styles.root, className)}
    >
        <AriaButton className={styles.trigger}>
            <AriaSelectValue<AIModel> className="flex min-w-0 items-center gap-1.5">
                {({ selectedItem, defaultChildren }) =>
                    selectedItem ? (
                        <>
                            {renderIcon(selectedItem.icon, styles.icon)}
                            <span className="truncate">{selectedItem.name}</span>
                        </>
                    ) : (
                        defaultChildren
                    )
                }
            </AriaSelectValue>
            <ChevronDown aria-hidden="true" className={styles.icon} />
        </AriaButton>

        <AriaPopover
            placement={placement}
            offset={6}
            className={({ isEntering, isExiting }) => cx(styles.popover.root, isEntering && styles.popover.entering, isExiting && styles.popover.exiting)}
        >
            <AriaListBox<AIModel> items={models} className="outline-hidden">
                {(model) => (
                    <AriaListBoxItem
                        id={model.id}
                        value={model}
                        textValue={model.provider ? `${model.name}, ${model.provider}` : model.name}
                        className={styles.item}
                    >
                        {({ isSelected, isFocused, isFocusVisible, isDisabled: itemDisabled }) => (
                            <div
                                className={cx(
                                    styles.itemInner,
                                    (isFocused || isSelected) && "bg-primary_hover",
                                    isFocusVisible && "ring-focus-ring ring-2 ring-inset",
                                    itemDisabled && "cursor-not-allowed opacity-50",
                                )}
                            >
                                {model.icon !== undefined && renderIcon(model.icon, styles.itemIcon)}
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <AriaText slot="label" className={styles.itemName}>
                                            {model.name}
                                        </AriaText>
                                        {model.badges?.map((badge) => {
                                            const { label, color = "gray" } = typeof badge === "string" ? { label: badge } : badge;
                                            return (
                                                <Badge key={label} type="pill-color" size="sm" color={color}>
                                                    {label}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    {model.description && (
                                        <AriaText slot="description" className={styles.itemDescription}>
                                            {model.description}
                                        </AriaText>
                                    )}
                                </div>
                                <Check aria-hidden="true" className={cx(styles.check, !isSelected && "invisible")} />
                            </div>
                        )}
                    </AriaListBoxItem>
                )}
            </AriaListBox>
        </AriaPopover>
    </AriaSelect>
);
