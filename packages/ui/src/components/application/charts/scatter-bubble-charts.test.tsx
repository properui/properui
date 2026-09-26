import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import * as Demos from "./scatter-bubble-charts.demo";

describe("Scatter & bubble charts", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("renders one legend entry per channel in the bubble chart", () => {
        const { getByText } = render(<Demos.BubbleChart />);
        expect(getByText("Search")).toBeTruthy();
        expect(getByText("Email")).toBeTruthy();
    });

    it("renders one legend entry per cohort in the categorical scatter chart", () => {
        const { getByText } = render(<Demos.ScatterChartCategorical />);
        expect(getByText("Enterprise")).toBeTruthy();
        expect(getByText("SMB")).toBeTruthy();
        expect(getByText("Startup")).toBeTruthy();
    });
});
