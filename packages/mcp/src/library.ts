/**
 * The design reference library: screens, marketing sections and curated flows over the registry,
 * plus `compare_screens` and the read-only `get_install_plan`.
 *
 * Everything reads through the same `Registry` the other tools use (`ServerContext`), so a local
 * directory, https://properui.dev/r and a staging registry all behave alike. `flows.json`,
 * `thumbs.json` and `stats.json` are optional registry files: when one is missing the tool says
 * so in a plain sentence instead of failing.
 *
 * Results are markdown for the model to read, with the same data as `structuredContent`.
 * Nothing in here may write to stdout: on the stdio transport stdout is the protocol channel.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { type Registry, type RegistryEntry, type RegistryIndexEntry, editDistance, fuzzyScore, readAuthToken } from "./cli.js";
import type { ServerContext } from "./context.js";

export const ADD_COMMAND = "npx @properui/cli@latest add";

/** Below this mean word score, a hit is more likely noise than a match. Same cut-off as `properui search`. */
export const SCORE_THRESHOLD = 0.32;

export const DEFAULT_LIMIT = 8;
export const MAX_LIMIT = 25;

// ---------------------------------------------------------------------------- shapes

/** Index rows carry the semantic fields the registry build adds; the CLI's type does not list them. */
export interface LibraryEntry extends RegistryIndexEntry {
    composes_with?: string[];
    token_contract?: string[];
    intent?: string;
}

export interface FlowStep {
    entry: string;
    purpose: string;
}

export interface Flow {
    id: string;
    title: string;
    description: string;
    tags: string[];
    /** Site-relative docs page for the flow, e.g. `/flows/billing`. Absent in registries that predate it. */
    docs?: string;
    steps: FlowStep[];
}

/** `thumbs.json`: entry name to site-relative thumbnail paths. A null row means no thumbnail. */
export type ThumbsIndex = Record<string, { light: string | null; dark?: string | null } | null>;

export type Platform = "app" | "marketing";

export interface Thumbnail {
    light: string;
    dark: string | null;
}

export interface EntryItem {
    name: string;
    title: string;
    layer: string;
    type: string;
    platform?: Platform;
    group?: string;
    description: string;
    docsUrl: string | null;
    previewUrl: string | null;
    thumbnail: Thumbnail | null;
    composesWith: string[];
    tokenContract: string[];
    addCommand: string;
}

/** What a library tool hands back: markdown for the model, the same data as structured content. */
export interface LibraryResult {
    text: string;
    data: Record<string, unknown>;
    isError?: boolean;
}

// ---------------------------------------------------------------------------- optional registry files

type FileCache = Map<string, Promise<unknown>>;
const fileCaches = new WeakMap<Registry, FileCache>();

/**
 * One optional JSON file from the registry root, or null when it is not there or cannot be
 * read. Cached per `Registry` instance, which `ServerContext` already expires on its TTL.
 */
function readOptionalJson<T>(registry: Registry, file: string): Promise<T | null> {
    let cache = fileCaches.get(registry);
    if (!cache) {
        cache = new Map();
        fileCaches.set(registry, cache);
    }
    const hit = cache.get(file);
    if (hit) return hit as Promise<T | null>;

    const load = async (): Promise<T | null> => {
        try {
            if (!registry.remote) {
                const full = path.join(registry.source, file);
                return existsSync(full) ? (JSON.parse(readFileSync(full, "utf8")) as T) : null;
            }
            const token = readAuthToken();
            const response = await fetch(`${registry.source}/${file}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
            return response.ok ? ((await response.json()) as T) : null;
        } catch {
            return null;
        }
    };
    const value = load();
    cache.set(file, value);
    return value;
}

export async function readFlows(registry: Registry): Promise<Flow[] | null> {
    const file = await readOptionalJson<{ flows?: Flow[] }>(registry, "flows.json");
    return file && Array.isArray(file.flows) ? file.flows : null;
}

export function readStats(registry: Registry): Promise<Record<string, unknown> | null> {
    return readOptionalJson<Record<string, unknown>>(registry, "stats.json");
}

// ---------------------------------------------------------------------------- catalog

export interface Catalog {
    registry: Registry;
    siteUrl: string;
    entries: LibraryEntry[];
    byName: Map<string, LibraryEntry>;
    /** null when the registry does not publish thumbs.json. */
    thumbs: ThumbsIndex | null;
}

export async function loadCatalog(ctx: ServerContext): Promise<Catalog> {
    const registry = ctx.registry();
    const [entries, thumbs] = await Promise.all([registry.index(), readOptionalJson<ThumbsIndex>(registry, "thumbs.json")]);
    const rows = entries as LibraryEntry[];
    return { registry, siteUrl: ctx.siteUrl(registry), entries: rows, byName: new Map(rows.map((entry) => [entry.name, entry])), thumbs };
}

/** A full-page example: an `example` entry in the app or marketing example layers. */
export const isScreen = (entry: RegistryIndexEntry) =>
    entry.type === "example" && (entry.layer === "app-examples" || entry.layer === "marketing-examples") && entry.fileCount > 0;

/** One variant of a marketing page section. */
export const isSection = (entry: RegistryIndexEntry) => entry.type === "example" && entry.layer === "marketing" && entry.fileCount > 0;

export const platformOf = (entry: RegistryIndexEntry): Platform | undefined =>
    entry.layer === "app-examples" ? "app" : entry.layer === "marketing-examples" ? "marketing" : undefined;

/** `/marketing/pricing-sections/pricing-dual-action` gives `pricing-sections`. Top-level docs paths have no group. */
export function groupOf(entry: RegistryIndexEntry): string | undefined {
    const segments = (entry.docs ?? "").split("/").filter(Boolean);
    return segments.length >= 3 ? segments[segments.length - 2] : undefined;
}

/** Registry copy uses em dashes and ellipsis characters; this server's output does not. */
export const clean = (value: string) => value.replace(/\s*\u2014\s*/g, ": ").replace(/\u2026/g, "...");

function thumbnailOf(catalog: Catalog, name: string): Thumbnail | null {
    const row = catalog.thumbs?.[name];
    if (!row?.light) return null;
    return { light: catalog.siteUrl + row.light, dark: row.dark ? catalog.siteUrl + row.dark : null };
}

/**
 * The preview route mirrors the thumbnail path: `/thumbs/<section>/<slug>/<variant>.webp` is the
 * render of `/preview/variant/<section>/<slug>/<variant>`. Derived from the published thumbnail,
 * never guessed, so an entry without a thumbnail has no preview link.
 */
function previewUrlOf(catalog: Catalog, name: string): string | null {
    const light = catalog.thumbs?.[name]?.light;
    const match = light ? /^\/thumbs\/([^/]+)\/([^/]+)\/([^/]+)\.webp$/.exec(light) : null;
    return match ? `${catalog.siteUrl}/preview/variant/${match[1]}/${match[2]}/${match[3]}` : null;
}

export function toItem(catalog: Catalog, entry: LibraryEntry): EntryItem {
    const item: EntryItem = {
        name: entry.name,
        title: clean(entry.title),
        layer: entry.layer,
        type: entry.type,
        description: clean(entry.description),
        docsUrl: entry.docs ? catalog.siteUrl + entry.docs : null,
        previewUrl: previewUrlOf(catalog, entry.name),
        thumbnail: thumbnailOf(catalog, entry.name),
        composesWith: entry.composes_with ?? [],
        tokenContract: entry.token_contract ?? [],
        addCommand: `${ADD_COMMAND} ${entry.name}`,
    };
    const platform = platformOf(entry);
    if (platform) item.platform = platform;
    const group = groupOf(entry);
    if (group) item.group = group;
    return item;
}

// ---------------------------------------------------------------------------- search

const STOPWORDS = new Set([
    "a",
    "an",
    "and",
    "the",
    "for",
    "of",
    "to",
    "in",
    "on",
    "with",
    "page",
    "pages",
    "screen",
    "screens",
    "section",
    "sections",
    "flow",
    "flows",
    "ui",
    "new",
]);

/** Small, hand-kept word families. An alternate scores slightly below the word the user typed. */
const SYNONYMS: Record<string, string[]> = {
    login: ["signin", "logon"],
    signin: ["login"],
    signup: ["register", "createaccount"],
    register: ["signup"],
    billing: ["pricing", "payment", "invoice", "subscription", "plan"],
    pricing: ["plan", "billing"],
    payment: ["billing", "creditcard"],
    dashboard: ["analytics", "overview"],
    profile: ["account"],
    homepage: ["landing", "hero"],
    landing: ["hero", "homepage"],
    password: ["forgot", "reset"],
    onboarding: ["welcome", "setup"],
    notfound: ["404"],
};

const normalize = (value: string) => value.toLowerCase().replace(/[\s\-_/.]+/g, "");

/** Splits a free-text query into match words: lowercase, no stopwords, plural stripped. */
export function queryWords(query: string): string[] {
    const raw = query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
    const kept = raw.filter((word) => word.length > 1 && !STOPWORDS.has(word));
    const words = kept.length > 0 ? kept : raw;
    return [...new Set(words.map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word)))];
}

interface Field {
    text: string;
    weight: number;
    /** Short identifier-like fields tolerate abbreviations (subsequence matches); prose does not. */
    loose: boolean;
}

/** Score of one word against one field text, in [0, 1]. */
function wordScore(field: Field, word: string): number {
    const score = fuzzyScore(field.text, word);
    // A substring hit in a shorter text is the better hit: "button" ranks `buttons` above `button-group`.
    if (score >= 0.7) return score < 1 ? Math.min(1, score + (0.05 * normalize(word).length) / Math.max(1, normalize(field.text).length)) : score;
    // Below a substring match it is a subsequence match: only trusted on identifier-like fields and
    // longer words, so "bar" does not match every name that happens to contain b, a and r in order.
    return field.loose && word.length >= 5 ? score : 0;
}

/** One typo (a missing or wrong letter) against a whole word of a field, for longer query words. */
function typoScore(field: Field, word: string): number {
    if (word.length < 5) return 0;
    for (const part of field.text.split(/[^A-Za-z0-9]+/)) {
        if (part.length >= 4 && Math.abs(part.length - word.length) <= 1 && editDistance(part, word) <= 1) return 0.6;
    }
    return 0;
}

function bestForWord(fields: Field[], word: string): number {
    let best = 0;
    const variants: { word: string; factor: number }[] = [{ word, factor: 1 }];
    for (const alternate of SYNONYMS[normalize(word)] ?? []) variants.push({ word: alternate, factor: 0.8 });
    for (const variant of variants) {
        for (const field of fields) {
            if (!field.text) continue;
            const score = Math.max(wordScore(field, variant.word), variant.factor === 1 ? typoScore(field, variant.word) : 0);
            best = Math.max(best, field.weight * variant.factor * score);
        }
    }
    return best;
}

function scoreFields(fields: Field[], query: string): number {
    const words = queryWords(query);
    if (words.length === 0) return 0;
    const mean = words.reduce((sum, word) => sum + bestForWord(fields, word), 0) / words.length;
    // The whole phrase against the identifier-like fields ("sign up" against `sign-up-pages`).
    let phrase = 0;
    if (words.length > 1) {
        for (const field of fields) if (field.loose) phrase = Math.max(phrase, field.weight * fuzzyScore(field.text, query));
    }
    return Math.max(mean, phrase);
}

function entryFields(entry: LibraryEntry): Field[] {
    const fields: Field[] = [
        { text: entry.name, weight: 1, loose: true },
        { text: entry.title, weight: 0.85, loose: true },
        { text: groupOf(entry) ?? "", weight: 0.8, loose: true },
        { text: entry.intent ?? "", weight: 0.6, loose: false },
        { text: entry.description, weight: 0.6, loose: false },
        { text: entry.layer, weight: 0.3, loose: false },
    ];
    for (const name of entry.composes_with ?? []) fields.push({ text: name, weight: 0.4, loose: false });
    return fields;
}

interface Scored<T> {
    item: T;
    score: number;
}

/** Closest three names to `query` when nothing clears the threshold. */
function nearestOf<T>(sorted: Scored<T>[], label: (item: T) => string, query: string): string[] {
    return sorted
        .map((row) => ({ ...row, name: label(row.item), distance: editDistance(label(row.item), query) }))
        .sort((a, b) => b.score - a.score || a.distance - b.distance || a.name.localeCompare(b.name))
        .slice(0, 3)
        .map((row) => row.name);
}

export function searchEntries(pool: LibraryEntry[], query: string): { matches: Scored<LibraryEntry>[]; nearest: string[] } {
    const scored = pool.map((entry) => ({ item: entry, score: scoreFields(entryFields(entry), query) }));
    const sorted = [...scored].sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
    return { matches: sorted.filter((row) => row.score >= SCORE_THRESHOLD), nearest: nearestOf(sorted, (entry) => entry.name, query) };
}

export function searchFlowList(flows: Flow[], query: string): { matches: Scored<Flow>[]; nearest: string[] } {
    const scored = flows.map((flow) => {
        const fields: Field[] = [
            { text: flow.id, weight: 1, loose: true },
            { text: flow.title, weight: 0.9, loose: true },
            { text: flow.description, weight: 0.6, loose: false },
        ];
        for (const tag of flow.tags) fields.push({ text: tag, weight: 0.9, loose: true });
        for (const step of flow.steps) {
            fields.push({ text: step.entry, weight: 0.5, loose: false });
            fields.push({ text: step.purpose, weight: 0.5, loose: false });
        }
        return { item: flow, score: scoreFields(fields, query) };
    });
    const sorted = [...scored].sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
    return { matches: sorted.filter((row) => row.score >= SCORE_THRESHOLD), nearest: sorted.slice(0, 3).map((row) => row.item.id) };
}

// ---------------------------------------------------------------------------- markdown

const quote = (query: string) => JSON.stringify(query);
const list = (values: string[]) => (values.length > 0 ? values.map((value) => `\`${value}\``).join(", ") : "none");

function itemLine(item: EntryItem, index: number): string {
    const where = [item.layer, item.platform ? `${item.platform} screen` : null, item.group].filter(Boolean).join(", ");
    const parts = [`${index}. **${item.title}** (\`${item.name}\`, ${where})`];
    if (item.thumbnail) parts.push(`![thumb](${item.thumbnail.light})`);
    if (item.thumbnail?.dark) parts.push(`dark: ${item.thumbnail.dark}`);
    if (item.docsUrl) parts.push(`docs: ${item.docsUrl}`);
    if (item.previewUrl) parts.push(`preview: ${item.previewUrl}`);
    if (item.composesWith.length > 0) {
        const shown = item.composesWith.slice(0, 6).join(", ");
        parts.push(`composes: ${shown}${item.composesWith.length > 6 ? `, and ${item.composesWith.length - 6} more` : ""}`);
    }
    parts.push(`add: \`${item.addCommand}\``);
    return parts.join(" | ");
}

const thenHint = (first: string | undefined) =>
    `Then: read one with get_component${first ? ` (for example name "${first}")` : ""}, compare a shortlist with compare_screens, and plan the install with get_install_plan (names: [...]).`;

function noMatch(kind: string, query: string, nearest: string[]): LibraryResult {
    const text = [
        `No ${kind} match ${quote(query)}.`,
        "",
        `Nearest names: ${list(nearest)}.`,
        "",
        "Try fewer or different words, a synonym, or another search tool (search_screens, search_sections, search_flows, search_components).",
    ].join("\n");
    return { text, data: { query, total: 0, results: [], nearest } };
}

// ---------------------------------------------------------------------------- search tools

export interface ScreenSearchInput {
    query: string;
    platform?: Platform;
    limit?: number;
}

export interface SectionSearchInput {
    query: string;
    group?: string;
    limit?: number;
}

function entrySearch(catalog: Catalog, kind: "screens" | "sections", input: { query: string; limit?: number }, pool: LibraryEntry[]): LibraryResult {
    const { matches, nearest } = searchEntries(pool, input.query);
    if (matches.length === 0) return noMatch(kind, input.query, nearest);
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
    const items = matches.slice(0, limit).map((row) => toItem(catalog, row.item));
    const lines = [`${matches.length} ${kind} match ${quote(input.query)}${items.length < matches.length ? `, showing ${items.length}` : ""}.`, ""];
    items.forEach((item, index) => lines.push(itemLine(item, index + 1)));
    lines.push("");
    if (catalog.thumbs === null) lines.push("Thumbnails are not published for this registry yet, so results have no images.", "");
    lines.push(thenHint(items[0]?.name));
    return { text: lines.join("\n"), data: { query: input.query, total: matches.length, results: items } };
}

export async function searchScreens(ctx: ServerContext, input: ScreenSearchInput): Promise<LibraryResult> {
    const catalog = await loadCatalog(ctx);
    const pool = catalog.entries.filter((entry) => isScreen(entry) && (!input.platform || platformOf(entry) === input.platform));
    return entrySearch(catalog, "screens", input, pool);
}

export async function searchSections(ctx: ServerContext, input: SectionSearchInput): Promise<LibraryResult> {
    const catalog = await loadCatalog(ctx);
    const wanted = input.group?.toLowerCase().replace(/[\s_]+/g, "-");
    const pool = catalog.entries.filter((entry) => isSection(entry) && (!wanted || (groupOf(entry) ?? "").includes(wanted)));
    return entrySearch(catalog, "sections", input, pool);
}

export interface FlowStepItem extends EntryItem {
    purpose: string;
}

export interface FlowItem {
    id: string;
    title: string;
    description: string;
    tags: string[];
    docsUrl: string | null;
    steps: FlowStepItem[];
    /** Entries named by the flow that the registry index does not contain. */
    unresolvedSteps: string[];
    addCommand: string;
}

export async function searchFlows(ctx: ServerContext, input: { query: string; limit?: number }): Promise<LibraryResult> {
    const registry = ctx.registry();
    const flows = await readFlows(registry);
    if (!flows) {
        return {
            text: "Flows are not published yet for this registry (flows.json is missing). Use search_screens to find individual screens and assemble the journey from them.",
            data: { query: input.query, total: 0, results: [], published: false },
        };
    }
    const { matches, nearest } = searchFlowList(flows, input.query);
    if (matches.length === 0) return noMatch("flows", input.query, nearest);

    const catalog = await loadCatalog(ctx);
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? 5));
    const items: FlowItem[] = matches.slice(0, limit).map(({ item: flow }) => {
        const steps: FlowStepItem[] = [];
        const unresolvedSteps: string[] = [];
        for (const step of flow.steps) {
            const entry = catalog.byName.get(step.entry);
            if (entry) steps.push({ ...toItem(catalog, entry), purpose: clean(step.purpose) });
            else unresolvedSteps.push(step.entry);
        }
        return {
            id: flow.id,
            title: clean(flow.title),
            description: clean(flow.description),
            tags: flow.tags,
            docsUrl: flow.docs ? catalog.siteUrl + flow.docs : null,
            steps,
            unresolvedSteps,
            addCommand: `${ADD_COMMAND} ${[...new Set(steps.map((step) => step.name))].join(" ")}`,
        };
    });

    const lines = [`${matches.length} flows match ${quote(input.query)}${items.length < matches.length ? `, showing ${items.length}` : ""}.`, ""];
    items.forEach((flow, index) => {
        lines.push(`${index + 1}. **${flow.title}** (\`${flow.id}\`): ${flow.description}`);
        if (flow.docsUrl) lines.push(`   docs: ${flow.docsUrl}`);
        flow.steps.forEach((step, stepIndex) => {
            const parts = [`   ${stepIndex + 1}. ${step.title} (\`${step.name}\`): ${step.purpose}`];
            if (step.thumbnail) parts.push(`![thumb](${step.thumbnail.light})`);
            if (step.docsUrl) parts.push(`docs: ${step.docsUrl}`);
            lines.push(parts.join(" | "));
        });
        if (flow.unresolvedSteps.length > 0) lines.push(`   Not in the registry index: ${list(flow.unresolvedSteps)}.`);
        lines.push(`   Install every step: \`${flow.addCommand}\``, "");
    });
    lines.push(thenHint(items[0]?.steps[0]?.name));
    return { text: lines.join("\n"), data: { query: input.query, total: matches.length, results: items } };
}

// ---------------------------------------------------------------------------- compare

interface SetComparison {
    sharedByAll: string[];
    uniqueTo: Record<string, string[]>;
}

/** Values every entry has, and for each entry the values no other entry has. */
function compareSets(sets: Record<string, string[]>): SetComparison {
    const names = Object.keys(sets);
    const lists = names.map((name) => new Set(sets[name]));
    const sharedByAll = [...(lists[0] ?? [])].filter((value) => lists.every((entry) => entry.has(value))).sort();
    const uniqueTo: Record<string, string[]> = {};
    names.forEach((name, i) => {
        uniqueTo[name] = [...(lists[i] ?? [])].filter((value) => lists.every((entry, j) => j === i || !entry.has(value))).sort();
    });
    return { sharedByAll, uniqueTo };
}

interface ComparedEntry extends EntryItem {
    fileCount: number;
    npmPackages: string[];
}

function setSection(title: string, set: SetComparison): string[] {
    const lines = [`**${title}**`, `- shared by all: ${list(set.sharedByAll)}`];
    for (const [name, values] of Object.entries(set.uniqueTo)) lines.push(`- only \`${name}\`: ${list(values)}`);
    return lines;
}

export async function compareScreens(ctx: ServerContext, input: { names: string[]; include_source?: boolean }): Promise<LibraryResult> {
    const catalog = await loadCatalog(ctx);
    const unique = [...new Set(input.names)];
    const known = unique.filter((name) => catalog.byName.has(name));
    const pool = catalog.entries.filter((entry) => entry.fileCount > 0);
    const unknown = unique.filter((name) => !catalog.byName.has(name)).map((name) => ({ name, nearest: searchEntries(pool, name).nearest }));

    if (known.length < 2) {
        const reason = unique.length < 2 ? "Give two to five different names." : "At least two names must be registry entries.";
        const missing = unknown.map((row) => `"${row.name}" (nearest: ${list(row.nearest)})`).join("; ");
        return {
            text: `Nothing to compare. ${reason}${missing ? ` Unknown: ${missing}.` : ""}`,
            data: { names: unique, unknown, compared: known },
            isError: true,
        };
    }

    const rows = known.map((name) => catalog.byName.get(name) as LibraryEntry);
    const entries: ComparedEntry[] = rows.map((row) => ({ ...toItem(catalog, row), fileCount: row.fileCount, npmPackages: row.dependencies ?? [] }));
    const collect = (pick: (entry: ComparedEntry) => string[]) => Object.fromEntries(entries.map((entry) => [entry.name, pick(entry)]));
    const composesWith = compareSets(collect((entry) => entry.composesWith));
    const tokenContract = compareSets(collect((entry) => entry.tokenContract));
    const npmPackages = compareSets(collect((entry) => entry.npmPackages));
    const fileCounts = Object.fromEntries(entries.map((entry) => [entry.name, entry.fileCount]));
    const installCommands = Object.fromEntries(entries.map((entry) => [entry.name, entry.addCommand]));

    let sources: Record<string, { target: string; content: string }[]> | undefined;
    if (input.include_source) {
        sources = {};
        const loaded = await Promise.all(known.map(async (name) => [name, await catalog.registry.item(name).catch(() => null)] as const));
        for (const [name, entry] of loaded) {
            if (entry) sources[name] = entry.files.map((file) => ({ target: file.target, content: file.content }));
        }
    }

    const lines = [`Comparison of ${entries.length} entries: ${known.map((name) => `\`${name}\``).join(", ")}.`, ""];
    for (const entry of entries) {
        lines.push(`## ${entry.title} (\`${entry.name}\`)`, "", entry.description, "");
        lines.push(`- layer: ${entry.layer}${entry.platform ? `, platform: ${entry.platform}` : ""}${entry.group ? `, group: ${entry.group}` : ""}`);
        if (entry.thumbnail) lines.push(`- thumbnail: ![thumb](${entry.thumbnail.light})${entry.thumbnail.dark ? ` (dark: ${entry.thumbnail.dark})` : ""}`);
        if (entry.docsUrl) lines.push(`- docs: ${entry.docsUrl}`);
        if (entry.previewUrl) lines.push(`- preview: ${entry.previewUrl}`);
        lines.push("");
    }
    lines.push("## Comparison", "");
    lines.push("**Files**", ...entries.map((entry) => `- \`${entry.name}\`: ${entry.fileCount} file${entry.fileCount === 1 ? "" : "s"}`), "");
    lines.push(...setSection("Composes with", composesWith), "");
    lines.push(...setSection("Tokens used", tokenContract), "");
    lines.push(...setSection("npm packages", npmPackages), "");
    if (sources) {
        lines.push("## Source", "");
        for (const [name, files] of Object.entries(sources)) {
            for (const file of files) lines.push(`### ${name}: ${file.target}`, "", "```tsx", file.content.replace(/\n$/, ""), "```", "");
        }
    }
    if (unknown.length > 0) {
        lines.push("## Not found", "");
        for (const row of unknown) lines.push(`- \`${row.name}\` is not a registry entry. Nearest names: ${list(row.nearest)}.`);
        lines.push("");
    }
    lines.push("## Install", "");
    for (const entry of entries) lines.push(`- \`${entry.name}\`: \`${entry.addCommand}\``);
    lines.push("", "Then: plan the chosen one with get_install_plan, or read its source with get_component.");

    return {
        text: lines.join("\n"),
        data: { names: known, entries, composesWith, tokenContract, npmPackages, fileCounts, installCommands, unknown, ...(sources ? { sources } : {}) },
    };
}

// ---------------------------------------------------------------------------- install plan

interface PlanEntry {
    name: string;
    title: string;
    layer: string;
    type: string;
    /** True when the entry is only pulled in through optionalRegistryDependencies. */
    optional: boolean;
}

interface PlanFile {
    entry: string;
    path: string;
    target: string;
    optional: boolean;
}

/**
 * Mirrors `Registry.resolveTree` (dependencies before the entries that need them; optional edges
 * walked second so anything already required stays required), but over the index alone so a
 * missing dependency is reported instead of thrown.
 */
function resolveTree(index: Map<string, LibraryEntry>, names: string[]) {
    const ordered: { entry: LibraryEntry; optional: boolean }[] = [];
    const seen = new Set<string>();
    const missing = new Set<string>();
    const required = new Set<string>();

    const visit = (name: string, optional: boolean, walkOptionalEdges: boolean) => {
        if (seen.has(name)) return;
        seen.add(name);
        const entry = index.get(name);
        if (!entry) {
            missing.add(name);
            return;
        }
        if (!optional) required.add(name);
        for (const dependency of entry.registryDependencies ?? []) visit(dependency, optional, walkOptionalEdges);
        if (walkOptionalEdges) for (const dependency of entry.optionalRegistryDependencies ?? []) visit(dependency, true, true);
        ordered.push({ entry, optional });
    };

    for (const name of names) visit(name, false, false);
    for (const name of [...required]) {
        for (const dependency of index.get(name)?.optionalRegistryDependencies ?? []) visit(dependency, true, true);
    }
    return { ordered, missing: [...missing] };
}

/** Runs `worker` over `items` with at most `limit` in flight, keeping input order. */
async function mapLimited<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;
    const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const position = next++;
            results[position] = await worker(items[position] as T);
        }
    });
    await Promise.all(lanes);
    return results;
}

export async function getInstallPlan(ctx: ServerContext, input: { names: string[] }): Promise<LibraryResult> {
    const catalog = await loadCatalog(ctx);
    const requested = [...new Set(input.names)];
    const unknown = requested.filter((name) => !catalog.byName.has(name));
    if (unknown.length > 0) {
        const pool = catalog.entries.filter((entry) => entry.fileCount > 0);
        const hints = unknown.map((name) => `"${name}" (nearest: ${list(searchEntries(pool, name).nearest)})`);
        return { text: `Unknown registry names: ${hints.join("; ")}.`, data: { unknown }, isError: true };
    }

    const { ordered, missing } = resolveTree(catalog.byName, requested);
    const requiredNpm = new Set<string>();
    const optionalNpm = new Set<string>();
    for (const { entry, optional } of ordered) {
        for (const pkg of entry.dependencies ?? []) (optional ? optionalNpm : requiredNpm).add(pkg);
    }
    for (const pkg of requiredNpm) optionalNpm.delete(pkg);

    const loaded = await mapLimited(ordered, 8, async ({ entry, optional }) => {
        let file: RegistryEntry | null = null;
        try {
            file = await catalog.registry.item(entry.name);
        } catch {
            file = null;
        }
        return { entry, optional, file };
    });

    const files: PlanFile[] = [];
    const seenTargets = new Set<string>();
    const unreadable: string[] = [];
    let demoFilesOmitted = 0;
    for (const { entry, optional, file } of loaded) {
        if (!file) {
            unreadable.push(entry.name);
            continue;
        }
        for (const item of file.files) {
            if (item.kind === "demo") {
                demoFilesOmitted += 1;
                continue;
            }
            if (seenTargets.has(item.target)) continue;
            seenTargets.add(item.target);
            files.push({ entry: entry.name, path: item.path, target: item.target, optional });
        }
    }

    const command = `${ADD_COMMAND} ${requested.join(" ")}`;
    const commandWithoutOptional = ordered.some((row) => row.optional) ? `${command} --no-optional` : null;
    const entries: PlanEntry[] = ordered.map(({ entry, optional }) => ({
        name: entry.name,
        title: clean(entry.title),
        layer: entry.layer,
        type: entry.type,
        optional,
    }));
    const npmPackages = [...requiredNpm].sort();
    const optionalNpmPackages = [...optionalNpm].sort();
    const names = requested.map((name) => `"${name}"`).join(", ");
    const note = ctx.hosted
        ? "This remote server writes nothing. Run the command in the project, or use the local server (`npx -y @properui/mcp`), whose add_component tool performs the same install."
        : `The add_component tool performs this same install in the project directory (names: [${names}]); pass dryRun: true to preview it, or run the command yourself.`;

    const required = entries.filter((entry) => !entry.optional);
    const optional = entries.filter((entry) => entry.optional);
    const lines = [`Install plan for ${requested.map((name) => `\`${name}\``).join(", ")}. Nothing has been written.`, ""];
    lines.push(
        "Run this in the project root. If the project has no components.json, run `npx @properui/cli@latest init` first.",
        "",
        "```sh",
        command,
        "```",
        "",
    );
    if (commandWithoutOptional) lines.push(`Some entries are optional dependencies and install by default. To skip them: \`${commandWithoutOptional}\`.`, "");
    lines.push(`Registry entries (${required.length}, dependencies first): ${list(required.map((entry) => entry.name))}.`);
    if (optional.length > 0) lines.push(`Optional entries (${optional.length}): ${list(optional.map((entry) => entry.name))}.`);
    lines.push("");
    lines.push(
        npmPackages.length > 0
            ? `npm packages (${npmPackages.length}): ${list(npmPackages)}. The CLI reports which are missing from the project; add --install to have it run the install.`
            : "npm packages: none.",
    );
    if (optionalNpmPackages.length > 0) lines.push(`Extra npm packages from optional entries: ${list(optionalNpmPackages)}.`);
    lines.push("", `Files written (${files.length}, relative to the components alias in components.json):`);
    for (const file of files) lines.push(`- \`${file.target}\` (from \`${file.entry}\`${file.optional ? ", optional" : ""})`);
    if (demoFilesOmitted > 0) lines.push("", `${demoFilesOmitted} demo or fixture file(s) are written only with --with-demos.`);
    if (unreadable.length > 0) lines.push("", `Could not read the files of: ${list(unreadable)}. They are still installed by the command.`);
    if (missing.length > 0) lines.push("", `Named as dependencies but missing from the registry index: ${list(missing)}.`);
    lines.push("", note);
    lines.push(
        "",
        "Then: open the written files, replace placeholder copy and demo data with the product's own, and keep the semantic tokens (no raw palette classes).",
    );

    return {
        text: lines.join("\n"),
        data: {
            requested,
            command,
            commandWithoutOptional,
            entries,
            npmPackages,
            optionalNpmPackages,
            files,
            demoFilesOmitted,
            missingEntries: missing,
            unreadableEntries: unreadable,
            note,
        },
    };
}

// ---------------------------------------------------------------------------- prompt

/** The `build_screen` prompt: research first, then install, as one user message. */
export function buildScreenPrompt(description: string, canInstall: boolean): string {
    const install = canInstall
        ? `5. Install it: call add_component with the chosen names (dryRun: true first if unsure), or run the command get_install_plan printed (it looks like \`${ADD_COMMAND} <name>\`). If get_project_info shows no components.json, run \`npx @properui/cli@latest init -y\` first.`
        : `5. Install it: run the command get_install_plan printed in the user's project (it looks like \`${ADD_COMMAND} <name>\`). If there is no components.json, run \`npx @properui/cli@latest init -y\` first. This remote server never writes files.`;
    return [
        `Build this with Proper UI: ${description}`,
        "",
        "Follow these steps in order.",
        "",
        "1. Decide what is being asked for: a whole screen (search_screens), a multi-step journey (search_flows), a section of a marketing page (search_sections), or a single control (search_components). For a journey, start with search_flows and then read each step as a screen.",
        "2. Search with two or three differently worded queries and review at least three results before choosing. Note each name, what it shows and what it lacks. With two to five candidates, call compare_screens to see what they share and where they differ.",
        "3. Call get_component on the best candidate and read its source, usage guidance and docs link. Do not write the markup from memory.",
        "4. Call get_install_plan with the chosen names. Check the npm packages and the files it will write against the user's project.",
        install,
        "6. Adapt the written code: replace placeholder copy, demo images and sample data with the product's own, wire real handlers to React Aria props (onPress, isDisabled, isSelected), and rename exports where the project needs it.",
        "7. Keep the design tokens. Use semantic classes such as bg-primary and text-tertiary, never raw palette classes or arbitrary values, and no dark: utilities; the theme handles dark mode.",
        "8. Check the result: keyboard order, focus visibility, contrast in both themes, and the layout at phone width.",
        "",
        "Separate what the library shows from what you infer. Examples use placeholder data, and sections are compositions rather than screens from shipped products.",
    ].join("\n");
}
