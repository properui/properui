/**
 * Builds the Proper UI MCP server: seven tools and the registry as resources.
 *
 * Tools read the same registry the CLI reads (see `ServerContext`) and write files through the
 * same code the CLI's `add` uses. Every tool returns its result as JSON text; an expected
 * failure (unknown name, no components.json, unreachable registry) comes back as `isError`
 * with a message an agent can act on.
 */
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "node:module";
import { z } from "zod";
import { RegistryError } from "./cli.js";
import { ServerContext, type ServerOptions } from "./context.js";
import { ToolError, addComponents, checkTokens, getComponent, getComponentDocs, listComponents, projectInfo, searchComponents } from "./operations.js";

export const SERVER_NAME = "properui";

/** Read at runtime so the advertised version can never drift from package.json. */
export const SERVER_VERSION = (createRequire(import.meta.url)("../package.json") as { version: string }).version;

const INSTRUCTIONS = `Proper UI is a registry of accessible React 19 components (React Aria Components + Tailwind CSS v4), distributed as source.

Before writing UI markup by hand:
1. get_project_info: is components.json there yet? If not, run \`npx @properui/cli@latest init -y\` in the project.
2. search_components / list_components: find an existing component or full-page example.
3. get_component / get_component_docs: read the real source and docs instead of writing from memory.
4. add_component: copy it into the project (resolves registry dependencies, rewrites @/ imports, reports the npm install command).
5. check_tokens: after editing, flag raw palette classes, dark: variants and arbitrary colour values.

Code rules for anything written by hand: React Aria props (onPress, isDisabled, isSelected), semantic tokens only (bg-primary, text-tertiary, never bg-purple-600 or bg-[#7f56d9]), no dark: utilities, logical properties (ms-/me-/ps-/pe-/start-/end-), icons passed as component references (iconLeading={ArrowRight}), subpath imports.`;

const cwdSchema = z
    .string()
    .optional()
    .describe("Project directory to act on. Relative paths resolve against the server's working directory, which is also the default.");

const json = (value: unknown): CallToolResult => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });

/** Runs a tool body, turning expected failures into `isError` results instead of protocol errors. */
async function run(body: () => Promise<unknown>): Promise<CallToolResult> {
    try {
        return json(await body());
    } catch (error) {
        const message =
            error instanceof ToolError || error instanceof RegistryError ? error.message : `Unexpected error: ${(error as Error).message ?? String(error)}`;
        return { isError: true, content: [{ type: "text", text: message }] };
    }
}

export function createServer(options: ServerOptions = {}): McpServer {
    const ctx = new ServerContext(options);
    const server = new McpServer({ name: SERVER_NAME, title: "Proper UI", version: SERVER_VERSION }, { instructions: INSTRUCTIONS });

    server.registerTool(
        "list_components",
        {
            title: "List Proper UI components",
            description:
                "List registry entries (name, layer, type, title, description). Filter by layer (base, application, marketing, app-examples, marketing-examples, foundations, shared-assets, utils, hooks, styles) or type (component, example, util, hook, style). Paginated: pass offset=nextOffset for more.",
            inputSchema: {
                layer: z.string().optional().describe("Only entries in this layer, e.g. base, application, marketing."),
                type: z.enum(["component", "example", "util", "hook", "style"]).optional().describe("Only entries of this type."),
                limit: z.number().int().min(1).max(1000).optional().describe("Maximum rows to return (default 100)."),
                offset: z.number().int().min(0).optional().describe("Rows to skip, for paging (default 0)."),
                cwd: cwdSchema,
            },
            annotations: { readOnlyHint: true, openWorldHint: true },
        },
        async (input) => run(() => listComponents(ctx, input)),
    );

    server.registerTool(
        "search_components",
        {
            title: "Search Proper UI components",
            description:
                "Fuzzy search over registry names, titles, descriptions, docs example names and exported symbols (the same scoring as `properui search`). Use it before writing any component markup by hand.",
            inputSchema: {
                query: z.string().min(1).describe('What you need, e.g. "date picker", "pricing table", "Button".'),
                limit: z.number().int().min(1).max(100).optional().describe("Maximum matches (default 10)."),
                type: z.enum(["component", "example", "util", "hook", "style"]).optional().describe("Only entries of this type, e.g. example for full pages."),
                cwd: cwdSchema,
            },
            annotations: { readOnlyHint: true, openWorldHint: true },
        },
        async (input) => run(() => searchComponents(ctx, input)),
    );

    server.registerTool(
        "get_component",
        {
            title: "Get a Proper UI component",
            description:
                "The full registry entry for one name: every file with its source, npm dependencies, registryDependencies, docs example names, usage guidance when published (intent, avoid_when, a11y_contract, token_contract) and the docs URL.",
            inputSchema: {
                name: z.string().min(1).describe('Registry name, e.g. "buttons", "date-picker", "settings-01".'),
                includeDemoFiles: z.boolean().optional().describe("Also return files marked as demo content (fixtures, placeholder data). Default false."),
                cwd: cwdSchema,
            },
            annotations: { readOnlyHint: true, openWorldHint: true },
        },
        async (input) => run(() => getComponent(ctx, input)),
    );

    server.registerTool(
        "get_component_docs",
        {
            title: "Get Proper UI docs",
            description:
                "The docs page for one registry entry as markdown: usage, props, examples and accessibility notes. Reads the published markdown twin (https://properui.dev/<route>.md), or the MDX source when the registry is a local checkout.",
            inputSchema: {
                name: z.string().min(1).describe('Registry name, e.g. "buttons".'),
                cwd: cwdSchema,
            },
            annotations: { readOnlyHint: true, openWorldHint: true },
        },
        async (input) => run(() => getComponentDocs(ctx, input)),
    );

    server.registerTool(
        "add_component",
        {
            title: "Add Proper UI components",
            description:
                'Copy registry entries into the project exactly like `properui add`: resolves registryDependencies, rewrites @/ imports to the components.json alias, records the install in components.json and reports the missing npm packages with the command to install them. Existing files are skipped unless overwrite is true. Pass ["example", "<name>"] or just the example name for a full page. Requires components.json (run `npx @properui/cli@latest init -y` first).',
            inputSchema: {
                names: z.array(z.string().min(1)).min(1).describe('Registry names, e.g. ["buttons", "date-picker"].'),
                cwd: cwdSchema,
                overwrite: z.boolean().optional().describe("Replace files that already exist and differ. Default false."),
                dryRun: z.boolean().optional().describe("Report what would change without writing anything."),
                optional: z.boolean().optional().describe("Also install optionalRegistryDependencies (default true)."),
                withDemos: z.boolean().optional().describe("Also write demo/fixture files for the added entries. Default false."),
                path: z.string().optional().describe("Directory, relative to cwd, for component files instead of the components alias."),
                install: z
                    .boolean()
                    .optional()
                    .describe("Run the package manager for missing npm packages instead of only returning the command. Default false."),
            },
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        },
        async (input) => run(() => addComponents(ctx, input)),
    );

    server.registerTool(
        "get_project_info",
        {
            title: "Inspect the project's Proper UI setup",
            description:
                "Same report as `properui info --json`: framework, TypeScript, Tailwind version, package manager, components.json aliases and theme path, installed @properui packages, the registry source and whether it is reachable, and which entries are already installed.",
            inputSchema: { cwd: cwdSchema },
            annotations: { readOnlyHint: true, openWorldHint: true },
        },
        async (input) => run(() => projectInfo(ctx, input)),
    );

    server.registerTool(
        "check_tokens",
        {
            title: "Check for raw Tailwind values",
            description:
                "Same guard as `properui check`: scans .ts/.tsx/.jsx files (or one file) for raw palette classes (bg-purple-600), dark: variants and arbitrary colour values (bg-[#7f56d9]) that should be semantic tokens.",
            inputSchema: {
                path: z.string().optional().describe("File or directory to scan, relative to cwd. Default: the whole project."),
                cwd: cwdSchema,
            },
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async (input) => run(() => checkTokens(ctx, input)),
    );

    server.registerResource(
        "registry-index",
        "properui://registry/index",
        {
            title: "Proper UI registry index",
            description: "Every registry entry: name, layer, type, title, description, dependencies and file count.",
            mimeType: "application/json",
        },
        async (uri) => ({
            contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({ components: await ctx.registry().index() }, null, 2) }],
        }),
    );

    server.registerResource(
        "registry-entry",
        new ResourceTemplate("properui://registry/{name}", {
            list: async () => ({
                resources: (await ctx.registry().index())
                    .filter((entry) => entry.fileCount > 0)
                    .map((entry) => ({
                        uri: `properui://registry/${entry.name}`,
                        name: entry.name,
                        title: entry.title,
                        description: entry.description,
                        mimeType: "application/json",
                    })),
            }),
            complete: {
                name: async (value) =>
                    (await ctx.registry().index())
                        .map((entry) => entry.name)
                        .filter((name) => name.startsWith(value))
                        .slice(0, 100),
            },
        }),
        {
            title: "Proper UI registry entry",
            description: "One registry entry with the full source of every file.",
            mimeType: "application/json",
        },
        async (uri, variables) => {
            const name = String(Array.isArray(variables.name) ? variables.name[0] : variables.name);
            const entry = await ctx.registry().item(name);
            return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(entry, null, 2) }] };
        },
    );

    return server;
}
