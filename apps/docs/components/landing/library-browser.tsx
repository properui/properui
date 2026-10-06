"use client";

import { type KeyboardEvent, useRef, useState } from "react";

/** A card in the Screens, Sections and Components panels. `thumb` is a site-relative image path. */
export type BrowseItem = { name: string; title: string; group: string; thumb: string | null; docs: string };

/** A card in the Flows panel: the first few step thumbnails plus the real step count. */
export type BrowseFlow = { id: string; title: string; stepCount: number; steps: Array<{ title: string; thumb: string | null }> };

export type BrowseCounts = { screens: number; flows: number; sections: number; components: number };

export type LibraryBrowserProps = {
    screens: BrowseItem[];
    sections: BrowseItem[];
    components: BrowseItem[];
    flows: BrowseFlow[];
    counts: BrowseCounts;
};

type TabId = "screens" | "flows" | "sections" | "components";

/** Where each tab's "Browse all" link goes: the real index pages that exist today. */
const TABS: Array<{ id: TabId; label: string; noun: string; href: string }> = [
    { id: "screens", label: "Screens", noun: "full pages", href: "/application-ui" },
    { id: "flows", label: "Flows", noun: "flows", href: "/flows" },
    { id: "sections", label: "Sections", noun: "website sections", href: "/marketing" },
    { id: "components", label: "Components", noun: "component groups", href: "/components" },
];

const FLOW_STEPS_SHOWN = 4;

function Thumb({ src }: { src: string | null }) {
    return <span className="lib-thumb">{src ? <img src={src} alt="" loading="lazy" width="640" height="400" /> : null}</span>;
}

function ItemGrid({ items }: { items: BrowseItem[] }) {
    return (
        <ul className="lib-grid">
            {items.map((item) => (
                <li key={item.name}>
                    <a className={item.thumb ? "lib-card" : "lib-card lib-card-plain"} href={item.docs}>
                        {item.thumb ? <Thumb src={item.thumb} /> : null}
                        <span className="lib-card-title">{item.title}</span>
                        <span className="lib-card-group">{item.group}</span>
                    </a>
                </li>
            ))}
        </ul>
    );
}

function FlowGrid({ flows }: { flows: BrowseFlow[] }) {
    return (
        <ul className="lib-flow-grid">
            {flows.map((flow) => {
                const extra = flow.stepCount - Math.min(flow.steps.length, FLOW_STEPS_SHOWN);
                return (
                    <li key={flow.id}>
                        <a className="lib-card lib-flow-card" href={`/flows/${flow.id}`}>
                            <span className="lib-flow-strip">
                                {flow.steps.slice(0, FLOW_STEPS_SHOWN).map((step, index) => (
                                    <Thumb key={`${step.title}-${index}`} src={step.thumb} />
                                ))}
                                {extra > 0 ? <span className="lib-flow-more">+{extra}</span> : null}
                            </span>
                            <span className="lib-card-title">{flow.title}</span>
                            <span className="lib-card-group">{flow.stepCount} steps</span>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * Browse tabs for the home hero: Screens, Flows, Sections, Components. Same accessible tabs
 * pattern as `sections/example-showcase.tsx` (roving tabindex, arrow/Home/End keys). Every panel
 * is rendered into the HTML so the links are crawlable; inactive panels are `hidden`, which also
 * keeps their lazy thumbnails from loading until the tab is selected. The server hero passes a
 * trimmed slice (8 per tab, 4 flows), never the whole library.
 */
export function LibraryBrowser({ screens, sections, components, flows, counts }: LibraryBrowserProps) {
    const [activeId, setActiveId] = useState<TabId>("screens");
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const activeIndex = TABS.findIndex((tab) => tab.id === activeId);

    const selectByIndex = (index: number) => {
        const target = TABS[(index + TABS.length) % TABS.length]!;
        setActiveId(target.id);
        tabRefs.current[TABS.indexOf(target)]?.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case "ArrowRight":
                event.preventDefault();
                selectByIndex(activeIndex + 1);
                break;
            case "ArrowLeft":
                event.preventDefault();
                selectByIndex(activeIndex - 1);
                break;
            case "Home":
                event.preventDefault();
                selectByIndex(0);
                break;
            case "End":
                event.preventDefault();
                selectByIndex(TABS.length - 1);
                break;
            default:
                break;
        }
    };

    return (
        <div className="lib-browser">
            {/* `tabIndex={-1}`: the tablist is never a tab stop (focus lives on the active tab via roving tabindex), but jsx-a11y wants an explicit tabIndex on an element with an interactive role. */}
            <div className="lib-tabs" role="tablist" aria-label="Browse the library" tabIndex={-1} onKeyDown={onKeyDown}>
                {TABS.map((tab, index) => (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            tabRefs.current[index] = el;
                        }}
                        role="tab"
                        type="button"
                        className="lib-tab"
                        id={`lib-tab-${tab.id}`}
                        aria-selected={tab.id === activeId}
                        aria-controls={`lib-panel-${tab.id}`}
                        tabIndex={tab.id === activeId ? 0 : -1}
                        onClick={() => setActiveId(tab.id)}
                    >
                        {tab.label}
                        <span className="lib-tab-count">{counts[tab.id]}</span>
                    </button>
                ))}
            </div>

            {TABS.map((tab) => (
                <div
                    key={tab.id}
                    id={`lib-panel-${tab.id}`}
                    role="tabpanel"
                    aria-labelledby={`lib-tab-${tab.id}`}
                    tabIndex={0}
                    className="lib-panel"
                    hidden={tab.id !== activeId}
                >
                    {tab.id === "screens" ? <ItemGrid items={screens} /> : null}
                    {tab.id === "sections" ? <ItemGrid items={sections} /> : null}
                    {tab.id === "components" ? <ItemGrid items={components} /> : null}
                    {tab.id === "flows" ? <FlowGrid flows={flows} /> : null}
                    <p className="lib-browse-all">
                        <a href={tab.href}>
                            Browse all {counts[tab.id]} {tab.noun}
                            <span aria-hidden="true"> &rarr;</span>
                        </a>
                    </p>
                </div>
            ))}
        </div>
    );
}
