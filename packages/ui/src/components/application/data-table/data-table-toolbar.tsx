"use client";

import type { ReactNode } from "react";
import { parseDate } from "@internationalized/date";
import type { DateValue as AriaDateValue } from "react-aria-components";
import { Columns03, Rows01, Rows03, SearchLg } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { ButtonGroup, ButtonGroupItem } from "../../base/button-group/button-group";
import { Button } from "../../base/buttons/button";
import { Dropdown } from "../../base/dropdown/dropdown";
import { Input } from "../../base/input/input";
import { DateRangePicker } from "../date-picker/date-range-picker";
import { FilterBar } from "../filter-bar/filter-bar";
import type { DataTableColumn, DataTableDateRange, DataTableDensity, DataTableInstance, DataTableNumberRange } from "./use-data-table";
import { canHide, isFilterValueActive } from "./use-data-table";

export const styles = sortCx({
    root: "border-secondary border-b px-4 py-3 md:px-6",
    search: "min-w-0 max-md:flex-1 md:w-70",
    filterPanel: "flex flex-col gap-4 p-4",
    fieldset: "flex flex-col gap-1.5",
    legend: "text-secondary mb-1.5 text-sm font-medium",
    rangeFields: "flex items-center gap-2",
});

/* -------------------------------------------------------------------------------------------------
 * Faceted (select) filter
 * -----------------------------------------------------------------------------------------------*/

export interface DataTableFacetedFilterProps<T> {
    /** The value returned by `useDataTable`. */
    table: DataTableInstance<T>;
    /** The column to filter. Its `filter.type` should be `"select"`. */
    column: DataTableColumn<T>;
}

/** A toolbar button that opens a multi-select menu of a column's distinct values, with counts. */
export const DataTableFacetedFilter = <T,>({ table, column }: DataTableFacetedFilterProps<T>) => {
    const value = table.state.columnFilters[column.id];
    const selected = Array.isArray(value) ? value : [];
    const facets = table.getFacets(column.id);

    return (
        <Dropdown.Root>
            <FilterBar.FilterButton count={selected.length}>{column.header}</FilterBar.FilterButton>
            <Dropdown.Popover placement="bottom start" className="w-56">
                <Dropdown.Menu
                    aria-label={`Filter by ${column.header}`}
                    selectionMode="multiple"
                    selectedKeys={new Set(selected)}
                    onSelectionChange={(keys) => table.setColumnFilter(column.id, keys === "all" ? facets.map((facet) => facet.value) : [...keys].map(String))}
                    items={facets.map((facet) => ({ ...facet, id: facet.value }))}
                >
                    {(facet) => (
                        <Dropdown.Item id={facet.value} textValue={facet.label} addon={String(facet.count)} selectionIndicator="checkbox">
                            {facet.label}
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};

/* -------------------------------------------------------------------------------------------------
 * Filter fields (text, number range, date range)
 * -----------------------------------------------------------------------------------------------*/

const toNumber = (value: string) => (value.trim() === "" || Number.isNaN(Number(value)) ? undefined : Number(value));

const toDateRangeValue = (range: DataTableDateRange | undefined) => {
    if (!range?.start || !range.end) return null;
    try {
        return { start: parseDate(range.start), end: parseDate(range.end) };
    } catch {
        return null;
    }
};

export interface DataTableFilterFieldProps<T> {
    /** The value returned by `useDataTable`. */
    table: DataTableInstance<T>;
    /** The column to filter. */
    column: DataTableColumn<T>;
}

/** The input for one column filter: a text field, a min/max pair, or a date range picker. */
export const DataTableFilterField = <T,>({ table, column }: DataTableFilterFieldProps<T>) => {
    const filter = column.filter;
    const value = table.state.columnFilters[column.id];

    if (!filter || filter.type === "select") return null;

    if (filter.type === "number-range") {
        const range = (value ?? {}) as DataTableNumberRange;
        return (
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>{column.header}</legend>
                <div className={styles.rangeFields}>
                    <Input
                        size="sm"
                        type="number"
                        aria-label={`Minimum ${column.header}`}
                        placeholder={filter.min !== undefined ? `Min ${filter.min}` : "Min"}
                        min={filter.min}
                        max={filter.max}
                        step={filter.step}
                        value={range.min === undefined ? "" : String(range.min)}
                        onChange={(next) => table.setColumnFilter(column.id, { ...range, min: toNumber(next) })}
                    />
                    <span aria-hidden="true" className="text-quaternary text-sm">
                        –
                    </span>
                    <Input
                        size="sm"
                        type="number"
                        aria-label={`Maximum ${column.header}`}
                        placeholder={filter.max !== undefined ? `Max ${filter.max}` : "Max"}
                        min={filter.min}
                        max={filter.max}
                        step={filter.step}
                        value={range.max === undefined ? "" : String(range.max)}
                        onChange={(next) => table.setColumnFilter(column.id, { ...range, max: toNumber(next) })}
                    />
                </div>
            </fieldset>
        );
    }

    if (filter.type === "date-range") {
        return (
            <DateRangePicker
                label={column.header}
                value={toDateRangeValue(value as DataTableDateRange | undefined)}
                onChange={(range: { start: AriaDateValue; end: AriaDateValue } | null) =>
                    table.setColumnFilter(column.id, range ? { start: range.start.toString().slice(0, 10), end: range.end.toString().slice(0, 10) } : undefined)
                }
            />
        );
    }

    return (
        <Input
            size="sm"
            label={column.header}
            placeholder={filter.placeholder ?? `Filter ${column.header.toLocaleLowerCase()}`}
            value={typeof value === "string" ? value : ""}
            onChange={(next) => table.setColumnFilter(column.id, next)}
        />
    );
};

/* -------------------------------------------------------------------------------------------------
 * Column visibility + density
 * -----------------------------------------------------------------------------------------------*/

export interface DataTableViewOptionsProps<T> {
    /** The value returned by `useDataTable`. */
    table: DataTableInstance<T>;
    /**
     * Label of the trigger button.
     * @default "Columns"
     */
    label?: string;
}

/** A "Columns" dropdown of checkboxes that shows and hides columns. */
export const DataTableViewOptions = <T,>({ table, label = "Columns" }: DataTableViewOptionsProps<T>) => {
    const visible = new Set(table.visibleColumns.map((column) => column.id));
    const locked = table.columns.filter((column) => !canHide(column)).map((column) => column.id);

    return (
        <Dropdown.Root>
            <Button color="secondary" size="sm" iconLeading={Columns03}>
                {label}
            </Button>
            <Dropdown.Popover placement="bottom end" className="w-56">
                <Dropdown.Menu
                    aria-label="Toggle columns"
                    selectionMode="multiple"
                    selectedKeys={visible}
                    disabledKeys={locked}
                    onSelectionChange={table.setVisibleColumnKeys}
                    items={table.columns.map((column) => ({ id: column.id, header: column.header }))}
                >
                    {(column) => (
                        <Dropdown.Item id={column.id} textValue={column.header} selectionIndicator="checkbox">
                            {column.header}
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};

export interface DataTableDensityToggleProps {
    /** The current density. */
    value: DataTableDensity;
    /** Called with the new density. */
    onChange: (density: DataTableDensity) => void;
}

/** A two-button group that switches rows between the default and compact heights. */
export const DataTableDensityToggle = ({ value, onChange }: DataTableDensityToggleProps) => (
    <ButtonGroup
        size="sm"
        aria-label="Row density"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
            const [next] = [...keys];
            if (next === "sm" || next === "md") onChange(next);
        }}
    >
        <ButtonGroupItem id="md" iconLeading={Rows01} aria-label="Comfortable rows" />
        <ButtonGroupItem id="sm" iconLeading={Rows03} aria-label="Compact rows" />
    </ButtonGroup>
);

/* -------------------------------------------------------------------------------------------------
 * Toolbar
 * -----------------------------------------------------------------------------------------------*/

export interface DataTableToolbarProps<T> {
    /** The value returned by `useDataTable`. */
    table: DataTableInstance<T>;
    /** Show the search field. @default true */
    showSearch?: boolean;
    /** Placeholder (and accessible name) of the search field. @default "Search" */
    searchPlaceholder?: string;
    /** Show the "Columns" visibility menu. @default true */
    showColumnVisibility?: boolean;
    /** Show the row density toggle. @default true */
    showDensityToggle?: boolean;
    /** Extra controls rendered at the end of the toolbar. */
    children?: ReactNode;
    /** Classes merged onto the toolbar. */
    className?: string;
}

/**
 * The bar above a data table: search, one faceted button per `select` filter, a "Filters" panel
 * for text/number/date filters, "Clear all", the column visibility menu and the density toggle.
 */
export const DataTableToolbar = <T,>({
    table,
    showSearch = true,
    searchPlaceholder = "Search",
    showColumnVisibility = true,
    showDensityToggle = true,
    children,
    className,
}: DataTableToolbarProps<T>) => {
    const facetedColumns = table.columns.filter((column) => column.filter?.type === "select");
    const fieldColumns = table.columns.filter((column) => column.filter && column.filter.type !== "select");
    const fieldFilterCount = fieldColumns.filter((column) => isFilterValueActive(table.state.columnFilters[column.id])).length;

    return (
        <div className={cx(styles.root, className)}>
            <FilterBar>
                <FilterBar.Content>
                    {showSearch ? (
                        <Input
                            size="sm"
                            type="search"
                            aria-label={searchPlaceholder}
                            placeholder={searchPlaceholder}
                            icon={SearchLg}
                            className={styles.search}
                            value={table.state.globalFilter}
                            onChange={table.setGlobalFilter}
                        />
                    ) : null}
                    {facetedColumns.map((column) => (
                        <DataTableFacetedFilter key={column.id} table={table} column={column} />
                    ))}
                    {table.hasActiveFilters ? (
                        <Button color="link-gray" size="sm" onPress={table.resetFilters}>
                            Clear all
                        </Button>
                    ) : null}
                </FilterBar.Content>

                <FilterBar.Actions>
                    {fieldColumns.length > 0 ? (
                        <FilterBar.FilterDropdown count={fieldFilterCount} popoverClassName="w-80">
                            <div className={styles.filterPanel}>
                                {fieldColumns.map((column) => (
                                    <DataTableFilterField key={column.id} table={table} column={column} />
                                ))}
                            </div>
                        </FilterBar.FilterDropdown>
                    ) : null}
                    {showColumnVisibility ? <DataTableViewOptions table={table} /> : null}
                    {showDensityToggle ? <DataTableDensityToggle value={table.density} onChange={table.setDensity} /> : null}
                    {children}
                </FilterBar.Actions>
            </FilterBar>
        </div>
    );
};
DataTableToolbar.displayName = "DataTableToolbar";
