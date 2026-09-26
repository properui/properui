/**
 * `properui create <dir>` — scaffold a brand-new Next.js or Vite project from an embedded
 * template, then run the same `init`/`add` logic `properui` uses against an existing project.
 *
 * Unlike `add`'s `--yes` (which also accepts the install confirmation, per its own docs), a plain
 * `properui create <dir>` never touches the network on its own: the scaffold and the `init`/`add`
 * steps only write files. An actual package-manager install only ever runs when `--install` is
 * passed, both for the template's own base dependencies (react, the framework, Tailwind — written
 * into package.json above but never installed by `init`/`add`, since neither treats an already
 * *declared* dependency as missing) and for whatever `init`/`add` themselves report as missing.
 *
 * Spec: docs/cli.md ("create").
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type CreateTemplate, TEMPLATE_FILES, packageNameFor } from "../create-templates.js";
import type { PackageManager } from "../detect.js";
import { log } from "../ui.js";
import { runAdd } from "./add.js";
import { runInit } from "./init.js";

export interface CreateOptions {
    template?: string;
    pm?: string;
    install?: boolean;
    overwrite?: boolean;
    yes?: boolean;
    registry?: string;
    cwd?: string;
}

const TEMPLATES = new Set<CreateTemplate>(["next", "vite"]);
const PACKAGE_MANAGERS = new Set<PackageManager>(["pnpm", "npm", "yarn", "bun"]);

const runVerb = (manager: PackageManager) => (manager === "npm" ? "npm run dev" : `${manager} dev`);

export async function runCreate(dir: string, options: CreateOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const target = path.resolve(cwd, dir);
    const relativeTarget = path.relative(cwd, target) || dir;

    if (options.template && !TEMPLATES.has(options.template as CreateTemplate)) {
        log.error(`Unknown --template "${options.template}". Use "next" or "vite".`);
        process.exitCode = 1;
        return;
    }
    if (options.pm && !PACKAGE_MANAGERS.has(options.pm as PackageManager)) {
        log.error(`Unknown --pm "${options.pm}". Use "pnpm", "npm", "yarn" or "bun".`);
        process.exitCode = 1;
        return;
    }

    if (existsSync(target)) {
        if (readdirSync(target).length > 0 && !options.overwrite) {
            log.error(`${relativeTarget} already exists and is not empty. Pass --overwrite to scaffold into it anyway.`);
            process.exitCode = 1;
            return;
        }
    } else {
        mkdirSync(target, { recursive: true });
    }

    const template: CreateTemplate = (options.template as CreateTemplate) ?? "next";
    const manager: PackageManager = (options.pm as PackageManager) ?? "npm";
    const projectName = packageNameFor(path.basename(target));

    log.title(`Scaffolding ${template === "next" ? "a Next.js" : "a Vite"} project in ${relativeTarget}`);
    for (const [relative, content] of Object.entries(TEMPLATE_FILES[template])) {
        const file = path.join(target, relative);
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, content.replaceAll("__PROJECT_NAME__", projectName), "utf8");
        log.step(`write ${relative}`);
    }

    if (options.install) {
        log.plain();
        log.title("Installing base dependencies");
        const result = spawnSync(manager, ["install"], { cwd: target, stdio: "inherit" });
        if (result.status !== 0) log.warn(`\`${manager} install\` failed. Run it yourself before continuing.`);
    }

    log.plain();
    log.title("Configuring Proper UI");
    await runInit({
        cwd: target,
        yes: true,
        nextjs: template === "next",
        vite: template === "vite",
        install: options.install,
        registry: options.registry,
    });

    log.plain();
    log.title("Adding components");
    // `add`'s own `--yes` also accepts its install confirmation (see docs/cli.md), so it is only
    // passed through when an install was actually requested — otherwise `add` prints (or, non-
    // interactively, fails loudly on) what it would install rather than running a package manager.
    await runAdd(["buttons", "badges"], {
        cwd: target,
        yes: Boolean(options.install),
        registry: options.registry,
    });

    log.plain();
    log.title("Next steps");
    log.step(`cd ${dir}`);
    if (!options.install) log.step(`${manager} install`);
    log.step(runVerb(manager));
    log.plain();
    log.success(`${projectName} is ready.`);
}
