/**
 * The design reference library tools (screens, sections, flows, compare, install plan) and the
 * stateless HTTP handler. The registry is packages/registry/dist, assembled into a temp
 * directory with `flows.json` and `thumbs.json` replaced by the fixtures in test/fixtures, so
 * the assertions do not move when the real thumbnails or flows are regenerated.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { handleMcpRequest } from "../src/http.js";
import { createServer } from "../src/server.js";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REAL_REGISTRY = path.resolve(TEST_DIR, "..", "..", "registry", "dist");
const FIXTURES = path.join(TEST_DIR, "fixtures");
const SITE = "https://properui.dev";

if (!existsSync(path.join(REAL_REGISTRY, "index.json"))) {
    throw new Error(`${REAL_REGISTRY} not found: build the registry first (pnpm registry:build).`);
}

const scratch = mkdtempSync(path.join(tmpdir(), "properui-mcp-library-"));
const OVERRIDDEN = new Set(["flows.json", "thumbs.json", "stats.json"]);

/** Every file of the real registry (symlinked), with flows/thumbs from fixtures unless left out. */
function makeRegistry(name: string, options: { flows?: boolean; thumbs?: boolean } = {}): string {
    const dir = path.join(scratch, name);
    mkdirSync(dir, { recursive: true });
    for (const file of readdirSync(REAL_REGISTRY)) {
        if (!OVERRIDDEN.has(file)) symlinkSync(path.join(REAL_REGISTRY, file), path.join(dir, file));
    }
    if (options.flows !== false) copyFileSync(path.join(FIXTURES, "flows.json"), path.join(dir, "flows.json"));
    if (options.thumbs !== false) copyFileSync(path.join(FIXTURES, "thumbs.json"), path.join(dir, "thumbs.json"));
    return dir;
}

interface Called {
    isError: boolean;
    text: string;
    // JSON structured content is arbitrary per tool; each test asserts the fields it reads.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
}

async function connect(registry: string): Promise<{ client: Client; call: (name: string, args?: Record<string, unknown>) => Promise<Called> }> {
    const server = createServer({ registry, cwd: scratch });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "properui-mcp-library-test", version: "0.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const call = async (name: string, args: Record<string, unknown> = {}): Promise<Called> => {
        const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
        const first = result.content[0];
        return { isError: Boolean(result.isError), text: first && first.type === "text" ? first.text : "", data: result.structuredContent };
    };
    return { client, call };
}

let full: Awaited<ReturnType<typeof connect>>;
let noFlows: Awaited<ReturnType<typeof connect>>;
let noThumbs: Awaited<ReturnType<typeof connect>>;
const registries = { full: "", noFlows: "", noThumbs: "", tiny: "" };

/**
 * A three-entry registry written by hand: one screen with a real optional dependency (the real
 * registry has none), registry copy with an em dash and an ellipsis character, and a demo file.
 */
function makeTinyRegistry(name: string): string {
    const dir = path.join(scratch, name);
    mkdirSync(dir, { recursive: true });
    const file = (target: string, content: string, kind?: "demo") => ({
        path: target,
        target,
        type: "component",
        content,
        dependencies: [],
        ...(kind ? { kind } : {}),
    });
    const base = { cssVars: [], examples: [], platforms: ["react", "next"], optionalRegistryDependencies: [] as string[] };
    const entries = [
        {
            ...base,
            name: "card-screen",
            layer: "app-examples",
            type: "example",
            title: "Card screen \u2014 compact",
            description: "A card layout\u2026 with a heading \u2014 and a body.",
            docs: "/components/card-screens/card-screen",
            registryDependencies: ["cx"],
            optionalRegistryDependencies: ["demo-data"],
            dependencies: ["react"],
            composes_with: ["cx"],
            token_contract: ["bg-primary"],
            files: [
                file("components/app-examples/card-screen.tsx", "export const CardScreen = () => null;\n"),
                file("components/app-examples/card-screen.demo.tsx", "export const demo = 1;\n", "demo"),
            ],
        },
        {
            ...base,
            name: "cx",
            layer: "utils",
            type: "util",
            title: "cx",
            description: "Class name helper.",
            registryDependencies: [],
            dependencies: [],
            files: [file("utils/cx.ts", "export const cx = () => '';\n")],
        },
        {
            ...base,
            name: "demo-data",
            layer: "utils",
            type: "util",
            title: "Demo data",
            description: "Sample rows.",
            registryDependencies: [],
            dependencies: ["faker"],
            files: [file("components/demo-data.ts", "export const rows = [];\n")],
        },
    ];
    for (const entry of entries) writeFileSync(path.join(dir, `${entry.name}.json`), JSON.stringify(entry));
    writeFileSync(path.join(dir, "index.json"), JSON.stringify({ components: entries.map(({ files, ...row }) => ({ ...row, fileCount: files.length })) }));
    return dir;
}

beforeAll(async () => {
    registries.full = makeRegistry("full");
    registries.noFlows = makeRegistry("no-flows", { flows: false });
    registries.noThumbs = makeRegistry("no-thumbs", { thumbs: false });
    registries.tiny = makeTinyRegistry("tiny");
    [full, noFlows, noThumbs] = await Promise.all([connect(registries.full), connect(registries.noFlows), connect(registries.noThumbs)]);
});

afterAll(async () => {
    await Promise.all([full?.client.close(), noFlows?.client.close(), noThumbs?.client.close()]);
    rmSync(scratch, { recursive: true, force: true });
});

describe("tool list", () => {
    it("adds the library tools next to the upstream ones", async () => {
        const { tools } = await full.client.listTools();
        expect(tools.map((tool) => tool.name).sort()).toEqual([
            "add_component",
            "check_tokens",
            "compare_screens",
            "get_component",
            "get_component_docs",
            "get_install_plan",
            "get_project_info",
            "list_components",
            "search_components",
            "search_flows",
            "search_screens",
            "search_sections",
        ]);
    });
});

describe("search_screens", () => {
    it("returns a markdown line per hit with thumbnail, docs, preview and add command", async () => {
        const { text, data, isError } = await full.call("search_screens", { query: "billing settings" });
        expect(isError).toBe(false);
        expect(data.results[0].name).toBe("settings-13");
        expect(text).toContain("`settings-13`");
        expect(text).toContain(`![thumb](${SITE}/thumbs/app-examples/settings-pages/settings-13.webp)`);
        expect(text).toContain(`docs: ${SITE}/components/settings-pages/settings-13`);
        expect(text).toContain(`preview: ${SITE}/preview/variant/app-examples/settings-pages/settings-13`);
        expect(text).toContain("`npx @properui/cli@latest add settings-13`");
        expect(text).toMatch(/Then: read one with get_component/);
        expect(data.results[0]).toMatchObject({
            title: expect.any(String),
            layer: "app-examples",
            platform: "app",
            group: "settings-pages",
            thumbnail: { light: `${SITE}/thumbs/app-examples/settings-pages/settings-13.webp`, dark: null },
            previewUrl: `${SITE}/preview/variant/app-examples/settings-pages/settings-13`,
            addCommand: "npx @properui/cli@latest add settings-13",
        });
        expect(data.results[0].composesWith.length).toBeGreaterThan(0);
        expect(data.results[0].tokenContract.length).toBeGreaterThan(0);
    });

    it("includes the dark thumbnail when the registry has one", async () => {
        const { data } = await full.call("search_screens", { query: "dashboard 04" });
        const hit = data.results.find((row: { name: string }) => row.name === "dashboard-04");
        expect(hit.thumbnail.dark).toBe(`${SITE}/thumbs/app-examples/dashboards/dashboard-04-dark.webp`);
    });

    it("returns only full-page examples", async () => {
        const { data } = await full.call("search_screens", { query: "button" });
        for (const row of data.results as { layer: string; type: string }[]) {
            expect(["app-examples", "marketing-examples"]).toContain(row.layer);
            expect(row.type).toBe("example");
        }
    });

    it("filters by platform", async () => {
        const app = await full.call("search_screens", { query: "pricing", platform: "app" });
        expect(app.data.results.every((row: { platform: string }) => row.platform === "app")).toBe(true);
        const marketing = await full.call("search_screens", { query: "pricing", platform: "marketing" });
        expect(marketing.data.results.length).toBeGreaterThan(0);
        expect(marketing.data.results.every((row: { platform: string }) => row.platform === "marketing")).toBe(true);
    });

    it("splits natural-language queries into words", async () => {
        const { data } = await full.call("search_screens", { query: "a page to sign up for an account" });
        expect(data.total).toBeGreaterThan(0);
    });

    it("states no match plainly and names the three nearest entries", async () => {
        const { text, data, isError } = await full.call("search_screens", { query: "zzzqqqxx" });
        expect(isError).toBe(false);
        expect(text).toMatch(/^No screens match "zzzqqqxx"\./);
        expect(data.total).toBe(0);
        expect(data.results).toEqual([]);
        expect(data.nearest).toHaveLength(3);
        expect(text).toContain("Nearest names:");
    });

    it("respects limit", async () => {
        const { data } = await full.call("search_screens", { query: "settings", limit: 2 });
        expect(data.results).toHaveLength(2);
        expect(data.total).toBeGreaterThan(2);
    });

    it("omits thumbnails and previews, and says so, when thumbs.json is missing", async () => {
        const { text, data, isError } = await noThumbs.call("search_screens", { query: "settings" });
        expect(isError).toBe(false);
        expect(data.results[0].thumbnail).toBeNull();
        expect(data.results[0].previewUrl).toBeNull();
        expect(text).not.toContain("![thumb]");
        expect(text).toContain("Thumbnails are not published");
    });

    it("rejects an invalid platform at the schema", async () => {
        const result = await full.call("search_screens", { query: "x", platform: "desktop" }).catch((error: Error) => ({ isError: true, text: error.message }));
        expect(result.isError).toBe(true);
    });
});

describe("search_sections", () => {
    it("finds a section variant and honors the group filter", async () => {
        const hit = await full.call("search_sections", { query: "pricing dual action" });
        expect(hit.data.results[0].name).toBe("pricing-dual-action");
        expect(hit.data.results[0].group).toBe("pricing-sections");
        expect(hit.data.results[0].layer).toBe("marketing");
        expect(hit.data.results[0].previewUrl).toBe(`${SITE}/preview/variant/marketing/pricing-sections/pricing-dual-action`);

        const other = await full.call("search_sections", { query: "pricing", group: "footers" });
        expect(other.data.total).toBe(0);
        const partial = await full.call("search_sections", { query: "pricing", group: "pricing" });
        expect(partial.data.total).toBeGreaterThan(0);
        expect(partial.data.results.every((row: { group: string }) => row.group.includes("pricing"))).toBe(true);
    });

    it("does not return whole screens", async () => {
        const { data } = await full.call("search_sections", { query: "settings" });
        expect(data.results.every((row: { layer: string }) => row.layer === "marketing")).toBe(true);
    });
});

describe("search_flows", () => {
    it("returns ordered steps with purposes and an install command for the whole flow", async () => {
        const { text, data } = await full.call("search_flows", { query: "billing" });
        expect(data.results[0].id).toBe("billing");
        expect(data.results[0].steps.map((step: { name: string }) => step.name)).toEqual(["pricing-dual-action", "settings-13"]);
        expect(data.results[0].steps[1].purpose).toMatch(/payment method/);
        expect(data.results[0].steps[1].thumbnail.light).toContain("/thumbs/app-examples/settings-pages/settings-13.webp");
        expect(data.results[0].addCommand).toBe("npx @properui/cli@latest add pricing-dual-action settings-13");
        expect(data.results[0].docsUrl).toMatch(/\/flows\/billing$/);
        expect(text).toContain("docs: ");
        expect(text).toContain("/flows/billing");
        expect(text).toContain("Install every step:");
        expect(text).toContain("![thumb]");
    });

    it("matches on tags and step purposes", async () => {
        const { data } = await full.call("search_flows", { query: "password recovery" });
        expect(data.results[0].id).toBe("auth");
    });

    it("says plainly that flows are not published when flows.json is missing", async () => {
        const { text, data, isError } = await noFlows.call("search_flows", { query: "auth" });
        expect(isError).toBe(false);
        expect(text).toContain("Flows are not published yet");
        expect(data.published).toBe(false);
    });

    it("states no match with the nearest flow ids", async () => {
        const { text, data } = await full.call("search_flows", { query: "zzzqqqxx" });
        expect(text).toMatch(/^No flows match/);
        expect(data.nearest).toEqual(["auth", "billing"]);
    });

    it("resolves the steps of the flows the real registry publishes", async () => {
        const real = await connect(REAL_REGISTRY);
        try {
            const { data } = await real.call("search_flows", { query: "sign up and verify email" });
            if (data.published === false) return; // the registry build predates flows.json
            expect(data.results[0].unresolvedSteps).toEqual([]);
            expect(data.results[0].steps.length).toBeGreaterThan(1);
        } finally {
            await real.client.close();
        }
    });
});

describe("compare_screens", () => {
    it("lays entries side by side with shared and unique sets", async () => {
        const { text, data, isError } = await full.call("compare_screens", { names: ["settings-13", "dashboard-04"] });
        expect(isError).toBe(false);
        expect(data.names).toEqual(["settings-13", "dashboard-04"]);
        expect(data.entries[0].thumbnail.light).toContain("/thumbs/app-examples/settings-pages/settings-13.webp");
        expect(data.entries[0].docsUrl).toBe(`${SITE}/components/settings-pages/settings-13`);
        expect(data.entries[1].previewUrl).toBe(`${SITE}/preview/variant/app-examples/dashboards/dashboard-04`);
        expect(data.fileCounts).toEqual({ "settings-13": 2, "dashboard-04": 2 });
        expect(data.composesWith.sharedByAll).toContain("app-navigation");
        expect(data.composesWith.uniqueTo["dashboard-04"]).toContain("charts");
        expect(data.composesWith.uniqueTo["settings-13"]).not.toContain("app-navigation");
        expect(data.tokenContract.sharedByAll).toContain("text-primary");
        expect(data.npmPackages.sharedByAll).toContain("react");
        expect(data.npmPackages.uniqueTo["dashboard-04"]).toContain("recharts");
        expect(data.installCommands["settings-13"]).toBe("npx @properui/cli@latest add settings-13");
        expect(text).toContain("**Composes with**");
        expect(text).toContain("- shared by all:");
        expect(text).toContain("- only `dashboard-04`:");
        expect(text).not.toContain("```tsx");
    });

    it("compares three entries across layers and appends source on request", async () => {
        const { text, data } = await full.call("compare_screens", { names: ["settings-13", "dashboard-04", "pricing-dual-action"], include_source: true });
        expect(data.entries).toHaveLength(3);
        expect(data.sources["pricing-dual-action"][0].content.length).toBeGreaterThan(0);
        expect(text).toContain("### pricing-dual-action:");
    });

    it("reports unknown names with three nearest matches and still compares the rest", async () => {
        const { text, data, isError } = await full.call("compare_screens", { names: ["settings-13", "dashboard-04", "setings-13"] });
        expect(isError).toBe(false);
        expect(data.unknown[0].name).toBe("setings-13");
        expect(data.unknown[0].nearest).toHaveLength(3);
        expect(data.unknown[0].nearest[0]).toBe("settings-13");
        expect(text).toContain("## Not found");
    });

    it("returns an error result, not an exception, when fewer than two names resolve", async () => {
        const { text, isError } = await full.call("compare_screens", { names: ["settings-13", "nope-99"] });
        expect(isError).toBe(true);
        expect(text).toContain("Nothing to compare");
        expect(text).toContain("nope-99");
    });

    it("enforces two to five names at the schema", async () => {
        for (const names of [["settings-13"], ["a", "b", "c", "d", "e", "f"]]) {
            const result = await full.call("compare_screens", { names }).catch((error: Error) => ({ isError: true, text: error.message }));
            expect(result.isError).toBe(true);
        }
    });
});

describe("get_install_plan", () => {
    it("resolves dependencies first, unions npm packages and lists files, the command and the add_component note", async () => {
        const { text, data, isError } = await full.call("get_install_plan", { names: ["settings-13"] });
        expect(isError).toBe(false);
        const names = data.entries.map((entry: { name: string }) => entry.name);
        expect(names.at(-1)).toBe("settings-13");
        expect(names.indexOf("buttons")).toBeLessThan(names.indexOf("settings-13"));
        expect(names.indexOf("cx")).toBeLessThan(names.indexOf("buttons"));
        expect(new Set(names).size).toBe(names.length);
        expect(data.npmPackages).toEqual(expect.arrayContaining(["@properui/icons", "react", "react-aria-components"]));
        expect(data.files.map((file: { target: string }) => file.target)).toContain("components/app-examples/settings-pages/settings-13.tsx");
        expect(data.command).toBe("npx @properui/cli@latest add settings-13");
        expect(text).toContain("```sh\nnpx @properui/cli@latest add settings-13\n```");
        expect(text).toContain("Nothing has been written");
        expect(text).toContain("cli@latest init");
        expect(data.note).toContain("add_component");
        expect(data.note).toContain('names: ["settings-13"]');
    });

    it("merges several names into one command and one plan, without duplicate files", async () => {
        const { data } = await full.call("get_install_plan", { names: ["settings-13", "dashboard-04", "settings-13"] });
        expect(data.command).toBe("npx @properui/cli@latest add settings-13 dashboard-04");
        const targets = data.files.map((file: { target: string }) => file.target);
        expect(new Set(targets).size).toBe(targets.length);
    });

    it("lists optional dependencies separately and offers --no-optional", async () => {
        const tiny = await connect(registries.tiny);
        try {
            const { data, text } = await tiny.call("get_install_plan", { names: ["card-screen"] });
            expect(data.commandWithoutOptional).toBe("npx @properui/cli@latest add card-screen --no-optional");
            expect(text).toContain("--no-optional");
            expect(data.entries.map((entry: { name: string; optional: boolean }) => [entry.name, entry.optional])).toEqual([
                ["cx", false],
                ["card-screen", false],
                ["demo-data", true],
            ]);
            expect(data.npmPackages).toEqual(["react"]);
            expect(data.optionalNpmPackages).toEqual(["faker"]);
            expect(data.files.map((file: { target: string; optional: boolean }) => [file.target, file.optional])).toEqual([
                ["utils/cx.ts", false],
                ["components/app-examples/card-screen.tsx", false],
                ["components/demo-data.ts", true],
            ]);
            expect(data.demoFilesOmitted).toBe(1);
        } finally {
            await tiny.client.close();
        }
    });

    it("reports unknown names as an error and writes no plan", async () => {
        const { text, isError } = await full.call("get_install_plan", { names: ["settings-13", "nope-99"] });
        expect(isError).toBe(true);
        expect(text).toContain('"nope-99"');
    });

    it("never writes anything", async () => {
        const before = readdirSync(scratch).sort();
        await full.call("get_install_plan", { names: ["settings-13"] });
        expect(readdirSync(scratch).sort()).toEqual(before);
    });
});

describe("resources and prompt", () => {
    it("serves stats, and says so when the registry has no stats.json", async () => {
        const missing = await full.client.readResource({ uri: "properui://stats" });
        expect((missing.contents[0] as { text: string }).text).toContain("stats.json is not published");

        const real = await connect(REAL_REGISTRY);
        try {
            const result = await real.client.readResource({ uri: "properui://stats" });
            const stats = JSON.parse((result.contents[0] as { text: string }).text) as { entries?: number; error?: string };
            if (existsSync(path.join(REAL_REGISTRY, "stats.json"))) expect(stats.entries).toBeGreaterThan(0);
            else expect(stats.error).toBeDefined();
        } finally {
            await real.client.close();
        }
    });

    it("returns the build_screen workflow with the description filled in", async () => {
        const reply = await full.client.getPrompt({ name: "build_screen", arguments: { description: "settings page with a billing tab" } });
        const text = JSON.stringify(reply.messages);
        expect(text).toContain("settings page with a billing tab");
        for (const tool of ["search_screens", "search_flows", "search_sections", "compare_screens", "get_component", "get_install_plan", "add_component"]) {
            expect(text).toContain(tool);
        }
    });
});

describe("copy discipline", () => {
    it("cleans em dashes and ellipsis characters out of registry copy", async () => {
        const index = JSON.parse(readFileSync(path.join(REAL_REGISTRY, "index.json"), "utf8")) as {
            components: { name: string; title: string; description: string }[];
        };
        const dirty = index.components.find((entry) => /[\u2014\u2026]/.test(`${entry.title} ${entry.description}`) && entry.name === "about-page-01");
        expect(dirty, "about-page-01 is expected to carry an em dash in the registry copy").toBeDefined();
        const { text, data } = await full.call("search_screens", { query: "about page 01" });
        expect(data.results.some((row: { name: string }) => row.name === "about-page-01")).toBe(true);
        expect(text).not.toMatch(/[\u2014\u2026]/);
        expect(JSON.stringify(data)).not.toMatch(/[\u2014\u2026]/);
    });

    it("cleans registry copy in every library tool, including flows and compare", async () => {
        const tiny = await connect(registries.tiny);
        try {
            const search = await tiny.call("search_screens", { query: "card" });
            expect(search.data.results[0].title).toBe("Card screen: compact");
            expect(search.data.results[0].description).toBe("A card layout... with a heading: and a body.");
            expect(search.text).not.toMatch(/[\u2014\u2026]/);
            const plan = await tiny.call("get_install_plan", { names: ["card-screen"] });
            expect(plan.text).not.toMatch(/[\u2014\u2026]/);
            expect(JSON.stringify(plan.data)).not.toMatch(/[\u2014\u2026]/);
        } finally {
            await tiny.client.close();
        }
    });

    it("uses no em dashes or ellipsis characters in any library output", async () => {
        const { client, call } = full;
        const outputs = [
            (await call("search_screens", { query: "settings" })).text,
            (await call("search_screens", { query: "zzzqqqxx" })).text,
            (await call("search_sections", { query: "pricing" })).text,
            (await call("search_flows", { query: "billing" })).text,
            (await noFlows.call("search_flows", { query: "billing" })).text,
            (await call("get_install_plan", { names: ["settings-13", "data-table"] })).text,
            (await call("compare_screens", { names: ["settings-13", "dashboard-04"] })).text,
            (await call("compare_screens", { names: ["settings-13", "setings-13", "x"] })).text,
            JSON.stringify((await client.listTools()).tools.filter((tool) => /screens|sections|flows|install_plan/.test(tool.name))),
            JSON.stringify(await client.getPrompt({ name: "build_screen", arguments: { description: "x" } })),
        ];
        for (const output of outputs) expect(output).not.toMatch(/[\u2014\u2026]/);
    });
});

describe("handleMcpRequest", () => {
    const REGISTRY_URL = "https://registry.test/r";
    const SITE_URL = "https://site.test";
    const calls: string[] = [];

    /** Serves the assembled registry directory under REGISTRY_URL and 404s everything else. */
    const fakeFetch = async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
        const url = String(input);
        calls.push(url);
        if (!url.startsWith(`${REGISTRY_URL}/`)) return new Response("Not found", { status: 404 });
        const file = path.join(registries.full, url.slice(REGISTRY_URL.length + 1));
        return existsSync(file)
            ? new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } })
            : new Response("Not found", { status: 404 });
    };

    afterEach(() => {
        vi.unstubAllGlobals();
        calls.length = 0;
    });

    const options = { registryUrl: REGISTRY_URL, siteUrl: SITE_URL };

    interface Reply {
        result?: Record<string, unknown> & {
            tools?: { name: string }[];
            content?: { text: string }[];
            structuredContent?: Record<string, unknown>;
            isError?: boolean;
        };
        error?: { code: number; message: string };
    }

    async function post(method: string, params?: Record<string, unknown>, siteUrl = SITE_URL): Promise<{ response: Response; reply: Reply }> {
        vi.stubGlobal("fetch", fakeFetch);
        const response = await handleMcpRequest(
            new Request("https://site.test/api/mcp", {
                method: "POST",
                headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
                body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
            }),
            { ...options, siteUrl },
        );
        return { response, reply: (await response.json()) as Reply };
    }

    it("answers initialize with JSON, CORS headers and the server info", async () => {
        const { response, reply } = await post("initialize", {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "0.0.0" },
        });
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("application/json");
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("mcp-session-id")).toBeNull();
        expect(reply.result?.serverInfo).toMatchObject({ name: "properui" });
        expect(String(reply.result?.instructions)).toContain("remote, read-only server");
    });

    it("lists the read-only tools and hides the project-bound ones", async () => {
        const { reply } = await post("tools/list");
        const names = (reply.result?.tools ?? []).map((tool) => tool.name).sort();
        expect(names).toEqual([
            "compare_screens",
            "get_component",
            "get_component_docs",
            "get_install_plan",
            "list_components",
            "search_components",
            "search_flows",
            "search_screens",
            "search_sections",
        ]);
        expect(names).not.toContain("add_component");
        expect(names).not.toContain("get_project_info");
        expect(names).not.toContain("check_tokens");
        expect(JSON.stringify(reply)).not.toMatch(/[\u2014\u2026]/);
    });

    it("runs a search against the registry URL and links back to the site origin", async () => {
        const { reply } = await post("tools/call", { name: "search_screens", arguments: { query: "billing settings" } });
        expect(reply.result?.isError).toBeUndefined();
        const data = reply.result?.structuredContent as { results: { name: string; docsUrl: string; thumbnail: { light: string } }[] };
        expect(data.results[0]?.name).toBe("settings-13");
        expect(data.results[0]?.docsUrl).toBe(`${SITE_URL}/components/settings-pages/settings-13`);
        expect(data.results[0]?.thumbnail.light).toBe(`${SITE_URL}/thumbs/app-examples/settings-pages/settings-13.webp`);
        expect(calls.every((url) => url.startsWith(`${REGISTRY_URL}/`))).toBe(true);
    });

    it("says the install is the CLI's job in get_install_plan", async () => {
        const { reply } = await post("tools/call", { name: "get_install_plan", arguments: { names: ["settings-13"] } });
        const data = reply.result?.structuredContent as { command: string; note: string };
        expect(data.command).toBe("npx @properui/cli@latest add settings-13");
        expect(data.note).toContain("remote server writes nothing");
    });

    it("does not offer add_component over HTTP", async () => {
        const { reply, response } = await post("tools/call", { name: "add_component", arguments: { names: ["buttons"] } });
        expect(response.status).toBeLessThan(500);
        const failed = reply.error !== undefined || reply.result?.isError === true;
        expect(failed).toBe(true);
        expect(JSON.stringify(reply)).toMatch(/not found|unknown|disabled/i);
    });

    it("answers OPTIONS with 204 and CORS, and GET and DELETE with 405", async () => {
        const preflight = await handleMcpRequest(new Request("https://site.test/api/mcp", { method: "OPTIONS" }), options);
        expect(preflight.status).toBe(204);
        expect(preflight.headers.get("access-control-allow-origin")).toBe("*");
        expect(preflight.headers.get("access-control-allow-methods")).toContain("POST");

        for (const method of ["GET", "DELETE"]) {
            const response = await handleMcpRequest(new Request("https://site.test/api/mcp", { method }), options);
            expect(response.status).toBe(405);
            expect(response.headers.get("allow")).toBe("POST, OPTIONS");
            expect(response.headers.get("access-control-allow-origin")).toBe("*");
        }
    });

    it("keeps the registry index in memory across requests", async () => {
        // A site URL no other test uses, so this handler context starts cold.
        const cold = "https://cache-check.test";
        await post("tools/call", { name: "search_screens", arguments: { query: "settings" } }, cold);
        await post("tools/call", { name: "search_screens", arguments: { query: "dashboard" } }, cold);
        expect(calls.filter((url) => url.endsWith("/index.json"))).toHaveLength(1);
    });

    it("degrades to a plain sentence when flows.json is missing", async () => {
        vi.stubGlobal("fetch", async (input: Parameters<typeof fetch>[0]) =>
            String(input).endsWith("/flows.json") ? new Response("Not found", { status: 404 }) : fakeFetch(input),
        );
        const response = await handleMcpRequest(
            new Request("https://site.test/api/mcp", {
                method: "POST",
                headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
                body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "search_flows", arguments: { query: "billing" } } }),
            }),
            { registryUrl: "https://registry.test/r", siteUrl: "https://flows-missing.test" },
        );
        const reply = (await response.json()) as Reply;
        expect(reply.result?.isError).toBeUndefined();
        expect(reply.result?.content?.[0]?.text).toContain("Flows are not published yet");
    });
});
