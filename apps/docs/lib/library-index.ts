import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./content";

/**
 * The design reference library as the docs site sees it: screens, marketing sections, components
 * and curated flows, read at build time from `packages/registry/dist` (index.json, thumbs.json,
 * flows.json). Every consumer is a server component or a force-static route handler, so nothing
 * here touches the filesystem at request time. The classification mirrors `packages/mcp/src/library.ts`
 * (isScreen, isSection, groupOf, previewUrlOf) so the site and the MCP agree on what an item is.
 */

export type LibraryKind = "screen" | "section" | "component" | "flow";

export type LibraryItem = {
    name: string;
    title: string;
    kind: LibraryKind;
    layer: string;
    /** Docs group as a readable label: "Pricing pages", "Hero header sections", or the layer for a component. */
    group: string;
    description: string;
    /** Site-relative thumbnail paths; null when the entry has none (every component today). */
    thumb: { light: string; dark: string | null } | null;
    /** Site-relative docs path. */
    docs: string;
    /** Site-relative full-page preview route, derived from the thumbnail path; null without a thumbnail. */
    preview: string | null;
    platform?: "app" | "marketing";
    composesWith: string[];
};

export type Flow = {
    id: string;
    title: string;
    description: string;
    tags: string[];
    /** Site-relative page for the flow: `/flows/<id>`. */
    docs: string;
    steps: Array<{ item: LibraryItem; purpose: string }>;
};

type IndexRow = {
    name: string;
    layer: string;
    type: string;
    title: string;
    description?: string;
    docs?: string;
    composes_with?: string[];
    fileCount?: number;
};

type ThumbRow = { light: string | null; dark?: string | null } | null;

type FlowsFile = {
    flows?: Array<{ id: string; title: string; description: string; tags?: string[]; docs?: string; steps: Array<{ entry: string; purpose: string }> }>;
};

const distDir = () => path.join(repoRoot(), "packages", "registry", "dist");

const readDist = <T>(file: string): T | undefined => {
    const full = path.join(distDir(), file);
    if (!existsSync(full)) return undefined;
    try {
        return JSON.parse(readFileSync(full, "utf8")) as T;
    } catch {
        return undefined;
    }
};

const SCREEN_LAYERS = new Set(["app-examples", "marketing-examples"]);
const COMPONENT_LAYERS = new Set(["base", "application", "marketing"]);

const kindOf = (row: IndexRow): LibraryKind | undefined => {
    if (row.type === "example" && SCREEN_LAYERS.has(row.layer) && (row.fileCount ?? 1) > 0) return "screen";
    if (row.type === "example" && row.layer === "marketing" && (row.fileCount ?? 1) > 0) return "section";
    if (row.type === "component" && COMPONENT_LAYERS.has(row.layer)) return "component";
    return undefined;
};

const ACRONYMS = new Map([
    ["faq", "FAQ"],
    ["faqs", "FAQs"],
    ["cta", "CTA"],
]);

/** `pricing-sections` becomes `Pricing sections`; known acronyms stay upper case. */
const humanize = (slug: string) => {
    const words = slug.split("-").map((word, index) => ACRONYMS.get(word) ?? (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word));
    return words.join(" ");
};

const LAYER_LABELS: Record<string, string> = { base: "Base", application: "Application", marketing: "Marketing" };

/** `/marketing/pricing-sections/pricing-dual-action` gives `pricing-sections`; a component groups by its layer. */
const groupOf = (row: IndexRow, kind: LibraryKind): string => {
    const segments = (row.docs ?? "").split("/").filter(Boolean);
    if (kind !== "component" && segments.length >= 3) return humanize(segments[segments.length - 2]!);
    return LAYER_LABELS[row.layer] ?? humanize(row.layer);
};

/** `/thumbs/<section>/<slug>/<variant>.webp` is the render of `/preview/variant/<section>/<slug>/<variant>`. */
const previewOf = (light: string): string | null => {
    const match = /^\/thumbs\/([^/]+)\/([^/]+)\/([^/]+)\.(?:webp|png)$/.exec(light);
    return match ? `/preview/variant/${match[1]}/${match[2]}/${match[3]}` : null;
};

let cache: { items: LibraryItem[]; byName: Map<string, LibraryItem>; flows: Flow[] } | undefined;

const load = () => {
    if (cache) return cache;

    const rows = readDist<{ components?: IndexRow[] }>("index.json")?.components ?? [];
    const thumbs = readDist<Record<string, ThumbRow>>("thumbs.json") ?? {};

    const entries: LibraryItem[] = [];
    for (const row of rows) {
        const kind = kindOf(row);
        if (!kind) continue;
        const light = thumbs[row.name]?.light ?? null;
        const dark = thumbs[row.name]?.dark ?? null;
        entries.push({
            name: row.name,
            title: row.title,
            kind,
            layer: row.layer,
            group: groupOf(row, kind),
            description: row.description ?? "",
            thumb: light ? { light, dark } : null,
            docs: row.docs ?? `/r/${row.name}.json`,
            preview: light ? previewOf(light) : null,
            ...(row.layer === "app-examples" ? { platform: "app" as const } : row.layer === "marketing-examples" ? { platform: "marketing" as const } : {}),
            composesWith: row.composes_with ?? [],
        });
    }

    const byName = new Map(entries.map((item) => [item.name, item]));

    const flows: Flow[] = [];
    for (const flow of readDist<FlowsFile>("flows.json")?.flows ?? []) {
        const steps = flow.steps.flatMap((step) => {
            const item = byName.get(step.entry);
            return item ? [{ item, purpose: step.purpose }] : [];
        });
        flows.push({ id: flow.id, title: flow.title, description: flow.description, tags: flow.tags ?? [], docs: flow.docs ?? `/flows/${flow.id}`, steps });
    }

    // Order: screens, flows, sections, components. Flows are derived from the steps above, so each one
    // becomes an item named `flow:<id>`, carrying its first step's thumbnail as the card image.
    const flowItems: LibraryItem[] = flows.map((flow) => {
        const cover = flow.steps.find((step) => step.item.thumb)?.item;
        return {
            name: `flow:${flow.id}`,
            title: flow.title,
            kind: "flow",
            layer: "flows",
            group: "Flows",
            description: flow.description,
            thumb: cover?.thumb ?? null,
            docs: flow.docs,
            preview: null,
            composesWith: flow.steps.map((step) => step.item.name),
        };
    });

    const of = (kind: LibraryKind) => entries.filter((item) => item.kind === kind);
    cache = { items: [...of("screen"), ...flowItems, ...of("section"), ...of("component")], byName, flows };
    return cache;
};

/** Every browsable item, in the order the home library lists them: screens, flows, sections, components. */
export const getLibraryItems = (): LibraryItem[] => load().items;

export const getFlows = (): Flow[] => load().flows;

export const getFlow = (id: string): Flow | undefined => load().flows.find((flow) => flow.id === id);

export const getLibraryCounts = (): { screens: number; flows: number; sections: number; components: number } => {
    const { items } = load();
    const count = (kind: LibraryKind) => items.filter((item) => item.kind === kind).length;
    return { screens: count("screen"), flows: count("flow"), sections: count("section"), components: count("component") };
};
