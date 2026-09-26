import { parseDate } from "@internationalized/date";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import type { GanttGroupData, GanttZoom } from "./gantt";
import { Gantt } from "./gantt";
import * as Demos from "./gantt.demo";

const groups: GanttGroupData[] = [
    {
        id: "build",
        name: "Build",
        features: [
            { id: "api", name: "API", startAt: parseDate("2026-03-02"), endAt: parseDate("2026-03-06"), progress: 50 },
            { id: "ui", name: "UI", startAt: parseDate("2026-03-09"), endAt: parseDate("2026-03-13"), dependencies: ["api"] },
            { id: "ship", name: "Ship", startAt: parseDate("2026-03-20"), endAt: parseDate("2026-03-20"), isMilestone: true },
        ],
    },
];

const renderGantt = (props: { zoom?: GanttZoom; isReadOnly?: boolean; onMove?: () => void; onResize?: () => void } = {}) =>
    render(
        <Gantt.Provider groups={groups} startDate={parseDate("2026-03-01")} endDate={parseDate("2026-04-30")} today={null} aria-label="Roadmap" {...props}>
            <Gantt.Sidebar />
            <Gantt.Timeline />
        </Gantt.Provider>,
    );

describe("Gantt", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("labels the grid and names each bar with its dates", () => {
        const { getByRole } = renderGantt();

        expect(getByRole("grid", { name: "Roadmap" })).toBeInTheDocument();

        const bar = getByRole("button", { name: /^API,/ });
        expect(bar.getAttribute("aria-label")).toMatch(/Mar 2/);
        expect(bar.getAttribute("aria-label")).toMatch(/2026/);
        expect(bar.getAttribute("aria-label")).toMatch(/50% complete/);
        expect(getByRole("button", { name: /^Ship, milestone/ })).toBeInTheDocument();
    });

    it("keeps a single tab stop and moves focus between bars with the up and down arrows", () => {
        const { getByRole } = renderGantt();
        const api = getByRole("button", { name: /^API,/ });
        const ui = getByRole("button", { name: /^UI,/ });

        expect(api.tabIndex).toBe(0);
        expect(ui.tabIndex).toBe(-1);

        act(() => api.focus());
        fireEvent.keyDown(api, { key: "ArrowDown" });
        expect(document.activeElement).toBe(ui);
        expect(ui.tabIndex).toBe(0);
        expect(api.tabIndex).toBe(-1);
    });

    it("calls onMove with dates shifted by one zoom unit when an arrow key is pressed", () => {
        const onMove = vi.fn();
        const { getByRole, rerender } = renderGantt({ zoom: "day", onMove });
        const api = getByRole("button", { name: /^API,/ });

        act(() => api.focus());
        fireEvent.keyDown(api, { key: "ArrowRight" });

        expect(onMove).toHaveBeenCalledTimes(1);
        const [event] = onMove.mock.calls[0] ?? [];
        expect(event.id).toBe("api");
        expect(event.source).toBe("keyboard");
        expect(event.startAt.toString()).toBe("2026-03-03");
        expect(event.endAt.toString()).toBe("2026-03-07");

        rerender(
            <Gantt.Provider groups={groups} startDate={parseDate("2026-03-01")} endDate={parseDate("2026-04-30")} today={null} zoom="week" onMove={onMove}>
                <Gantt.Timeline />
            </Gantt.Provider>,
        );
        fireEvent.keyDown(getByRole("button", { name: /^API,/ }), { key: "ArrowLeft" });
        // Clamped to the start of the visible range: one week back would fall before March 1.
        expect(onMove.mock.calls[1]?.[0].startAt.toString()).toBe("2026-03-01");
    });

    it("calls onResize when Shift+arrow is pressed and never shrinks below one day", () => {
        const onResize = vi.fn();
        const { getByRole } = renderGantt({ zoom: "week", onResize });
        const api = getByRole("button", { name: /^API,/ });

        fireEvent.keyDown(api, { key: "ArrowRight", shiftKey: true });
        expect(onResize.mock.calls[0]?.[0].endAt.toString()).toBe("2026-03-13");

        fireEvent.keyDown(api, { key: "ArrowLeft", shiftKey: true });
        expect(onResize.mock.calls[1]?.[0].endAt.toString()).toBe("2026-03-02");
    });

    it("ignores date keys when read-only", () => {
        const onMove = vi.fn();
        const { getByRole } = renderGantt({ isReadOnly: true, onMove });

        fireEvent.keyDown(getByRole("button", { name: /^API,/ }), { key: "ArrowRight" });
        expect(onMove).not.toHaveBeenCalled();
    });

    it("calls onMove after a pointer drag", () => {
        // jsdom has no PointerEvent, so fireEvent.pointer* would drop clientX and button.
        if (!("PointerEvent" in window)) {
            class PointerEventShim extends MouseEvent {
                pointerId: number;
                constructor(type: string, init: PointerEventInit = {}) {
                    super(type, init);
                    this.pointerId = init.pointerId ?? 0;
                }
            }
            vi.stubGlobal("PointerEvent", PointerEventShim);
        }

        const onMove = vi.fn();
        const { getByRole } = renderGantt({ zoom: "day", onMove });
        const api = getByRole("button", { name: /^API,/ });

        fireEvent.pointerDown(api, { button: 0, clientX: 100, pointerId: 1 });
        fireEvent.pointerMove(api, { clientX: 180, pointerId: 1 });
        fireEvent.pointerUp(api, { clientX: 180, pointerId: 1 });

        // 80px at 40px per day is two days.
        expect(onMove.mock.calls[0]?.[0].startAt.toString()).toBe("2026-03-04");
        expect(onMove.mock.calls[0]?.[0].source).toBe("pointer");
        vi.unstubAllGlobals();
    });

    it("draws one dependency arrow per dependency", () => {
        const { container } = renderGantt();

        expect(container.querySelectorAll("svg path[marker-end]")).toHaveLength(1);
    });
});
