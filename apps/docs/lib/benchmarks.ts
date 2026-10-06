import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./content";

/**
 * Benchmark results as the docs site sees them: `benchmarks/<run>/<condition>/metrics.json` (written
 * by `benchmarks/measure.mjs`), the builder's `agent-report.md` next to it, and the protocol in
 * `benchmarks/README.md`. Read at build time like `library-index.ts` reads the registry, so a
 * comparison page never types a number: change the files and the page follows. Anything that
 * cannot be found throws, which fails the build instead of rendering a blank cell.
 */

export const BENCHMARK_RUN = "2026-10-billing";
export const PROTOCOL_URL = "https://github.com/properui/properui/blob/main/benchmarks/README.md";

export const CONDITION_IDS = ["properui", "shadcn", "tailwind"] as const;
export type ConditionId = (typeof CONDITION_IDS)[number];

export type AxeViolation = { id: string; impact: string; nodes: number };

export type PageMetrics = {
    status: number;
    axeViolations: number;
    axeNodes: number;
    axe: AxeViolation[];
    horizontalOverflow: boolean;
    consoleErrors: string[];
};

export type Metrics = {
    condition: string;
    measuredAt: string;
    /** Optional: seconds the condition's own setup command took. Rendered only when present. */
    setup?: { seconds: number };
    build: { passed: boolean; seconds: number };
    files: { authored: string[]; authoredCount: number; authoredLines: number; libraryCount: number; libraryLines: number };
    tokens: { rawPaletteClasses: number; arbitraryValues: number; darkVariants: number };
    page: { desktop: PageMetrics; mobile: PageMetrics };
    dialog: { opened: boolean; roleDialog: boolean; focusInside: boolean; escapeCloses: boolean };
};

export type AgentReport = {
    toolCalls: number;
    shellCommands: number;
    wallClockSeconds: number;
    model: string;
    /** True when the report says `pnpm build` passed on the first run. */
    buildPassedFirstRun: boolean;
    /** How many failed builds the agent fixed before the build passed. */
    buildFixes: number;
    /** The builder's own words for what broke on the first build, when it did not pass. */
    buildFailureNote: string | null;
};

export type Shot = { src: string; width: number; height: number };

export type Condition = {
    id: ConditionId;
    metrics: Metrics;
    report: AgentReport;
    shots: { desktop: Shot; mobile: Shot; dialog: Shot };
};

export type Benchmark = {
    run: string;
    /** Display date, e.g. "6 Oct 2026", as written in the protocol's run line. */
    dateLabel: string;
    model: string;
    nextVersion: string;
    prompt: string;
    protocolUrl: string;
    conditions: Record<ConditionId, Condition>;
};

const benchmarksDir = () => path.join(repoRoot(), "benchmarks");

const need = (source: string, pattern: RegExp, what: string, file: string): RegExpMatchArray => {
    const match = source.match(pattern);
    if (!match) throw new Error(`benchmarks: could not read ${what} from ${file}`);
    return match;
};

/** Width and height of a WebP file, read from its header (lossy, lossless and extended forms). */
function webpSize(file: string): { width: number; height: number } {
    const b = readFileSync(file);
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
        const bits = b.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    throw new Error(`benchmarks: ${file} is not a WebP file`);
}

function parseReport(source: string, file: string): AgentReport {
    const result = need(source, /^- Result:(.*)$/m, "the Result line", file)[1] ?? "";
    const passedFirst = /passed on the first run/.test(result);
    const failure = result.match(/failed[^(]*\(([^)]*)\)/);
    const failedTimes = result.match(/failed (once|(\d+) times)/);
    if (!passedFirst && !failedTimes) throw new Error(`benchmarks: could not tell how often the build failed in ${file}`);
    return {
        toolCalls: Number(need(source, /Tool calls: (\d+)/, "tool calls", file)[1]),
        shellCommands: Number(need(source, /Shell commands: (\d+)/, "shell commands", file)[1]),
        wallClockSeconds: Number(need(source, /Wall clock: (\d+) s/, "wall clock", file)[1]),
        model: need(source, /Model: ([a-z0-9-]+)/, "model", file)[1] ?? "",
        buildPassedFirstRun: passedFirst,
        buildFixes: passedFirst ? 0 : failedTimes?.[1] === "once" ? 1 : Number(failedTimes?.[2]),
        buildFailureNote: passedFirst ? null : (failure?.[1]?.trim() ?? null),
    };
}

let cached: Benchmark | undefined;

/** The billing-settings run: three conditions, one prompt, read from `benchmarks/2026-10-billing`. */
export function getBillingBenchmark(): Benchmark {
    if (cached) return cached;

    const root = benchmarksDir();
    const readmeFile = path.join(root, "README.md");
    const readme = readFileSync(readmeFile, "utf8");

    const prompt = need(readme, /^\s*> (Build a billing settings page[^\n]*)$/m, "the prompt", readmeFile)[1]?.trim() ?? "";
    const runLine = need(readme, new RegExp(`\`${BENCHMARK_RUN}/\`: [^,]*, (\\d+ \\w+ \\d{4}), ([a-z0-9-]+), (Next\\.js \\d+)`), "the run line", readmeFile);

    const conditions = {} as Record<ConditionId, Condition>;
    for (const id of CONDITION_IDS) {
        const dir = path.join(root, BENCHMARK_RUN, id);
        const metricsFile = path.join(dir, "metrics.json");
        const reportFile = path.join(dir, "agent-report.md");
        if (!existsSync(metricsFile) || !existsSync(reportFile)) throw new Error(`benchmarks: missing metrics.json or agent-report.md in ${dir}`);

        const shot = (name: "desktop" | "mobile" | "dialog"): Shot => {
            const rel = `benchmarks/${BENCHMARK_RUN}/${id}/${name}.webp`;
            const file = path.join(repoRoot(), "apps", "docs", "public", rel);
            if (!existsSync(file)) throw new Error(`benchmarks: missing screenshot ${file}`);
            return { src: `/${rel}`, ...webpSize(file) };
        };

        conditions[id] = {
            id,
            metrics: JSON.parse(readFileSync(metricsFile, "utf8")) as Metrics,
            report: parseReport(readFileSync(reportFile, "utf8"), reportFile),
            shots: { desktop: shot("desktop"), mobile: shot("mobile"), dialog: shot("dialog") },
        };
    }

    cached = {
        run: BENCHMARK_RUN,
        dateLabel: runLine[1] ?? "",
        model: runLine[2] ?? "",
        nextVersion: runLine[3] ?? "",
        prompt,
        protocolUrl: PROTOCOL_URL,
        conditions,
    };
    return cached;
}
