import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { Stepper } from "./stepper";
import * as Demos from "./stepper.demo";

/** React Aria listens for pointer events, so a plain `click` is not enough to press a button. */
const press = (element: HTMLElement) => {
    fireEvent.pointerDown(element, { pointerType: "mouse", button: 0 });
    fireEvent.pointerUp(element, { pointerType: "mouse", button: 0 });
    fireEvent.click(element);
};

const ThreeStepWizard = (props: { linear?: boolean; canAdvance?: (step: number) => boolean; onFinish?: () => void; defaultActiveStep?: number }) => (
    <Stepper totalSteps={3} defaultActiveStep={props.defaultActiveStep ?? 0} linear={props.linear} canAdvance={props.canAdvance}>
        <Stepper.Steps aria-label="Wizard progress">
            <Stepper.Step index={0} title="One" />
            <Stepper.Step index={1} title="Two" />
            <Stepper.Step index={2} title="Three" />
        </Stepper.Steps>

        <Stepper.Content index={0}>Content one</Stepper.Content>
        <Stepper.Content index={1}>Content two</Stepper.Content>
        <Stepper.Content index={2}>Content three</Stepper.Content>

        <Stepper.Controls onFinish={props.onFinish} />
    </Stepper>
);

describe("Stepper", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("renders only the active step's content and marks its header aria-current", () => {
        render(<ThreeStepWizard />);

        expect(screen.getByText("Content one")).toBeInTheDocument();
        expect(screen.queryByText("Content two")).toBeNull();

        const currentSteps = document.querySelectorAll('[aria-current="step"]');
        expect(currentSteps).toHaveLength(1);
        expect(currentSteps[0]?.textContent).toContain("One");
    });

    it("advances to the next step on Next and back again on Back", () => {
        render(<ThreeStepWizard />);

        press(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByText("Content two")).toBeInTheDocument();

        press(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByText("Content one")).toBeInTheDocument();
    });

    it("disables Back on the first step", () => {
        render(<ThreeStepWizard />);
        expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    });

    it("blocks Next when canAdvance returns false", () => {
        render(<ThreeStepWizard canAdvance={() => false} />);

        press(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByText("Content one")).toBeInTheDocument();
    });

    it("shows Finish on the last step and calls onFinish", () => {
        const onFinish = vi.fn();
        render(<ThreeStepWizard defaultActiveStep={2} onFinish={onFinish} />);

        const finishButton = screen.getByRole("button", { name: "Finish" });
        press(finishButton);
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("does not let a completed step's header be clicked when linear (the default)", () => {
        render(<ThreeStepWizard defaultActiveStep={2} />);

        expect(screen.queryByRole("button", { name: /One/ })).toBeNull();
        expect(screen.getByText("Content three")).toBeInTheDocument();
    });

    it("jumps to a completed step when its header is clicked in non-linear mode", () => {
        render(<ThreeStepWizard defaultActiveStep={2} linear={false} />);

        press(screen.getByRole("button", { name: /One/ }));
        expect(screen.getByText("Content one")).toBeInTheDocument();
    });
});
