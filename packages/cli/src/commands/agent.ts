/**
 * `properui agent init --client claude|codex|cursor|lovable|all` — installs the portable
 * Proper UI Skill for one or more AI coding tools.
 *
 * claude  → .claude/skills/properui/SKILL.md + a short pointer appended to CLAUDE.md
 * codex   → .agents/skills/properui/SKILL.md + a rules block appended to AGENTS.md
 * cursor  → .cursor/rules/properui.mdc (alwaysApply: true) — Cursor does not read SKILL.md
 * lovable → prints the public GitHub URL of skills/properui/SKILL.md and what to paste
 *
 * It also registers the Proper UI MCP server (`@properui/mcp`) where the client reads a
 * project-level MCP config: `.mcp.json` for claude, `.cursor/mcp.json` for cursor. Codex keeps
 * MCP servers in `~/.codex/config.toml`, outside the project, so for codex the TOML block is
 * printed instead. An existing config is merged: other servers are kept, and an existing
 * `properui` entry is left alone unless `--overwrite` is passed. `--no-mcp` skips all of this.
 *
 * CLAUDE.md/AGENTS.md are never clobbered: the block is inserted between marker comments and
 * replaced in place on a second run, so `agent init` is idempotent. See docs/cli.md and
 * apps/docs/content/docs/agents.mdx for the user-facing walkthrough.
 *
 * Spec: docs/spec/strategy/2026-09-plan.md §3 P1.1–P1.2.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
    AGENTS_MD_BLOCK,
    CLAUDE_MD_BLOCK,
    CODEX_MCP_TOML,
    CURSOR_RULE_MDC,
    LOVABLE_INSTRUCTIONS,
    LOVABLE_SKILL_URL,
    MCP_SERVER_ENTRY,
    MCP_SERVER_NAME,
    SKILL_MD,
    upsertMarkedBlock,
} from "../agent-templates.js";
import { parseJsonc } from "../detect.js";
import { type WriteFileOptions, type WriteResult, writeSourceFile } from "../files.js";
import { kleur, log } from "../ui.js";

export type AgentClient = "claude" | "codex" | "cursor" | "lovable" | "all";

export interface AgentInitOptions {
    client?: string;
    yes?: boolean;
    overwrite?: boolean;
    cwd?: string;
    /** `--no-mcp` sets this to `false`; absent/true also registers the MCP server. */
    mcp?: boolean;
}

const CLIENTS: Exclude<AgentClient, "all">[] = ["claude", "codex", "cursor", "lovable"];

function resolveClients(client: string | undefined): Exclude<AgentClient, "all">[] {
    if (!client || client === "all") return CLIENTS;
    if ((CLIENTS as string[]).includes(client)) return [client as Exclude<AgentClient, "all">];
    throw new Error(`Unknown --client "${client}". Use one of: ${CLIENTS.join(", ")}, all.`);
}

/** Appends (or replaces) a marked block in a project file, creating the file if it doesn't exist yet. */
function upsertProjectFile(file: string, id: string, block: string, dryRun: boolean): WriteResult {
    const relative = path.basename(file);
    const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
    const next = upsertMarkedBlock(existing, id, block);
    if (existing === next) return { file, relative, status: "unchanged" };
    if (!dryRun) {
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, next, "utf8");
    }
    return { file, relative, status: existing ? "updated" : "created" };
}

function statusLabel(status: WriteResult["status"]): string {
    if (status === "created") return kleur.green("write ");
    if (status === "updated") return kleur.yellow("update");
    if (status === "skipped") return kleur.dim("skip  ");
    return kleur.dim("keep  ");
}

/**
 * Adds the `properui` server to a JSON MCP config (`{ "mcpServers": { ... } }`), keeping every
 * other server. An existing `properui` entry is only replaced with `overwrite`.
 */
function upsertMcpJson(file: string, cwd: string, overwrite: boolean): WriteResult | { file: string; relative: string; status: "invalid" } {
    const relative = path.relative(cwd, file) || path.basename(file);
    const exists = existsSync(file);
    const source = exists ? readFileSync(file, "utf8") : "";
    const parsed = source.trim() ? parseJsonc<Record<string, unknown>>(source) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { file, relative, status: "invalid" };

    const servers = (parsed.mcpServers && typeof parsed.mcpServers === "object" ? parsed.mcpServers : {}) as Record<string, unknown>;
    const current = servers[MCP_SERVER_NAME];
    if (current !== undefined) {
        if (JSON.stringify(current) === JSON.stringify(MCP_SERVER_ENTRY)) return { file, relative, status: "unchanged" };
        if (!overwrite) return { file, relative, status: "skipped" };
    }

    const next = { ...parsed, mcpServers: { ...servers, [MCP_SERVER_NAME]: MCP_SERVER_ENTRY } };
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    return { file, relative, status: exists ? "updated" : "created" };
}

function installMcpJson(file: string, cwd: string, overwrite: boolean): void {
    const result = upsertMcpJson(file, cwd, overwrite);
    if (result.status === "invalid") {
        log.warn(`${result.relative} is not valid JSON; left it alone. Add this under "mcpServers" yourself:`);
        log.plain(kleur.dim(`        "${MCP_SERVER_NAME}": ${JSON.stringify(MCP_SERVER_ENTRY)}`));
        return;
    }
    const note = result.status === "skipped" ? " (has its own properui server; --overwrite replaces it)" : " (MCP server)";
    log.step(`${statusLabel(result.status)} ${result.relative}${note}`);
}

function installClaude(cwd: string, writeOptions: WriteFileOptions): void {
    const skill = writeSourceFile(path.join(cwd, ".claude", "skills", "properui", "SKILL.md"), SKILL_MD, writeOptions);
    log.step(`${statusLabel(skill.status)} ${skill.relative}`);

    const claudeMd = upsertProjectFile(path.join(cwd, "CLAUDE.md"), "skill", CLAUDE_MD_BLOCK, writeOptions.dryRun);
    log.step(`${statusLabel(claudeMd.status)} ${claudeMd.relative}${claudeMd.status === "created" ? " (created)" : " (pointer appended)"}`);
}

function installCodex(cwd: string, writeOptions: WriteFileOptions): void {
    const skill = writeSourceFile(path.join(cwd, ".agents", "skills", "properui", "SKILL.md"), SKILL_MD, writeOptions);
    log.step(`${statusLabel(skill.status)} ${skill.relative}`);

    const agentsMd = upsertProjectFile(path.join(cwd, "AGENTS.md"), "agents", AGENTS_MD_BLOCK, writeOptions.dryRun);
    log.step(`${statusLabel(agentsMd.status)} ${agentsMd.relative}${agentsMd.status === "created" ? " (created)" : " (rules block appended)"}`);
}

function installCursor(cwd: string, writeOptions: WriteFileOptions): void {
    const rule = writeSourceFile(path.join(cwd, ".cursor", "rules", "properui.mdc"), CURSOR_RULE_MDC, writeOptions);
    log.step(`${statusLabel(rule.status)} ${rule.relative}`);
}

function printCodexMcp(): void {
    log.step(`Codex reads MCP servers from ~/.codex/config.toml, outside this project. Add:`);
    log.plain();
    for (const line of CODEX_MCP_TOML.split("\n")) log.plain(`        ${line}`);
}

function installLovable(): void {
    log.step(`Lovable reads from the web, not this checkout. Nothing is written locally.`);
    log.plain();
    log.info(`Paste this into Lovable's knowledge / custom instructions panel:`);
    log.plain(kleur.dim(`        ${LOVABLE_SKILL_URL}`));
    log.plain();
    for (const line of LOVABLE_INSTRUCTIONS.split("\n")) log.plain(line ? `  ${line}` : "");
}

export async function runAgentInit(options: AgentInitOptions): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const clients = resolveClients(options.client);
    const writeOptions: WriteFileOptions = { cwd, overwrite: Boolean(options.overwrite), dryRun: false };

    log.title(`Installing the Proper UI skill for ${clients.length > 1 ? clients.join(", ") : clients[0]}`);

    for (const client of clients) {
        log.plain();
        log.plain(kleur.bold(client));
        if (client === "claude") installClaude(cwd, writeOptions);
        else if (client === "codex") installCodex(cwd, writeOptions);
        else if (client === "cursor") installCursor(cwd, writeOptions);
        else installLovable();

        if (options.mcp === false) continue;
        if (client === "claude") installMcpJson(path.join(cwd, ".mcp.json"), cwd, writeOptions.overwrite);
        else if (client === "cursor") installMcpJson(path.join(cwd, ".cursor", "mcp.json"), cwd, writeOptions.overwrite);
        else if (client === "codex") printCodexMcp();
    }

    log.plain();
    log.success("Done. Re-run any time. Existing files are updated in place, not duplicated.");
    if (!options.overwrite) log.info("Pass --overwrite to replace the Skill file even if you've edited it locally.");
}
