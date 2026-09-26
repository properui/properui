/**
 * Platform-aware registry resolution, shared by `add`, `list`, `search`, `info` and the MCP
 * server so the rules cannot drift between them.
 *
 * The registry carries two kinds of entry: React (TSX, `platforms: ["react","next"]`) and HTML
 * (`type: "html"`, `layer: "html"`, named `<component>-html`, `platforms: HTML_PLATFORMS`). A
 * project's `components.json` `platform` picks which kind `add <name>` installs.
 *
 * Spec: docs/cli.md ("Platforms").
 */
import type { Platform } from "./detect.js";
import type { RegistryMeta } from "./registry.js";

export const REACT_PLATFORMS = ["react", "next"] as const;
export const HTML_PLATFORMS = ["html", "vue", "angular", "svelte", "astro", "vanilla"] as const;

/** Every value `--platform` / the MCP `platform` filter accepts. */
export const PLATFORM_FILTERS = [...REACT_PLATFORMS, ...HTML_PLATFORMS] as const;
export type PlatformFilter = (typeof PLATFORM_FILTERS)[number];

/** Suffix every html entry name carries: `buttons` -> `buttons-html`. */
export const HTML_SUFFIX = "-html";

/**
 * The no-build install for the html platform: the prebuilt stylesheet (tokens + component
 * classes, from `@properui/tokens`), the behaviours as an IIFE (`window.ProperUI`, initialised on
 * `DOMContentLoaded` by `data-auto-init`) and the custom elements as a classic script. Printed by
 * `init` when there is no Tailwind v4 stylesheet to wire. Paths follow each package's
 * `jsdelivr` field.
 */
export const HTML_CDN = {
    stylesheet: "https://cdn.jsdelivr.net/npm/@properui/tokens/dist/properui.min.css",
    script: "https://cdn.jsdelivr.net/npm/@properui/html/dist/properui-html.iife.js",
    elements: "https://cdn.jsdelivr.net/npm/@properui/elements/dist/properui-elements.global.js",
} as const;

/** npm packages the html platform uses: tokens + component CSS/JS, and the custom elements. */
export const HTML_PACKAGES = ["@properui/tokens", "@properui/html"] as const;
export const ELEMENTS_PACKAGE = "@properui/elements";

/** Docs page that explains which components exist outside React. */
export const FRAMEWORKS_DOCS_URL = "https://properui.dev/docs/frameworks";

export const isHtmlEntry = (entry: Pick<RegistryMeta, "type" | "layer">): boolean => entry.type === "html" || entry.layer === "html";

/** The entry's `platforms`, falling back to what its type implies on registries without the field. */
export function entryPlatforms(entry: Pick<RegistryMeta, "type" | "layer" | "platforms">): string[] {
    if (entry.platforms && entry.platforms.length > 0) return entry.platforms;
    return isHtmlEntry(entry) ? [...HTML_PLATFORMS] : [...REACT_PLATFORMS];
}

/** `react` or `html`: the short label `search` prints in its platform column. */
export const entryPlatform = (entry: Pick<RegistryMeta, "type" | "layer">): Platform => (isHtmlEntry(entry) ? "html" : "react");

/** True when `entry` runs on `filter` (`react`, `next`, `html`, `vue`, ...). */
export function matchesPlatform(entry: Pick<RegistryMeta, "type" | "layer" | "platforms">, filter: string | undefined): boolean {
    if (!filter) return true;
    return entryPlatforms(entry).includes(filter.toLowerCase());
}

export function isPlatformFilter(value: string): value is PlatformFilter {
    return (PLATFORM_FILTERS as readonly string[]).includes(value.toLowerCase());
}

/** `buttons-html` -> `buttons`. */
export const htmlBaseName = (name: string): string => (name.endsWith(HTML_SUFFIX) ? name.slice(0, -HTML_SUFFIX.length) : name);

/** `button` <-> `buttons`, `modal` <-> `modals`: the spellings a name is also tried under. */
function spellings(name: string): string[] {
    return name.endsWith("s") ? [name, name.slice(0, -1)] : [name, `${name}s`];
}

/**
 * React group names whose html counterpart is the same component under another name. `add` on
 * an html project installs these without asking (`add radio-buttons` -> `radio-html`).
 */
const EQUIVALENTS: Record<string, string[]> = {
    "radio-buttons": ["radio"],
    "progress-indicators": ["progress"],
    "empty-state": ["empty"],
    alerts: ["alert", "callout"],
    modals: ["modal", "dialog"],
    notifications: ["toast", "toasts"],
    input: ["field"],
};

/**
 * React-only entries with a *different but close* html component. Only ever named in the refusal
 * message; never installed silently.
 */
const CLOSEST: Record<string, string[]> = {
    "data-table": ["table"],
    "confirm-dialog": ["modal", "modals", "dialog"],
    callout: ["alert", "alerts"],
    "button-group": ["button", "buttons"],
    "card-headers": ["card", "cards"],
    "command-menu": ["dropdown"],
    menubar: ["dropdown"],
    popover: ["dropdown"],
    "hover-card": ["tooltip"],
    "loading-indicator": ["progress", "skeleton"],
    tags: ["badge", "badges"],
    "number-input": ["input"],
    "tag-input": ["input"],
    "date-picker": ["input"],
};

/**
 * The html entry that stands in for `name`, if any: `<name>-html` first, then the singular or
 * plural spelling, then a known equivalent under another name (`exact: true` for all three,
 * which `add` installs directly). Failing that, a close-but-different component
 * (`data-table` -> `table-html`, `exact: false`), which is only ever suggested.
 */
export function htmlAlternativeFor(name: string, index: Pick<RegistryMeta, "name" | "type" | "layer">[]): { name: string; exact: boolean } | null {
    const html = new Set(index.filter(isHtmlEntry).map((entry) => entry.name));
    const base = htmlBaseName(name);
    const first = (candidates: string[]) => {
        for (const candidate of candidates) {
            for (const spelling of spellings(candidate)) if (html.has(`${spelling}${HTML_SUFFIX}`)) return `${spelling}${HTML_SUFFIX}`;
        }
        return null;
    };
    const exact = first([base, ...(EQUIVALENTS[base] ?? [])]);
    if (exact) return { name: exact, exact: true };
    const closest = first(CLOSEST[base] ?? []);
    return closest ? { name: closest, exact: false } : null;
}

export type Resolution =
    { ok: true; name: string; resolvedFrom?: string } | { ok: false; reason: "unknown" } | { ok: false; reason: "platform"; message: string };

/**
 * What `add <name>` installs on a project of `platform`.
 *
 * - `react`: the name as-is (an html entry can still be added by its full `-html` name).
 * - `html`: `<name>-html` (or its singular/plural spelling) when it exists, the name itself when
 *   it already is an html entry, otherwise a one-line refusal that names the closest html
 *   alternative, if there is one.
 */
export function resolveForPlatform(name: string, index: Pick<RegistryMeta, "name" | "type" | "layer">[], platform: Platform): Resolution {
    const entry = index.find((candidate) => candidate.name === name);
    if (platform === "react") return entry ? { ok: true, name } : { ok: false, reason: "unknown" };

    if (entry && isHtmlEntry(entry)) return { ok: true, name };
    const alternative = htmlAlternativeFor(name, index);
    if (alternative?.exact) return { ok: true, name: alternative.name, resolvedFrom: name };
    if (!entry) return { ok: false, reason: "unknown" };
    return { ok: false, reason: "platform", message: platformMismatchMessage(name, alternative?.name ?? null) };
}

/** The one-line refusal for a React-only entry on an html-platform project. */
export function platformMismatchMessage(name: string, alternative: string | null): string {
    const head = `"${name}" is React-only and this project's components.json platform is "html".`;
    if (alternative) return `${head} Use the HTML equivalent instead: properui add ${htmlBaseName(alternative)} (installs ${alternative}).`;
    return `${head} There is no HTML equivalent yet; see ${FRAMEWORKS_DOCS_URL}.`;
}
