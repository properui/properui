import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { ScrollArea } from "./scroll-area";
import * as Demos from "./scroll-area.demo";

type Box = Partial<Record<"scrollHeight" | "clientHeight" | "scrollWidth" | "clientWidth", number>>;

const patched: string[] = [];

/** jsdom does no layout, so give every viewport (and scrollbar rail) the given scroll box. */
const fakeLayout = (viewport: Box, rail = 200) => {
    for (const [prop, value] of Object.entries(viewport)) {
        const fallback = Object.getOwnPropertyDescriptor(Element.prototype, prop);
        Object.defineProperty(HTMLElement.prototype, prop, {
            configurable: true,
            get(this: HTMLElement) {
                if (this.hasAttribute("data-scroll-viewport")) return value;
                if (this.parentElement?.hasAttribute("data-scrollbar")) return rail;
                return fallback?.get?.call(this) ?? 0;
            },
        });
        patched.push(prop);
    }
};

afterEach(() => {
    for (const prop of patched.splice(0)) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
});

describe("ScrollArea", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("keeps the viewport a focusable, labelled scrolling region", () => {
        const { getByRole } = render(
            <ScrollArea aria-label="Notes" className="h-40">
                <p>Content</p>
            </ScrollArea>,
        );
        const viewport = getByRole("region", { name: "Notes" });

        expect(viewport).toHaveAttribute("tabindex", "0");
        expect(viewport.className).toContain("overflow-y-auto");
        act(() => viewport.focus());
        expect(viewport).toHaveFocus();
    });

    it("scrolls the axes the orientation asks for", () => {
        const { getByRole, rerender } = render(
            <ScrollArea aria-label="Row" orientation="horizontal">
                <p>Content</p>
            </ScrollArea>,
        );
        expect(getByRole("region").className).toContain("overflow-x-auto");

        rerender(
            <ScrollArea aria-label="Row" orientation="both">
                <p>Content</p>
            </ScrollArea>,
        );
        expect(getByRole("region").className).toContain("overflow-auto");
    });

    it("renders no scrollbar when nothing overflows, unless type is always", () => {
        const { container, rerender } = render(
            <ScrollArea aria-label="Notes">
                <p>Content</p>
            </ScrollArea>,
        );
        expect(container.querySelector("[data-scrollbar]")).toBeNull();

        rerender(
            <ScrollArea aria-label="Notes" type="always">
                <p>Content</p>
            </ScrollArea>,
        );
        const scrollbar = container.querySelector("[data-scrollbar]");
        expect(scrollbar).toHaveAttribute("aria-hidden", "true");
        expect(scrollbar).toHaveAttribute("data-visible");
    });

    it("sizes the thumb to the visible share of the content", () => {
        fakeLayout({ scrollHeight: 1000, clientHeight: 250 });
        const { container } = render(
            <ScrollArea aria-label="Notes" type="auto">
                <p>Content</p>
            </ScrollArea>,
        );
        const scrollbar = container.querySelector('[data-scrollbar="vertical"]');
        const thumb = scrollbar?.querySelector<HTMLElement>("[data-scrollbar] > div > div");

        expect(scrollbar).toHaveAttribute("data-visible");
        expect(thumb?.style.height).toBe("50px");
    });

    it("shows hover scrollbars only while the pointer is over the area", () => {
        fakeLayout({ scrollHeight: 1000, clientHeight: 250 });
        const { container } = render(
            <ScrollArea aria-label="Notes">
                <p>Content</p>
            </ScrollArea>,
        );
        const root = container.querySelector("[data-scroll-area]") as HTMLElement;
        const scrollbar = () => container.querySelector('[data-scrollbar="vertical"]');

        expect(scrollbar()).not.toHaveAttribute("data-visible");
        fireEvent.pointerEnter(root);
        expect(scrollbar()).toHaveAttribute("data-visible");
        fireEvent.pointerLeave(root);
        expect(scrollbar()).not.toHaveAttribute("data-visible");
    });

    it("fades only the edges that have more content beyond them", () => {
        fakeLayout({ scrollHeight: 1000, clientHeight: 250 });
        const { getByRole } = render(
            <ScrollArea aria-label="Notes" fadeEdges>
                <p>Content</p>
            </ScrollArea>,
        );
        const viewport = getByRole("region");

        // At the top: the top edge is crisp and the bottom one fades.
        expect(viewport.style.maskImage).toContain("black 0px");
        expect(viewport.style.maskImage).toContain("calc(100% - calc(var(--spacing) * 8))");
    });
});
