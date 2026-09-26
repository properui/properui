"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import type { Key as AriaKey } from "react-aria-components";
import {
    ColumnResizer as AriaColumnResizer,
    ResizableTableContainer as AriaResizableTableContainer,
    TableLayout as AriaTableLayout,
    Virtualizer as AriaVirtualizer,
} from "react-aria-components";
import { ArrowDown, SearchLg } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { Button } from "../../base/buttons/button";
import { NativeSelect } from "../../base/select/select-native";
import { Skeleton } from "../../base/skeleton/skeleton";
import { EmptyState } from "../empty-state/empty-state";
import { Table, TableCard } from "../table/table";
import { TablePaginationNumbered } from "../table/table-pagination";
import { DataTableColumnMenu } from "./data-table-column-menu";
import { DataTableToolbar } from "./data-table-toolbar";
import type { DataTableDensity, DataTableInstance, DataTableRow, DataTableVisibleColumn, UseDataTableOptions } from "./use-data-table";
import { getColumnValue, useDataTable, valueToText } from "./use-data-table";

export const styles = sortCx({
    bulkBar: "border-secondary bg-secondary flex flex-wrap items-center gap-3 border-b px-4 py-3 md:px-6",
    bulkCount: "text-secondary text-sm font-semibold whitespace-nowrap",
    bulkActions: "flex flex-wrap items-center gap-2",
    stickyWrapper: "[&_div:has(>table)]:max-h-(--data-table-max-height) [&_div:has(>table)]:overflow-y-auto",
    stickyHeader: "sticky top-0 z-10",
    virtualTable: "block h-(--data-table-height) overflow-auto",
    pinnedHead: "bg-secondary sticky z-2",
    pinnedCell: "bg-primary group-hover/data-row:bg-secondary group-data-selected/data-row:bg-secondary sticky z-2",
    pinEdgeStart: "border-secondary border-e",
    pinEdgeEnd: "border-secondary border-s",
    resizer:
        "bg-border-secondary hover:bg-brand-solid focus-visible:bg-brand-solid data-resizing:bg-brand-solid absolute inset-y-2 end-0 w-0.5 cursor-col-resize touch-none rounded-full outline-hidden",
    skeletonCell: "h-3 w-full max-w-32 rounded-full",
    footer: "border-secondary flex flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:px-6 md:pt-3 md:pb-4",
    footerSummary: "flex items-center gap-3",
    footerRange: "text-tertiary text-sm whitespace-nowrap",
});

/** Row heights in px per density. They match `Table.Row`'s `h-14`/`h-18` and `Table.Header`'s `h-9`/`h-11`. */
const ROW_HEIGHT: Record<DataTableDensity, number> = { sm: 56, md: 72 };
const HEADER_HEIGHT: Record<DataTableDensity, number> = { sm: 36, md: 44 };

type SkeletonRow = { id: string; skeleton: true };
type BodyItem<T> = (DataTableRow<T> & { skeleton?: false }) | SkeletonRow;

export interface DataTableBulkActionsContext<T> {
    /** The selected records that are currently loaded. */
    selectedRows: T[];
    /** How many rows are selected. */
    selectedCount: number;
    /** Deselects every row. */
    clearSelection: () => void;
}

export interface DataTableProps<T> extends UseDataTableOptions<T> {
    /** Accessible name of the grid. Defaults to `title`. */
    "aria-label"?: string;
    /** Card header title. Omit to render no card header. */
    title?: string;
    /** Card header description. */
    description?: string;
    /** Badge beside the title, e.g. a row count. */
    badge?: ReactNode;
    /** Content at the end of the card header, e.g. "Add" buttons. */
    headerActions?: ReactNode;
    /** Row selection, with React Aria's semantics. @default "none" */
    selectionMode?: "none" | "single" | "multiple";
    /** Rows that cannot be selected or actioned. */
    disabledKeys?: Iterable<AriaKey>;
    /** Buttons for the bulk-action bar that appears while rows are selected. */
    bulkActions?: (context: DataTableBulkActionsContext<T>) => ReactNode;
    /** Called when a row is actioned (clicked, or Enter pressed). */
    onRowAction?: (row: T) => void;
    /** Show the toolbar. @default true */
    showToolbar?: boolean;
    /** Show the toolbar search field. @default true */
    showSearch?: boolean;
    /** Placeholder and accessible name of the search field. @default "Search" */
    searchPlaceholder?: string;
    /** Show the column visibility menu. @default true */
    showColumnVisibility?: boolean;
    /** Show the row density toggle. @default true */
    showDensityToggle?: boolean;
    /** Extra toolbar controls, rendered at its end. */
    toolbarActions?: ReactNode;
    /** Render a sort/pin/hide menu in every header cell. @default false */
    showColumnMenu?: boolean;
    /** Replace the rows with skeleton rows while data loads. */
    isLoading?: boolean;
    /** How many skeleton rows to render while loading. Defaults to the page size, capped at 10. */
    loadingRowCount?: number;
    /** Rendered in place of the rows when there are none. Defaults to a "No results found" empty state. */
    emptyState?: ReactNode;
    /**
     * Render only the rows in view, using React Aria's `Virtualizer` and `TableLayout`. Rows get a
     * fixed height per density, pagination is off by default, and column pinning is not applied.
     */
    virtualized?: boolean;
    /** The scroll height in px of a virtualized table. @default 480 */
    height?: number;
    /** Keep the header row visible while the body scrolls inside `maxHeight`. */
    stickyHeader?: boolean;
    /** The body's maximum height in px when `stickyHeader` is set. @default 480 */
    maxHeight?: number;
    /** Let columns be resized by dragging (or arrow keys on) the handle at their end edge. */
    resizable?: boolean;
    /** Page sizes offered in the footer. Omit to hide the page size control. */
    pageSizeOptions?: number[];
    /** Classes merged onto the card. */
    className?: string;
}

const pinStyle = <T,>(column: DataTableVisibleColumn<T>): CSSProperties | undefined => {
    if (!column.pinned) return undefined;
    const width = column.column.width;
    return {
        ...(column.pinned === "start" ? { insetInlineStart: column.pinOffset } : { insetInlineEnd: column.pinOffset }),
        ...(width ? { width, minWidth: width, maxWidth: width } : {}),
    };
};

const pinClass = <T,>(column: DataTableVisibleColumn<T>, isHeader: boolean) =>
    column.pinned
        ? cx(isHeader ? styles.pinnedHead : styles.pinnedCell, column.isPinEdge && (column.pinned === "start" ? styles.pinEdgeStart : styles.pinEdgeEnd))
        : undefined;

interface DataTableHeadContentProps<T> {
    table: DataTableInstance<T>;
    column: DataTableVisibleColumn<T>;
    showColumnMenu: boolean;
    resizable: boolean;
}

/** Everything a header cell renders after its label: stacked-sort position, the column menu and the resize handle. */
const DataTableHeadContent = <T,>({ table, column, showColumnMenu, resizable }: DataTableHeadContentProps<T>) => {
    const isStacked = table.state.sorting.length > 1 && column.sortIndex !== undefined;

    return (
        <>
            {column.column.hideHeader ? <span className="sr-only">{column.column.header}</span> : null}
            {isStacked && column.sortIndex! > 1 ? (
                <ArrowDown
                    aria-hidden="true"
                    strokeWidth={3}
                    className={cx("text-fg-quaternary size-3", column.sortDirection === "ascending" && "rotate-180")}
                />
            ) : null}
            {isStacked ? (
                <span className="text-quaternary text-xs font-semibold tabular-nums">
                    <span className="sr-only">, sort priority </span>
                    {column.sortIndex}
                </span>
            ) : null}
            {showColumnMenu ? <DataTableColumnMenu table={table} column={column} className="ms-1" /> : null}
            {resizable ? <AriaColumnResizer className={styles.resizer} /> : null}
        </>
    );
};

/**
 * A data table built on `Table`: sorting (single or stacked), search, faceted/text/number/date
 * filters, column visibility, pinning and resizing, row selection with a bulk-action bar,
 * client-side or server-side pagination, density, loading and empty states, and optional
 * virtualization for thousands of rows. `Table` stays the styling primitive; every visual detail
 * here comes from it, `TableCard` and `TablePaginationNumbered`.
 *
 * All state lives in `useDataTable`, which this component calls with its props. Set `manual` to
 * hand sorting, filtering and pagination to a server through `onQueryChange`.
 */
export const DataTable = <T,>({
    "aria-label": ariaLabel,
    title,
    description,
    badge,
    headerActions,
    selectionMode = "none",
    disabledKeys,
    bulkActions,
    onRowAction,
    showToolbar = true,
    showSearch = true,
    searchPlaceholder,
    showColumnVisibility = true,
    showDensityToggle = true,
    toolbarActions,
    showColumnMenu = false,
    isLoading = false,
    loadingRowCount,
    emptyState,
    virtualized = false,
    height = 480,
    stickyHeader = false,
    maxHeight = 480,
    resizable = false,
    pageSizeOptions,
    className,
    enablePagination,
    ...options
}: DataTableProps<T>) => {
    const table = useDataTable<T>({ ...options, enablePagination: enablePagination ?? !virtualized });
    const { density, visibleColumns, state } = table;

    // Sticky pinning relies on real table layout, which the virtualizer's absolutely positioned cells don't have.
    const columns = useMemo(
        () => (virtualized ? visibleColumns.map((column) => ({ ...column, pinned: undefined, pinOffset: 0, isPinEdge: false })) : visibleColumns),
        [virtualized, visibleColumns],
    );

    const skeletonCount = loadingRowCount ?? Math.min(state.pagination.pageSize, 10);
    const items: BodyItem<T>[] = isLoading
        ? Array.from({ length: skeletonCount }, (_, index) => ({ id: `data-table-skeleton-${index}`, skeleton: true }))
        : table.rows;
    const disabled = isLoading ? items.map((item) => item.id) : disabledKeys;

    // React Aria treats the first column as the row header when none is flagged; a skeleton row
    // still needs text in that cell, or axe reports an empty row header.
    const rowHeaderId = (columns.find((column) => column.column.isRowHeader) ?? columns[0])?.id;

    const showPagination = table.enablePagination && !virtualized;
    const firstRow = table.rowCount === 0 ? 0 : (state.pagination.page - 1) * state.pagination.pageSize + 1;
    const lastRow = Math.min(state.pagination.page * state.pagination.pageSize, table.rowCount);

    const grid = (
        <Table
            aria-label={ariaLabel ?? title}
            selectionMode={selectionMode}
            selectedKeys={state.selectedKeys}
            onSelectionChange={table.setSelectedKeys}
            disabledKeys={disabled}
            sortDescriptor={table.sortDescriptor}
            onSortChange={table.onSortChange}
            onRowAction={
                onRowAction
                    ? (key) => {
                          const row = table.rows.find((item) => item.id === key);
                          if (row) onRowAction(row.original);
                      }
                    : undefined
            }
            className={virtualized ? styles.virtualTable : undefined}
        >
            <Table.Header columns={columns} className={stickyHeader && !virtualized ? styles.stickyHeader : undefined}>
                {(column) => (
                    <Table.Head
                        id={column.id}
                        textValue={column.column.header}
                        label={column.column.hideHeader ? undefined : column.column.header}
                        tooltip={column.column.tooltip}
                        isRowHeader={column.column.isRowHeader}
                        allowsSorting={!!column.column.enableSorting && !isLoading}
                        defaultWidth={column.column.width}
                        minWidth={column.column.minWidth}
                        maxWidth={column.column.maxWidth}
                        style={pinStyle(column)}
                        className={cx(pinClass(column, true), column.column.headerClassName)}
                    >
                        <DataTableHeadContent table={table} column={column} showColumnMenu={showColumnMenu} resizable={resizable} />
                    </Table.Head>
                )}
            </Table.Header>

            <Table.Body
                items={items}
                dependencies={[columns, density, isLoading]}
                renderEmptyState={() =>
                    emptyState ?? (
                        <div className="flex justify-center px-6 py-12">
                            <EmptyState size="sm">
                                <EmptyState.Header pattern="none">
                                    <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>No results found</EmptyState.Title>
                                    <EmptyState.Description>
                                        {table.hasActiveFilters ? "No rows match your search and filters." : "There is nothing here yet."}
                                    </EmptyState.Description>
                                </EmptyState.Content>
                                {table.hasActiveFilters ? (
                                    <EmptyState.Footer>
                                        <Button size="sm" color="secondary" onPress={table.resetFilters}>
                                            Clear filters
                                        </Button>
                                    </EmptyState.Footer>
                                ) : null}
                            </EmptyState>
                        </div>
                    )
                }
            >
                {(item) => (
                    <Table.Row id={item.id} columns={columns} className="group/data-row">
                        {(column) => (
                            <Table.Cell style={pinStyle(column)} className={cx(pinClass(column, false), column.column.className)}>
                                {item.skeleton ? (
                                    <>
                                        <Skeleton className={styles.skeletonCell} />
                                        {column.id === rowHeaderId ? <span className="sr-only">Loading</span> : null}
                                    </>
                                ) : column.column.cell ? (
                                    column.column.cell(item.original, { density })
                                ) : (
                                    <span className={cx("whitespace-nowrap", column.column.isRowHeader && "text-primary font-medium")}>
                                        {valueToText(getColumnValue(column.column, item.original))}
                                    </span>
                                )}
                            </Table.Cell>
                        )}
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );

    const resizableGrid = resizable ? <AriaResizableTableContainer className="w-full">{grid}</AriaResizableTableContainer> : grid;

    return (
        <TableCard.Root size={density} className={className}>
            {title ? <TableCard.Header title={title} badge={badge} description={description} contentTrailing={headerActions} /> : null}

            {showToolbar ? (
                <DataTableToolbar
                    table={table}
                    showSearch={showSearch}
                    searchPlaceholder={searchPlaceholder}
                    showColumnVisibility={showColumnVisibility}
                    showDensityToggle={showDensityToggle}
                >
                    {toolbarActions}
                </DataTableToolbar>
            ) : null}

            {selectionMode !== "none" && table.selectedCount > 0 ? (
                <div className={styles.bulkBar}>
                    <p role="status" className={styles.bulkCount}>
                        {table.selectedCount} selected
                    </p>
                    {bulkActions ? (
                        <div className={styles.bulkActions}>
                            {bulkActions({ selectedRows: table.selectedRows, selectedCount: table.selectedCount, clearSelection: table.clearSelection })}
                        </div>
                    ) : null}
                    <Button color="link-gray" size="sm" className="ms-auto" onPress={table.clearSelection}>
                        Clear selection
                    </Button>
                </div>
            ) : null}

            {virtualized ? (
                <div style={{ "--data-table-height": `${height}px` } as CSSProperties}>
                    <AriaVirtualizer layout={AriaTableLayout} layoutOptions={{ rowHeight: ROW_HEIGHT[density], headingHeight: HEADER_HEIGHT[density] }}>
                        {resizableGrid}
                    </AriaVirtualizer>
                </div>
            ) : stickyHeader ? (
                <div className={styles.stickyWrapper} style={{ "--data-table-max-height": `${maxHeight}px` } as CSSProperties}>
                    {resizableGrid}
                </div>
            ) : (
                resizableGrid
            )}

            {showPagination ? (
                <div className={styles.footer}>
                    <div className={styles.footerSummary}>
                        {pageSizeOptions ? (
                            <NativeSelect
                                aria-label="Rows per page"
                                size="sm"
                                className="w-max"
                                value={String(state.pagination.pageSize)}
                                onChange={(event) => table.setPageSize(Number(event.target.value))}
                                options={pageSizeOptions.map((size) => ({ label: `${size} per page`, value: String(size) }))}
                            />
                        ) : null}
                        <p className={styles.footerRange}>
                            {firstRow}–{lastRow} of {table.rowCount}
                        </p>
                    </div>
                    <TablePaginationNumbered page={state.pagination.page} total={table.pageCount} onPageChange={table.setPage} className="flex-1 border-t-0" />
                </div>
            ) : null}
        </TableCard.Root>
    );
};
DataTable.displayName = "DataTable";
