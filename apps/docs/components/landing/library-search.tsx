"use client";

import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

/** One row of `/library-index.json`: the slim shape the search needs, nothing more. */
type SearchEntry = {
    name: string;
    title: string;
    kind: "screen" | "section" | "component" | "flow";
    group: string;
    thumb: string | null;
    docs: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";

const MAX_RESULTS = 8;
const DEBOUNCE_MS = 80;

const KIND_LABEL: Record<SearchEntry["kind"], string> = { screen: "Screen", flow: "Flow", section: "Section", component: "Component" };
const KIND_ORDER: Record<SearchEntry["kind"], number> = { screen: 0, flow: 1, section: 2, component: 3 };

/** Names are kebab-case; "date picker" should still reach `date-picker`. Same rule as `packages/cli/src/fuzzy.ts`. */
const normalize = (value: string) => value.toLowerCase().replace(/[\s\-_/.]+/g, "");

/** 0 when `query` is not a subsequence of `haystack`, else a score in (0, 1] rewarding contiguous, early matches. */
function fuzzyScore(haystack: string, query: string): number {
    const target = normalize(haystack);
    const needle = normalize(query);
    if (needle.length === 0) return 0;
    if (target === needle) return 1;

    const exact = target.indexOf(needle);
    if (exact !== -1) return 0.9 - Math.min(exact, 40) / 200;

    let cursor = 0;
    let matched = 0;
    let streak = 0;
    let bestStreak = 0;
    for (const character of needle) {
        const found = target.indexOf(character, cursor);
        if (found === -1) return 0;
        streak = found === cursor ? streak + 1 : 1;
        bestStreak = Math.max(bestStreak, streak);
        cursor = found + 1;
        matched += 1;
    }
    return 0.3 * (matched / needle.length) + 0.3 * (bestStreak / needle.length);
}

/** Levenshtein distance, two-row variant. */
function editDistance(a: string, b: string): number {
    const left = normalize(a);
    const right = normalize(b);
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
        const current = [i];
        for (let j = 1; j <= right.length; j += 1) {
            const substitution = (previous[j - 1] ?? 0) + (left[i - 1] === right[j - 1] ? 0 : 1);
            current[j] = Math.min((current[j - 1] ?? 0) + 1, (previous[j] ?? 0) + 1, substitution);
        }
        previous = current;
    }
    return previous[right.length] ?? Math.max(left.length, right.length);
}

/** Title and name carry the match; the group only breaks ties, so it is discounted. */
function scoreEntry(entry: SearchEntry, query: string): number {
    const needle = normalize(query);
    let best = Math.max(fuzzyScore(entry.title, query), fuzzyScore(entry.name, query) * 0.95, fuzzyScore(entry.group, query) * 0.6);

    // "login screen": every word appears somewhere, even when the words are not adjacent.
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
        const haystack = `${entry.title} ${entry.name} ${entry.group}`.toLowerCase();
        if (words.every((word) => haystack.includes(word))) best = Math.max(best, 0.85);
    }
    if (best > 0 && (normalize(entry.title).startsWith(needle) || normalize(entry.name).startsWith(needle))) best += 0.1;
    return best;
}

const byKindThenTitle = (a: SearchEntry, b: SearchEntry) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title);

function search(entries: SearchEntry[], query: string): SearchEntry[] {
    return entries
        .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score || byKindThenTitle(a.entry, b.entry))
        .slice(0, MAX_RESULTS)
        .map((match) => match.entry);
}

function nearest(entries: SearchEntry[], query: string, limit = 3): SearchEntry[] {
    return entries
        .map((entry) => ({ entry, distance: Math.min(editDistance(entry.name, query), editDistance(entry.title, query)) }))
        .sort((a, b) => a.distance - b.distance || byKindThenTitle(a.entry, b.entry))
        .slice(0, limit)
        .map((match) => match.entry);
}

/**
 * Search box over the whole library (screens, flows, sections, components). The index is
 * fetched once, on first focus, from `/library-index.json`; matching runs locally. There is no
 * server route that accepts `?q=` (`/components` is a static overview), so without JavaScript
 * the input stays disabled and a `noscript` note says so, rather than shipping a dead form.
 */
export function LibrarySearch() {
    const router = useRouter();
    const uid = useId();
    const listId = `${uid}-list`;
    const wrapperRef = useRef<HTMLDivElement>(null);

    // False in the server HTML, true once React has hydrated: the input stays disabled until then.
    const hydrated = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
    const [load, setLoad] = useState<LoadState>("idle");
    const [entries, setEntries] = useState<SearchEntry[]>([]);
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [open, setOpen] = useState(false);
    // The highlighted option belongs to one debounced query; a new query starts with none highlighted.
    const [highlight, setHighlight] = useState({ key: "", index: -1 });
    const active = highlight.key === debounced ? highlight.index : -1;
    const setActive = (update: number | ((index: number) => number)) =>
        setHighlight((current) => {
            const base = current.key === debounced ? current.index : -1;
            return { key: debounced, index: typeof update === "function" ? update(base) : update };
        });

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [query]);

    const loadIndex = () => {
        if (load !== "idle" && load !== "error") return;
        setLoad("loading");
        fetch("/library-index.json")
            .then((response) => {
                if (!response.ok) throw new Error(`library-index.json responded ${response.status}`);
                return response.json() as Promise<SearchEntry[]>;
            })
            .then((data) => {
                setEntries(data);
                setLoad("ready");
            })
            .catch(() => setLoad("error"));
    };

    const matches = useMemo(() => (load === "ready" && debounced ? search(entries, debounced) : []), [entries, debounced, load]);
    const noMatch = load === "ready" && debounced !== "" && matches.length === 0;
    const suggestions = useMemo(() => (noMatch ? nearest(entries, debounced) : []), [entries, debounced, noMatch]);
    const options = noMatch ? suggestions : matches;

    const showPanel = open && query.trim() !== "";

    let status = "";
    if (showPanel) {
        if (load === "loading" || (load === "ready" && debounced !== query.trim())) status = "Searching";
        else if (load === "error") status = "Search is unavailable";
        else if (noMatch) status = `No match. ${suggestions.length} nearest suggestions.`;
        else status = `${matches.length} ${matches.length === 1 ? "result" : "results"}`;
    }

    const go = (entry: SearchEntry) => {
        setOpen(false);
        router.push(entry.docs);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setOpen(true);
                if (options.length > 0) setActive((index) => (index + 1) % options.length);
                break;
            case "ArrowUp":
                event.preventDefault();
                setOpen(true);
                if (options.length > 0) setActive((index) => (index <= 0 ? options.length - 1 : index - 1));
                break;
            case "Enter": {
                const target = options[active] ?? (noMatch ? undefined : options[0]);
                if (showPanel && target) {
                    event.preventDefault();
                    go(target);
                }
                break;
            }
            case "Escape":
                if (open) {
                    event.preventDefault();
                    setOpen(false);
                } else if (query) {
                    setQuery("");
                }
                break;
            default:
                break;
        }
    };

    return (
        <div
            className="lib-search"
            ref={wrapperRef}
            onBlur={(event) => {
                if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
            }}
        >
            <label className="lib-search-label" htmlFor={`${uid}-input`}>
                Search every screen, flow, section and component
            </label>
            <div className="lib-search-field">
                <svg className="lib-search-icon" viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                    id={`${uid}-input`}
                    className="lib-search-input"
                    type="text"
                    role="combobox"
                    aria-expanded={showPanel}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={showPanel && active >= 0 && options[active] ? `${uid}-opt-${active}` : undefined}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={hydrated ? "Try pricing, login or table" : "Search needs JavaScript"}
                    disabled={!hydrated}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => {
                        loadIndex();
                        if (query.trim()) setOpen(true);
                    }}
                    onKeyDown={onKeyDown}
                />
            </div>
            <noscript>
                <p className="lib-search-note">Search needs JavaScript. Use the browse tabs below instead.</p>
            </noscript>

            <p className="visually-hidden" role="status">
                {status}
            </p>

            {showPanel ? (
                <div className="lib-search-panel">
                    {load === "loading" ? <p className="lib-search-message">Loading the library index</p> : null}
                    {load === "error" ? <p className="lib-search-message">Search could not load. Browse the tabs below instead.</p> : null}
                    {noMatch ? (
                        <p className="lib-search-message">
                            No match for <strong>{debounced}</strong>. Nearest:
                        </p>
                    ) : null}
                    <ul id={listId} className="lib-search-list" role="listbox" aria-label="Search results" hidden={options.length === 0}>
                        {options.map((entry, index) => (
                            // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard activation lives on the combobox input (arrows plus Enter), the standard combobox pattern.
                            <li
                                key={`${entry.kind}-${entry.name}`}
                                id={`${uid}-opt-${index}`}
                                role="option"
                                aria-selected={index === active}
                                className="lib-search-option"
                                data-active={index === active || undefined}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setActive(index)}
                                onClick={() => go(entry)}
                            >
                                <span className="lib-search-thumb" aria-hidden="true">
                                    {entry.thumb ? <img src={entry.thumb} alt="" loading="lazy" width="64" height="40" /> : null}
                                </span>
                                <span className="lib-search-text">
                                    <span className="lib-search-title">{entry.title}</span>
                                    <span className="lib-search-group">{entry.group}</span>
                                </span>
                                <span className="lib-badge" data-kind={entry.kind}>
                                    {KIND_LABEL[entry.kind]}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
