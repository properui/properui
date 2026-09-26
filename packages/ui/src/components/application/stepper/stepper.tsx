"use client";

import { type ReactNode, createContext, useCallback, useContext, useState } from "react";
import { Check } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { Button } from "../../base/buttons/button";

const styles = sortCx({
    indicator: "z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
    indicators: {
        complete: "bg-success-solid text-fg-white",
        current: "bg-primary text-secondary ring-2 ring-brand ring-inset",
        upcoming: "bg-primary text-quaternary opacity-60 ring-1 ring-secondary ring-inset",
    },
    connectors: {
        complete: "border-secondary",
        current: "border-secondary",
        upcoming: "border-secondary",
    },
});

/** The direction the steps flow in. */
export type StepperOrientation = "horizontal" | "vertical";

/** How far along a single step is, derived from its index and the wizard's current `activeStep`. */
export type StepperStepStatus = "complete" | "current" | "upcoming";

interface StepperContextValue {
    activeStep: number;
    totalSteps: number;
    orientation: StepperOrientation;
    linear: boolean;
    goTo: (index: number) => void;
    next: () => void;
    back: () => void;
    statusOf: (index: number) => StepperStepStatus;
}

const StepperContext = createContext<StepperContextValue | null>(null);

const useStepperContext = (component: string) => {
    const context = useContext(StepperContext);
    if (!context) throw new Error(`Stepper.${component} must be rendered inside a Stepper.`);
    return context;
};

export interface StepperProps {
    /** The total number of steps in the wizard. */
    totalSteps: number;
    /** The active step's index (0-based). Omit to let the `Stepper` manage its own state. */
    activeStep?: number;
    /** The active step's index by default, for uncontrolled usage. */
    defaultActiveStep?: number;
    /** Called with the new index whenever the active step changes, by any means — `Back`, `Next`, or clicking a completed step. */
    onStepChange?: (index: number) => void;
    /**
     * When `true` (the default), a step's header is inert — the only way through the wizard is
     * `Stepper.Controls`' `Back`/`Next`. When `false`, clicking a step that's already been
     * completed jumps straight to it; upcoming steps stay inert either way.
     *
     * @default true
     */
    linear?: boolean;
    /**
     * Called with the current step's index before `Next` advances past it. Return `false` to
     * block the advance — e.g. because that step's form fields haven't validated yet.
     */
    canAdvance?: (step: number) => boolean;
    /**
     * The direction the steps flow in. `"horizontal"` lays the steps out in a row above the
     * content; `"vertical"` lays them out in a column beside it.
     *
     * @default "horizontal"
     */
    orientation?: StepperOrientation;
    /** `Stepper.Steps`, `Stepper.Content` (one per step) and `Stepper.Controls`. */
    children: ReactNode;
    /** Additional classes merged onto the root element. */
    className?: string;
}

/**
 * A multi-step form wizard — `Stepper.Steps` for the header, one `Stepper.Content` per step for
 * its fields, and `Stepper.Controls` for `Back`/`Next`/`Finish`. Unlike `ProgressSteps` (a purely
 * decorative status display), `Stepper` owns the active step itself, so it can gate advancing
 * through `canAdvance` and, in non-linear mode, let a completed step's header jump back to it.
 */
const StepperRoot = ({
    totalSteps,
    activeStep: activeStepProp,
    defaultActiveStep = 0,
    onStepChange,
    linear = true,
    canAdvance,
    orientation = "horizontal",
    children,
    className,
}: StepperProps) => {
    const [internalStep, setInternalStep] = useState(defaultActiveStep);
    const activeStep = activeStepProp ?? internalStep;

    const setStep = useCallback(
        (index: number) => {
            const clamped = Math.min(Math.max(index, 0), totalSteps - 1);
            if (activeStepProp === undefined) setInternalStep(clamped);
            onStepChange?.(clamped);
        },
        [activeStepProp, onStepChange, totalSteps],
    );

    const goTo = useCallback((index: number) => setStep(index), [setStep]);
    const back = useCallback(() => setStep(activeStep - 1), [setStep, activeStep]);
    const next = useCallback(() => {
        if (canAdvance && !canAdvance(activeStep)) return;
        setStep(activeStep + 1);
    }, [canAdvance, activeStep, setStep]);

    const statusOf = useCallback(
        (index: number): StepperStepStatus => (index < activeStep ? "complete" : index === activeStep ? "current" : "upcoming"),
        [activeStep],
    );

    return (
        <StepperContext.Provider value={{ activeStep, totalSteps, orientation, linear, goTo, next, back, statusOf }}>
            <div className={cx("flex w-full", orientation === "horizontal" ? "flex-col gap-6" : "flex-row items-start gap-8", className)}>{children}</div>
        </StepperContext.Provider>
    );
};

export interface StepperStepsProps {
    /** Accessible label for the surrounding navigation landmark. @default "Progress" */
    "aria-label"?: string;
    /** `Stepper.Step` entries, one per step, in order. */
    children: ReactNode;
    /** Additional classes merged onto the step list. */
    className?: string;
}

const StepperSteps = ({ "aria-label": ariaLabel = "Progress", children, className }: StepperStepsProps) => {
    const { orientation } = useStepperContext("Steps");

    return (
        <nav aria-label={ariaLabel} className={cx(orientation === "horizontal" ? "w-full" : "w-full shrink-0 sm:w-56")}>
            <ol className={cx("flex", orientation === "horizontal" ? "w-full items-start justify-between" : "flex-col", className)}>{children}</ol>
        </nav>
    );
};

export interface StepperStepProps {
    /** This step's 0-based index — must match the `index` of its `Stepper.Content`. */
    index: number;
    /** The step's title. */
    title: ReactNode;
    /** A supporting description rendered below the title. */
    description?: ReactNode;
    /** Marks the step as optional, rendering a muted "(optional)" alongside its title. */
    optional?: boolean;
    /** Additional classes merged onto the list item. */
    className?: string;
}

const StepperStep = ({ index, title, description, optional, className }: StepperStepProps) => {
    const { totalSteps, orientation, linear, goTo, statusOf } = useStepperContext("Step");
    const status = statusOf(index);
    const isLast = index === totalSteps - 1;
    const isClickable = !linear && status === "complete";

    const indicator = (
        <span className={cx(styles.indicator, styles.indicators[status])}>
            {status === "complete" ? <Check aria-hidden="true" className="size-3.5 stroke-[2.5px]" /> : index + 1}
        </span>
    );

    const titleEl = (
        <p
            className={cx(
                "text-sm font-semibold",
                status === "current" ? "text-brand-secondary" : "text-secondary",
                orientation === "horizontal" && "text-center",
            )}
        >
            {title}
            {optional && <span className="text-tertiary ms-1 font-normal">(optional)</span>}
        </p>
    );

    const descriptionEl = description && <p className={cx("text-tertiary text-sm", orientation === "horizontal" && "text-center")}>{description}</p>;

    const connector = !isLast && (
        <span
            aria-hidden="true"
            className={cx(
                "rounded-xs",
                orientation === "horizontal" ? "absolute start-[53%] top-4 z-0 w-full flex-1 -translate-y-1/2 border-t-2" : "my-1 flex-1 border-s-2",
                styles.connectors[status],
            )}
        />
    );

    const body =
        orientation === "horizontal" ? (
            <div className="flex w-full flex-col items-center justify-center gap-2">
                <div className="relative flex w-full flex-col items-center self-stretch">
                    {indicator}
                    {connector}
                </div>
                <div className="flex w-full flex-col items-center">
                    {titleEl}
                    {descriptionEl}
                </div>
            </div>
        ) : (
            <div className="flex flex-row items-start justify-start gap-3">
                <div className="flex flex-col items-center self-stretch">
                    {indicator}
                    {connector}
                </div>
                <div className={cx("flex flex-col items-start pt-1", !isLast && "pb-6")}>
                    {titleEl}
                    {descriptionEl}
                </div>
            </div>
        );

    return (
        <li aria-current={status === "current" ? "step" : undefined} className={cx(orientation === "horizontal" ? "flex-1" : "flex flex-col", className)}>
            {isClickable ? (
                <button
                    type="button"
                    onClick={() => goTo(index)}
                    className="outline-focus-ring w-full cursor-pointer rounded-md text-start focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    {body}
                </button>
            ) : (
                body
            )}
        </li>
    );
};

export interface StepperContentProps {
    /** The step this content belongs to — rendered only while it's the active step. */
    index: number;
    children: ReactNode;
    /** Additional classes merged onto the root element. */
    className?: string;
}

const StepperContent = ({ index, children, className }: StepperContentProps) => {
    const { activeStep } = useStepperContext("Content");
    if (activeStep !== index) return null;

    return <div className={cx("flex w-full flex-col", className)}>{children}</div>;
};

export interface StepperControlsProps {
    /** Called instead of advancing once `Next` is pressed on the last step. */
    onFinish?: () => void;
    /** @default "Back" */
    backLabel?: ReactNode;
    /** @default "Next" */
    nextLabel?: ReactNode;
    /** @default "Finish" */
    finishLabel?: ReactNode;
    /** Additional classes merged onto the root element. */
    className?: string;
}

const StepperControls = ({ onFinish, backLabel = "Back", nextLabel = "Next", finishLabel = "Finish", className }: StepperControlsProps) => {
    const { activeStep, totalSteps, next, back } = useStepperContext("Controls");
    const isFirst = activeStep === 0;
    const isLast = activeStep === totalSteps - 1;

    return (
        <div className={cx("flex w-full items-center justify-between gap-3 pt-2", className)}>
            <Button color="secondary" size="md" onPress={back} isDisabled={isFirst}>
                {backLabel}
            </Button>
            <Button color="primary" size="md" onPress={isLast ? onFinish : next}>
                {isLast ? finishLabel : nextLabel}
            </Button>
        </div>
    );
};

export const Stepper = Object.assign(StepperRoot, {
    Steps: StepperSteps,
    Step: StepperStep,
    Content: StepperContent,
    Controls: StepperControls,
});
