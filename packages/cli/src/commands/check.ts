/**
 * `properui check [dir]` — scans `.ts`/`.tsx`/`.jsx` files for raw Tailwind palette classes,
 * hardcoded `dark:` variants and arbitrary colour values, none of which the token system (or
 * plain ESLint) catches. Exits non-zero on any hit; there is no `--fix` (the fix is picking the
 * right semantic token, which is a judgement call, not a mechanical rewrite).
 *
 * Regexes (kept here so `--help` and this comment can never drift apart):
 *   palette    /\b(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|gray|zinc|neutral|stone|
 *               red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|
 *               purple|fuchsia|pink|rose)-\d{2,3}\b/g
 *   dark       /\bdark:[^\s"'`)]+/g
 *   arbitrary  /-\[(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/g
 *
 * A hit is skipped when the same class token also contains `-utility-` — the kit's own
 * semantic-color utilities (e.g. `outline-utility-blue-500`) are not raw palette usage.
 *
 * Spec: docs/spec/feedback/2026-09-11-agent-feedback-map.md 2.21.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { kleur, log } from "../ui.js";

export interface CheckOptions {
    cwd?: string;
}

export const PALETTE_COLORS = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
];

export const PALETTE_REGEX = new RegExp(`\\b(?:bg|text|border|ring|outline|fill|stroke)-(?:${PALETTE_COLORS.join("|")})-\\d{2,3}\\b`, "g");
export const DARK_VARIANT_REGEX = /\bdark:[^\s"'`)]+/g;
export const ARBITRARY_COLOR_REGEX = /-\[(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/g;

const RULES: { name: string; regex: RegExp }[] = [
    { name: "palette", regex: PALETTE_REGEX },
    { name: "dark-variant", regex: DARK_VARIANT_REGEX },
    { name: "arbitrary-color", regex: ARBITRARY_COLOR_REGEX },
];

const EXTENSIONS = new Set([".ts", ".tsx", ".jsx"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo", "storybook-static"]);

/** True when the class token the match sits inside also contains `-utility-` (excluded). */
function isUtilityToken(line: string, matchIndex: number): boolean {
    const isBoundary = (char: string) => /[\s"'`]/.test(char);
    let start = matchIndex;
    while (start > 0 && !isBoundary(line[start - 1] ?? "")) start -= 1;
    let end = matchIndex;
    while (end < line.length && !isBoundary(line[end] ?? "")) end += 1;
    return line.slice(start, end).includes("-utility-");
}

export interface Finding {
    /** Path relative to the `cwd` the scan was run from. */
    file: string;
    line: number;
    rule: string;
    text: string;
}

function scanFile(file: string, cwd: string, findings: Finding[]): void {
    const content = readFileSync(file, "utf8");
    const relative = path.relative(cwd, file);
    content.split("\n").forEach((line, index) => {
        for (const { name, regex } of RULES) {
            regex.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = regex.exec(line))) {
                if (!isUtilityToken(line, match.index)) {
                    findings.push({ file: relative, line: index + 1, rule: name, text: match[0] });
                }
                if (match[0].length === 0) regex.lastIndex += 1;
            }
        }
    });
}

function walk(dir: string, cwd: string, findings: Finding[]): void {
    let entries: string[];
    try {
        entries = readdirSync(dir);
    } catch {
        return;
    }
    for (const name of entries) {
        if (SKIP_DIRS.has(name)) continue;
        const full = path.join(dir, name);
        const stats = statSync(full);
        if (stats.isDirectory()) walk(full, cwd, findings);
        else if (EXTENSIONS.has(path.extname(name))) scanFile(full, cwd, findings);
    }
}

/**
 * Scans a directory (recursively) or a single file and returns every finding, without printing.
 * `runCheck` and the MCP server's `check_tokens` tool both go through this.
 */
export function scanForViolations(target: string, cwd: string): Finding[] {
    const findings: Finding[] = [];
    let isFile = false;
    try {
        isFile = statSync(target).isFile();
    } catch {
        return findings;
    }
    if (isFile) scanFile(target, cwd, findings);
    else walk(target, cwd, findings);
    return findings;
}

export async function runCheck(dir: string | undefined, options: CheckOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const scanRoot = path.resolve(cwd, dir ?? ".");

    const findings = scanForViolations(scanRoot, cwd);

    if (findings.length === 0) {
        log.success("No raw palette classes, dark: variants or arbitrary colour values found.");
        return;
    }

    log.title(`${findings.length} finding${findings.length === 1 ? "" : "s"}`);
    for (const finding of findings) {
        log.plain(`  ${kleur.dim(`${finding.file}:${finding.line}`)}  ${kleur.yellow(finding.rule.padEnd(15))}  ${finding.text}`);
    }
    log.plain();
    log.warn("These bypass the token system: use the kit's semantic colour tokens instead.");
    process.exitCode = 1;
}
