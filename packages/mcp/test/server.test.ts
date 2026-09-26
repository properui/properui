/**
 * Drives the MCP server through a real MCP client, in-process over the SDK's in-memory
 * transport, against the registry built into packages/registry/dist (offline). The last case
 * spawns the built bin over stdio to prove the bundle itself works.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.resolve(PACKAGE_DIR, "..", "registry", "dist");
const BIN = path.join(PACKAGE_DIR, "dist", "index.js");

if (!existsSync(path.join(REGISTRY, "index.json"))) {
    throw new Error(`${REGISTRY} not found: build the registry first (pnpm registry:build).`);
}

let client: Client;
const scratch = mkdtempSync(path.join(tmpdir(), "properui-mcp-"));

/** Calls a tool and returns its parsed JSON payload (or the raw error text when isError). */
async function call<T = Record<string, unknown>>(name: string, args: Record<string, unknown> = {}): Promise<{ isError: boolean; data: T; text: string }> {
    const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
    const first = result.content[0];
    const text = first && first.type === "text" ? first.text : "";
    return { isError: Boolean(result.isError), text, data: (result.isError ? {} : JSON.parse(text)) as T };
}

/** A minimal project `add_component` can write into: package.json, src/, components.json. */
function makeProject(name: string, withConfig = true): string {
    const dir = path.join(scratch, name);
    mkdirSync(path.join(dir, "src"), { recursive: true });
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, private: true, dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" } }, null, 2));
    writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } } }, null, 2));
    if (withConfig) {
        writeFileSync(
            path.join(dir, "components.json"),
            JSON.stringify(
                {
                    $schema: "https://properui.dev/schema.json",
                    style: "default",
                    tsx: true,
                    tailwind: { css: "src/index.css", theme: "src/styles/theme.css", prefix: "" },
                    aliases: { components: "@/components", utils: "@/utils", ui: "@/components/ui", hooks: "@/hooks" },
                    registry: REGISTRY,
                },
                null,
                2,
            ),
        );
    }
    return dir;
}

beforeAll(async () => {
    const server = createServer({ registry: REGISTRY, cwd: scratch });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "properui-mcp-test", version: "0.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
});

afterAll(async () => {
    await client?.close();
    rmSync(scratch, { recursive: true, force: true });
});

describe("tools", () => {
    it("advertises every tool", async () => {
        const { tools } = await client.listTools();
        expect(tools.map((tool) => tool.name).sort()).toEqual([
            "add_component",
            "check_tokens",
            "get_component",
            "get_component_docs",
            "get_project_info",
            "list_components",
            "search_components",
        ]);
    });

    it("list_components returns compact rows and filters by layer and type", async () => {
        const { isError, data } = await call<{ total: number; components: Record<string, unknown>[] }>("list_components", { layer: "base", type: "component" });
        expect(isError).toBe(false);
        expect(data.total).toBeGreaterThan(5);
        const buttons = data.components.find((row) => row.name === "buttons");
        expect(buttons).toEqual({ name: "buttons", layer: "base", type: "component", title: expect.any(String), description: expect.any(String) });
        expect(data.components.every((row) => row.layer === "base" && row.type === "component")).toBe(true);
    });

    it("list_components pages with offset", async () => {
        const first = await call<{ nextOffset?: number; components: { name: string }[] }>("list_components", { limit: 5 });
        expect(first.data.components).toHaveLength(5);
        expect(first.data.nextOffset).toBe(5);
        const second = await call<{ components: { name: string }[] }>("list_components", { limit: 5, offset: 5 });
        expect(second.data.components[0]?.name).not.toBe(first.data.components[0]?.name);
    });

    it('search_components("button") ranks the buttons entry', async () => {
        const { isError, data } = await call<{ matches: { name: string; score: number }[] }>("search_components", { query: "button" });
        expect(isError).toBe(false);
        expect(data.matches.length).toBeGreaterThan(0);
        expect(data.matches.slice(0, 5).map((match) => match.name)).toContain("buttons");
    });

    it("search_components says so plainly when nothing matches", async () => {
        const { data } = await call<{ matches: unknown[]; note?: string }>("search_components", { query: "zzqqxxjj" });
        expect(data.matches).toEqual([]);
        expect(data.note).toMatch(/No match/);
    });

    it('get_component("buttons") returns the full entry with source and docs URL', async () => {
        const { isError, data } = await call<{
            name: string;
            files: { target: string; content: string }[];
            dependencies: string[];
            registryDependencies: string[];
            docsUrl: string | null;
        }>("get_component", { name: "buttons" });
        expect(isError).toBe(false);
        expect(data.name).toBe("buttons");
        const button = data.files.find((file) => file.target === "components/base/buttons/button.tsx");
        expect(button?.content).toContain("export const Button");
        expect(data.dependencies).toContain("react-aria-components");
        expect(data.registryDependencies).toContain("cx");
        expect(data.docsUrl).toBe("https://properui.dev/components/buttons");
    });

    it("get_component suggests the closest name for a typo", async () => {
        const { isError, text } = await call("get_component", { name: "buttonz" });
        expect(isError).toBe(true);
        expect(text).toMatch(/Did you mean: .*buttons/);
    });

    it("get_component_docs reads the MDX page when the registry is a local checkout", async () => {
        const { isError, data } = await call<{ format: string; markdown: string; source: string }>("get_component_docs", { name: "buttons" });
        expect(isError).toBe(false);
        expect(data.format).toBe("mdx");
        expect(data.source).toBe("apps/docs/content/components/buttons.mdx");
        expect(data.markdown).toMatch(/^---/);
    });

    it("add_component writes the files, records them and reports the install command", async () => {
        const project = makeProject("add-app");
        const { isError, data, text } = await call<{
            filesWritten: string[];
            entries: { name: string }[];
            missingDependencies: string[];
            installCommand: string | null;
        }>("add_component", { names: ["badges"], cwd: project });
        expect(isError, text).toBe(false);

        expect(data.filesWritten).toContain("src/components/base/badges/badges.tsx");
        expect(data.filesWritten).toContain("src/utils/cx.ts");
        for (const file of data.filesWritten) expect(existsSync(path.join(project, file)), file).toBe(true);
        expect(data.entries.map((entry) => entry.name)).toContain("badges");

        const config = JSON.parse(readFileSync(path.join(project, "components.json"), "utf8")) as { installed: Record<string, { files: string[] }> };
        expect(config.installed.badges?.files).toContain("src/components/base/badges/badges.tsx");

        expect(data.missingDependencies.length).toBeGreaterThan(0);
        expect(data.installCommand).toMatch(/^npm install /);

        const again = await call<{ filesWritten: string[]; summary: string }>("add_component", { names: ["badges"], cwd: project });
        expect(again.data.filesWritten).toEqual([]);
        expect(again.data.summary).toMatch(/No changes/);
    });

    it("add_component dry run writes nothing", async () => {
        const project = makeProject("dry-app");
        const { data } = await call<{ dryRun: boolean; entries: { files: { path: string; status: string }[] }[] }>("add_component", {
            names: ["badges"],
            cwd: project,
            dryRun: true,
        });
        expect(data.dryRun).toBe(true);
        expect(existsSync(path.join(project, "src", "components", "base", "badges", "badges.tsx"))).toBe(false);
        expect(data.entries.flatMap((entry) => entry.files).every((file) => file.status === "created")).toBe(true);
    });

    it("add_component without components.json points at init", async () => {
        const { isError, text } = await call("add_component", { names: ["badges"], cwd: makeProject("bare-app", false) });
        expect(isError).toBe(true);
        expect(text).toMatch(/init -y/);
    });

    it("get_project_info mirrors `properui info --json`", async () => {
        const project = makeProject("info-app");
        const { data } = await call<{ config: { present: boolean; aliases: { components: string } }; registryReachable: boolean; registrySource: string }>(
            "get_project_info",
            { cwd: project },
        );
        expect(data.config.present).toBe(true);
        expect(data.config.aliases.components).toBe("@/components");
        expect(data.registryReachable).toBe(true);
        expect(data.registrySource).toBe(REGISTRY);
    });

    it("check_tokens flags raw palette classes, dark: variants and arbitrary colours", async () => {
        const project = makeProject("check-app");
        writeFileSync(path.join(project, "src", "bad.tsx"), 'export const Bad = () => <div className="bg-purple-600 dark:bg-gray-900 text-[#7f56d9]" />;\n');
        writeFileSync(path.join(project, "src", "good.tsx"), 'export const Good = () => <div className="bg-primary text-tertiary" />;\n');

        const whole = await call<{ ok: boolean; findings: { file: string; rule: string }[] }>("check_tokens", { cwd: project });
        expect(whole.data.ok).toBe(false);
        expect([...new Set(whole.data.findings.map((finding) => finding.rule))].sort()).toEqual(["arbitrary-color", "dark-variant", "palette"]);
        expect(whole.data.findings.every((finding) => finding.file === path.join("src", "bad.tsx"))).toBe(true);

        const single = await call<{ ok: boolean }>("check_tokens", { cwd: project, path: "src/good.tsx" });
        expect(single.data.ok).toBe(true);
    });
});

describe("resources", () => {
    it("serves the registry index", async () => {
        const result = await client.readResource({ uri: "properui://registry/index" });
        const first = result.contents[0] as { text: string };
        const index = JSON.parse(first.text) as { components: { name: string }[] };
        expect(index.components.some((entry) => entry.name === "buttons")).toBe(true);
    });

    it("lists and serves one resource per entry", async () => {
        const { resources } = await client.listResources();
        expect(resources.some((resource) => resource.uri === "properui://registry/buttons")).toBe(true);

        const result = await client.readResource({ uri: "properui://registry/buttons" });
        const entry = JSON.parse((result.contents[0] as { text: string }).text) as { name: string; files: unknown[] };
        expect(entry.name).toBe("buttons");
        expect(entry.files.length).toBeGreaterThan(0);
    });
});

describe("stdio bin", () => {
    it.skipIf(!existsSync(BIN))("serves list_components from the built bundle", async () => {
        const transport = new StdioClientTransport({ command: process.execPath, args: [BIN, "--registry", REGISTRY], stderr: "ignore" });
        const stdioClient = new Client({ name: "properui-mcp-stdio-test", version: "0.0.0" });
        await stdioClient.connect(transport);
        try {
            const result = (await stdioClient.callTool({ name: "list_components", arguments: { layer: "base", limit: 3 } })) as CallToolResult;
            const first = result.content[0];
            const data = JSON.parse(first && first.type === "text" ? first.text : "{}") as { components: unknown[] };
            expect(data.components).toHaveLength(3);
        } finally {
            await stdioClient.close();
        }
    });
});
