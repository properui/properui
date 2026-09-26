import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { NumberInput } from "./number-input";
import * as Demos from "./number-input.demo";

/** React Aria listens for pointer events, so a plain `click` is not enough to press a button. */
const press = (element: HTMLElement) => {
    fireEvent.pointerDown(element, { pointerType: "mouse", button: 0 });
    fireEvent.pointerUp(element, { pointerType: "mouse", button: 0 });
    fireEvent.click(element);
};

describe("NumberInput", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("increments and decrements the value with the stacked buttons", () => {
        render(<NumberInput label="Quantity" defaultValue={1} />);

        press(screen.getByRole("button", { name: /increase/i }));
        expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("2");

        press(screen.getByRole("button", { name: /decrease/i }));
        press(screen.getByRole("button", { name: /decrease/i }));
        expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("0");
    });

    it("renders full-height minus/plus buttons for the inline variant", () => {
        render(<NumberInput label="Seats" buttonVariant="inline" defaultValue={2} />);

        press(screen.getByRole("button", { name: /increase/i }));
        expect(screen.getByRole("textbox", { name: "Seats" })).toHaveValue("3");
    });

    it("clamps to minValue and disables the decrement button there", () => {
        render(<NumberInput label="Party size" defaultValue={2} minValue={2} maxValue={20} step={2} />);

        const decrementButton = screen.getByRole("button", { name: /decrease/i });
        expect(decrementButton).toBeDisabled();

        press(decrementButton);
        expect(screen.getByRole("textbox", { name: "Party size" })).toHaveValue("2");
    });

    it("formats the displayed value with formatOptions", () => {
        render(<NumberInput label="Price" defaultValue={49.99} formatOptions={{ style: "currency", currency: "USD" }} />);
        expect(screen.getByRole("textbox", { name: "Price" })).toHaveValue("$49.99");
    });

    it("renders the hint text and marks the field invalid", () => {
        render(<NumberInput label="Age" defaultValue={-1} isInvalid hint="Age can't be negative." />);

        expect(screen.getByText("Age can't be negative.")).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: "Age" })).toHaveAttribute("aria-invalid", "true");
    });
});
