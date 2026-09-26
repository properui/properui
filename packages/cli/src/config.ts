/**
 * `components.json` — written by `init`, read by every other command.
 * Shape is fixed by docs/cli.md.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type Platform, detectAlias, parseJsonc } from "./detect.js";

export const CONFIG_FILE = "components.json";
export const CONFIG_SCHEMA_URL = "https://properui.dev/schema.json";

/** One row of the `installed` manifest `add` writes and `diff`/`info`/`remove`/`why` read. */
export interface InstalledEntryRecord {
    /** Registry version/hash for this entry at the time it was added; see `entryVersion`. */
    version: string;
    /** Paths relative to the project root, e.g. `src/components/base/badges/badges.tsx`. */
    files: string[];
    /** ISO timestamp of the `add` run that wrote this entry. */
    installedAt: string;
}

/** name -> installed record, recorded by `add` (2.10). Absent on projects from before this existed. */
export type InstalledManifest = Record<string, InstalledEntryRecord>;

export interface ComponentsConfig {
    $schema: string;
    style: string;
    /**
     * Which registry layer `add` installs from: `react` (TSX components, the default when the
     * field is absent) or `html` (`@properui/html` snippets, for Vue, Angular, Svelte, Astro and
     * plain HTML projects). Written by `init`.
     */
    platform?: Platform;
    tsx: boolean;
    tailwind: {
        /** Global stylesheet, relative to the project root. */
        css: string;
        /** Theme token file, relative to the project root. */
        theme: string;
        prefix: string;
    };
    aliases: {
        components: string;
        utils: string;
        ui: string;
        hooks: string;
    };
    registry: string;
    installed?: InstalledManifest;
}

export function configPath(cwd: string): string {
    return path.join(cwd, CONFIG_FILE);
}

export function readConfig(cwd: string): ComponentsConfig | null {
    const file = configPath(cwd);
    if (!existsSync(file)) return null;
    const parsed = parseJsonc<ComponentsConfig>(readFileSync(file, "utf8"));
    if (!parsed?.aliases?.components) return null;
    return parsed;
}

/** The config's platform, defaulting to `react` for files written before the field existed. */
export function configPlatform(config: Pick<ComponentsConfig, "platform"> | null | undefined): Platform {
    return config?.platform === "html" ? "html" : "react";
}

export function writeConfig(cwd: string, config: ComponentsConfig): string {
    const file = configPath(cwd);
    writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    return file;
}

/**
 * `@/components` → `@/`. Falls back to `@/` for aliases without a `/` (e.g. `~components`),
 * which the caller reports as un-rewritable.
 */
export function aliasPrefixOf(alias: string): string {
    const slash = alias.indexOf("/");
    return slash === -1 ? `${alias}/` : alias.slice(0, slash + 1);
}

/**
 * Absolute directory the config's aliases resolve to (`src/` in a typical Vite or
 * Next `src` project), re-derived from tsconfig paths on every run so the two cannot drift.
 */
export function aliasBaseDir(cwd: string, config: ComponentsConfig): string {
    const prefix = aliasPrefixOf(config.aliases.components);
    const detected = detectAlias(cwd, existsSync(path.join(cwd, "src")));
    if (detected.declared && detected.prefix === prefix) return detected.base;
    return path.join(cwd, existsSync(path.join(cwd, "src")) ? "src" : ".");
}
