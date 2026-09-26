"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Key as AriaKey, Selection as AriaSelection, SortDescriptor as AriaSortDescriptor } from "react-aria-components";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

export type DataTableSortDirection = "ascending" | "descending";

/** One entry of the sort stack. The first entry is the primary sort, the rest break ties. */
export interface DataTableSort {
    /** The `id` of the sorted column. */
    column: string;
    /** The sort direction. */
    direction: DataTableSortDirection;
}

/** One choice of a `select` (faceted) filter. */
export interface DataTableFilterOption {
    /** The value compared against the column's cell value. */
    value: string;
    /** The label shown in the filter menu. Defaults to `value`. */
    label?: string;
}

/**
 * How a column can be filtered.
 * - `text`: case-insensitive "contains" match.
 * - `select`: faceted multi-select; a row matches when its value is one of the chosen values.
 * - `number-range`: inclusive `min`/`max` bounds.
 * - `date-range`: inclusive ISO `start`/`end` dates (`YYYY-MM-DD`), picked with `DateRangePicker`.
 */
export type DataTableFilter =
    | { type: "text"; placeholder?: string }
    | { type: "select"; options?: DataTableFilterOption[] }
    | { type: "number-range"; min?: number; max?: number; step?: number }
    | { type: "date-range" };

/** Inclusive bounds of a `number-range` filter. Either bound may be left open. */
export interface DataTableNumberRange {
    min?: number;
    max?: number;
}

/** Inclusive ISO (`YYYY-MM-DD`) bounds of a `date-range` filter. Either bound may be left open. */
export interface DataTableDateRange {
    start?: string;
    end?: string;
}

/** A column filter's value: `string` (text), `string[]` (select), or a range object. */
export type DataTableFilterValue = string | string[] | DataTableNumberRange | DataTableDateRange;

/** Column filter values keyed by column `id`. */
export type DataTableColumnFilters = Record<string, DataTableFilterValue | undefined>;

export type DataTableDensity = "sm" | "md";

export interface DataTablePagination {
    /** The current page, 1-based. */
    page: number;
    /** Rows per page. */
    pageSize: number;
}

/** Column ids pinned to the start or end edge, in display order. */
export interface DataTableColumnPinning {
    start: string[];
    end: string[];
}

export interface DataTableState {
    /** The sort stack. Empty for unsorted. */
    sorting: DataTableSort[];
    /** The toolbar search text, matched against every searchable column. */
    globalFilter: string;
    /** Per-column filter values. */
    columnFilters: DataTableColumnFilters;
    /** `false` hides a column; a missing entry means visible. */
    columnVisibility: Record<string, boolean>;
    /** Columns pinned to either edge. */
    columnPinning: DataTableColumnPinning;
    /** React Aria selection: `"all"` or a set of row ids. */
    selectedKeys: AriaSelection;
    /** Current page and page size. */
    pagination: DataTablePagination;
    /** Row density. */
    density: DataTableDensity;
}

/** Everything a server needs to answer one request in `manual` mode. */
export interface DataTableQuery {
    sorting: DataTableSort[];
    globalFilter: string;
    columnFilters: DataTableColumnFilters;
    pagination: DataTablePagination;
}

export interface DataTableCellContext {
    /** The current row density, for cells that render a smaller layout in compact mode. */
    density: DataTableDensity;
}

export interface DataTableColumn<T> {
    /** Unique column id. Also the default accessor key into each row. */
    id: string;
    /** The column label: shown in the header, the column menu and the column visibility menu. */
    header: string;
    /** Render `header` visually hidden, e.g. for an icon-only "Actions" column. */
    hideHeader?: boolean;
    /** How to read the column's value from a row. A key of the row, or a function. Defaults to `row[id]`. */
    accessor?: keyof T | ((row: T) => unknown);
    /** Renders the cell. Defaults to the accessor value as text. */
    cell?: (row: T, context: DataTableCellContext) => ReactNode;
    /** Whether clicking the header sorts by this column. */
    enableSorting?: boolean;
    /** A custom ascending comparator. Defaults to a locale-aware comparison of the accessor values. */
    sortingFn?: (a: T, b: T) => number;
    /** Whether the toolbar search looks at this column. @default true */
    enableGlobalFilter?: boolean;
    /** How to extract the searchable text. Defaults to the accessor value as text. */
    searchValue?: (row: T) => string;
    /** The column's filter, shown in the toolbar. */
    filter?: DataTableFilter;
    /** A custom predicate for the column filter. Defaults to the built-in predicate for `filter.type`. */
    filterFn?: (row: T, value: DataTableFilterValue) => boolean;
    /** Whether the column can be hidden from the column visibility menu. @default true, except for the row-header column */
    enableHiding?: boolean;
    /** Whether the column labels its row for assistive tech. Give exactly one column this. */
    isRowHeader?: boolean;
    /** Pin the column to an edge by default. Pinned columns need a `width`. */
    pinned?: "start" | "end";
    /** Column width in px. Used by resizing, virtualization and pinning offsets. */
    width?: number;
    /** Minimum width in px when resizing. */
    minWidth?: number;
    /** Maximum width in px when resizing. */
    maxWidth?: number;
    /** A help tooltip shown next to the header label. */
    tooltip?: string;
    /** Classes merged onto every body cell of the column. */
    className?: string;
    /** Classes merged onto the header cell. */
    headerClassName?: string;
}

/** A processed row: a stable `id` plus the original record. */
export interface DataTableRow<T> {
    id: AriaKey;
    original: T;
}

export interface UseDataTableOptions<T> {
    /** The records. In `manual` mode, only the current page. */
    data: readonly T[];
    /** Column definitions, in display order. */
    columns: readonly DataTableColumn<T>[];
    /** Returns a stable id for a row. Defaults to `row.id`, falling back to the row's index in `data`. */
    getRowId?: (row: T, index: number) => AriaKey;
    /** State to start from. Every key is optional. */
    initialState?: Partial<DataTableState>;
    /**
     * Keep earlier sorts as tie-breakers when another column is sorted: the newly clicked
     * column becomes the primary sort and the previous ones follow it. @default false
     */
    enableMultiSort?: boolean;
    /** How many columns the multi-sort stack keeps. @default 3 */
    maxMultiSortColumns?: number;
    /** Split rows into pages. Turn it off for virtualized tables. @default true */
    enablePagination?: boolean;
    /**
     * Delegate sorting, filtering and pagination to a server. `data` is then taken as the current
     * page as-is, `rowCount` gives the total, and `onQueryChange` reports what to fetch.
     * @default false
     */
    manual?: boolean;
    /** The total number of rows on the server, in `manual` mode. Defaults to `data.length`. */
    rowCount?: number;
    /** Called with the full query on mount and whenever sorting, filters or pagination change. */
    onQueryChange?: (query: DataTableQuery) => void;
    /** Called when the sort stack changes. */
    onSortingChange?: (sorting: DataTableSort[]) => void;
    /** Called when the search text changes. */
    onGlobalFilterChange?: (value: string) => void;
    /** Called when any column filter changes. */
    onColumnFiltersChange?: (filters: DataTableColumnFilters) => void;
    /** Called when the page or page size changes. */
    onPaginationChange?: (pagination: DataTablePagination) => void;
    /** Called when the selection changes, with the selected records that are currently loaded. */
    onSelectionChange?: (keys: AriaSelection, rows: T[]) => void;
    /** Called when a column is shown or hidden. */
    onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
}

/** A column in display order, with the state the header and cells need to render it. */
export interface DataTableVisibleColumn<T> {
    id: string;
    column: DataTableColumn<T>;
    /** Which edge the column is pinned to, if any. */
    pinned?: "start" | "end";
    /** The inline offset (px) of a pinned column from its edge. */
    pinOffset: number;
    /** Whether this is the last start-pinned or first end-pinned column (draws the divider). */
    isPinEdge: boolean;
    /** Position in the sort stack (1-based), or `undefined` when unsorted. */
    sortIndex?: number;
    /** Sort direction when sorted. */
    sortDirection?: DataTableSortDirection;
    /** The current density, so cached cells re-render when it changes. */
    density: DataTableDensity;
}

export interface DataTableFacet {
    value: string;
    label: string;
    /** How many rows in `data` hold this value. */
    count: number;
}

/* -------------------------------------------------------------------------------------------------
 * Pure helpers (exported for tests and custom tables)
 * -----------------------------------------------------------------------------------------------*/

const collator = typeof Intl !== "undefined" ? new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }) : undefined;

/** Reads a column's value from a row. */
export const getColumnValue = <T>(column: DataTableColumn<T>, row: T): unknown => {
    const { accessor } = column;
    if (typeof accessor === "function") return accessor(row);
    const key = (accessor ?? column.id) as keyof T;
    return row == null ? undefined : row[key];
};

/** Turns a cell value into text for search and faceting. */
export const valueToText = (value: unknown): string => {
    if (value == null) return "";
    if (Array.isArray(value)) return value.map(valueToText).join(" ");
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") return "";
    return String(value);
};

/** Normalises a `Date` or date string to `YYYY-MM-DD`, or `undefined` when it isn't one. */
export const toIsoDate = (value: unknown): string | undefined => {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    return undefined;
};

/** Compares two cell values ascending. `null`/`undefined` sort last in either direction (handled by the caller). */
export const compareValues = (a: unknown, b: unknown): number => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
    const first = valueToText(a);
    const second = valueToText(b);
    return collator ? collator.compare(first, second) : first.localeCompare(second);
};

/** Whether a filter value would narrow the rows at all. */
export const isFilterValueActive = (value: DataTableFilterValue | undefined): boolean => {
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return Object.values(value).some((bound) => bound !== undefined && bound !== "");
};

/** The built-in predicate for a column filter. */
export const matchesColumnFilter = <T>(column: DataTableColumn<T>, row: T, value: DataTableFilterValue): boolean => {
    if (column.filterFn) return column.filterFn(row, value);

    const cellValue = getColumnValue(column, row);

    switch (column.filter?.type) {
        case "select": {
            const chosen = value as string[];
            const cellValues = Array.isArray(cellValue) ? cellValue.map(valueToText) : [valueToText(cellValue)];
            return cellValues.some((item) => chosen.includes(item));
        }
        case "number-range": {
            const { min, max } = value as DataTableNumberRange;
            const number = typeof cellValue === "number" ? cellValue : Number(cellValue);
            if (Number.isNaN(number)) return false;
            return (min === undefined || number >= min) && (max === undefined || number <= max);
        }
        case "date-range": {
            const { start, end } = value as DataTableDateRange;
            const date = toIsoDate(cellValue);
            if (!date) return false;
            return (!start || date >= start) && (!end || date <= end);
        }
        default:
            return valueToText(cellValue).toLocaleLowerCase().includes(String(value).trim().toLocaleLowerCase());
    }
};

/** Whether a column may be hidden from the column visibility menu. */
export const canHide = <T>(column: DataTableColumn<T>) => column.enableHiding ?? !column.isRowHeader;

const defaultGetRowId = <T>(row: T, index: number): AriaKey => {
    const id = (row as { id?: unknown } | null)?.id;
    return typeof id === "string" || typeof id === "number" ? id : index;
};

const initialPinning = <T>(columns: readonly DataTableColumn<T>[], pinning?: DataTableColumnPinning): DataTableColumnPinning =>
    pinning ?? {
        start: columns.filter((column) => column.pinned === "start").map((column) => column.id),
        end: columns.filter((column) => column.pinned === "end").map((column) => column.id),
    };

/* -------------------------------------------------------------------------------------------------
 * Hook
 * -----------------------------------------------------------------------------------------------*/

/**
 * The state and row model behind `DataTable`. Owns sorting (single or stacked), the global search,
 * per-column filters, column visibility and pinning, row selection, pagination and density, and
 * returns the rows to render. Pair its return value with the existing `Table` primitives, or pass
 * it to `DataTableToolbar`/`DataTableColumnMenu` to build a custom layout.
 *
 * In `manual` mode nothing is sorted, filtered or sliced locally: `data` is rendered as the
 * current page and `onQueryChange` reports the query to send to the server.
 */
export const useDataTable = <T>({
    data,
    columns,
    getRowId = defaultGetRowId,
    initialState,
    enableMultiSort = false,
    maxMultiSortColumns = 3,
    enablePagination = true,
    manual = false,
    rowCount: rowCountProp,
    onQueryChange,
    onSortingChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    onPaginationChange,
    onSelectionChange,
    onColumnVisibilityChange,
}: UseDataTableOptions<T>) => {
    const [sorting, setSortingState] = useState<DataTableSort[]>(initialState?.sorting ?? []);
    const [globalFilter, setGlobalFilterState] = useState(initialState?.globalFilter ?? "");
    const [columnFilters, setColumnFiltersState] = useState<DataTableColumnFilters>(initialState?.columnFilters ?? {});
    const [columnVisibility, setColumnVisibilityState] = useState<Record<string, boolean>>(initialState?.columnVisibility ?? {});
    const [columnPinning, setColumnPinningState] = useState<DataTableColumnPinning>(() => initialPinning(columns, initialState?.columnPinning));
    const [selectedKeys, setSelectedKeysState] = useState<AriaSelection>(initialState?.selectedKeys ?? new Set());
    const [pagination, setPaginationState] = useState<DataTablePagination>({ page: 1, pageSize: 10, ...initialState?.pagination });
    const [density, setDensity] = useState<DataTableDensity>(initialState?.density ?? "md");

    /* ---------------------------------------------------------------- Row model */

    const allRows = useMemo<DataTableRow<T>[]>(() => data.map((row, index) => ({ id: getRowId(row, index), original: row })), [data, getRowId]);

    const columnsById = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);

    const filteredRows = useMemo(() => {
        if (manual) return allRows;

        const query = globalFilter.trim().toLocaleLowerCase();
        const searchable = columns.filter((column) => column.enableGlobalFilter !== false);
        const activeFilters = Object.entries(columnFilters).filter(
            (entry): entry is [string, DataTableFilterValue] => columnsById.has(entry[0]) && isFilterValueActive(entry[1]),
        );

        const filtered =
            !query && activeFilters.length === 0
                ? allRows
                : allRows.filter(({ original }) => {
                      const passesColumns = activeFilters.every(([id, value]) => matchesColumnFilter(columnsById.get(id)!, original, value));
                      if (!passesColumns) return false;
                      if (!query) return true;
                      return searchable.some((column) =>
                          (column.searchValue ? column.searchValue(original) : valueToText(getColumnValue(column, original)))
                              .toLocaleLowerCase()
                              .includes(query),
                      );
                  });

        const activeSorts = sorting.filter((sort) => columnsById.has(sort.column));
        if (activeSorts.length === 0) return filtered;

        return [...filtered].sort((a, b) => {
            for (const { column: id, direction } of activeSorts) {
                const column = columnsById.get(id)!;
                const factor = direction === "descending" ? -1 : 1;

                if (column.sortingFn) {
                    const result = column.sortingFn(a.original, b.original);
                    if (result !== 0) return result * factor;
                    continue;
                }

                const first = getColumnValue(column, a.original);
                const second = getColumnValue(column, b.original);
                // Empty values always sort last, whichever the direction.
                if (first == null || second == null) {
                    if (first == null && second == null) continue;
                    return first == null ? 1 : -1;
                }

                const result = compareValues(first, second);
                if (result !== 0) return result * factor;
            }
            return 0;
        });
    }, [manual, allRows, globalFilter, columns, columnFilters, columnsById, sorting]);

    const rowCount = manual ? (rowCountProp ?? data.length) : filteredRows.length;
    const pageCount = enablePagination ? Math.max(1, Math.ceil(rowCount / pagination.pageSize)) : 1;
    // Derived rather than stored, so shrinking the row count never leaves the table on an empty page.
    const page = Math.min(Math.max(1, pagination.page), pageCount);

    const rows = useMemo(() => {
        if (manual || !enablePagination) return filteredRows;
        const start = (page - 1) * pagination.pageSize;
        return filteredRows.slice(start, start + pagination.pageSize);
    }, [manual, enablePagination, filteredRows, page, pagination.pageSize]);

    /* ---------------------------------------------------------------- Columns */

    const visibleColumns = useMemo<DataTableVisibleColumn<T>[]>(() => {
        const visible = columns.filter((column) => columnVisibility[column.id] !== false);
        const start = columnPinning.start.flatMap((id) => visible.filter((column) => column.id === id));
        const end = columnPinning.end.flatMap((id) => visible.filter((column) => column.id === id));
        const middle = visible.filter((column) => !columnPinning.start.includes(column.id) && !columnPinning.end.includes(column.id));

        const sortIndex = new Map(sorting.map((sort, index) => [sort.column, { index: index + 1, direction: sort.direction }]));
        const view = (column: DataTableColumn<T>, pinned: "start" | "end" | undefined, pinOffset: number, isPinEdge: boolean): DataTableVisibleColumn<T> => ({
            id: column.id,
            column,
            pinned,
            pinOffset,
            isPinEdge,
            sortIndex: sortIndex.get(column.id)?.index,
            sortDirection: sortIndex.get(column.id)?.direction,
            density,
        });

        // A pinned column sits past every pinned column between it and its edge.
        const widthOf = (list: DataTableColumn<T>[]) => list.reduce((total, column) => total + (column.width ?? 0), 0);
        const startViews = start.map((column, index) => view(column, "start", widthOf(start.slice(0, index)), index === start.length - 1));
        const endViews = end.map((column, index) => view(column, "end", widthOf(end.slice(index + 1)), index === 0));

        return [...startViews, ...middle.map((column) => view(column, undefined, 0, false)), ...endViews];
    }, [columns, columnVisibility, columnPinning, sorting, density]);

    /* ---------------------------------------------------------------- Setters */

    const setPagination = useCallback(
        (next: DataTablePagination) => {
            setPaginationState(next);
            onPaginationChange?.(next);
        },
        [onPaginationChange],
    );

    const resetPage = useCallback(() => {
        setPaginationState((current) => (current.page === 1 ? current : { ...current, page: 1 }));
    }, []);

    const setSorting = useCallback(
        (next: DataTableSort[]) => {
            setSortingState(next);
            onSortingChange?.(next);
        },
        [onSortingChange],
    );

    /** Wire to `Table`'s `onSortChange`. */
    const onSortChange = useCallback(
        (descriptor: AriaSortDescriptor) => {
            const entry: DataTableSort = { column: String(descriptor.column), direction: descriptor.direction };
            const next = enableMultiSort ? [entry, ...sorting.filter((sort) => sort.column !== entry.column)].slice(0, maxMultiSortColumns) : [entry];
            setSorting(next);
        },
        [enableMultiSort, maxMultiSortColumns, sorting, setSorting],
    );

    const setGlobalFilter = useCallback(
        (value: string) => {
            setGlobalFilterState(value);
            resetPage();
            onGlobalFilterChange?.(value);
        },
        [resetPage, onGlobalFilterChange],
    );

    const setColumnFilters = useCallback(
        (next: DataTableColumnFilters) => {
            setColumnFiltersState(next);
            resetPage();
            onColumnFiltersChange?.(next);
        },
        [resetPage, onColumnFiltersChange],
    );

    const setColumnFilter = useCallback(
        (id: string, value: DataTableFilterValue | undefined) => {
            const next = { ...columnFilters };
            if (isFilterValueActive(value)) next[id] = value;
            else delete next[id];
            setColumnFilters(next);
        },
        [columnFilters, setColumnFilters],
    );

    /** Clears the search text and every column filter. */
    const resetFilters = useCallback(() => {
        setGlobalFilter("");
        setColumnFilters({});
    }, [setGlobalFilter, setColumnFilters]);

    const setColumnVisibility = useCallback(
        (next: Record<string, boolean>) => {
            setColumnVisibilityState(next);
            onColumnVisibilityChange?.(next);
        },
        [onColumnVisibilityChange],
    );

    /** Shows or hides one column. Columns with `enableHiding: false` stay visible. */
    const toggleColumnVisibility = useCallback(
        (id: string, visible?: boolean) => {
            const column = columnsById.get(id);
            if (!column || !canHide(column)) return;
            setColumnVisibility({ ...columnVisibility, [id]: visible ?? columnVisibility[id] === false });
        },
        [columnsById, columnVisibility, setColumnVisibility],
    );

    /** Makes exactly these columns visible (plus any that cannot be hidden). Wire to a multi-select menu. */
    const setVisibleColumnKeys = useCallback(
        (keys: AriaSelection) => {
            const next: Record<string, boolean> = {};
            for (const column of columns) next[column.id] = keys === "all" || keys.has(column.id) || !canHide(column);
            setColumnVisibility(next);
        },
        [columns, setColumnVisibility],
    );

    /** Pins a column to an edge, or unpins it with `false`. */
    const setColumnPin = useCallback((id: string, edge: "start" | "end" | false) => {
        setColumnPinningState((current) => {
            const start = current.start.filter((item) => item !== id);
            const end = current.end.filter((item) => item !== id);
            if (edge === "start") start.push(id);
            if (edge === "end") end.unshift(id);
            return { start, end };
        });
    }, []);

    const selectedRows = useMemo(
        () => (selectedKeys === "all" ? rows.map((row) => row.original) : allRows.filter((row) => selectedKeys.has(row.id)).map((row) => row.original)),
        [selectedKeys, rows, allRows],
    );

    const setSelectedKeys = useCallback(
        (keys: AriaSelection) => {
            setSelectedKeysState(keys);
            if (onSelectionChange) {
                const loaded = keys === "all" ? rows : allRows.filter((row) => keys.has(row.id));
                onSelectionChange(
                    keys,
                    loaded.map((row) => row.original),
                );
            }
        },
        [onSelectionChange, rows, allRows],
    );

    const clearSelection = useCallback(() => setSelectedKeys(new Set()), [setSelectedKeys]);

    const setPage = useCallback((next: number) => setPagination({ ...pagination, page: next }), [pagination, setPagination]);
    const setPageSize = useCallback((pageSize: number) => setPagination({ page: 1, pageSize }), [setPagination]);

    /** The distinct values of a column in `data`, with counts, for a faceted filter. */
    const getFacets = useCallback(
        (id: string): DataTableFacet[] => {
            const column = columnsById.get(id);
            if (!column) return [];

            const counts = new Map<string, number>();
            for (const { original } of allRows) {
                const value = getColumnValue(column, original);
                for (const item of Array.isArray(value) ? value : [value]) {
                    const text = valueToText(item);
                    if (text) counts.set(text, (counts.get(text) ?? 0) + 1);
                }
            }

            const options = column.filter?.type === "select" && column.filter.options ? column.filter.options : undefined;
            if (options) return options.map((option) => ({ value: option.value, label: option.label ?? option.value, count: counts.get(option.value) ?? 0 }));

            return [...counts.entries()].sort(([a], [b]) => compareValues(a, b)).map(([value, count]) => ({ value, label: value, count }));
        },
        [columnsById, allRows],
    );

    const activeFilterCount = Object.entries(columnFilters).filter(([id, value]) => columnsById.has(id) && isFilterValueActive(value)).length;

    /* ---------------------------------------------------------------- Server query */

    const query = useMemo<DataTableQuery>(
        () => ({ sorting, globalFilter, columnFilters, pagination: { page: pagination.page, pageSize: pagination.pageSize } }),
        [sorting, globalFilter, columnFilters, pagination.page, pagination.pageSize],
    );

    const onQueryChangeRef = useRef(onQueryChange);
    useEffect(() => {
        onQueryChangeRef.current = onQueryChange;
    });
    useEffect(() => {
        onQueryChangeRef.current?.(query);
    }, [query]);

    const primarySort = sorting[0];
    const sortDescriptor = useMemo<AriaSortDescriptor | undefined>(
        () => (primarySort ? { column: primarySort.column, direction: primarySort.direction } : undefined),
        [primarySort],
    );

    const state: DataTableState = {
        sorting,
        globalFilter,
        columnFilters,
        columnVisibility,
        columnPinning,
        selectedKeys,
        pagination: { page, pageSize: pagination.pageSize },
        density,
    };

    return {
        state,
        query,
        manual,
        enablePagination,
        /** Every column definition, in the order given. */
        columns,
        /** Visible columns in display order: start-pinned, unpinned, end-pinned. */
        visibleColumns,
        /** The rows to render: the current page, or every filtered row without pagination. */
        rows,
        /** Every row that passes the filters, sorted, before pagination. */
        filteredRows,
        /** Total rows after filtering (or `rowCount` in manual mode). */
        rowCount,
        pageCount,
        /** The primary sort, in the shape `Table`'s `sortDescriptor` expects. */
        sortDescriptor,
        onSortChange,
        setSorting,
        setGlobalFilter,
        setColumnFilter,
        setColumnFilters,
        resetFilters,
        activeFilterCount,
        hasActiveFilters: activeFilterCount > 0 || globalFilter.trim().length > 0,
        getFacets,
        setColumnVisibility,
        toggleColumnVisibility,
        setVisibleColumnKeys,
        setColumnPin,
        selectedKeys,
        selectedRows,
        selectedCount: selectedKeys === "all" ? rows.length : selectedKeys.size,
        setSelectedKeys,
        clearSelection,
        setPage,
        setPageSize,
        density,
        setDensity,
    };
};

export type DataTableInstance<T> = ReturnType<typeof useDataTable<T>>;
