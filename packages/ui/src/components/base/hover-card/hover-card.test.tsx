import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { HoverCard, HoverCardTrigger } from "./hover-card";
import * as Demos from "./hover-card.demo";

describe("HoverCard", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("is closed until the trigger is focused", async () => {
        render(
            <HoverCard aria-label="Profile" trigger={<HoverCardTrigger>Trigger</HoverCardTrigger>}>
                <p>Card content</p>
            </HoverCard>,
        );

        expect(screen.queryByRole("dialog")).toBeNull();

        act(() => screen.getByRole("button", { name: "Trigger" }).focus());
        await waitFor(() => expect(screen.getByRole("dialog", { name: "Profile" })).toBeInTheDocument());
    });

    it("closes on Escape", async () => {
        render(
            <HoverCard aria-label="Profile" trigger={<HoverCardTrigger>Trigger</HoverCardTrigger>}>
                <p>Card content</p>
            </HoverCard>,
        );

        act(() => screen.getByRole("button", { name: "Trigger" }).focus());
        const dialog = await waitFor(() => screen.getByRole("dialog"));

        fireEventEscape(dialog);
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("calls onOpenChange when focus opens and blur (after the close delay) closes it", async () => {
        vi.useFakeTimers();
        const onOpenChange = vi.fn();

        render(
            <HoverCard aria-label="Profile" closeDelay={100} onOpenChange={onOpenChange} trigger={<HoverCardTrigger>Trigger</HoverCardTrigger>}>
                <p>Card content</p>
            </HoverCard>,
        );

        const trigger = screen.getByRole("button", { name: "Trigger" });
        act(() => trigger.focus());
        expect(onOpenChange).toHaveBeenCalledWith(true);

        act(() => trigger.blur());
        act(() => vi.advanceTimersByTime(100));
        expect(onOpenChange).toHaveBeenLastCalledWith(false);

        vi.useRealTimers();
    });

    it("respects a controlled isOpen prop instead of managing its own state", () => {
        const { rerender } = render(
            <HoverCard aria-label="Profile" isOpen={false} trigger={<HoverCardTrigger>Trigger</HoverCardTrigger>}>
                <p>Card content</p>
            </HoverCard>,
        );
        expect(screen.queryByRole("dialog")).toBeNull();

        rerender(
            <HoverCard aria-label="Profile" isOpen={true} trigger={<HoverCardTrigger>Trigger</HoverCardTrigger>}>
                <p>Card content</p>
            </HoverCard>,
        );
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});

/**
 * Escape is handled by an ancestor `onKeyDown`, so dispatching it on the dialog itself is
 * equivalent to a real Escape press from anywhere inside it (see `popover.test.tsx`).
 */
function fireEventEscape(element: Element) {
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
}
