"use client";

import { useId } from "react";
import { AVATARS } from "../../../utils/demo-assets";
import { Avatar } from "../../base/avatar/avatar";
import { ScrollArea } from "./scroll-area";

const versions = Array.from({ length: 40 }, (_, index) => `v1.${40 - index}.0`);

export const ScrollAreaExample = () => {
    const headingId = useId();

    return (
        <div className="bg-primary ring-secondary w-56 overflow-hidden rounded-xl shadow-xs ring-1 ring-inset">
            <h2 id={headingId} className="border-secondary text-primary border-b px-4 py-3 text-sm font-semibold">
                Releases
            </h2>
            <ScrollArea aria-labelledby={headingId} className="h-72">
                <ul className="flex flex-col py-1">
                    {versions.map((version) => (
                        <li key={version} className="text-secondary px-4 py-2 text-sm">
                            {version}
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        </div>
    );
};

export const Horizontal = () => (
    <div className="w-full max-w-md">
        <ScrollArea aria-label="Team members" orientation="horizontal" type="auto" className="ring-secondary rounded-xl ring-1 ring-inset">
            <ul className="flex gap-4 p-4 pb-5">
                {AVATARS.map((person) => (
                    <li key={person.username} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
                        <Avatar size="lg" src={person.src} alt="" />
                        <span className="text-secondary text-sm font-medium">{person.name}</span>
                    </li>
                ))}
            </ul>
        </ScrollArea>
    </div>
);

const columns = ["Invoice", "Customer", "Status", "Issued", "Due", "Amount", "Tax", "Total", "Currency", "Owner"];
const rows = Array.from({ length: 16 }, (_, index) => index + 1);

export const BothAxes = () => (
    <div className="w-full max-w-lg">
        <ScrollArea aria-label="Invoices" orientation="both" type="always" className="bg-primary ring-secondary h-72 rounded-xl ring-1 ring-inset">
            <table className="text-sm">
                <thead>
                    <tr className="border-secondary border-b">
                        {columns.map((column) => (
                            <th key={column} scope="col" className="text-tertiary px-4 py-3 text-start font-semibold whitespace-nowrap">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row} className="border-secondary border-b last:border-b-0">
                            {columns.map((column) => (
                                <td key={column} className="text-secondary px-4 py-3 whitespace-nowrap">
                                    {column === "Invoice" ? `INV-${String(row).padStart(4, "0")}` : `${column} ${row}`}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </ScrollArea>
    </div>
);

const paragraphs = [
    "Proper UI components are copied into your project, so you own every line and can change anything.",
    "Every interactive component is built on React Aria, which handles keyboard navigation, focus management and screen reader announcements.",
    "Styles use semantic tokens only. Switching the theme repoints the tokens, so a component written once is correct in light and dark mode.",
    "Directional spacing uses logical properties, which means right-to-left layouts work without a separate stylesheet.",
    "The scroll area keeps native scrolling: wheel, touch, keyboard and find-in-page all behave exactly as they do on any other element.",
    "Its scrollbars are decoration on top of that. They are hidden from assistive technology, because the viewport already exposes everything they do.",
];

export const FadeEdges = () => (
    <div className="w-full max-w-sm">
        <ScrollArea aria-label="About" fadeEdges className="bg-secondary h-64 rounded-xl">
            <div className="flex flex-col gap-4 p-5">
                {paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-secondary text-sm">
                        {paragraph}
                    </p>
                ))}
            </div>
        </ScrollArea>
    </div>
);
