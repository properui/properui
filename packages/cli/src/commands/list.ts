/**
 * `properui list [--layer base] [--platform html]` — available components with layer and description.
 */
import path from "node:path";
import { readConfig } from "../config.js";
import { PLATFORM_FILTERS, isPlatformFilter, matchesPlatform } from "../platform.js";
import { Registry, RegistryError, type RegistryIndexEntry, resolveRegistrySource } from "../registry.js";
import { kleur, log } from "../ui.js";

export interface ListOptions {
    layer?: string;
    type?: string;
    /** `--platform`: only entries that run on this platform (react, next, html, vue, angular, svelte, astro, vanilla). */
    platform?: string;
    json?: boolean;
    registry?: string;
    cwd?: string;
}

/** Keeps the description on one line so the table stays readable in an 80-column terminal. */
const truncate = (value: string, max: number) => (value.length <= max ? value : `${value.slice(0, max - 3).trimEnd()}...`);

export async function runList(options: ListOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const registry = new Registry(resolveRegistrySource(options.registry, readConfig(cwd)?.registry));

    if (options.platform && !isPlatformFilter(options.platform)) {
        log.error(`Unknown --platform "${options.platform}". Use one of: ${PLATFORM_FILTERS.join(", ")}.`);
        process.exitCode = 1;
        return;
    }

    let entries: RegistryIndexEntry[];
    try {
        entries = await registry.index();
    } catch (error) {
        log.error(error instanceof RegistryError ? error.message : (error as Error).message);
        process.exitCode = 1;
        return;
    }

    if (options.layer) entries = entries.filter((entry) => entry.layer === options.layer);
    if (options.type) entries = entries.filter((entry) => entry.type === options.type);
    if (options.platform) entries = entries.filter((entry) => matchesPlatform(entry, options.platform));
    // A 0-file entry (a docs-only stub like `typography`) has nothing `add` could install.
    entries = entries.filter((entry) => entry.fileCount > 0);

    if (options.json) {
        log.plain(JSON.stringify(entries, null, 2));
        return;
    }

    if (entries.length === 0) {
        log.warn("Nothing matched those filters.");
        return;
    }

    const width = Math.max(...entries.map((entry) => entry.name.length));
    log.title(`${entries.length} item${entries.length === 1 ? "" : "s"} · ${registry.describe()}`);
    for (const entry of entries) {
        const files = kleur.dim(`${entry.fileCount} file${entry.fileCount === 1 ? "" : "s"}`);
        log.plain(`  ${kleur.bold(entry.name.padEnd(width))}  ${kleur.dim(entry.layer.padEnd(18))}  ${truncate(entry.description, 60).padEnd(60)}  ${files}`);
    }
    log.plain();
    log.info("Add one with: npx @properui/cli add <name>");
}
