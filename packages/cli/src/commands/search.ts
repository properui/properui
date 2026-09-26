/**
 * `properui search <query>` — local fuzzy search over name + title + description + export
 * names (`exports.json`, when the registry publishes one) + example names. `--icons` (or the
 * standalone `properui icons` command) instead searches the icon export index.
 *
 * A real score threshold means most typos and unrelated queries get an honest "no match"
 * instead of a list of loosely-related noise, and entries with 0 files (docs-only stubs like
 * `typography`) are never shown — there is nothing `add` could install for them.
 *
 * Every row shows its platform (`react` or `html`); `--platform` narrows the search to one.
 */
import path from "node:path";
import { readConfig } from "../config.js";
import { fuzzyScore } from "../fuzzy.js";
import { PLATFORM_FILTERS, entryPlatform, isPlatformFilter, matchesPlatform } from "../platform.js";
import { type ExportsIndex, Registry, RegistryError, type RegistryFile, type RegistryIndexEntry, exportNames, resolveRegistrySource } from "../registry.js";
import { kleur, log } from "../ui.js";
import { runIcons } from "./icons.js";

export interface SearchOptions {
    limit?: string;
    registry?: string;
    cwd?: string;
    /** `--platform`: only entries that run on this platform (react, next, html, vue, ...). */
    platform?: string;
    /** `--icons`: delegate to the icon-name search instead of the component index. */
    icons?: boolean;
}

/** Below this, a match is more likely to be noise than a real hit for the query. */
const SCORE_THRESHOLD = 0.32;

interface ScoredMatch {
    entry: RegistryIndexEntry;
    score: number;
    /** Set when the winning hit came from an exported symbol name rather than name/title/description. */
    matchedExport?: { name: string; file?: string };
}

/** Best score across name, title, description, examples and (when available) exported symbol names. */
export function scoreEntry(entry: RegistryIndexEntry, query: string, exportsForEntry?: ExportsIndex[string]): ScoredMatch {
    let best = fuzzyScore(entry.name, query);
    let matchedExport: ScoredMatch["matchedExport"];

    const title = 0.85 * fuzzyScore(entry.title, query);
    if (title > best) best = title;

    const description = 0.6 * fuzzyScore(entry.description, query);
    if (description > best) best = description;

    for (const example of entry.examples) {
        const score = 0.7 * fuzzyScore(example, query);
        if (score > best) best = score;
    }

    for (const name of exportNames(exportsForEntry)) {
        const score = 0.8 * fuzzyScore(name, query);
        if (score > best) {
            best = score;
            matchedExport = { name };
        }
    }

    return { entry, score: best, matchedExport };
}

/** Which of `files` actually declares `name` as an export — best-effort, source-text scan. */
function findExportFile(files: RegistryFile[], name: string): string | undefined {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
        `\\bexport\\s+(?:default\\s+)?(?:const|function|class|interface|type|enum)\\s+${escaped}\\b|\\bexport\\s*\\{[^}]*\\b${escaped}\\b`,
    );
    return files.find((file) => pattern.test(file.content))?.target;
}

export async function runSearch(query: string, options: SearchOptions): Promise<void> {
    if (options.icons) {
        await runIcons(query, options);
        return;
    }

    const cwd = path.resolve(options.cwd ?? process.cwd());
    const registry = new Registry(resolveRegistrySource(options.registry, readConfig(cwd)?.registry));

    if (options.platform && !isPlatformFilter(options.platform)) {
        log.error(`Unknown --platform "${options.platform}". Use one of: ${PLATFORM_FILTERS.join(", ")}.`);
        process.exitCode = 1;
        return;
    }

    let entries: RegistryIndexEntry[];
    let exportsIndex: ExportsIndex | null;
    try {
        entries = await registry.index();
        exportsIndex = await registry.exportsIndex();
    } catch (error) {
        log.error(error instanceof RegistryError ? error.message : (error as Error).message);
        process.exitCode = 1;
        return;
    }

    const visible = entries.filter((entry) => entry.fileCount > 0 && matchesPlatform(entry, options.platform));

    const limit = Number(options.limit ?? 20);
    const matches = visible
        .map((entry) => scoreEntry(entry, query, exportsIndex?.[entry.name]))
        .filter((match) => match.score >= SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
        .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 20);

    if (matches.length === 0) {
        log.warn(`no match for "${query}"`);
        return;
    }

    // exports.json says *which entry* exports a name, not which of its files — resolve that by
    // scanning source text, but only for the handful of matches actually shown.
    for (const match of matches) {
        if (!match.matchedExport || match.matchedExport.file) continue;
        try {
            const entry = await registry.item(match.entry.name);
            match.matchedExport.file = findExportFile(entry.files, match.matchedExport.name);
        } catch {
            // best-effort: leave the file unresolved rather than fail the whole search
        }
    }

    const width = Math.max(...matches.map((match) => match.entry.name.length));
    log.title(`${matches.length} match${matches.length === 1 ? "" : "es"} for "${query}"`);
    for (const { entry, matchedExport } of matches) {
        const examples = entry.examples.length > 0 ? kleur.dim(` · ${entry.examples.length} docs examples`) : "";
        const files = kleur.dim(` · ${entry.fileCount} file${entry.fileCount === 1 ? "" : "s"}`);
        const exportHit = matchedExport ? kleur.dim(` · ${matchedExport.name}${matchedExport.file ? ` in ${matchedExport.file}` : ""}`) : "";
        log.plain(
            `  ${kleur.bold(entry.name.padEnd(width))}  ${entryPlatform(entry).padEnd(5)}  ${kleur.dim(entry.layer.padEnd(18))}  ${entry.title}${examples}${files}${exportHit}`,
        );
    }
}
