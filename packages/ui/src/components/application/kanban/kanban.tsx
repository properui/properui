"use client";

import type { FC, ReactNode } from "react";
import { Fragment, createContext, useContext, useId } from "react";
import { useControlledState } from "@react-stately/utils";
import type { DropItem as AriaDropItem, DropTarget as AriaDropTarget } from "react-aria-components";
import {
    Button as AriaButton,
    DropIndicator as AriaDropIndicator,
    GridList as AriaGridList,
    GridListItem as AriaGridListItem,
    isTextDropItem as AriaIsTextDropItem,
    // The repo requires an `Aria*` alias on every `react-aria-components` import, hooks included.
    useDragAndDrop as AriaUseDragAndDrop,
} from "react-aria-components";
import { Calendar, ChevronLeftDouble, ChevronRightDouble, DotsGrid, Plus } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { Avatar } from "../../base/avatar/avatar";
import type { BadgeColors } from "../../base/badges/badge-types";
import { Badge, BadgeWithDot } from "../../base/badges/badges";
import { ButtonUtility } from "../../base/buttons/button-utility";

/** The drag type every card carries, so boards only accept their own cards. */
const CARD_DRAG_TYPE = "application/x-properui-kanban-card";

const styles = sortCx({
    board: "flex w-full snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 sm:snap-none",
    column: {
        root: "flex max-h-full w-72 shrink-0 snap-start flex-col rounded-xl bg-secondary ring-1 ring-secondary transition duration-100 ease-linear ring-inset has-drop-target:bg-brand-primary has-drop-target:ring-2 has-drop-target:ring-brand",
        collapsed: "w-12 items-center py-3",
        header: "flex items-center gap-2 px-3 pt-3 pb-2",
        title: "min-w-0 truncate text-sm font-semibold text-primary",
        actions: "ms-auto flex items-center gap-0.5",
        list: "flex min-h-24 flex-col gap-2 overflow-y-auto px-2 pb-2 outline-hidden",
        empty: "flex h-20 items-center justify-center rounded-lg border border-dashed border-primary text-sm text-tertiary",
        collapsedTitle: "mt-3 text-sm font-semibold text-primary",
    },
    card: {
        root: "group/card relative flex cursor-grab flex-col rounded-lg bg-primary p-3 shadow-xs ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset hover:ring-primary focus-visible:outline-2 focus-visible:-outline-offset-2 data-dragging:cursor-grabbing data-dragging:opacity-50",
        handle: "absolute end-2 top-2 flex size-6 cursor-grab items-center justify-center rounded-md text-fg-quaternary opacity-0 outline-focus-ring transition duration-100 ease-linear group-hover/card:opacity-100 group-focus-within/card:opacity-100 hover:bg-primary_hover focus-visible:opacity-100 focus-visible:outline-2",
        indicator: "-my-1.25 h-0.5 shrink-0 rounded-full bg-transparent drop-target:bg-fg-brand-secondary",
    },
    content: {
        root: "flex flex-col gap-3",
        title: "pe-6 text-sm font-semibold text-primary",
        description: "line-clamp-2 text-sm text-tertiary",
        tags: "flex flex-wrap gap-1.5",
        footer: "flex items-center gap-3",
        due: "flex items-center gap-1 text-xs font-medium text-tertiary",
        assignees: "ms-auto flex -space-x-1.5",
    },
});

/** How urgent a card is. */
export type KanbanPriority = "low" | "medium" | "high" | "urgent";

const priorities: Record<KanbanPriority, { label: string; color: BadgeColors }> = {
    low: { label: "Low", color: "gray" },
    medium: { label: "Medium", color: "blue" },
    high: { label: "High", color: "warning" },
    urgent: { label: "Urgent", color: "error" },
};

/** A person a card is assigned to. */
export interface KanbanAssignee {
    /** The full name, used as the avatar's alternative text. */
    name: string;
    /** The avatar image. */
    src?: string;
    /** Initials shown when there is no image. */
    initials?: string;
}

/** A label shown on a card. */
export interface KanbanTag {
    /** The label text. */
    label: string;
    /** The badge color. */
    color?: BadgeColors;
}

/** The minimum shape of a card: a unique id and a title used for typeahead and announcements. */
export interface KanbanItem {
    /** A unique key across the whole board. */
    id: string;
    /** The card title, also its plain text representation. */
    title: string;
}

/** The data the default `Kanban.Card` renders. */
export interface KanbanCardData extends KanbanItem {
    /** Secondary text under the title. */
    description?: string;
    /** People working on the card. */
    assignees?: KanbanAssignee[];
    /** Labels shown as badges. */
    tags?: KanbanTag[];
    /** A preformatted due date, e.g. "Sep 30". */
    dueDate?: string;
    /** How urgent the card is. */
    priority?: KanbanPriority;
}

/** One column of the board. */
export interface KanbanColumnData<T extends KanbanItem = KanbanCardData> {
    /** A unique key for the column. */
    id: string;
    /** The column heading. */
    title: string;
    /** The cards in display order. */
    cards: T[];
}

/** Describes a completed move, passed as the second argument of `onChange`. */
export interface KanbanMoveEvent {
    /** The ids of the cards that moved. */
    cardIds: string[];
    /** The column the first card came from. */
    fromColumnId: string;
    /** The column the cards landed in. */
    toColumnId: string;
    /** The index of the first moved card in its new column. */
    index: number;
}

interface KanbanContextValue {
    columns: KanbanColumnData<KanbanItem>[];
    moveCards: (cardIds: string[], toColumnId: string, target: AriaDropTarget) => void;
    renderCard: (card: KanbanItem, column: KanbanColumnData<KanbanItem>) => ReactNode;
    headingLevel: 2 | 3 | 4;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);

const useKanbanContext = () => {
    const context = useContext(KanbanContext);
    if (!context) throw new Error("Kanban.Column must be rendered inside Kanban.Board.");
    return context;
};

/** Moves cards to a drop target and returns the new columns, or `null` when nothing changed. */
const applyMove = <T extends KanbanItem>(
    columns: KanbanColumnData<T>[],
    cardIds: string[],
    toColumnId: string,
    target: AriaDropTarget,
): { columns: KanbanColumnData<T>[]; event: KanbanMoveEvent } | null => {
    const ids = new Set(cardIds);
    const moving: T[] = [];
    let fromColumnId: string | undefined;

    // Preserve the on-screen order of the moved cards, whatever order the keys arrive in.
    for (const column of columns) {
        for (const card of column.cards) {
            if (ids.has(card.id)) {
                moving.push(card);
                fromColumnId ??= column.id;
            }
        }
    }

    if (!moving.length || !fromColumnId) return null;

    const remaining = columns.map((column) => ({ ...column, cards: column.cards.filter((card) => !ids.has(card.id)) }));
    const destination = remaining.find((column) => column.id === toColumnId);
    if (!destination) return null;

    let index = destination.cards.length;
    if (target.type === "item") {
        const targetIndex = destination.cards.findIndex((card) => card.id === target.key);
        if (targetIndex !== -1) index = target.dropPosition === "before" ? targetIndex : targetIndex + 1;
    }

    destination.cards = [...destination.cards.slice(0, index), ...moving, ...destination.cards.slice(index)];

    return { columns: remaining, event: { cardIds: moving.map((card) => card.id), fromColumnId, toColumnId, index } };
};

export interface KanbanCardProps extends Omit<KanbanCardData, "id"> {
    /** The class name applied to the card content. */
    className?: string;
    /** Extra content rendered below the tags, e.g. a progress bar. */
    children?: ReactNode;
}

/** The default card content: title, description, tags, priority, due date and assignees. */
const KanbanCard = ({ title, description, assignees, tags, dueDate, priority, className, children }: KanbanCardProps) => {
    const hasFooter = Boolean(dueDate || assignees?.length);
    const visibleAssignees = assignees?.slice(0, 3) ?? [];
    const hiddenAssignees = (assignees?.length ?? 0) - visibleAssignees.length;

    return (
        <div className={cx(styles.content.root, className)}>
            <div className="flex flex-col gap-1">
                <p className={styles.content.title}>{title}</p>
                {description && <p className={styles.content.description}>{description}</p>}
            </div>

            {(tags?.length || priority) && (
                <div className={styles.content.tags}>
                    {priority && (
                        <BadgeWithDot type="pill-color" size="sm" color={priorities[priority].color}>
                            {priorities[priority].label}
                            <span className="sr-only"> priority</span>
                        </BadgeWithDot>
                    )}
                    {tags?.map((tag) => (
                        <Badge key={tag.label} type="pill-color" size="sm" color={tag.color ?? "gray"}>
                            {tag.label}
                        </Badge>
                    ))}
                </div>
            )}

            {children}

            {hasFooter && (
                <div className={styles.content.footer}>
                    {dueDate && (
                        <span className={styles.content.due}>
                            <Calendar aria-hidden="true" className="text-fg-quaternary size-3.5" />
                            <span className="sr-only">Due </span>
                            {dueDate}
                        </span>
                    )}
                    {visibleAssignees.length > 0 && (
                        <div className={styles.content.assignees}>
                            {visibleAssignees.map((person) => (
                                <Avatar
                                    key={person.name}
                                    size="xs"
                                    src={person.src}
                                    alt={person.name}
                                    initials={person.initials}
                                    className="ring-bg-primary ring-2"
                                />
                            ))}
                            {hiddenAssignees > 0 && (
                                <Avatar
                                    size="xs"
                                    className="ring-bg-primary ring-2"
                                    placeholder={<span className="text-quaternary text-xs font-semibold">+{hiddenAssignees}</span>}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export interface KanbanColumnProps {
    /** The id of the column in the board's `columns`. */
    id: string;
    /** Overrides the heading taken from the column data. */
    title?: ReactNode;
    /** Whether the column can be collapsed to a narrow strip. */
    isCollapsible?: boolean;
    /** Whether the column is collapsed (controlled). */
    isCollapsed?: boolean;
    /** Whether the column starts collapsed (uncontrolled). */
    defaultCollapsed?: boolean;
    /** Handler called when the column is collapsed or expanded. */
    onCollapsedChange?: (isCollapsed: boolean) => void;
    /** Handler called when the add-card action is pressed. The action is hidden without it. */
    onAddCard?: (columnId: string) => void;
    /** Content shown when the column has no cards. */
    emptyState?: ReactNode;
    /** An icon rendered before the heading, e.g. a status dot. */
    icon?: FC<{ className?: string }>;
    /** The class name applied to the column. */
    className?: string;
}

/** One board column: heading, count, actions and a sortable, droppable list of cards. */
const KanbanColumn = ({
    id,
    title,
    isCollapsible = false,
    isCollapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    onAddCard,
    emptyState = "Drop cards here",
    icon: Icon,
    className,
}: KanbanColumnProps) => {
    const { columns, moveCards, renderCard, headingLevel } = useKanbanContext();
    const [collapsed, setCollapsed] = useControlledState(isCollapsed, defaultCollapsed, onCollapsedChange);
    const headingId = useId();
    const column = columns.find((item) => item.id === id);

    const readIds = async (items: AriaDropItem[]) => Promise.all(items.filter(AriaIsTextDropItem).map((item) => item.getText(CARD_DRAG_TYPE)));

    const { dragAndDropHooks } = AriaUseDragAndDrop({
        getItems: (keys) =>
            [...keys].map((key) => ({
                [CARD_DRAG_TYPE]: String(key),
                "text/plain": column?.cards.find((card) => card.id === key)?.title ?? String(key),
            })),
        acceptedDragTypes: [CARD_DRAG_TYPE],
        // Cards land between other cards, never on top of one.
        getDropOperation: (target) => (target.type === "item" && target.dropPosition === "on" ? "cancel" : "move"),
        onReorder: (event) => moveCards([...event.keys].map(String), id, event.target),
        onInsert: async (event) => moveCards(await readIds(event.items), id, event.target),
        onRootDrop: async (event) => moveCards(await readIds(event.items), id, { type: "root" }),
        renderDropIndicator: (target) => <AriaDropIndicator target={target} className={styles.card.indicator} />,
    });

    if (!column) return null;

    const Heading = `h${headingLevel}` as const;
    const heading = title ?? column.title;

    const collapseButton = isCollapsible && (
        <ButtonUtility
            size="xs"
            color="tertiary"
            tooltip={collapsed ? `Expand ${column.title}` : `Collapse ${column.title}`}
            icon={collapsed ? ChevronRightDouble : ChevronLeftDouble}
            aria-expanded={!collapsed}
            onPress={() => setCollapsed(!collapsed)}
            className="rtl:*:rotate-180"
        />
    );

    if (collapsed) {
        return (
            <section aria-labelledby={headingId} data-collapsed="" className={cx(styles.column.root, styles.column.collapsed, className)}>
                {collapseButton}
                <Heading id={headingId} style={{ writingMode: "vertical-rl" }} className={styles.column.collapsedTitle}>
                    {heading}
                </Heading>
                <Badge type="pill-color" size="sm" color="gray" className="mt-2">
                    {column.cards.length}
                    <span className="sr-only"> cards</span>
                </Badge>
            </section>
        );
    }

    return (
        <section aria-labelledby={headingId} className={cx(styles.column.root, className)}>
            <div className={styles.column.header}>
                {Icon && <Icon aria-hidden="true" className="text-fg-quaternary size-4 shrink-0" />}
                <Heading id={headingId} className={styles.column.title}>
                    {heading}
                </Heading>
                <Badge type="pill-color" size="sm" color="gray">
                    {column.cards.length}
                    <span className="sr-only"> cards</span>
                </Badge>
                <div className={styles.column.actions}>
                    {onAddCard && (
                        <ButtonUtility size="xs" color="tertiary" tooltip={`Add card to ${column.title}`} icon={Plus} onPress={() => onAddCard(id)} />
                    )}
                    {collapseButton}
                </div>
            </div>

            <AriaGridList
                aria-label={column.title}
                items={column.cards}
                dragAndDropHooks={dragAndDropHooks}
                selectionMode="none"
                renderEmptyState={() => <div className={styles.column.empty}>{emptyState}</div>}
                className={styles.column.list}
            >
                {(card) => (
                    <AriaGridListItem id={card.id} textValue={card.title} className={styles.card.root}>
                        {({ allowsDragging }) => (
                            <>
                                {renderCard(card, column)}
                                {allowsDragging && (
                                    <AriaButton slot="drag" className={styles.card.handle}>
                                        <DotsGrid aria-hidden="true" className="size-4" />
                                    </AriaButton>
                                )}
                            </>
                        )}
                    </AriaGridListItem>
                )}
            </AriaGridList>
        </section>
    );
};

export interface KanbanBoardProps<T extends KanbanItem = KanbanCardData> {
    /** The columns and their cards (controlled). */
    columns?: KanbanColumnData<T>[];
    /** The initial columns (uncontrolled). */
    defaultColumns?: KanbanColumnData<T>[];
    /** Handler called with the next columns after cards are dropped somewhere new. */
    onChange?: (columns: KanbanColumnData<T>[], event: KanbanMoveEvent) => void;
    /**
     * Renders the content of one card. Defaults to `Kanban.Card` with the card's data spread in,
     * which expects `KanbanCardData`.
     */
    renderCard?: (card: T, column: KanbanColumnData<T>) => ReactNode;
    /**
     * Renders one column. Defaults to a plain `Kanban.Column` — return your own to add actions,
     * icons or collapsing.
     */
    children?: (column: KanbanColumnData<T>) => ReactNode;
    /**
     * The heading level of the column titles.
     *
     * @default 3
     */
    headingLevel?: 2 | 3 | 4;
    /** The accessible label of the board. */
    "aria-label": string;
    /** The class name applied to the scrolling board container. */
    className?: string;
}

const defaultRenderCard = (card: KanbanItem) => <KanbanCard {...(card as KanbanCardData)} />;

/** The board: lays the columns out in a horizontally scrolling row and owns the move logic. */
const KanbanBoard = <T extends KanbanItem = KanbanCardData>({
    columns: columnsProp,
    defaultColumns,
    onChange,
    renderCard,
    children,
    headingLevel = 3,
    "aria-label": ariaLabel,
    className,
}: KanbanBoardProps<T>) => {
    const [columns, setColumns] = useControlledState<KanbanColumnData<T>[]>(columnsProp, defaultColumns ?? []);

    const moveCards = (cardIds: string[], toColumnId: string, target: AriaDropTarget) => {
        const result = applyMove(columns, cardIds, toColumnId, target);
        if (!result) return;
        setColumns(result.columns);
        onChange?.(result.columns, result.event);
    };

    const context: KanbanContextValue = {
        columns: columns as KanbanColumnData<KanbanItem>[],
        moveCards,
        renderCard: (renderCard as KanbanContextValue["renderCard"] | undefined) ?? defaultRenderCard,
        headingLevel,
    };

    return (
        <KanbanContext.Provider value={context}>
            <div role="group" aria-label={ariaLabel} className={cx(styles.board, className)}>
                {columns.map((column) => (
                    <Fragment key={column.id}>{children ? children(column) : <KanbanColumn id={column.id} />}</Fragment>
                ))}
            </div>
        </KanbanContext.Provider>
    );
};

export const Kanban = {
    Board: KanbanBoard,
    Column: KanbanColumn,
    Card: KanbanCard,
};
