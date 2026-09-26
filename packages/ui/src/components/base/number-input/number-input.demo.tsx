"use client";

import { NumberInput } from "./number-input";

export const NumberInputExample = () => (
    <div className="w-full max-w-xs">
        <NumberInput label="Quantity" hint="How many would you like?" defaultValue={1} minValue={0} maxValue={99} />
    </div>
);

/** `formatOptions` is a plain `Intl.NumberFormatOptions` — the underlying value stays a number. */
export const FormatOptions = () => (
    <div className="flex w-full max-w-xs flex-col gap-4">
        <NumberInput label="Price" defaultValue={49.99} minValue={0} step={0.01} formatOptions={{ style: "currency", currency: "USD" }} />
        <NumberInput label="Discount" defaultValue={0.15} minValue={0} maxValue={1} step={0.01} formatOptions={{ style: "percent" }} />
        <NumberInput label="Distance" defaultValue={12} minValue={0} formatOptions={{ style: "unit", unit: "kilometer", unitDisplay: "long" }} />
    </div>
);

/** `buttonVariant="inline"` puts a full-height minus/plus button on either side of the value instead of a stacked chevron pair. */
export const InlineButtons = () => (
    <div className="flex w-full max-w-xs flex-col gap-4">
        <NumberInput label="Seats" buttonVariant="inline" defaultValue={2} minValue={1} maxValue={10} />
        <NumberInput label="Guests" buttonVariant="inline" size="sm" defaultValue={4} minValue={0} />
    </div>
);

export const Sizes = () => (
    <div className="flex w-full max-w-xs flex-col gap-4">
        <NumberInput label="Small" size="sm" defaultValue={10} />
        <NumberInput label="Medium" size="md" defaultValue={10} />
        <NumberInput label="Large" size="lg" defaultValue={10} />
    </div>
);

/** `minValue`/`maxValue`/`step` clamp the value and disable the buttons at either bound. */
export const MinMaxStep = () => (
    <div className="w-full max-w-xs">
        <NumberInput label="Party size" hint="Steps of 2, from 2 to 20" defaultValue={2} minValue={2} maxValue={20} step={2} />
    </div>
);

export const States = () => (
    <div className="flex w-full max-w-xs flex-col gap-4">
        <NumberInput label="Disabled" defaultValue={5} isDisabled />
        <NumberInput label="Age" defaultValue={-1} minValue={0} isInvalid hint="Age can't be negative." />
        <NumberInput label="Required field" isRequired placeholder="0" />
    </div>
);
