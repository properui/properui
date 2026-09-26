import { fireEvent, render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizablePanelGroupProps, type ResizablePanelProps } from "./resizable";
import * as Demos from "./resizable.demo";

const Sample = ({ first, ...props }: Partial<ResizablePanelGroupProps> & { first?: Partial<ResizablePanelProps> }) => (
    <ResizablePanelGroup {...props}>
        <ResizablePanel id="first" defaultSize={50} minSize={20} maxSize={80} {...first}>
            First
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="second" minSize={20}>
            Second
        </ResizablePanel>
    </ResizablePanelGroup>
);

/** jsdom has no `PointerEvent`; without one `fireEvent.pointer*` drops `clientX` and `button`. */
beforeAll(() => {
    if (typeof window.PointerEvent === "function") return;

    class PointerEventShim extends MouseEvent {
        pointerId: number;
        constructor(type: string, init: PointerEventInit = {}) {
            super(type, init);
            this.pointerId = init.pointerId ?? 1;
        }
    }
    window.PointerEvent = PointerEventShim as unknown as typeof PointerEvent;
});

const growOf = (element: HTMLElement | null) => Number(element?.style.flexGrow);

describe("Resizable", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("exposes the handle as a focusable separator with its value", () => {
        const { getByRole } = render(<Sample />);
        const handle = getByRole("separator", { name: "Resize" });

        expect(handle).toHaveAttribute("tabindex", "0");
        expect(handle).toHaveAttribute("aria-orientation", "vertical");
        expect(handle).toHaveAttribute("aria-controls", "first");
        expect(handle).toHaveAttribute("aria-valuenow", "50");
        expect(handle).toHaveAttribute("aria-valuemin", "20");
        expect(handle).toHaveAttribute("aria-valuemax", "80");
    });

    it("splits the space left over between panels without a default size", () => {
        const { container } = render(<Sample first={{ defaultSize: 30 }} />);

        expect(growOf(container.querySelector("#first"))).toBe(30);
        expect(growOf(container.querySelector("#second"))).toBe(70);
    });

    it("resizes with the arrow keys and reports the layout", () => {
        const onLayoutChange = vi.fn();
        const { getByRole, container } = render(<Sample onLayoutChange={onLayoutChange} />);
        const handle = getByRole("separator");

        fireEvent.keyDown(handle, { key: "ArrowRight" });
        expect(handle).toHaveAttribute("aria-valuenow", "60");
        expect(onLayoutChange).toHaveBeenLastCalledWith([60, 40]);
        expect(growOf(container.querySelector("#first"))).toBe(60);

        fireEvent.keyDown(handle, { key: "ArrowLeft" });
        fireEvent.keyDown(handle, { key: "ArrowLeft" });
        expect(handle).toHaveAttribute("aria-valuenow", "40");
        expect(onLayoutChange).toHaveBeenLastCalledWith([40, 60]);
    });

    it("keeps both panels inside their limits", () => {
        const { getByRole } = render(<Sample />);
        const handle = getByRole("separator");

        fireEvent.keyDown(handle, { key: "End" });
        expect(handle).toHaveAttribute("aria-valuenow", "80");
        for (let step = 0; step < 10; step += 1) fireEvent.keyDown(handle, { key: "ArrowLeft" });
        expect(handle).toHaveAttribute("aria-valuenow", "20");
        fireEvent.keyDown(handle, { key: "Home" });
        expect(handle).toHaveAttribute("aria-valuenow", "20");
    });

    it("uses the up and down arrows for a vertical group", () => {
        const { getByRole } = render(<Sample direction="vertical" />);
        const handle = getByRole("separator");

        expect(handle).toHaveAttribute("aria-orientation", "horizontal");
        fireEvent.keyDown(handle, { key: "ArrowDown" });
        expect(handle).toHaveAttribute("aria-valuenow", "60");
        fireEvent.keyDown(handle, { key: "ArrowRight" });
        expect(handle).toHaveAttribute("aria-valuenow", "60");
    });

    it("flips the horizontal arrow keys in a right-to-left layout", () => {
        const { getByRole } = render(
            <div dir="rtl">
                <Sample />
            </div>,
        );
        const handle = getByRole("separator");

        fireEvent.keyDown(handle, { key: "ArrowLeft" });
        expect(handle).toHaveAttribute("aria-valuenow", "60");
    });

    it("collapses a collapsible panel past its minimum and restores it with Enter", () => {
        const onCollapsedChange = vi.fn();
        const { getByRole, container } = render(<Sample first={{ defaultSize: 30, collapsible: true, onCollapsedChange }} />);
        const handle = getByRole("separator");
        const first = container.querySelector<HTMLElement>("#first");

        fireEvent.keyDown(handle, { key: "ArrowLeft" });
        expect(handle).toHaveAttribute("aria-valuenow", "20");
        fireEvent.keyDown(handle, { key: "ArrowLeft" });
        expect(handle).toHaveAttribute("aria-valuenow", "0");
        expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
        expect(first).toHaveAttribute("data-collapsed");
        expect(first).toHaveAttribute("inert");

        fireEvent.keyDown(handle, { key: "Enter" });
        expect(handle).toHaveAttribute("aria-valuenow", "20");
        expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
    });

    it("starts from a saved layout", () => {
        const { getByRole } = render(<Sample defaultLayout={[35, 65]} />);

        expect(getByRole("separator")).toHaveAttribute("aria-valuenow", "35");
    });

    it("resizes by dragging the handle", () => {
        const onLayoutChange = vi.fn();
        const { getByRole, container } = render(<Sample onLayoutChange={onLayoutChange} />);
        const group = container.querySelector<HTMLElement>("[data-panel-group]");
        if (!group) throw new Error("No group");
        group.getBoundingClientRect = () => ({ width: 1000, height: 400, top: 0, left: 0, right: 1000, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });
        const handle = getByRole("separator");

        fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 500 });
        expect(handle).toHaveAttribute("data-dragging");
        fireEvent.pointerMove(handle, { pointerId: 1, clientX: 600 });
        fireEvent.pointerUp(handle, { pointerId: 1, clientX: 600 });

        expect(onLayoutChange).toHaveBeenLastCalledWith([60, 40]);
        expect(handle).not.toHaveAttribute("data-dragging");
    });
});
