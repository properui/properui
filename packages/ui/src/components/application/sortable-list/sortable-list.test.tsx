import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { SortableList, reorderItems } from "./sortable-list";
import * as Demos from "./sortable-list.demo";

const items = [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Bravo" },
    { id: "c", label: "Charlie" },
];

const Sample = (props: Partial<Parameters<typeof SortableList<(typeof items)[number]>>[0]>) => (
    <SortableList aria-label="Letters" items={items} {...props}>
        {(item) => <SortableList.Item id={item.id} textValue={item.label} />}
    </SortableList>
);

/** React Aria moves focus to the next drop target asynchronously. */
const flush = () =>
    act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
    });

const press = async (key: string) => {
    const target = document.activeElement ?? document.body;
    fireEvent.keyDown(target, { key });
    fireEvent.keyUp(target, { key });
    await flush();
};

describe("SortableList", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("renders a drag handle per row", () => {
        const { getAllByRole } = render(<Sample />);

        expect(getAllByRole("row")).toHaveLength(3);
        expect(getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["Drag Alpha", "Drag Bravo", "Drag Charlie"]);
    });

    it("reorders with the keyboard and passes the new order to onReorder", async () => {
        const onReorder = vi.fn<(next: typeof items) => void>();
        const { getAllByRole } = render(<Sample onReorder={onReorder} />);

        act(() => getAllByRole("row")[0]?.focus());
        await press("ArrowRight");
        await press("Enter");
        expect(document.activeElement).toHaveAttribute("aria-label", "Insert between Alpha and Bravo");
        await press("ArrowDown");
        expect(document.activeElement).toHaveAttribute("aria-label", "Insert between Bravo and Charlie");
        await press("Enter");

        expect(onReorder).toHaveBeenCalledTimes(1);
        expect(onReorder.mock.lastCall?.[0].map((item) => item.id)).toEqual(["b", "a", "c"]);
    });

    it("hides the handles when reordering is disabled", () => {
        const { queryAllByRole } = render(<Sample isDisabled />);

        expect(queryAllByRole("button")).toHaveLength(0);
    });

    it("moves several keys next to the target, keeping their order", () => {
        const next = reorderItems(items, { keys: new Set(["c", "a"]), target: { type: "item", key: "b", dropPosition: "after" } });

        expect(next.map((item) => item.id)).toEqual(["b", "a", "c"]);
    });
});
