/**
 * `properui init` on an html-platform project (Vue, Nuxt, Angular, Svelte, SvelteKit, Astro or
 * plain HTML; or any project with `--platform html`).
 *
 * None of the React steps run: no `utils/cx.ts`, no ThemeProvider/RouterProvider, no TSX
 * `@source`, no Vite alias wiring. Instead:
 *   - components.json is written with `"platform": "html"`, so `add <name>` installs the
 *     `<name>-html` snippets;
 *   - with a global stylesheet and Tailwind v4, the stylesheet gets the token layer
 *     (`@properui/tokens/theme.css`), the component classes (`@properui/html/css`) and an
 *     `@source` for the snippets folder;
 *   - without one, it prints the no-build CDN `<link>` and `<script>` lines instead.
 * Either way the npm install line comes last.
 *
 * Spec: docs/cli.md ("Platforms"), docs/frameworks.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ThemePreset } from "../../../ui/src/styles/presets.js";
import { CONFIG_SCHEMA_URL, type ComponentsConfig, configPath, readConfig, writeConfig } from "../config.js";
import { installCommand, installDependencies, missingDependencies } from "../deps.js";
import { FRAMEWORK_LABEL, type ProjectInfo, readPackageJson } from "../detect.js";
import { ELEMENTS_PACKAGE, HTML_CDN, HTML_PACKAGES } from "../platform.js";
import { confirm } from "../prompt.js";
import { DEFAULT_REGISTRY_URL, resolveRegistrySource } from "../registry.js";
import { TAILWIND_IMPORT } from "../templates.js";
import { kleur, log } from "../ui.js";
import type { InitOptions } from "./init.js";
import { applyPresetToFile } from "./theme.js";

export const HTML_TOKENS_IMPORT = '@import "@properui/tokens/theme.css";';
export const HTML_CSS_IMPORT = '@import "@properui/html/css";';

/** Frameworks where `@properui/elements` (`<pui-button>`, ...) is the natural way in. */
const ELEMENTS_FRAMEWORKS = new Set(["vue", "nuxt", "angular", "svelte", "sveltekit", "astro"]);

/** POSIX-style relative path from a stylesheet to `to`, always `./`-prefixed when it stays inside. */
function relativeFromCss(cssFile: string, to: string): string {
    const relative = path.relative(path.dirname(cssFile), to).split(path.sep).join("/");
    return relative.startsWith(".") ? relative : `./${relative}`;
}

/**
 * Adds whatever is missing of: the Tailwind import, the tokens import, the html component CSS
 * import and the `@source` for the snippets folder. Everything goes right after
 * `@import "tailwindcss";` (added first when absent), never above it.
 */
function wireHtmlStylesheet(cssFile: string, componentsDir: string): string[] {
    const existing = existsSync(cssFile) ? readFileSync(cssFile, "utf8") : "";
    const sourceLine = `@source "${relativeFromCss(cssFile, componentsDir)}/**/*.html";`;
    const block = [HTML_TOKENS_IMPORT, HTML_CSS_IMPORT, sourceLine].filter((line) => !existing.includes(line));
    const hasTailwindImport = existing.includes(TAILWIND_IMPORT);
    const added = [...(hasTailwindImport ? [] : [TAILWIND_IMPORT]), ...block];
    if (added.length === 0) return added;

    let next: string;
    if (!hasTailwindImport) {
        const lead = [TAILWIND_IMPORT, ...block].join("\n");
        next = existing.trim().length > 0 ? `${lead}\n\n${existing.replace(/^\uFEFF/, "")}` : `${lead}\n`;
    } else {
        const importEnd = existing.indexOf(TAILWIND_IMPORT) + TAILWIND_IMPORT.length;
        next = block.length > 0 ? `${existing.slice(0, importEnd)}\n${block.join("\n")}${existing.slice(importEnd)}` : existing;
    }
    mkdirSync(path.dirname(cssFile), { recursive: true });
    writeFileSync(cssFile, next, "utf8");
    return added;
}

export async function runInitHtml(project: ProjectInfo, options: InitOptions, preset: ThemePreset | null): Promise<void> {
    const cwd = project.cwd;
    const relTo = (file: string) => path.relative(cwd, file).split(path.sep).join("/") || path.basename(file);
    const filesTouched: string[] = [];
    const hasPackageJson = readPackageJson(cwd) !== null;

    const existingConfig = readConfig(cwd);
    let writeNewConfig = !existingConfig || Boolean(options.overwrite);
    if (existingConfig && !options.overwrite) {
        writeNewConfig = await confirm(`${path.basename(configPath(cwd))} already exists. Overwrite it?`, { yes: options.yes, fallback: false });
        if (!writeNewConfig) log.info("Keeping the existing components.json.");
    }

    // The stylesheet is only wired when it already exists and Tailwind v4 is there to compile it;
    // otherwise the prebuilt CDN stylesheet is the honest answer.
    const cssCandidate = existingConfig?.tailwind.css || project.cssFile;
    const cssFile = cssCandidate && existsSync(path.resolve(cwd, cssCandidate)) ? cssCandidate : null;
    const tailwindReady = project.tailwindVersion !== null && project.tailwindVersion >= 4;
    const wireCss = Boolean(cssFile && tailwindReady);

    log.title("Configuring this project for Proper UI");
    log.step(`Framework       ${FRAMEWORK_LABEL[project.framework]}`);
    log.step(`Platform        html ${kleur.dim("(@properui/tokens + @properui/html snippets; React components are not installed)")}`);
    log.step(`Tailwind        ${project.tailwindVersion ? `v${project.tailwindVersion}` : "not installed"}`);
    log.step(`Stylesheet      ${cssFile ?? "none found"}`);
    log.step(`Package manager ${project.packageManager}${hasPackageJson ? "" : kleur.dim(" (no package.json)")}`);
    log.plain();

    const registrySource = resolveRegistrySource(options.registry, existingConfig?.registry);
    const alias = project.aliasPrefix;
    const config: ComponentsConfig = {
        $schema: CONFIG_SCHEMA_URL,
        style: "default",
        platform: "html",
        tsx: project.typescript,
        tailwind: {
            css: cssFile ?? "",
            theme: "@properui/tokens/theme.css",
            prefix: "",
        },
        aliases: {
            components: `${alias}components`,
            utils: `${alias}utils`,
            ui: `${alias}components`,
            hooks: `${alias}hooks`,
        },
        registry: registrySource.startsWith("http") ? registrySource : (existingConfig?.registry ?? DEFAULT_REGISTRY_URL),
        ...(existingConfig?.installed ? { installed: existingConfig.installed } : {}),
    };
    if (writeNewConfig) {
        writeConfig(cwd, config);
        filesTouched.push(relTo(configPath(cwd)));
    }

    const componentsDir = path.join(project.aliasBase, "components");
    let cssAdded: string[] = [];
    if (wireCss && cssFile) {
        cssAdded = wireHtmlStylesheet(path.resolve(cwd, cssFile), componentsDir);
        if (cssAdded.length > 0) filesTouched.push(cssFile);
    }
    const presetResult = preset && wireCss && cssFile ? applyPresetToFile(path.resolve(cwd, cssFile), preset) : null;
    if (presetResult?.status === "written" && cssFile) filesTouched.push(cssFile);

    log.title("Changes");
    log.step(`${writeNewConfig ? kleur.green("write") : kleur.dim("keep ")} ${relTo(configPath(cwd))} (platform: html)`);
    if (wireCss && cssFile) {
        if (cssAdded.length > 0) {
            log.step(`${kleur.green("write")} ${cssFile} (+${cssAdded.length} line${cssAdded.length === 1 ? "" : "s"})`);
            for (const line of cssAdded) log.plain(kleur.dim(`        ${line}`));
        } else {
            log.step(`${kleur.dim("keep ")} ${cssFile} (already wired)`);
        }
    }
    if (presetResult) {
        const label = presetResult.status === "written" ? kleur.green("write") : kleur.dim("keep ");
        log.step(`${label} ${cssFile} (theme preset "${presetResult.preset.name}", code ${presetResult.code})`);
    } else if (preset) {
        log.warn("--preset needs a Tailwind v4 stylesheet to write into. Skipped; run `properui theme apply` once one exists.");
    }

    if (!wireCss) {
        log.plain();
        log.info(
            cssFile
                ? "Tailwind v4 is not installed, so the stylesheet was left alone. Use the prebuilt stylesheet instead (no build step):"
                : "No global stylesheet found. Use the prebuilt stylesheet instead (no build step), in your page <head>:",
        );
        log.plain(kleur.dim(`        <link rel="stylesheet" href="${HTML_CDN.stylesheet}">`));
        log.plain(kleur.dim(`        <script src="${HTML_CDN.script}" data-auto-init defer></script>`));
        log.plain(kleur.dim(`        <script src="${HTML_CDN.elements}" defer></script>  <!-- optional: <pui-button>, <pui-modal>, ... -->`));
    } else {
        log.plain();
        log.info("Behaviours (dropdowns, tabs, modals, tooltips, toasts) come from @properui/html's JS:");
        log.plain(kleur.dim('        import { init } from "@properui/html"; init();'));
    }
    if (ELEMENTS_FRAMEWORKS.has(project.framework)) {
        log.info(
            `${FRAMEWORK_LABEL[project.framework]}: register the custom elements once with \`import "@properui/elements/register";\` and use <pui-button>, <pui-modal>, ...`,
        );
    }

    log.plain();
    log.title("Files written/changed");
    if (filesTouched.length === 0) log.step(kleur.dim("(none — everything already matched)"));
    else for (const file of [...new Set(filesTouched)]) log.step(file);

    log.success("Project configured for the html platform. Next: npx @properui/cli add buttons");

    // Install block — always last.
    const wanted = [...HTML_PACKAGES, ...(ELEMENTS_FRAMEWORKS.has(project.framework) || !wireCss ? [ELEMENTS_PACKAGE] : [])];
    const missing = hasPackageJson ? missingDependencies(cwd, wanted) : wanted;
    log.plain();
    if (missing.length === 0) {
        log.info("No new npm packages required.");
        return;
    }
    log.title("Install");
    for (const dependency of missing) log.step(`${kleur.cyan("need  ")} ${dependency}`);
    const cmd = hasPackageJson ? installCommand(project.packageManager, missing) : `npm i ${missing.join(" ")}`;
    if (options.install && hasPackageJson) {
        log.plain();
        const { ok, command } = installDependencies(cwd, project.packageManager, missing);
        if (ok) log.success(`Installed with \`${command}\`.`);
        else log.error(`\`${command}\` failed. Run it yourself.`);
        return;
    }
    log.plain();
    log.warn(
        hasPackageJson
            ? `Install to finish: ${kleur.bold(cmd)}`
            : `No package.json: the CDN lines above are all you need. With a bundler, install instead: ${kleur.bold(cmd)}`,
    );
}
