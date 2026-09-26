#!/usr/bin/env node
/**
 * properui CLI — init / add / list / search / diff / login.
 * Spec: docs/cli.md (commands, components.json, auto-detection).
 */
import { Command } from "commander";
import { createRequire } from "node:module";
import { runAdd } from "./commands/add.js";
import { runAgentInit } from "./commands/agent.js";
import { runCheck } from "./commands/check.js";
import { runCreate } from "./commands/create.js";
import { runDiff } from "./commands/diff.js";
import { runIcons } from "./commands/icons.js";
import { runInfo } from "./commands/info.js";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { runLogin } from "./commands/login.js";
import { runRemove } from "./commands/remove.js";
import { runSearch } from "./commands/search.js";
import { runThemeApply, runThemeList } from "./commands/theme.js";
import { runWhy } from "./commands/why.js";
import { CancelledError } from "./prompt.js";
import { DEFAULT_REGISTRY_URL, RegistryError } from "./registry.js";
import { log } from "./ui.js";

const REGISTRY_HELP = `registry directory or base URL (default: $REGISTRY_URL or ${DEFAULT_REGISTRY_URL})`;

/** Wraps a command action so expected failures print one line instead of a stack trace. */
function guard<A extends unknown[]>(action: (...args: A) => Promise<void>): (...args: A) => Promise<void> {
    return async (...args: A) => {
        try {
            await action(...args);
        } catch (error) {
            if (error instanceof CancelledError) {
                log.warn("Cancelled.");
                process.exitCode = 130;
                return;
            }
            log.error(error instanceof RegistryError ? error.message : ((error as Error).message ?? String(error)));
            if (process.env.PROPERUI_DEBUG) console.error(error);
            process.exitCode = 1;
        }
    };
}

// Read at runtime from the published package.json so `--version` can never drift from the release.
const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

const program = new Command();

program
    .name("properui")
    .description("Add Proper UI components to your project")
    .version(version)
    .option("--cwd <dir>", "run against another directory", process.cwd());

program
    .command("init")
    .description("Configure this project: components.json, theme tokens, cx util and the ThemeProvider")
    .option("--nextjs", "treat this project as Next.js instead of auto-detecting")
    .option("--vite", "treat this project as Vite instead of auto-detecting")
    .option("--manual", "write the files but do not edit the app entry point")
    .option("--overwrite", "replace components.json and any files that already exist")
    .option("--no-providers", "skip copying/wiring ThemeProvider and RouterProvider entirely")
    .option("--install", "run the install command instead of only printing it")
    .option("--no-tooling-ignores", "skip appending ESLint/Prettier ignore entries for vendored directories")
    .option("--preset <name|code>", "apply a theme preset or preset code to the global stylesheet (see `properui theme list`)")
    .option("--registry <source>", REGISTRY_HELP)
    .option("-y, --yes", "accept every default; never prompt")
    .action(guard(async (options) => runInit({ ...options, cwd: program.opts().cwd })));

program
    .command("create")
    .description("Scaffold a new Next.js or Vite project, pre-wired for Proper UI")
    .argument("<dir>", "directory to create the project in (created if it does not exist)")
    .option("--template <name>", "next or vite (default: next)")
    .option("--pm <manager>", "pnpm, npm, yarn or bun (default: npm)")
    .option("--install", "run the package manager install after scaffolding")
    .option("--overwrite", "scaffold into a directory that already has files in it")
    .option("--registry <source>", REGISTRY_HELP)
    .option("-y, --yes", "accept every default; never prompt")
    .action(guard(async (dir: string, options) => runCreate(dir, { ...options, cwd: program.opts().cwd })));

program
    .command("add")
    .description("Add components (or `add example <name>` for a full page example) and their dependencies")
    .argument("[components...]", "component names, or `example <name>`")
    .option("--all", "add every component in the registry")
    .option("--overwrite", "replace files that already exist")
    .option("--path <dir>", "put component files in this directory instead of the components alias")
    .option("--dry-run", "print what would change without writing anything")
    .option("--no-optional", "skip optionalRegistryDependencies instead of installing them")
    .option("--with-demos", 'also write demo files (kind: "demo") for the added entries, when the registry has them')
    .option("--registry <source>", REGISTRY_HELP)
    .option("-y, --yes", "accept every default; never prompt")
    .action(guard(async (components: string[], options) => runAdd(components, { ...options, cwd: program.opts().cwd })));

program
    .command("remove")
    .description("Remove an installed entry's files (only those not shared with another installed entry)")
    .argument("<entries...>", "entry names to remove, e.g. `properui remove badges`")
    .option("--dry-run", "print what would be removed without deleting anything")
    .option("--registry <source>", REGISTRY_HELP)
    .action(guard(async (entries: string[], options) => runRemove(entries, { ...options, cwd: program.opts().cwd })));

program
    .command("why")
    .description("Show the dependency chain that brought an installed file or entry into this project")
    .argument("<target>", "an installed entry name or one of its file paths")
    .option("--registry <source>", REGISTRY_HELP)
    .action(guard(async (target: string, options) => runWhy(target, { ...options, cwd: program.opts().cwd })));

program
    .command("check")
    .description(
        "Scan .ts/.tsx/.jsx files for raw Tailwind palette classes, hardcoded dark: variants and arbitrary colour values " +
            "(palette: /\\b(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|" +
            "yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b/g; " +
            "dark: /\\bdark:[^\\s\"'`)]+/g; arbitrary: /-\\[(?:#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/g). " +
            "Tokens containing -utility- are excluded. Exits non-zero on any hit; no --fix.",
    )
    .argument("[dir]", "directory to scan, relative to --cwd (default: the whole project)")
    .action(guard(async (dir: string | undefined, options) => runCheck(dir, { ...options, cwd: program.opts().cwd })));

program
    .command("icons")
    .description("Fuzzy search the registry's icon export index and print the import line for each match")
    .argument("<query>")
    .option("--limit <n>", "maximum results", "20")
    .option("--registry <source>", REGISTRY_HELP)
    .action(guard(async (query: string, options) => runIcons(query, { ...options, cwd: program.opts().cwd })));

program
    .command("list")
    .description("List available components with layer and description")
    .option("--layer <layer>", "filter by layer, e.g. base, application, marketing")
    .option("--type <type>", "filter by type: component, example, util, hook, style")
    .option("--json", "print the raw index rows")
    .option("--registry <source>", REGISTRY_HELP)
    .option("-y, --yes", "accept every default; never prompt")
    .action(guard(async (options) => runList({ ...options, cwd: program.opts().cwd })));

program
    .command("search")
    .description("Fuzzy search over component names, titles, descriptions, exported symbol names and example names")
    .argument("<query>")
    .option("--limit <n>", "maximum results", "20")
    .option("--icons", "search the icon export index instead (same as `properui icons <query>`)")
    .option("--registry <source>", REGISTRY_HELP)
    .option("-y, --yes", "accept every default; never prompt")
    .action(guard(async (query: string, options) => runSearch(query, { ...options, cwd: program.opts().cwd })));

program
    .command("diff")
    .description("Show local modifications against the registry version")
    .argument("[component]", "component to compare; omit to check everything already installed")
    .option("--registry <source>", REGISTRY_HELP)
    .option("-y, --yes", "accept every default; never prompt")
    .action(guard(async (component: string | undefined, options) => runDiff(component, { ...options, cwd: program.opts().cwd })));

program
    .command("agent")
    .description("Manage the portable Proper UI Skill for AI coding tools")
    .addCommand(
        new Command("init")
            .description("Install the Proper UI Skill for an AI coding tool: claude, codex, cursor, lovable, or all")
            .option("--client <client>", "claude, codex, cursor, lovable, or all", "all")
            .option("--overwrite", "replace the Skill file even if it already exists")
            .option("--no-mcp", "skip registering the Proper UI MCP server (.mcp.json, .cursor/mcp.json, the Codex TOML block)")
            .option("-y, --yes", "accept every default; never prompt")
            .action(guard(async (options) => runAgentInit({ ...options, cwd: program.opts().cwd }))),
    );

program
    .command("theme")
    .description("List theme presets, or apply one (brand ramp, base gray, radius, fonts) to the global stylesheet")
    .addCommand(
        new Command("list")
            .description("List the shipped theme presets with their preset codes")
            .option("--json", "print the presets as JSON")
            .action(guard(async (options) => runThemeList({ ...options, cwd: program.opts().cwd }))),
    )
    .addCommand(
        new Command("apply")
            .description("Write (or replace) the marked theme-preset block in the global stylesheet")
            .argument("<preset>", "a preset name from `properui theme list`, or a preset code from the docs theme generator")
            .option("--css <file>", "stylesheet to write to (default: components.json tailwind.css, else the detected global stylesheet)")
            .option("--dry-run", "print the block without writing anything")
            .action(guard(async (preset: string, options) => runThemeApply(preset, { ...options, cwd: program.opts().cwd }))),
    );

program
    .command("info")
    .description("Show this project's Proper UI setup: framework, Tailwind, aliases and installed entries")
    .option("--json", "print machine-readable JSON instead of a formatted report")
    .option("--registry <source>", REGISTRY_HELP)
    .action(guard(async (options) => runInfo({ ...options, cwd: program.opts().cwd })));

program
    .command("login")
    .description("Store a registry token at ~/.properui/auth.json (private registries only)")
    .option("--token <token>", "use this token instead of prompting")
    .option("--registry <source>", REGISTRY_HELP)
    .option("-y, --yes", "accept every default; never prompt")
    .action(guard(async (options) => runLogin({ ...options, cwd: program.opts().cwd })));

program.parseAsync().catch((error: unknown) => {
    log.error((error as Error).message);
    process.exit(1);
});
