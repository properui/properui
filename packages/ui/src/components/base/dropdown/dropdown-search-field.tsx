"use client";

import type { ComponentType, HTMLAttributes } from "react";
import { Input as AriaInput } from "react-aria-components";
import { cx } from "../../../utils/cx";

interface DropdownSearchFieldProps {
    /** Placeholder text for the search input. */
    placeholder?: string;
    /** Icon component to display on the left side of the field. */
    icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
    /** Class name for the field wrapper. */
    className?: string;
}

/**
 * A minimal search input used inside dropdown popovers.
 *
 * The full `InputBase` component (`base/input`) has not been ported yet, so this is a
 * self-contained field scoped to the dropdown component, styled to match `InputBase` at `size="md"`.
 */
export const DropdownSearchField = ({ placeholder, icon: Icon, className }: DropdownSearchFieldProps) => (
    <div
        className={cx(
            "group/input bg-primary ring-primary has-[input:focus]:ring-brand relative flex w-full flex-row place-content-center place-items-center rounded-lg shadow-xs ring-1 transition-shadow duration-100 ease-linear ring-inset has-[input:focus]:ring-2",
            className,
        )}
    >
        {Icon && <Icon aria-hidden="true" className="text-fg-quaternary pointer-events-none absolute start-3 size-5" />}

        <AriaInput
            placeholder={placeholder}
            className={cx("text-md text-primary placeholder:text-placeholder m-0 w-full bg-transparent py-2 outline-hidden", Icon ? "ps-10 pe-3" : "px-3")}
        />
    </div>
);
