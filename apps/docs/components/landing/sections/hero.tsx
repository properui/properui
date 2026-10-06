import { type BrowseFlow, type BrowseItem, LibraryBrowser } from "~/components/landing/library-browser";
import { LibrarySearch } from "~/components/landing/library-search";
import { AXE_SUITES, AXE_VIOLATIONS } from "~/components/landing/stats";
import { type LibraryItem, getFlows, getLibraryCounts, getLibraryItems } from "~/lib/library-index";

const PER_TAB = 8;
const FLOWS_SHOWN = 4;

const toBrowseItem = (item: LibraryItem): BrowseItem => ({
    name: item.name,
    title: item.title,
    kind: item.kind === "section" || item.kind === "component" ? item.kind : "screen",
    group: item.group,
    thumb: item.thumb?.light ?? null,
    docs: item.docs,
    preview: item.preview,
});

/**
 * Up to `limit` items of one kind, taking one per group in turn so the first row is not eight
 * variants of the same page. Screens and sections need a real thumbnail; components have none
 * today and render as plain text cards. The slice is deliberately small: the whole
 * library never goes into the page's HTML.
 */
function pick(items: LibraryItem[], kind: LibraryItem["kind"], limit: number): BrowseItem[] {
    const byGroup = new Map<string, LibraryItem[]>();
    for (const item of items) {
        if (item.kind !== kind || (kind !== "component" && !item.thumb)) continue;
        byGroup.set(item.group, [...(byGroup.get(item.group) ?? []), item]);
    }
    const queues = [...byGroup.values()];
    const picked: LibraryItem[] = [];
    for (let round = 0; picked.length < limit && queues.some((queue) => queue[round]); round += 1) {
        for (const queue of queues) {
            const item = queue[round];
            if (item && picked.length < limit) picked.push(item);
        }
    }
    return picked.map(toBrowseItem);
}

/**
 * Landing hero: a design-reference library entry point. A search box over everything, browse
 * tabs with real thumbnails, and the install story underneath. Every number comes from
 * `getLibraryCounts()` (the built registry) or `~/components/landing/stats`, so the copy cannot
 * drift from what ships.
 *
 * Setup (`ToolSelector`) and the hero video (`HeroVideo`) are no longer rendered here; the page
 * places them further down.
 */
export function Hero() {
    const items = getLibraryItems();
    const counts = getLibraryCounts();

    const flows: BrowseFlow[] = getFlows()
        .slice(0, FLOWS_SHOWN)
        .map((flow) => ({
            id: flow.id,
            title: flow.title,
            stepCount: flow.steps.length,
            steps: flow.steps.map((step) => ({
                name: step.item.name,
                title: step.item.title,
                group: step.item.group,
                thumb: step.item.thumb?.light ?? null,
                docs: step.item.docs,
                preview: step.item.preview,
                purpose: step.purpose,
            })),
        }));

    const microproof = ["React 19", "Vue, Angular & HTML", "MCP server", `${AXE_SUITES} axe suites, ${AXE_VIOLATIONS} violations`, "MIT, no paid tier"];

    return (
        <section className="hero lib-hero" id="top-hero">
            <div className="hero-grid" aria-hidden="true" />
            <div className="hero-glow" aria-hidden="true" />
            <div className="hero-copy container">
                <span className="eyebrow">WEB-APP DESIGN REFERENCES YOUR AI CAN INSTALL</span>
                <h1>Real screens, flows and sections. Searchable by your agent. Installable in one command.</h1>
                <p>
                    {counts.screens} full pages, {counts.flows} flows, {counts.sections} website sections and {counts.components} component groups, all from one
                    design system, axe-tested, free and MIT.
                </p>

                <LibrarySearch />

                <LibraryBrowser
                    screens={pick(items, "screen", PER_TAB)}
                    sections={pick(items, "section", PER_TAB)}
                    components={pick(items, "component", PER_TAB)}
                    flows={flows}
                    counts={counts}
                />

                <p className="lib-install-line">
                    Pick anything. Your agent runs <code>npx @properui/cli@latest add &lt;name&gt;</code> or calls the MCP and gets the real source.
                </p>
                <p className="lib-microproof">
                    {microproof.map((item, index) => (
                        <span className="lib-microproof-item" key={item}>
                            {item}
                            {index < microproof.length - 1 ? " ·" : ""}{" "}
                        </span>
                    ))}
                </p>
            </div>
        </section>
    );
}
