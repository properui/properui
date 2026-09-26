"use client";

import type { Key as AriaKey } from "react-aria-components";
import { Button as AriaButton } from "react-aria-components";
import { ArrowDown, ArrowUp, DotsVertical, EyeOff, Pin01, Pin02 } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { Dropdown } from "../../base/dropdown/dropdown";
import type { DataTableInstance, DataTableVisibleColumn } from "./use-data-table";
import { canHide } from "./use-data-table";

export interface DataTableColumnMenuProps<T> {
    /** The value returned by `useDataTable`. */
    table: DataTableInstance<T>;
    /** The column this menu acts on, as listed in `table.visibleColumns`. */
    column: DataTableVisibleColumn<T>;
    /** Classes merged onto the trigger button. */
    className?: string;
}

/**
 * A per-column "more" menu for a header cell: sort ascending/descending, pin to either edge,
 * unpin, and hide. Items that don't apply to the column (sorting on an unsortable column, hiding
 * the row-header column) are left out.
 */
export const DataTableColumnMenu = <T,>({ table, column, className }: DataTableColumnMenuProps<T>) => {
    const { column: definition } = column;
    const sortable = !!definition.enableSorting;
    const hideable = canHide(definition);

    const onAction = (key: AriaKey) => {
        switch (key) {
            case "sort-ascending":
            case "sort-descending":
                table.onSortChange({ column: column.id, direction: key === "sort-ascending" ? "ascending" : "descending" });
                break;
            case "pin-start":
                table.setColumnPin(column.id, "start");
                break;
            case "pin-end":
                table.setColumnPin(column.id, "end");
                break;
            case "unpin":
                table.setColumnPin(column.id, false);
                break;
            case "hide":
                table.toggleColumnVisibility(column.id, false);
                break;
        }
    };

    return (
        <Dropdown.Root>
            <AriaButton
                aria-label={`${definition.header} column options`}
                className={(state) =>
                    cx(
                        "text-fg-quaternary outline-focus-ring hover:text-fg-quaternary_hover -my-1 flex size-6 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
                        state.isFocusVisible && "outline-2 outline-offset-2",
                        className,
                    )
                }
            >
                <DotsVertical aria-hidden="true" className="size-4" />
            </AriaButton>

            <Dropdown.Popover placement="bottom end" className="w-48">
                <Dropdown.Menu aria-label={`${definition.header} column options`} onAction={onAction}>
                    {sortable ? (
                        <Dropdown.Section>
                            <Dropdown.Item id="sort-ascending" textValue="Sort ascending" icon={ArrowUp}>
                                Sort ascending
                            </Dropdown.Item>
                            <Dropdown.Item id="sort-descending" textValue="Sort descending" icon={ArrowDown}>
                                Sort descending
                            </Dropdown.Item>
                        </Dropdown.Section>
                    ) : null}
                    {sortable ? <Dropdown.Separator /> : null}
                    <Dropdown.Section>
                        {column.pinned !== "start" ? (
                            <Dropdown.Item id="pin-start" textValue="Pin to start" icon={Pin01}>
                                Pin to start
                            </Dropdown.Item>
                        ) : null}
                        {column.pinned !== "end" ? (
                            <Dropdown.Item id="pin-end" textValue="Pin to end" icon={Pin02}>
                                Pin to end
                            </Dropdown.Item>
                        ) : null}
                        {column.pinned ? (
                            <Dropdown.Item id="unpin" textValue="Unpin" icon={Pin02}>
                                Unpin
                            </Dropdown.Item>
                        ) : null}
                    </Dropdown.Section>
                    {hideable ? <Dropdown.Separator /> : null}
                    {hideable ? (
                        <Dropdown.Section>
                            <Dropdown.Item id="hide" textValue="Hide column" icon={EyeOff}>
                                Hide column
                            </Dropdown.Item>
                        </Dropdown.Section>
                    ) : null}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};
DataTableColumnMenu.displayName = "DataTableColumnMenu";
