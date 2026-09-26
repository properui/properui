"use client";

import { useState } from "react";
import { avatar } from "../../../utils/demo-assets";
import { Avatar } from "../../base/avatar/avatar";
import { Kanban, type KanbanCardData, type KanbanColumnData, type KanbanItem, type KanbanMoveEvent } from "./kanban";

const person = (index: number) => {
    const { name, src } = avatar(index);
    return { name, src };
};

const productColumns: KanbanColumnData[] = [
    {
        id: "backlog",
        title: "Backlog",
        cards: [
            {
                id: "search",
                title: "Global search",
                description: "Search across projects, files and people from the command menu.",
                tags: [{ label: "Feature", color: "brand" }],
                priority: "low",
                assignees: [person(0)],
            },
            {
                id: "export",
                title: "CSV export for reports",
                tags: [{ label: "Reporting", color: "indigo" }],
                priority: "medium",
                dueDate: "Oct 18",
            },
        ],
    },
    {
        id: "todo",
        title: "To do",
        cards: [
            {
                id: "onboarding",
                title: "Redesign onboarding",
                description: "Cut the setup flow from five steps to three.",
                tags: [
                    { label: "Design", color: "pink" },
                    { label: "UX", color: "purple" },
                ],
                priority: "high",
                dueDate: "Oct 4",
                assignees: [person(1), person(2), person(3), person(4)],
            },
            {
                id: "billing",
                title: "Annual billing toggle",
                tags: [{ label: "Billing", color: "success" }],
                priority: "medium",
                assignees: [person(5)],
            },
        ],
    },
    {
        id: "in-progress",
        title: "In progress",
        cards: [
            {
                id: "sso",
                title: "SAML single sign-on",
                description: "Okta and Azure AD first, generic SAML after.",
                tags: [{ label: "Security", color: "error" }],
                priority: "urgent",
                dueDate: "Sep 30",
                assignees: [person(6), person(7)],
            },
        ],
    },
    {
        id: "done",
        title: "Done",
        cards: [
            {
                id: "dark-mode",
                title: "Dark mode",
                tags: [{ label: "Design", color: "pink" }],
                dueDate: "Sep 12",
                assignees: [person(8)],
            },
        ],
    },
];

export const KanbanExample = () => {
    const [columns, setColumns] = useState(productColumns);
    const [count, setCount] = useState(1);

    const addCard = (columnId: string) => {
        const card: KanbanCardData = { id: `new-${count}`, title: `New task ${count}`, tags: [{ label: "Draft" }] };
        setCount(count + 1);
        setColumns((current) => current.map((column) => (column.id === columnId ? { ...column, cards: [...column.cards, card] } : column)));
    };

    return (
        <div className="w-full max-w-6xl">
            <Kanban.Board aria-label="Product roadmap" columns={columns} onChange={setColumns}>
                {(column) => <Kanban.Column id={column.id} onAddCard={addCard} isCollapsible />}
            </Kanban.Board>
        </div>
    );
};

interface Candidate extends KanbanItem {
    role: string;
    avatarIndex: number;
    applied: string;
}

const candidate = (id: string, title: string, role: string, avatarIndex: number, applied: string): Candidate => ({ id, title, role, avatarIndex, applied });

const hiringColumns: KanbanColumnData<Candidate>[] = [
    {
        id: "applied",
        title: "Applied",
        cards: [
            candidate("olivia", "Olivia Rhye", "Product designer", 0, "2 days ago"),
            candidate("phoenix", "Phoenix Baker", "Frontend engineer", 1, "3 days ago"),
        ],
    },
    { id: "screen", title: "Phone screen", cards: [candidate("lana", "Lana Steiner", "Product designer", 2, "1 week ago")] },
    { id: "interview", title: "Interview", cards: [candidate("demi", "Demi Wilkinson", "Engineering manager", 3, "2 weeks ago")] },
    { id: "offer", title: "Offer", cards: [] },
];

export const CustomCards = () => {
    const [columns, setColumns] = useState(hiringColumns);

    return (
        <div className="w-full max-w-5xl">
            <Kanban.Board
                aria-label="Hiring pipeline"
                columns={columns}
                onChange={setColumns}
                renderCard={(card) => (
                    <div className="flex items-center gap-3">
                        <Avatar size="md" src={avatar(card.avatarIndex).src} alt="" />
                        <div className="flex min-w-0 flex-col">
                            <p className="text-primary truncate text-sm font-semibold">{card.title}</p>
                            <p className="text-tertiary truncate text-sm">{card.role}</p>
                            <p className="text-quaternary text-xs">Applied {card.applied}</p>
                        </div>
                    </div>
                )}
            />
        </div>
    );
};

const sprintColumns: KanbanColumnData[] = [
    {
        id: "todo",
        title: "To do",
        cards: [
            { id: "t1", title: "Write release notes", priority: "low" },
            { id: "t2", title: "Fix flaky upload test", priority: "high", tags: [{ label: "Bug", color: "error" }] },
        ],
    },
    { id: "doing", title: "Doing", cards: [{ id: "t3", title: "Audit color contrast", priority: "medium", tags: [{ label: "A11y", color: "blue" }] }] },
    { id: "review", title: "Review", cards: [{ id: "t4", title: "Pagination edge cases", priority: "medium" }] },
    {
        id: "archived",
        title: "Archived",
        cards: [
            { id: "t5", title: "Legacy settings page" },
            { id: "t6", title: "Old pricing table" },
        ],
    },
];

export const CollapsibleColumns = () => {
    const [columns, setColumns] = useState(sprintColumns);
    const [lastMove, setLastMove] = useState<KanbanMoveEvent | null>(null);

    const titleOf = (id: string) => columns.find((column) => column.id === id)?.title ?? id;

    return (
        <div className="flex w-full max-w-5xl flex-col gap-3">
            <Kanban.Board
                aria-label="Sprint board"
                columns={columns}
                onChange={(next, move) => {
                    setColumns(next);
                    setLastMove(move);
                }}
            >
                {(column) => <Kanban.Column id={column.id} isCollapsible defaultCollapsed={column.id === "archived"} />}
            </Kanban.Board>
            <p aria-live="polite" className="text-tertiary text-sm">
                {lastMove
                    ? `Moved ${lastMove.cardIds.length} card from ${titleOf(lastMove.fromColumnId)} to ${titleOf(lastMove.toColumnId)}, position ${lastMove.index + 1}.`
                    : "Drag a card, or focus one and press Enter on its handle to move it with the keyboard."}
            </p>
        </div>
    );
};
