/**
 * `properui theme list` / `properui theme apply <preset|code> [--css <file>]`.
 *
 * A preset is a brand ramp + base gray + radius scale (+ optional fonts), defined once in
 * `packages/ui/src/styles/presets.ts` and bundled into the CLI at build time, so both commands
 * work offline. `apply` writes a `@theme` override block between
 * `/* properui:theme-preset *\/` markers at the end of the project's global stylesheet, after the
 * theme import, and replaces that block on every later run (idempotent).
 *
 * Spec: docs/cli.md § theme
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
    type ScaleStep,
    THEME_PRESETS,
    type ThemePreset,
    applyThemeCssBlock,
    encodePreset,
    generateThemeCss,
    parseRgb,
    readAppliedPresetCode,
    resolvePreset,
} from "../../../ui/src/styles/presets.js";
import { readConfig } from "../config.js";
import { defaultCssFile, detectProject } from "../detect.js";
import { kleur, log } from "../ui.js";

export interface ThemeListOptions {
    json?: boolean;
    cwd?: string;
}

export interface ThemeApplyOptions {
    /** Stylesheet to write the block into, relative to `cwd`. Defaults to components.json's `tailwind.css`. */
    css?: string;
    /** Print what would change without writing. */
    dryRun?: boolean;
    cwd?: string;
}

export interface ThemeApplyResult {
    file: string;
    status: "written" | "unchanged";
    preset: ThemePreset;
    code: string;
}

/** A two-cell truecolor swatch of one ramp step, or nothing when colour output is off. */
const swatch = (value: string): string => {
    const rgb = parseRgb(value);
    if (!rgb || !kleur.enabled || process.env.NO_COLOR) return "";
    return `\u001b[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m  \u001b[0m`;
};

/** Picks the stylesheet `apply` writes to: `--css`, then components.json, then detection. */
export function resolveThemeCssFile(cwd: string, override?: string): string {
    if (override) return path.resolve(cwd, override);
    const config = readConfig(cwd);
    if (config?.tailwind.css) return path.resolve(cwd, config.tailwind.css);
    const project = detectProject(cwd);
    return path.resolve(cwd, project.cssFile ?? defaultCssFile(project.framework, project.srcDir));
}

/**
 * Writes (or replaces) the marked preset block in `cssFile`. Shared by `theme apply` and
 * `init --preset`. Never touches anything outside the markers.
 */
export function applyPresetToFile(cssFile: string, preset: ThemePreset, dryRun = false): ThemeApplyResult {
    const existing = existsSync(cssFile) ? readFileSync(cssFile, "utf8") : "";
    const next = applyThemeCssBlock(existing, generateThemeCss(preset));
    const code = encodePreset(preset);
    if (next === existing) return { file: cssFile, status: "unchanged", preset, code };
    if (!dryRun) {
        mkdirSync(path.dirname(cssFile), { recursive: true });
        writeFileSync(cssFile, next, "utf8");
    }
    return { file: cssFile, status: "written", preset, code };
}

export async function runThemeList(options: ThemeListOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());

    if (options.json) {
        log.plain(
            JSON.stringify(
                THEME_PRESETS.map((preset) => ({ ...preset, code: encodePreset(preset) })),
                null,
                2,
            ),
        );
        return;
    }

    const applied = (() => {
        try {
            const file = resolveThemeCssFile(cwd);
            return existsSync(file) ? readAppliedPresetCode(readFileSync(file, "utf8")) : null;
        } catch {
            return null;
        }
    })();

    log.title("Theme presets");
    const width = Math.max(...THEME_PRESETS.map((preset) => preset.name.length));
    for (const preset of THEME_PRESETS) {
        const code = encodePreset(preset);
        const ramp = ([100, 300, 500, 600, 700, 900] as ScaleStep[]).map((step) => swatch(preset.brand[step])).join("");
        const current = applied === code ? kleur.green(" (applied)") : "";
        log.step(
            `${preset.name.padEnd(width)}  ${ramp}${ramp ? " " : ""}${kleur.dim(`gray ${preset.gray.padEnd(7)} radius ${preset.radius.padEnd(4)}`)} ${kleur.dim(code)}${current}`,
        );
    }
    log.plain();
    log.info("Apply one with `properui theme apply <name>`, or paste a code from https://properui.dev/docs/theme-generator.");
}

export async function runThemeApply(input: string, options: ThemeApplyOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const preset = resolvePreset(input);
    const cssFile = resolveThemeCssFile(cwd, options.css);
    const result = applyPresetToFile(cssFile, preset, Boolean(options.dryRun));
    const relative = path.relative(cwd, result.file) || path.basename(result.file);

    log.title(`Theme preset: ${preset.label}`);
    log.step(`Brand 600  ${swatch(preset.brand[600])}${swatch(preset.brand[600]) ? " " : ""}${preset.brand[600]}`);
    log.step(`Base gray  ${preset.gray}`);
    log.step(`Radius     ${preset.radius}`);
    if (preset.fontBody) log.step(`Body font  ${preset.fontBody}`);
    if (preset.fontDisplay) log.step(`Display    ${preset.fontDisplay}`);
    log.step(`Code       ${result.code}`);
    log.plain();

    if (result.status === "unchanged") {
        log.step(`${kleur.dim("keep ")} ${relative} (preset already applied)`);
        return;
    }
    if (options.dryRun) {
        log.step(`${kleur.yellow("would write")} ${relative}`);
        log.plain(kleur.dim(generateThemeCss(preset)));
        return;
    }
    log.step(`${kleur.green("write")} ${relative} (properui:theme-preset block)`);
    log.success(`Applied "${preset.name}". Re-run \`properui theme apply <preset|code>\` any time; only the marked block is replaced.`);
}
