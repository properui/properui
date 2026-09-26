import { act, fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { Kanban, type KanbanColumnData, type KanbanMoveEvent } from "./kanban";
import * as Demos from "./kanban.demo";

const columns: KanbanColumnData[] = [
    {
        id: "todo",
        title: "To do",
        cards: [
            { id: "a", title: "Card A" },
            { id: "b", title: "Card B" },
        ],
    },
    { id: "done", title: "Done", cards: [{ id: "c", title: "Card C" }] },
];

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

const firstRow = (rows: HTMLElement[]) => {
    const [row] = rows;
    if (!row) throw new Error("The board rendered no cards.");
    return row;
};

/** Focuses a card and picks it up with its drag handle, like a keyboard user would. */
const pickUp = async (row: HTMLElement) => {
    act(() => row.focus());
    await press("ArrowRight");
    expect(document.activeElement).toHaveAttribute("aria-label", expect.stringContaining("Drag"));
    await press("Enter");
};

describe("Kanban", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("renders one labelled grid per column with a card count", () => {
        const { getAllByRole, getByRole } = render(<Kanban.Board aria-label="Board" defaultColumns={columns} />);

        expect(getAllByRole("grid").map((grid) => grid.getAttribute("aria-label"))).toEqual(["To do", "Done"]);
        expect(getByRole("heading", { name: "To do" }).parentElement).toHaveTextContent("2 cards");
    });

    it("reorders a card within its column with the keyboard", async () => {
        const onChange = vi.fn<(columns: KanbanColumnData[], move: KanbanMoveEvent) => void>();
        const { getAllByRole } = render(<Kanban.Board aria-label="Board" defaultColumns={columns} onChange={onChange} />);

        await pickUp(firstRow(getAllByRole("row")));
        expect(document.activeElement).toHaveAttribute("aria-label", "Insert between Card A and Card B");
        await press("ArrowDown");
        await press("Enter");

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.any(Array), { cardIds: ["a"], fromColumnId: "todo", toColumnId: "todo", index: 1 });
        expect(onChange.mock.lastCall?.[0][0]?.cards.map((card) => card.id)).toEqual(["b", "a"]);
    });

    it("moves a card to another column with the keyboard and fires onChange", async () => {
        const onChange = vi.fn<(columns: KanbanColumnData[], move: KanbanMoveEvent) => void>();
        const { getAllByRole, getByRole } = render(<Kanban.Board aria-label="Board" defaultColumns={columns} onChange={onChange} />);

        await pickUp(firstRow(getAllByRole("row")));
        // Tab jumps to the next column, the arrow keys pick a slot inside it.
        await press("Tab");
        await press("ArrowDown");
        expect(document.activeElement).toHaveAttribute("aria-label", "Insert before Card C");
        await press("Enter");
        await flush();

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.any(Array), { cardIds: ["a"], fromColumnId: "todo", toColumnId: "done", index: 0 });

        // Uncontrolled boards update themselves.
        expect(
            within(getByRole("grid", { name: "Done" }))
                .getAllByRole("row")
                .map((row) => row.textContent),
        ).toEqual(["Card A", "Card C"]);
    });

    it("collapses a column to a strip and expands it again", () => {
        const onCollapsedChange = vi.fn();
        const { getByRole, queryByRole } = render(
            <Kanban.Board aria-label="Board" defaultColumns={columns}>
                {(column) => <Kanban.Column id={column.id} isCollapsible onCollapsedChange={onCollapsedChange} />}
            </Kanban.Board>,
        );

        const collapse = getByRole("button", { name: "Collapse Done" });
        expect(collapse).toHaveAttribute("aria-expanded", "true");
        fireEvent.click(collapse);

        expect(onCollapsedChange).toHaveBeenCalledWith(true);
        expect(queryByRole("grid", { name: "Done" })).toBeNull();
        expect(getByRole("button", { name: "Expand Done" })).toHaveAttribute("aria-expanded", "false");
    });

    it("calls onAddCard with the column id", () => {
        const onAddCard = vi.fn();
        const { getByRole } = render(
            <Kanban.Board aria-label="Board" defaultColumns={columns}>
                {(column) => <Kanban.Column id={column.id} onAddCard={onAddCard} />}
            </Kanban.Board>,
        );

        fireEvent.click(getByRole("button", { name: "Add card to Done" }));
        expect(onAddCard).toHaveBeenCalledWith("done");
    });

    it("renders custom card content with renderCard", () => {
        const { getAllByRole } = render(
            <Kanban.Board aria-label="Board" defaultColumns={columns} renderCard={(card, column) => <span>{`${column.title}: ${card.title}`}</span>} />,
        );

        expect(getAllByRole("row")[2]).toHaveTextContent("Done: Card C");
    });
});
