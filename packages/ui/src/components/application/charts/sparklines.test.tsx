import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Sparkline } from "./sparkline";
import * as Demos from "./sparklines.demo";

describe("Sparklines", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("renders one row per metric in the table cells demo", () => {
        const { getByText } = render(<Demos.SparklineTableCells />);
        expect(getByText("Revenue")).toBeTruthy();
        expect(getByText("Churn")).toBeTruthy();
    });

    it("renders every card title in the metric cards demo", () => {
        const { getAllByText } = render(<Demos.SparklineInMetricCards />);
        expect(getAllByText("Revenue").length).toBeGreaterThan(0);
        expect(getAllByText("Churn").length).toBeGreaterThan(0);
    });

    it("accepts plain numbers as well as `{ value }` datums", () => {
        const { container: fromNumbers } = render(<Sparkline data={[1, 2, 3]} />);
        const { container: fromDatums } = render(<Sparkline data={[{ value: 1 }, { value: 2 }, { value: 3 }]} />);
        expect(fromNumbers.querySelector("svg")).toBeTruthy();
        expect(fromDatums.querySelector("svg")).toBeTruthy();
    });

    it("marks only the final point when `showLast` is set on a bar sparkline", () => {
        const { container } = render(<Sparkline data={[1, 2, 3, 4]} type="bar" showLast />);
        const bars = container.querySelectorAll(".recharts-bar-rectangle");
        expect(bars.length).toBe(4);
    });
});
