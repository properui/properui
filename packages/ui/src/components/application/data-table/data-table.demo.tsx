"use client";

import { useCallback, useRef, useState } from "react";
import { Archive, Download01, Plus, Trash01 } from "@properui/icons";
import { Avatar } from "../../base/avatar/avatar";
import { BadgeWithDot } from "../../base/badges/badges";
import { Button } from "../../base/buttons/button";
import { DataTable } from "./data-table";
import { type Employee, employees, makeEmployees, statusColor } from "./data-table-data";
import type { DataTableColumn, DataTableQuery } from "./use-data-table";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

const nameColumn: DataTableColumn<Employee> = {
    id: "name",
    header: "Name",
    isRowHeader: true,
    enableSorting: true,
    width: 240,
    minWidth: 180,
    cell: (row, { density }) => (
        <div className="flex items-center gap-3">
            <Avatar src={row.avatarUrl} alt="" size={density === "sm" ? "xs" : "md"} />
            <div className="whitespace-nowrap">
                <p className="text-primary text-sm font-medium">{row.name}</p>
                {density === "md" ? <p className="text-tertiary text-sm">{row.email}</p> : null}
            </div>
        </div>
    ),
    searchValue: (row) => `${row.name} ${row.email}`,
};

const statusColumn: DataTableColumn<Employee> = {
    id: "status",
    header: "Status",
    enableSorting: true,
    width: 140,
    filter: { type: "select" },
    cell: (row) => (
        <BadgeWithDot size="sm" type="modern" color={statusColor[row.status]}>
            {row.status}
        </BadgeWithDot>
    ),
};

const columns: DataTableColumn<Employee>[] = [
    nameColumn,
    statusColumn,
    { id: "role", header: "Role", enableSorting: true, width: 200 },
    { id: "team", header: "Team", enableSorting: true, width: 140, filter: { type: "select" } },
    { id: "startDate", header: "Start date", enableSorting: true, width: 150, filter: { type: "date-range" }, cell: (row) => formatDate(row.startDate) },
    {
        id: "salary",
        header: "Salary",
        enableSorting: true,
        width: 140,
        filter: { type: "number-range", min: 0, step: 1000 },
        cell: (row) => <span className="tabular-nums">{currency.format(row.salary)}</span>,
    },
];

/** Plain sortable table: click a header to sort, click it again to reverse. */
export const BasicSortable = () => (
    <DataTable
        title="Team members"
        badge={`${employees.slice(0, 8).length} people`}
        data={employees.slice(0, 8)}
        columns={columns.filter((column) => column.id !== "team")}
        initialState={{ sorting: [{ column: "name", direction: "ascending" }] }}
        showToolbar={false}
        enablePagination={false}
    />
);

const filterColumns: DataTableColumn<Employee>[] = [
    ...columns,
    { id: "email", header: "Email", enableSorting: true, filter: { type: "text", placeholder: "Filter by email" } },
    { id: "location", header: "Location", enableSorting: true },
];

/**
 * Search, faceted Status/Team filters, a Filters panel (email text, salary range, start date
 * range), the Columns visibility menu, per-column menus, stacked sorting and a page size control.
 */
export const FiltersAndColumnVisibility = () => (
    <DataTable
        title="Directory"
        description="Search, filter, sort by several columns and choose which columns to show."
        data={employees}
        columns={filterColumns}
        enableMultiSort
        showColumnMenu
        initialState={{ columnVisibility: { email: false }, pagination: { page: 1, pageSize: 10 } }}
        pageSizeOptions={[10, 25, 50]}
        searchPlaceholder="Search people"
    />
);

/** Multiple selection with a bulk-action bar that appears once a row is selected. */
export const SelectionAndBulkActions = () => {
    const [data, setData] = useState(() => employees.slice(0, 24));

    return (
        <DataTable
            title="Members"
            badge={`${data.length} people`}
            headerActions={
                <Button size="sm" iconLeading={Plus}>
                    Invite
                </Button>
            }
            data={data}
            columns={columns}
            selectionMode="multiple"
            showDensityToggle={false}
            bulkActions={({ selectedRows, clearSelection }) => (
                <>
                    <Button size="sm" color="secondary" iconLeading={Download01}>
                        Export
                    </Button>
                    <Button size="sm" color="secondary" iconLeading={Archive}>
                        Archive
                    </Button>
                    <Button
                        size="sm"
                        color="secondary-destructive"
                        iconLeading={Trash01}
                        onPress={() => {
                            const removed = new Set(selectedRows.map((row) => row.id));
                            setData((current) => current.filter((row) => !removed.has(row.id)));
                            clearSelection();
                        }}
                    >
                        Delete
                    </Button>
                </>
            )}
        />
    );
};

const bigData = makeEmployees(5000);

/** 5,000 rows, rendered through React Aria's `Virtualizer`: only the rows in view exist in the DOM. */
export const Virtualized5000Rows = () => (
    <DataTable title="All employees" badge="5,000 rows" data={bigData} columns={columns} virtualized height={480} selectionMode="multiple" showDensityToggle />
);

/* ------------------------------------------------------------------ Server-side mode */

const serverData = makeEmployees(137);

/** A stand-in for an API: filters, sorts and pages on the "server", then resolves after a delay. */
const fetchEmployees = (query: DataTableQuery): Promise<{ rows: Employee[]; total: number }> =>
    new Promise((resolve) => {
        const search = query.globalFilter.trim().toLowerCase();
        const status = query.columnFilters.status as string[] | undefined;

        let rows = serverData.filter(
            (row) => (!search || `${row.name} ${row.email} ${row.role}`.toLowerCase().includes(search)) && (!status?.length || status.includes(row.status)),
        );

        const sort = query.sorting[0];
        if (sort) {
            const key = sort.column as keyof Employee;
            rows = [...rows].sort((a, b) => {
                const result = typeof a[key] === "number" ? (a[key] as number) - (b[key] as number) : String(a[key]).localeCompare(String(b[key]));
                return sort.direction === "descending" ? -result : result;
            });
        }

        const start = (query.pagination.page - 1) * query.pagination.pageSize;
        setTimeout(() => resolve({ rows: rows.slice(start, start + query.pagination.pageSize), total: rows.length }), 400);
    });

const serverColumns: DataTableColumn<Employee>[] = [
    nameColumn,
    { ...statusColumn, filter: { type: "select", options: [{ value: "Active" }, { value: "Invited" }, { value: "Suspended" }] } },
    { id: "role", header: "Role", enableSorting: true },
    { id: "salary", header: "Salary", enableSorting: true, cell: (row) => <span className="tabular-nums">{currency.format(row.salary)}</span> },
];

/**
 * `manual` mode: the table renders `data` as the current page and reports every sort, search,
 * filter and page change through `onQueryChange`; the demo answers from a mock API.
 */
export const ServerSideMode = () => {
    const [result, setResult] = useState<{ rows: Employee[]; total: number }>({ rows: [], total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const latestRequest = useRef(0);

    const onQueryChange = useCallback((query: DataTableQuery) => {
        const request = ++latestRequest.current;
        setIsLoading(true);
        fetchEmployees(query).then((response) => {
            // Drop responses to superseded queries, e.g. earlier keystrokes of a search.
            if (request !== latestRequest.current) return;
            setResult(response);
            setIsLoading(false);
        });
    }, []);

    return (
        <DataTable
            title="Employees"
            description="Sorted, filtered and paginated on the server."
            badge={`${result.total} results`}
            data={result.rows}
            columns={serverColumns}
            manual
            rowCount={result.total}
            isLoading={isLoading}
            onQueryChange={onQueryChange}
            initialState={{ pagination: { page: 1, pageSize: 8 } }}
            showColumnVisibility={false}
        />
    );
};

/* ------------------------------------------------------------------ Pinning + resizing */

const wideColumns: DataTableColumn<Employee>[] = [
    { ...nameColumn, pinned: "start" },
    statusColumn,
    { id: "role", header: "Role", enableSorting: true, width: 200 },
    { id: "team", header: "Team", enableSorting: true, width: 160 },
    { id: "location", header: "Location", enableSorting: true, width: 160 },
    { id: "email", header: "Email", width: 280 },
    { id: "startDate", header: "Start date", enableSorting: true, width: 160, cell: (row) => formatDate(row.startDate) },
    {
        id: "salary",
        header: "Salary",
        enableSorting: true,
        pinned: "end",
        width: 140,
        cell: (row) => <span className="text-primary font-medium tabular-nums">{currency.format(row.salary)}</span>,
    },
];

/** Name pinned to the start edge, salary to the end, and a header that stays put while the body scrolls. */
export const PinnedColumnsStickyHeader = () => (
    <DataTable
        title="Compensation"
        data={employees.slice(0, 20)}
        columns={wideColumns}
        stickyHeader
        maxHeight={400}
        showColumnMenu
        enablePagination={false}
        showDensityToggle={false}
        initialState={{ density: "sm" }}
    />
);

/** Drag the handle at a header's end edge (or focus it and use the arrow keys) to resize a column. */
export const ResizableColumns = () => (
    <DataTable
        title="Resizable columns"
        data={employees.slice(0, 6)}
        columns={columns.filter((column) => column.id !== "team")}
        resizable
        showToolbar={false}
        enablePagination={false}
    />
);
