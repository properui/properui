"use client";

import { useState } from "react";
import { Checkbox } from "../../base/checkbox/checkbox";
import { Input } from "../../base/input/input";
import { Select } from "../../base/select/select";
import type { SelectItemType } from "../../base/select/select-shared";
import { Stepper } from "./stepper";

const shippingMethods: SelectItemType[] = [
    { id: "standard", label: "Standard (5-7 days)" },
    { id: "express", label: "Express (2-3 days)" },
    { id: "overnight", label: "Overnight" },
];

interface CheckoutState {
    fullName: string;
    address: string;
    shippingMethod: string | null;
    cardNumber: string;
    saveCard: boolean;
    agreeToTerms: boolean;
}

const initialState: CheckoutState = {
    fullName: "",
    address: "",
    shippingMethod: null,
    cardNumber: "",
    saveCard: false,
    agreeToTerms: false,
};

/** A 3-step checkout form: shipping details, payment, then review — each step validated before `Next` advances. */
export const CheckoutExample = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [form, setForm] = useState<CheckoutState>(initialState);

    const canAdvance = (step: number) => {
        if (step === 0) return form.fullName.trim() !== "" && form.address.trim() !== "" && form.shippingMethod !== null;
        if (step === 1) return form.cardNumber.trim().length >= 4;
        return true;
    };

    return (
        <Stepper totalSteps={3} activeStep={activeStep} onStepChange={setActiveStep} canAdvance={canAdvance} className="max-w-xl">
            <Stepper.Steps aria-label="Checkout progress">
                <Stepper.Step index={0} title="Shipping" description="Where to send it" />
                <Stepper.Step index={1} title="Payment" description="How you'll pay" />
                <Stepper.Step index={2} title="Review" description="Confirm your order" optional />
            </Stepper.Steps>

            <Stepper.Content index={0} className="gap-4">
                <Input label="Full name" isRequired value={form.fullName} onChange={(fullName) => setForm((state) => ({ ...state, fullName }))} />
                <Input label="Address" isRequired value={form.address} onChange={(address) => setForm((state) => ({ ...state, address }))} />
                <Select
                    label="Shipping method"
                    isRequired
                    placeholder="Choose a method"
                    items={shippingMethods}
                    selectedKey={form.shippingMethod}
                    onSelectionChange={(key) => setForm((state) => ({ ...state, shippingMethod: key as string }))}
                >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>
            </Stepper.Content>

            <Stepper.Content index={1} className="gap-4">
                <Input
                    label="Card number"
                    isRequired
                    placeholder="1234 1234 1234 1234"
                    value={form.cardNumber}
                    onChange={(cardNumber) => setForm((state) => ({ ...state, cardNumber }))}
                />
                <Checkbox
                    label="Save this card for next time"
                    isSelected={form.saveCard}
                    onChange={(saveCard) => setForm((state) => ({ ...state, saveCard }))}
                />
            </Stepper.Content>

            <Stepper.Content index={2} className="gap-4">
                <div className="ring-secondary rounded-lg p-4 ring-1 ring-inset">
                    <p className="text-secondary text-sm font-semibold">{form.fullName || "—"}</p>
                    <p className="text-tertiary text-sm">{form.address || "—"}</p>
                    <p className="text-tertiary text-sm">Card ending in {form.cardNumber.slice(-4) || "----"}</p>
                </div>
                <Checkbox
                    label="I agree to the terms and conditions"
                    isSelected={form.agreeToTerms}
                    onChange={(agreeToTerms) => setForm((state) => ({ ...state, agreeToTerms }))}
                />
            </Stepper.Content>

            <Stepper.Controls onFinish={() => alert("Order placed!")} />
        </Stepper>
    );
};

/** `orientation="vertical"` puts the steps in a column beside the content instead of a row above it. */
export const VerticalLayout = () => {
    const [activeStep, setActiveStep] = useState(1);

    return (
        <Stepper totalSteps={3} activeStep={activeStep} onStepChange={setActiveStep} orientation="vertical" className="max-w-2xl">
            <Stepper.Steps aria-label="Setup progress">
                <Stepper.Step index={0} title="Account" description="Create your login" />
                <Stepper.Step index={1} title="Profile" description="Tell us about yourself" />
                <Stepper.Step index={2} title="Preferences" description="Fine-tune your setup" />
            </Stepper.Steps>

            <div className="flex-1">
                <Stepper.Content index={0} className="gap-4">
                    <Input label="Email" isRequired defaultValue="jane@example.com" />
                    <Input label="Password" type="password" isRequired />
                </Stepper.Content>
                <Stepper.Content index={1} className="gap-4">
                    <Input label="Display name" defaultValue="Jane" />
                </Stepper.Content>
                <Stepper.Content index={2} className="gap-4">
                    <Checkbox label="Email me weekly updates" defaultSelected />
                </Stepper.Content>

                <Stepper.Controls className="mt-6" />
            </div>
        </Stepper>
    );
};

/** `linear={false}` lets a completed step's header be clicked to jump straight back to it. */
export const NonLinear = () => {
    const [activeStep, setActiveStep] = useState(2);

    return (
        <Stepper totalSteps={3} activeStep={activeStep} onStepChange={setActiveStep} linear={false} className="max-w-xl">
            <Stepper.Steps aria-label="Application progress">
                <Stepper.Step index={0} title="Personal info" />
                <Stepper.Step index={1} title="Experience" />
                <Stepper.Step index={2} title="Submit" />
            </Stepper.Steps>

            <Stepper.Content index={0}>
                <Input label="Full name" defaultValue="Jane Doe" />
            </Stepper.Content>
            <Stepper.Content index={1}>
                <Input label="Years of experience" defaultValue="5" />
            </Stepper.Content>
            <Stepper.Content index={2}>
                <p className="text-secondary text-sm">Everything looks good — click a completed step above to make changes, or submit below.</p>
            </Stepper.Content>

            <Stepper.Controls finishLabel="Submit application" onFinish={() => alert("Application submitted!")} />
        </Stepper>
    );
};
