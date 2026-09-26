import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import * as Demos from "./combined-charts.demo";

describe("Combined charts", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("renders both series in the bar + line legend", () => {
        const { getByText } = render(<Demos.BarLineComposed />);
        expect(getByText("New customers")).toBeTruthy();
        expect(getByText("Cumulative total")).toBeTruthy();
    });

    it("renders a target line label on the bar-with-target chart", () => {
        const { getByText } = render(<Demos.BarWithTargetLine />);
        expect(getByText("Target")).toBeTruthy();
    });

    it("renders one funnel stage per legend entry", () => {
        const { getByText } = render(<Demos.FunnelChartExample />);
        expect(getByText("Visitors")).toBeTruthy();
        expect(getByText("Paid customers")).toBeTruthy();
    });
});
