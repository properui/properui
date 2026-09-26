import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import * as Demos from "./area-charts.demo";

// jsdom does not implement `window.matchMedia`, which the `useBreakpoint` hook used by these
// demos relies on. Stub it so the demos render in the test environment.
beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: true,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

describe("Area charts", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("renders three legend series for the stacked area chart", () => {
        const { getByText } = render(<Demos.AreaChartStacked />);
        expect(getByText("Organic")).toBeTruthy();
        expect(getByText("Paid")).toBeTruthy();
        expect(getByText("Referral")).toBeTruthy();
    });

    it("renders one chart per region in the small-multiples grid", () => {
        const { getByText } = render(<Demos.AreaChartSmallMultiples />);
        expect(getByText("North America")).toBeTruthy();
        expect(getByText("Oceania")).toBeTruthy();
    });
});
