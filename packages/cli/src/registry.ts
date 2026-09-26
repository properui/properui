/**
 * Registry access for the CLI.
 *
 * A registry source is either an HTTP(S) base (`https://properui.dev/r`) or a
 * directory on disk (`packages/registry/dist`). Both expose the same shape:
 * `index.json` plus one `<name>.json` per entry.
 *
 * Spec: docs/cli.md
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { readAuthToken } from "./auth.js";

/** Fallback used when neither `--registry` nor `REGISTRY_URL` nor components.json says otherwise. */
export const DEFAULT_REGISTRY_URL = "https://properui.dev/r";

export type RegistryFileType = "component" | "util" | "hook" | "style" | "html";
/** `html` entries are `@properui/html` snippets (`layer: "html"`, named `<component>-html`). */
export type RegistryEntryType = "component" | "example" | "util" | "hook" | "style" | "html";

export interface RegistryFile {
    /** Path inside `packages/ui/src`, e.g. `components/base/badges/badges.tsx`. */
    path: string;
    /** Path relative to the consuming project's alias base, e.g. `components/base/badges/badges.tsx`. */
    target: string;
    type: RegistryFileType;
    content: string;
    /** npm packages this specific file imports, when the registry publishes per-file attribution. */
    dependencies?: string[];
    /** Marks a demo/story file, only written when `add --with-demos` is passed. */
    kind?: "demo";
}

/** Fields shared by `index.json` rows and full `<name>.json` entries. */
export interface RegistryMeta {
    name: string;
    layer: string;
    type: RegistryEntryType;
    title: string;
    description: string;
    registryDependencies: string[];
    /** Registry entries that improve this one but are not required; installed by default, skippable with `--no-optional`. */
    optionalRegistryDependencies?: string[];
    dependencies: string[];
    cssVars: string[];
    examples: string[];
    /**
     * Where the entry runs: `["react","next"]` for TSX entries,
     * `["html","vue","angular","svelte","astro","vanilla"]` for html entries. Absent on registries
     * built before the field existed; read it through `entryPlatforms`.
     */
    platforms?: string[];
    docs?: string;
    /** Present once the registry publishes a stable version/hash for the entry; see `entryVersion`. */
    version?: string;
    hash?: string;
    /** `@properui/ui` releases whose CHANGELOG.md bullets mention this entry; `[]` when none do. */
    changelog?: { version: string; changes: string[] }[];
}

export interface RegistryIndexEntry extends RegistryMeta {
    fileCount: number;
}

export interface RegistryEntry extends RegistryMeta {
    files: RegistryFile[];
}

export interface RegistryIndex {
    $schema?: string;
    components: RegistryIndexEntry[];
}

/** One icon package the registry indexes, e.g. `{ package: "@untitledui/icons", alias: "@properui/icons", names: [...] }`. */
export interface IconSet {
    package: string;
    alias: string;
    names: string[];
}
export type IconsIndex = IconSet[];

/**
 * `dist/exports.json`: entry name -> exported symbol names. The shipped shape is a flat
 * `string[]` per entry (no per-file breakdown); a nested `{ file: names[] }` shape is also
 * accepted in case a future registry build adds file-level granularity. Use `exportNames` to
 * read either shape uniformly.
 */
export type ExportsIndex = Record<string, string[] | Record<string, string[]>>;

/** Flattens one entry's `exports.json` row (either shape) to a plain list of export names. */
export function exportNames(value: string[] | Record<string, string[]> | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : Object.values(value).flat();
}

export class RegistryError extends Error {}

/**
 * Stable-ish version string for an installed-entry manifest row. Prefers a real version or
 * content hash once the registry publishes one; falls back to a hash of the entry's own file
 * contents so `diff`/`info` still have something consistent to compare against today.
 */
export function entryVersion(entry: RegistryEntry): string {
    if (entry.version) return entry.version;
    if (entry.hash) return entry.hash;
    const digest = createHash("sha1")
        .update(entry.files.map((file) => `${file.target}:${file.content}`).join("\n"))
        .digest("hex");
    return `content-${digest.slice(0, 12)}`;
}

const isHttp = (source: string) => /^https?:\/\//i.test(source);

/**
 * Picks the registry source, highest precedence first:
 * `--registry` flag, `REGISTRY_URL` env var, `registry` in components.json, built-in default.
 */
export function resolveRegistrySource(flag?: string, fromConfig?: string): string {
    const source = flag ?? process.env.REGISTRY_URL ?? fromConfig ?? DEFAULT_REGISTRY_URL;
    return isHttp(source) ? source.replace(/\/+$/, "") : path.resolve(source);
}

export class Registry {
    readonly source: string;
    readonly remote: boolean;

    private indexCache: RegistryIndexEntry[] | null = null;
    private readonly entryCache = new Map<string, RegistryEntry>();

    constructor(source: string) {
        this.source = source;
        this.remote = isHttp(source);
    }

    describe(): string {
        return this.remote ? this.source : `${this.source} (local)`;
    }

    private async readJson<T>(file: string): Promise<T | null> {
        if (!this.remote) {
            const full = path.join(this.source, file);
            if (!existsSync(full) || !statSync(full).isFile()) return null;
            try {
                return JSON.parse(readFileSync(full, "utf8")) as T;
            } catch (error) {
                throw new RegistryError(`${full} is not valid JSON: ${(error as Error).message}`);
            }
        }

        const url = `${this.source}/${file}`;
        const token = readAuthToken();
        let response: Response;
        try {
            response = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
        } catch (error) {
            throw new RegistryError(`Could not reach ${url}: ${(error as Error).message}`);
        }
        if (response.status === 404) return null;
        if (response.status === 401 || response.status === 403) {
            throw new RegistryError(`${url} requires authentication. Run \`properui login\` first.`);
        }
        if (!response.ok) throw new RegistryError(`${url} responded ${response.status} ${response.statusText}`);
        return (await response.json()) as T;
    }

    async index(): Promise<RegistryIndexEntry[]> {
        if (this.indexCache) return this.indexCache;
        const index = await this.readJson<RegistryIndex>("index.json");
        if (!index) throw new RegistryError(`No index.json at ${this.source}. Is the registry source correct?`);
        this.indexCache = index.components ?? [];
        return this.indexCache;
    }

    async find(name: string): Promise<RegistryIndexEntry | undefined> {
        return (await this.index()).find((entry) => entry.name === name);
    }

    async item(name: string): Promise<RegistryEntry> {
        const cached = this.entryCache.get(name);
        if (cached) return cached;
        const entry = await this.readJson<RegistryEntry>(`${name}.json`);
        if (!entry) throw new RegistryError(`Unknown component "${name}". Run \`properui list\` to see what is available.`);
        this.entryCache.set(name, entry);
        return entry;
    }

    /**
     * Resolves `names` plus every `registryDependencies` edge, depth-first, so that a
     * dependency always appears before the entry that needs it. When `includeOptional` is
     * true (the default — preserves pre-2.10 behaviour), `optionalRegistryDependencies` are
     * walked too and returned names are reported in `optional` so callers can label them.
     * `--no-optional` passes `includeOptional: false`, which drops those edges entirely.
     */
    async resolveTree(names: string[], includeOptional = true): Promise<{ entries: RegistryEntry[]; optional: Set<string> }> {
        const ordered: RegistryEntry[] = [];
        const seen = new Set<string>();
        const required = new Set<string>();

        const visitRequired = async (name: string) => {
            if (seen.has(name)) return;
            seen.add(name);
            required.add(name);
            const entry = await this.item(name);
            for (const dependency of entry.registryDependencies) await visitRequired(dependency);
            ordered.push(entry);
        };
        for (const name of names) await visitRequired(name);

        const optional = new Set<string>();
        if (includeOptional) {
            const visitOptional = async (name: string) => {
                if (seen.has(name)) return; // already required, or already visited as optional
                seen.add(name);
                optional.add(name);
                const entry = await this.item(name);
                for (const dependency of entry.registryDependencies) await visitOptional(dependency);
                for (const dependency of entry.optionalRegistryDependencies ?? []) await visitOptional(dependency);
                ordered.push(entry);
            };
            for (const name of required) {
                const entry = await this.item(name);
                for (const dependency of entry.optionalRegistryDependencies ?? []) await visitOptional(dependency);
            }
        }

        return { entries: ordered, optional };
    }

    /** `dist/icons.json`, normalised to an array. `null` when the registry does not publish one yet. */
    async icons(): Promise<IconsIndex | null> {
        const raw = await this.readJson<IconSet | IconSet[]>("icons.json");
        if (!raw) return null;
        return Array.isArray(raw) ? raw : [raw];
    }

    /** `dist/exports.json`. `null` when the registry does not publish one yet. */
    async exportsIndex(): Promise<ExportsIndex | null> {
        return this.readJson<ExportsIndex>("exports.json");
    }
}
