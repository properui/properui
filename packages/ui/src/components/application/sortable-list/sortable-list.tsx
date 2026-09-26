"use client";

import type { FC, ReactNode } from "react";
import { createContext, useContext } from "react";
import type { DroppableCollectionReorderEvent as AriaDroppableCollectionReorderEvent, Key as AriaKey } from "react-aria-components";
import {
    Button as AriaButton,
    DropIndicator as AriaDropIndicator,
    GridList as AriaGridList,
    GridListItem as AriaGridListItem,
    // The repo requires an `Aria*` alias on every `react-aria-components` import, hooks included.
    useDragAndDrop as AriaUseDragAndDrop,
} from "react-aria-components";
import { DotsGrid } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";

const styles = sortCx({
    common: {
        root: "flex flex-col outline-hidden",
        item: "group/item relative flex items-center gap-3 bg-primary outline-focus-ring transition duration-100 ease-linear focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 data-dragging:opacity-50",
        handle: "flex shrink-0 cursor-grab items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 pressed:cursor-grabbing",
        content: "flex min-w-0 flex-1 items-center gap-3",
        label: "min-w-0 flex-1",
        title: "truncate text-sm font-medium text-secondary",
        description: "truncate text-sm text-tertiary",
        indicator: "rounded-full bg-transparent drop-target:bg-fg-brand-secondary",
    },
    variants: {
        bordered: {
            root: "overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset",
            item: "border-b border-secondary last:border-b-0",
            indicator: "-my-px h-0.5",
        },
        cards: {
            root: "gap-2",
            item: "rounded-lg shadow-xs ring-1 ring-secondary ring-inset hover:ring-primary",
            indicator: "-my-1.25 h-0.5",
        },
    },
    sizes: {
        sm: { item: "px-3 py-2.5", handle: "size-6", icon: "size-4" },
        md: { item: "px-4 py-3.5", handle: "size-7", icon: "size-5" },
    },
});

/** The container style of the list. */
export type SortableListVariant = keyof typeof styles.variants;
/** The density of the rows. */
export type SortableListSize = keyof typeof styles.sizes;

const SortableListContext = createContext<{ variant: SortableListVariant; size: SortableListSize }>({ variant: "bordered", size: "sm" });

/** Returns `items` with the dragged keys moved next to the drop target. */
export const reorderItems = <T extends { id: AriaKey }>(items: T[], event: Pick<AriaDroppableCollectionReorderEvent, "keys" | "target">): T[] => {
    const moving = items.filter((item) => event.keys.has(item.id));
    const rest = items.filter((item) => !event.keys.has(item.id));
    const targetIndex = rest.findIndex((item) => item.id === event.target.key);
    if (!moving.length || targetIndex === -1) return items;

    const index = event.target.dropPosition === "before" ? targetIndex : targetIndex + 1;
    return [...rest.slice(0, index), ...moving, ...rest.slice(index)];
};

export interface SortableListItemProps {
    /** A unique key for the row. It must match the `id` of the item in `items`. */
    id: AriaKey;
    /** A plain text representation of the row, used for typeahead and drag announcements. */
    textValue: string;
    /** An icon rendered after the handle. */
    icon?: FC<{ className?: string }>;
    /** Secondary text under the label. */
    description?: ReactNode;
    /** Content rendered at the end of the row, e.g. a toggle or a badge. */
    trailing?: ReactNode;
    /** Whether the row cannot be dragged. */
    isDisabled?: boolean;
    /** The class name applied to the row. */
    className?: string;
    /** The row label. Defaults to `textValue`. */
    children?: ReactNode;
}

/** A row with a drag handle. Keyboard users focus the handle and press Enter to pick the row up. */
const SortableListItem = ({ id, textValue, icon: Icon, description, trailing, isDisabled, className, children }: SortableListItemProps) => {
    const { variant, size } = useContext(SortableListContext);

    return (
        <AriaGridListItem
            id={id}
            textValue={textValue}
            isDisabled={isDisabled}
            className={cx(styles.common.item, styles.variants[variant].item, styles.sizes[size].item, className)}
        >
            {({ allowsDragging }) => (
                <>
                    {allowsDragging && (
                        <AriaButton slot="drag" className={cx(styles.common.handle, styles.sizes[size].handle)}>
                            <DotsGrid aria-hidden="true" className={styles.sizes[size].icon} />
                        </AriaButton>
                    )}
                    <div className={styles.common.content}>
                        {Icon && <Icon aria-hidden="true" className={cx("text-fg-quaternary shrink-0", styles.sizes[size].icon)} />}
                        <div className={styles.common.label}>
                            <p className={styles.common.title}>{children ?? textValue}</p>
                            {description && <p className={styles.common.description}>{description}</p>}
                        </div>
                    </div>
                    {trailing}
                </>
            )}
        </AriaGridListItem>
    );
};

export interface SortableListProps<T extends { id: AriaKey }> {
    /** The items in display order. Each needs a unique `id`. */
    items: T[];
    /**
     * Handler called after a drop with the items in their new order, plus the raw React Aria
     * reorder event.
     */
    onReorder?: (items: T[], event: AriaDroppableCollectionReorderEvent) => void;
    /** Renders one `SortableList.Item` per item. */
    children: (item: T) => ReactNode;
    /**
     * The container style: a bordered group of rows, or separate cards.
     *
     * @default "bordered"
     */
    variant?: SortableListVariant;
    /**
     * The density of the rows.
     *
     * @default "sm"
     */
    size?: SortableListSize;
    /** Whether reordering is turned off. */
    isDisabled?: boolean;
    /** The accessible label of the list. */
    "aria-label"?: string;
    /** The id of an element that labels the list. */
    "aria-labelledby"?: string;
    /** The class name applied to the list. */
    className?: string;
}

const SortableListRoot = <T extends { id: AriaKey }>({
    items,
    onReorder,
    children,
    variant = "bordered",
    size = "sm",
    isDisabled = false,
    className,
    ...aria
}: SortableListProps<T>) => {
    const { dragAndDropHooks } = AriaUseDragAndDrop({
        getItems: (keys) => [...keys].map((key) => ({ "text/plain": String(key) })),
        onReorder: (event) => onReorder?.(reorderItems(items, event), event),
        renderDropIndicator: (target) => <AriaDropIndicator target={target} className={cx(styles.common.indicator, styles.variants[variant].indicator)} />,
    });

    return (
        <SortableListContext.Provider value={{ variant, size }}>
            <AriaGridList
                {...aria}
                items={items}
                selectionMode="none"
                dragAndDropHooks={isDisabled ? undefined : dragAndDropHooks}
                className={cx(styles.common.root, styles.variants[variant].root, className)}
            >
                {children}
            </AriaGridList>
        </SortableListContext.Provider>
    );
};

export const SortableList = Object.assign(SortableListRoot, {
    Item: SortableListItem,
});
