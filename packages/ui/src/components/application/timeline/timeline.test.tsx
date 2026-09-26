import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { Timeline } from "./timeline";
import * as Demos from "./timeline.demo";

describe("Timeline", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("marks only the current item with aria-current", () => {
        render(
            <Timeline aria-label="Status">
                <Timeline.Item status="completed" title="One" />
                <Timeline.Item status="current" title="Two" />
                <Timeline.Item status="upcoming" title="Three" />
            </Timeline>,
        );

        const current = screen.getAllByRole("listitem").filter((item) => item.getAttribute("aria-current") === "step");
        expect(current).toHaveLength(1);
        expect(current[0]?.textContent).toContain("Two");
    });

    it("renders one connector per item, each hidden on the last via a group-last class", () => {
        const { container } = render(
            <Timeline aria-label="Status">
                <Timeline.Item title="One" />
                <Timeline.Item title="Two" />
                <Timeline.Item title="Three" />
            </Timeline>,
        );

        const connectors = container.querySelectorAll('span[aria-hidden="true"].rounded-full');
        expect(connectors).toHaveLength(3);
        for (const connector of connectors) {
            expect(connector.className).toContain("group-last/item:hidden");
        }
    });

    it("renders every item's title and description", () => {
        render(
            <Timeline aria-label="Status">
                <Timeline.Item title="Shipped" description="On its way" />
            </Timeline>,
        );

        expect(screen.getByText("Shipped")).toBeInTheDocument();
        expect(screen.getByText("On its way")).toBeInTheDocument();
    });

    it("lays out a horizontal timeline as a row of equal-width items", () => {
        const { container } = render(
            <Timeline aria-label="Status" variant="horizontal">
                <Timeline.Item title="One" />
                <Timeline.Item title="Two" />
            </Timeline>,
        );

        expect(container.querySelector("ol")?.className).toContain("flex");
        expect(container.querySelectorAll("li.flex-1")).toHaveLength(2);
    });

    it("renders an alternating timeline's content on both sides, one visible per item via CSS", () => {
        render(
            <Timeline aria-label="Status" variant="alternating">
                <Timeline.Item title="Only item" />
            </Timeline>,
        );

        // The same content is rendered on both the odd (left) and even (right) side; only one is
        // shown at a time via `group-odd/item:flex` / `group-even/item:flex` in the compiled CSS.
        expect(screen.getAllByText("Only item")).toHaveLength(2);
    });
});
