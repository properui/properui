/**
 * `properui diff [component]` — local modifications vs the registry version.
 * With no argument it checks every component that already exists in the project.
 *
 * Spec: docs/cli.md
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { aliasBaseDir, readConfig } from "../config.js";
import { diffLines, hunks } from "../diff.js";
import { prepareFile } from "../files.js";
import { Registry, type RegistryEntry, RegistryError, resolveRegistrySource } from "../registry.js";
import { kleur, log, spinner } from "../ui.js";

export interface DiffOptions {
    registry?: string;
    cwd?: string;
}

const SEMVER = /^\d+\.\d+\.\d+$/;

/** `1` when `a` is a newer release than `b`, `0` equal, `-1` older. Only meaningful for `x.y.z` strings. */
function compareSemver(a: string, b: string): number {
    const partsA = a.split(".").map(Number);
    const partsB = b.split(".").map(Number);
    for (let index = 0; index < 3; index++) {
        const delta = (partsA[index] ?? 0) - (partsB[index] ?? 0);
        if (delta !== 0) return delta > 0 ? 1 : -1;
    }
    return 0;
}

/**
 * Prints the entry's changelog (2.14 registry metadata), filtered to releases newer than the
 * version recorded in the installed manifest when that record is a real `x.y.z` — the manifest
 * mostly carries a content hash today (see `entryVersion`), which isn't comparable, so the full
 * changelog is printed instead whenever it isn't.
 */
function printChangelog(entry: RegistryEntry, installedVersion: string | undefined): void {
    const changelog = entry.changelog ?? [];
    if (changelog.length === 0) return;

    const installed = installedVersion && SEMVER.test(installedVersion) ? installedVersion : undefined;
    const releases = installed ? changelog.filter((release) => SEMVER.test(release.version) && compareSemver(release.version, installed) > 0) : changelog;
    if (releases.length === 0) return;

    log.title(installed ? `Changelog since ${installed}` : "Changelog");
    for (const release of releases) {
        log.plain(`  ${kleur.bold(release.version)}`);
        for (const change of release.changes) log.plain(`    - ${change}`);
    }
    log.plain();
}

export async function runDiff(component: string | undefined, options: DiffOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const config = readConfig(cwd);
    if (!config) {
        log.error("No components.json found. Run `properui init` first.");
        process.exitCode = 1;
        return;
    }

    const registry = new Registry(resolveRegistrySource(options.registry, config.registry));
    const aliasBase = aliasBaseDir(cwd, config);
    const resolveOptions = { cwd, aliasBase };

    let entries: RegistryEntry[];
    const load = spinner(component ? `Loading ${component}` : "Scanning for components copied into this project");
    try {
        if (component) {
            entries = [await registry.item(component)];
        } else if (config.installed && Object.keys(config.installed).length > 0) {
            // The installed manifest (2.10) already knows what's here — no need to re-derive it
            // by checking every registry entry's files against the filesystem.
            entries = [];
            for (const name of Object.keys(config.installed)) {
                try {
                    entries.push(await registry.item(name));
                } catch {
                    // entry removed from the registry since it was installed; skip it
                }
            }
        } else {
            const index = await registry.index();
            entries = [];
            for (const meta of index) {
                if (meta.type === "example") continue;
                const entry = await registry.item(meta.name);
                const present = entry.files.some((file) => existsSync(prepareFile(file, config, resolveOptions).target));
                if (present) entries.push(entry);
            }
        }
        load.succeed(`Comparing ${entries.length} component${entries.length === 1 ? "" : "s"} against ${registry.describe()}.`);
    } catch (error) {
        load.fail(error instanceof RegistryError ? error.message : (error as Error).message);
        process.exitCode = 1;
        return;
    }

    if (component && entries[0]) {
        log.plain();
        printChangelog(entries[0], config.installed?.[component]?.version);
    }

    let modified = 0;
    let missing = 0;

    for (const entry of entries) {
        for (const file of entry.files) {
            const { target, content } = prepareFile(file, config, resolveOptions);
            const relative = path.relative(cwd, target);

            if (!existsSync(target)) {
                if (component) {
                    missing += 1;
                    log.plain(`  ${kleur.dim("absent")} ${relative}`);
                }
                continue;
            }

            const local = readFileSync(target, "utf8");
            if (local === content) continue;

            modified += 1;
            log.title(`${entry.name} · ${relative}`);
            for (const hunk of hunks(diffLines(local.split("\n"), content.split("\n")))) {
                for (const line of hunk) {
                    if (line.op === "equal") log.plain(kleur.dim(`   ${line.text}`));
                    else if (line.op === "remove") log.plain(kleur.red(` - ${line.text}`));
                    else log.plain(kleur.green(` + ${line.text}`));
                }
                log.plain(kleur.dim("   ---"));
            }
        }
    }

    log.plain();
    if (modified === 0) {
        log.success(missing > 0 ? `No local modifications (${missing} file(s) not installed).` : "No local modifications: everything matches the registry.");
        return;
    }
    log.warn(`${modified} file${modified === 1 ? "" : "s"} differ from the registry.`);
    log.info(`Take the registry version with: npx @properui/cli add ${component ?? "<component>"} --overwrite`);
}
