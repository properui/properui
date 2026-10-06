// Measures one benchmark condition. Usage (from the repo root, after the builder agent finished):
//   node benchmarks/measure.mjs <conditionDir> <outDir> [port]
// Writes metrics.json plus desktop, mobile and dialog screenshots into <outDir>. Deterministic:
// everything here is a build, a diff against the "baseline before agent" commit, axe-core on
// the rendered page, and a regex pass over the files the agent wrote.
import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const [dir, out, portArg] = process.argv.slice(2);
if (!dir || !out) throw new Error("usage: node benchmarks/measure.mjs <conditionDir> <outDir> [port]");
const port = Number(portArg ?? 3950);
mkdirSync(out, { recursive: true });
const sh = (cmd, opts = {}) => execSync(cmd, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();

const metrics = { condition: path.basename(dir), measuredAt: new Date().toISOString() };

// 1. Build.
const buildStart = Date.now();
try {
    sh("pnpm build", { stdio: ["ignore", "pipe", "pipe"] });
    metrics.build = { passed: true, seconds: Math.round((Date.now() - buildStart) / 1000) };
} catch (error) {
    metrics.build = { passed: false, seconds: Math.round((Date.now() - buildStart) / 1000), error: String(error.stderr || error.message).slice(0, 2000) };
}

// 2. What the agent wrote, versus the baseline commit. Library files copied in by a CLI count
//    separately from files the agent authored, so each condition is judged on its own code.
const changed = sh("git status --porcelain -uall")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter((file) => !file.startsWith("node_modules") && !file.startsWith(".next"));
const isLibrary = (file) =>
    /^src\/components\/(ui|base|application|marketing|foundations|shared-assets|app-examples|marketing-examples)\//.test(file) ||
    /^src\/(utils|hooks|providers|styles)\//.test(file);
const authored = changed.filter((file) => !isLibrary(file) && /\.(tsx?|css)$/.test(file));
const library = changed.filter(isLibrary);
const countLines = (file) => (existsSync(path.join(dir, file)) ? readFileSync(path.join(dir, file), "utf8").split("\n").length : 0);
metrics.files = {
    authored,
    authoredCount: authored.length,
    authoredLines: authored.reduce((n, f) => n + countLines(f), 0),
    libraryCount: library.length,
    libraryLines: library.reduce((n, f) => n + countLines(f), 0),
};

// 3. Token discipline in authored files: raw palette classes, arbitrary values, dark: variants.
const palette =
    /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;
const arbitrary = /\b(?:bg|text|border|ring|p|px|py|m|mx|my|w|h|gap|rounded)-\[[^\]]+\]/g;
const dark = /\bdark:[a-z-]+/g;
let rawPalette = 0,
    arbitraryValues = 0,
    darkVariants = 0;
for (const file of authored) {
    const src = existsSync(path.join(dir, file)) ? readFileSync(path.join(dir, file), "utf8") : "";
    rawPalette += (src.match(palette) || []).length;
    arbitraryValues += (src.match(arbitrary) || []).length;
    darkVariants += (src.match(dark) || []).length;
}
metrics.tokens = { rawPaletteClasses: rawPalette, arbitraryValues, darkVariants };

// 4. Rendered page: axe on desktop and mobile, the cancel dialog, screenshots.
if (metrics.build.passed) {
    const server = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], { cwd: dir, stdio: "ignore", detached: true });
    const ready = async () => {
        for (let i = 0; i < 60; i++) {
            try {
                const r = await fetch(`http://localhost:${port}/settings/billing`);
                if (r.ok) return true;
            } catch {}
            await new Promise((r) => setTimeout(r, 1000));
        }
        return false;
    };
    try {
        if (!(await ready())) throw new Error("server did not start");
        const browser = await chromium.launch();
        const axeSource = readFileSync(process.env.AXE_PATH ?? require.resolve("axe-core/axe.min.js"), "utf8");
        metrics.page = {};
        for (const [name, viewport] of [
            ["desktop", { width: 1440, height: 900 }],
            ["mobile", { width: 375, height: 812 }],
        ]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
            page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
            const response = await page.goto(`http://localhost:${port}/settings/billing`, { waitUntil: "networkidle" });
            await page.addScriptTag({ content: axeSource });
            const axe = await page.evaluate(async () => {
                const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] });
                return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) };
            });
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
            await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
            metrics.page[name] = {
                status: response?.status(),
                axeViolations: axe.violations.length,
                axeNodes: axe.violations.reduce((n, v) => n + v.nodes, 0),
                axe: axe.violations,
                horizontalOverflow: overflow,
                consoleErrors: errors,
            };
            if (name === "desktop") {
                const button = page.getByRole("button", { name: /cancel/i }).first();
                const dialog = { opened: false, roleDialog: false, focusInside: false, escapeCloses: false };
                if (await button.count()) {
                    await button.click();
                    await page.waitForTimeout(500);
                    dialog.opened = (await page.locator('dialog[open], [role="dialog"], [role="alertdialog"]').count()) > 0;
                    dialog.roleDialog = (await page.locator('[role="dialog"], [role="alertdialog"], dialog[open]').count()) > 0;
                    dialog.focusInside = await page.evaluate(() => {
                        const d = document.querySelector('dialog[open], [role="dialog"], [role="alertdialog"]');
                        return !!d && d.contains(document.activeElement);
                    });
                    await page.screenshot({ path: path.join(out, "dialog.png") });
                    await page.keyboard.press("Escape");
                    await page.waitForTimeout(400);
                    dialog.escapeCloses = (await page.locator('dialog[open], [role="dialog"], [role="alertdialog"]').count()) === 0;
                }
                metrics.dialog = dialog;
            }
            await page.close();
        }
        await browser.close();
    } finally {
        try {
            process.kill(-server.pid, "SIGTERM");
        } catch {
            server.kill("SIGTERM");
        }
    }
}

writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2) + "\n");
console.log(
    JSON.stringify({
        condition: metrics.condition,
        build: metrics.build.passed,
        authored: metrics.files.authoredCount,
        lines: metrics.files.authoredLines,
        library: metrics.files.libraryCount,
        tokens: metrics.tokens,
        axeDesktop: metrics.page?.desktop?.axeViolations,
        axeMobile: metrics.page?.mobile?.axeViolations,
        dialog: metrics.dialog,
    }),
);
