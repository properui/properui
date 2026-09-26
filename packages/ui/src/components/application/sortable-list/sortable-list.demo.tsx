"use client";

import { useId, useState } from "react";
import { Bell01, CreditCard02, Globe01, Lock01, Palette, User01 } from "@properui/icons";
import { Toggle } from "../../base/toggle/toggle";
import { SortableList } from "./sortable-list";

const tasks = [
    { id: "research", label: "User research" },
    { id: "wireframes", label: "Wireframes" },
    { id: "prototype", label: "Interactive prototype" },
    { id: "handoff", label: "Developer handoff" },
    { id: "qa", label: "Design QA" },
];

export const SortableListExample = () => {
    const [items, setItems] = useState(tasks);

    return (
        <div className="w-full max-w-sm">
            <SortableList aria-label="Project phases" items={items} onReorder={setItems}>
                {(item) => <SortableList.Item id={item.id} textValue={item.label} />}
            </SortableList>
        </div>
    );
};

const settingsSections = [
    { id: "profile", label: "Profile", description: "Name, photo and contact details", icon: User01, isVisible: true },
    { id: "notifications", label: "Notifications", description: "Email, push and in-app alerts", icon: Bell01, isVisible: true },
    { id: "security", label: "Security", description: "Password, two-factor and sessions", icon: Lock01, isVisible: true },
    { id: "billing", label: "Billing", description: "Plan, invoices and payment method", icon: CreditCard02, isVisible: false },
    { id: "appearance", label: "Appearance", description: "Theme, density and font size", icon: Palette, isVisible: true },
    { id: "language", label: "Language and region", description: "Locale, time zone and currency", icon: Globe01, isVisible: false },
];

export const SettingsSections = () => {
    const [sections, setSections] = useState(settingsSections);
    const headingId = useId();

    const setVisible = (id: string, isVisible: boolean) =>
        setSections((current) => current.map((section) => (section.id === id ? { ...section, isVisible } : section)));

    const shown = sections.filter((section) => section.isVisible);

    return (
        <div className="flex w-full max-w-lg flex-col gap-4">
            <div>
                <h2 id={headingId} className="text-primary text-lg font-semibold">
                    Settings sections
                </h2>
                <p className="text-tertiary text-sm">Drag to change the order of the settings sidebar. Hidden sections keep their place.</p>
            </div>

            <SortableList aria-labelledby={headingId} size="md" items={sections} onReorder={setSections}>
                {(section) => (
                    <SortableList.Item
                        id={section.id}
                        textValue={section.label}
                        icon={section.icon}
                        description={section.description}
                        trailing={
                            <Toggle
                                aria-label={`Show ${section.label}`}
                                size="sm"
                                isSelected={section.isVisible}
                                onChange={(isVisible) => setVisible(section.id, isVisible)}
                            />
                        }
                    />
                )}
            </SortableList>

            <p aria-live="polite" className="text-tertiary text-sm">
                Sidebar order: {shown.map((section) => section.label).join(", ")}
            </p>
        </div>
    );
};

const tracks = [
    { id: "intro", label: "Intro", length: "1:12" },
    { id: "sunrise", label: "Sunrise drive", length: "3:48" },
    { id: "static", label: "Static bloom", length: "4:05" },
    { id: "harbor", label: "Harbor lights", length: "3:21" },
];

export const CardsVariant = () => {
    const [items, setItems] = useState(tracks);

    return (
        <div className="w-full max-w-sm">
            <SortableList aria-label="Playlist" variant="cards" items={items} onReorder={setItems}>
                {(track) => (
                    <SortableList.Item
                        id={track.id}
                        textValue={track.label}
                        trailing={<span className="text-tertiary text-sm tabular-nums">{track.length}</span>}
                    />
                )}
            </SortableList>
        </div>
    );
};
