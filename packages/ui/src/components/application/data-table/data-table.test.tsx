import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { DataTable } from "./data-table";
import * as Demos from "./data-table.demo";
import type { DataTableColumn } from "./use-data-table";

// React Aria's `Virtualizer` sizes its viewport from the scroll view's client box, which jsdom
// always reports as 0. Give every element a plausible box so the virtualized demo lays out rows.
const mockClientBox = () => {
    const width = vi.spyOn(window.HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 1000);
    const height = vi.spyOn(window.HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => 480);
    return () => {
        width.mockRestore();
        height.mockRestore();
    };
};

const bodyRows = () => within(screen.getByRole("grid")).getAllByRole("row").slice(1);
const firstColumnText = () => bodyRows().map((row) => within(row).getByRole("rowheader").textContent);

describe("DataTable", () => {
    let restore: () => void;
    beforeEach(() => {
        restore = mockClientBox();
    });
    afterEach(() => restore());

    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("sorts when a column header is clicked, and reverses on a second click", () => {
        render(<Demos.BasicSortable />);

        const names = firstColumnText();
        expect(names).toEqual([...names].sort((a, b) => a!.localeCompare(b!)));

        const header = screen.getByRole("columnheader", { name: /Name/ });
        expect(header).toHaveAttribute("aria-sort", "ascending");

        fireEvent.click(header);
        expect(header).toHaveAttribute("aria-sort", "descending");
        expect(firstColumnText()).toEqual([...names].reverse());

        fireEvent.click(screen.getByRole("columnheader", { name: /Salary/ }));
        const salaries = bodyRows().map((row) => Number(within(row).getAllByRole("gridcell").at(-1)!.textContent!.replace(/\D/g, "")));
        expect(salaries).toEqual([...salaries].sort((a, b) => a - b));
    });

    it("filters rows as the search text changes", () => {
        render(<Demos.FiltersAndColumnVisibility />);
        expect(bodyRows()).toHaveLength(10);

        fireEvent.change(screen.getByRole("searchbox", { name: "Search people" }), { target: { value: "olivia" } });

        const rows = bodyRows();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThan(10);
        for (const row of rows) expect(row.textContent!.toLowerCase()).toContain("olivia");
    });

    it("narrows rows with a faceted filter and counts the active choices", () => {
        render(<Demos.FiltersAndColumnVisibility />);

        fireEvent.click(screen.getByRole("button", { name: "Status" }));
        fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /Invited/ }));

        const rows = bodyRows();
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) expect(row).toHaveTextContent("Invited");
        expect(screen.getByRole("button", { name: /Status\s*1/ })).toBeInTheDocument();
    });

    it("shows the empty state when nothing matches, and clears filters from it", () => {
        render(<Demos.FiltersAndColumnVisibility />);

        fireEvent.change(screen.getByRole("searchbox", { name: "Search people" }), { target: { value: "no such person" } });
        expect(screen.getByText("No results found")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
        expect(bodyRows()).toHaveLength(10);
    });

    it("removes a column when it is unchecked in the Columns menu", () => {
        render(<Demos.FiltersAndColumnVisibility />);
        expect(screen.getByRole("columnheader", { name: /Role/ })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Columns" }));
        fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Role" }));

        expect(screen.queryByRole("columnheader", { name: /Role/ })).toBeNull();
    });

    it("hides a column from its column menu", () => {
        render(<Demos.FiltersAndColumnVisibility />);

        fireEvent.click(screen.getByRole("button", { name: "Team column options" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Hide column" }));

        expect(screen.queryByRole("columnheader", { name: /Team/ })).toBeNull();
    });

    it("shows the bulk-action bar with the selected count once rows are selected", () => {
        render(<Demos.SelectionAndBulkActions />);
        expect(screen.queryByRole("status")).toBeNull();

        const [first, second] = bodyRows();
        fireEvent.click(within(first!).getByRole("checkbox"));
        fireEvent.click(within(second!).getByRole("checkbox"));

        expect(screen.getByRole("status")).toHaveTextContent("2 selected");
        expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(screen.queryByRole("status")).toBeNull();
        expect(screen.getByText("22 people")).toBeInTheDocument();
    });

    it("renders far fewer rows than the data length when virtualized", () => {
        render(<Demos.Virtualized5000Rows />);

        const grid = screen.getByRole("grid");
        expect(grid).toHaveAttribute("aria-rowcount", "5001");

        const rendered = bodyRows().length;
        expect(rendered).toBeGreaterThan(0);
        expect(rendered).toBeLessThan(50);
    });

    it("reports queries to the server in manual mode and renders the page it returns", async () => {
        vi.useFakeTimers();
        try {
            render(<Demos.ServerSideMode />);
            // Skeleton rows while the first request is in flight.
            expect(bodyRows()).toHaveLength(8);
            expect(screen.queryAllByRole("rowheader").every((cell) => cell.textContent === "Loading")).toBe(true);

            await act(async () => {
                await vi.advanceTimersByTimeAsync(500);
            });
            expect(screen.getByText("137 results")).toBeInTheDocument();
            expect(bodyRows()).toHaveLength(8);

            fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), { target: { value: "olivia" } });
            await act(async () => {
                await vi.advanceTimersByTimeAsync(500);
            });
            for (const row of bodyRows()) expect(row.textContent!.toLowerCase()).toContain("olivia");
        } finally {
            vi.useRealTimers();
        }
    });

    it("renders skeleton rows while loading and a custom empty state otherwise", () => {
        const columns: DataTableColumn<{ id: string; name: string }>[] = [{ id: "name", header: "Name", isRowHeader: true }];

        const { rerender, container } = render(<DataTable aria-label="People" data={[]} columns={columns} isLoading loadingRowCount={3} showToolbar={false} />);
        expect(bodyRows()).toHaveLength(3);
        expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);

        rerender(<DataTable aria-label="People" data={[]} columns={columns} emptyState={<p>Nobody yet</p>} showToolbar={false} />);
        expect(screen.getByText("Nobody yet")).toBeInTheDocument();
    });

    it("switches row density from the toolbar", () => {
        const { container } = render(<Demos.FiltersAndColumnVisibility />);
        expect(container.querySelector("tbody tr")?.className).toContain("h-18");

        fireEvent.click(screen.getByRole("radio", { name: "Compact rows" }));
        expect(container.querySelector("tbody tr")?.className).toContain("h-14");
    });

    it("pages through filtered rows on the client", () => {
        render(<Demos.FiltersAndColumnVisibility />);
        expect(screen.getByText("1–10 of 48")).toBeInTheDocument();

        fireEvent.click(screen.getAllByRole("button", { name: "Go to next page" })[0]!);
        expect(screen.getByText("11–20 of 48")).toBeInTheDocument();
    });
});
