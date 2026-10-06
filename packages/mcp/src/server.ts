/**
 * Builds the Proper UI MCP server: the component tools, the design reference library tools
 * (screens, sections, flows, compare, install plan), the registry as resources and a prompt.
 *
 * Tools read the same registry the CLI reads (see `ServerContext`) and write files through the
 * same code the CLI's `add` uses. The component tools return their result as JSON text; the
 * library tools return markdown plus `structuredContent`. An expected failure (unknown name,
 * no components.json, unreachable registry) comes back as `isError` with a message an agent
 * can act on.
 *
 * With `hosted: true` (the HTTP handler) the project-bound tools `add_component`,
 * `get_project_info` and `check_tokens` are not registered: there is no project directory.
 */
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { version } from "../package.json";
import { PLATFORM_FILTERS, RegistryError } from "./cli.js";
import { ServerContext, type ServerOptions } from "./context.js";
import { type LibraryResult, buildScreenPrompt, compareScreens, getInstallPlan, readStats, searchFlows, searchScreens, searchSections } from "./library.js";
import { ToolError, addComponents, checkTokens, getComponent, getComponentDocs, listComponents, projectInfo, searchComponents } from "./operations.js";

export const SERVER_NAME = "properui";

/** Inlined from package.json at build time, so the advertised version can never drift from it. */
export const SERVER_VERSION: string = version;

const LOCAL_INSTRUCTIONS = `Proper UI is a registry of accessible React 19 components (React Aria Components + Tailwind CSS v4), distributed as source.

Before writing UI markup by hand:
1. get_project_info: is components.json there yet? If not, run \`npx @properui/cli@latest init -y\` in the project.
2. search_components / list_components: find an existing component. For a whole page, a multi-step journey or a marketing section, search_screens / search_flows / search_sections return real examples with thumbnails; review several, and compare_screens lines a shortlist up.
3. get_component / get_component_docs: read the real source and docs instead of writing from memory. get_install_plan previews what an install would write.
4. add_component: copy it into the project (resolves registry dependencies, rewrites @/ imports, reports the npm install command).
5. check_tokens: after editing, flag raw palette classes, dark: variants and arbitrary colour values.

Non-React projects (Vue, Nuxt, Angular, Svelte, SvelteKit, Astro, plain HTML): get_project_info reports platform "html". There, add_component installs the <name>-html snippet entry (plain HTML using the @properui/html pui- classes) and refuses React-only entries; use @properui/elements custom elements (<pui-button>, <pui-modal>) in framework templates, and never write TSX into those projects. Filter list_components/search_components with platform: "html" to see what exists.

Code rules for React code written by hand: React Aria props (onPress, isDisabled, isSelected), semantic tokens only (bg-primary, text-tertiary, never bg-purple-600 or bg-[#7f56d9]), no dark: utilities, logical properties (ms-/me-/ps-/pe-/start-/end-), icons passed as component references (iconLeading={ArrowRight}), subpath imports.`;

const HOSTED_INSTRUCTIONS = `Proper UI is a registry of accessible React 19 components (React Aria Components + Tailwind CSS v4), distributed as source, with a library of real screens, flows and marketing sections to start from.

This is the remote, read-only server: it has no access to a project, so it never writes files.

To build a screen or a section:
1. search_screens (whole pages), search_flows (multi-step journeys), search_sections (marketing sections) or search_components (single controls). Review several results; thumbnails, docs and preview links come with each.
2. compare_screens: line up two to five candidates and see what they share.
3. get_component (and get_component_docs): read the real source of the one you choose instead of writing from memory.
4. get_install_plan: the dependencies, npm packages, files and the exact CLI command. Run that command in the user's project (\`npx @properui/cli@latest add <name>\`; run \`npx @properui/cli@latest init -y\` first when there is no components.json). The local server (\`npx -y @properui/mcp\`) adds add_component, get_project_info and check_tokens for projects on disk.

Examples use placeholder copy and demo data; replace them with the product's own.

Code rules for React code written by hand: React Aria props (onPress, isDisabled, isSelected), semantic tokens only (bg-primary, text-tertiary, never bg-purple-600 or bg-[#7f56d9]), no dark: utilities, logical properties (ms-/me-/ps-/pe-/start-/end-), icons passed as component references (iconLeading={ArrowRight}), subpath imports.`;

const TYPES = ["component", "example", "util", "hook", "style", "html"] as const;

const platformSchema = z
    .enum(PLATFORM_FILTERS)
    .optional()
    .describe(
        'Only entries that run on this platform. "react"/"next" for the TSX components; "html" (or vue, angular, svelte, astro, vanilla) for the @properui/html snippet entries.',
    );

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

/** Runs a library tool body: markdown text plus structured content, expected failures as `isError`. */
async function runLibrary(body: () => Promise<LibraryResult>): Promise<CallToolResult> {
    try {
        const { text, data, isError } = await body();
        return { content: [{ type: "text", text }], structuredContent: data, ...(isError ? { isError: true } : {}) };
    } catch (error) {
        const message =
            error instanceof RegistryError
                ? `The Proper UI registry could not be read. ${error.message}`
                : `Unexpected error: ${(error as Error).message ?? String(error)}`;
        return { isError: true, content: [{ type: "text", text: message }] };
    }
}

/** `context` lets a long-lived host (the HTTP handler) share one registry cache across servers. */
export function createServer(options: ServerOptions = {}, context?: ServerContext): McpServer {
    const ctx = context ?? new ServerContext(options);
    const server = new McpServer(
        { name: SERVER_NAME, title: "Proper UI", version: SERVER_VERSION },
        { instructions: ctx.hosted ? HOSTED_INSTRUCTIONS : LOCAL_INSTRUCTIONS },
    );

    server.registerTool(
        "list_components",
        {
            title: "List Proper UI components",
            description:
                "List registry entries (name, layer, type, title, description, platforms). Filter by layer (base, application, marketing, app-examples, marketing-examples, foundations, shared-assets, utils, hooks, styles, html), type (component, example, util, hook, style, html) or platform (react, next, html, vue, angular, svelte, astro, vanilla). Paginated: pass offset=nextOffset for more.",
            inputSchema: {
                layer: z.string().optional().describe("Only entries in this layer, e.g. base, application, marketing."),
                type: z.enum(TYPES).optional().describe("Only entries of this type."),
                platform: platformSchema,
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
                type: z.enum(TYPES).optional().describe("Only entries of this type, e.g. example for full pages, html for HTML snippets."),
                platform: platformSchema,
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

    const limitSchema = (fallback: number) =>
        z.number().int().min(1).max(25).optional().describe(`Maximum results to return. Default ${fallback}, maximum 25.`);
    const querySchema = (what: string) =>
        z
            .string()
            .trim()
            .min(1)
            .max(200)
            .describe(`What to look for, in plain words: ${what}. A few words work best; a name, a use case or a layout all match.`);
    const libraryAnnotations = { readOnlyHint: true, idempotentHint: true, openWorldHint: true } as const;

    server.registerTool(
        "search_screens",
        {
            title: "Search screens",
            description:
                "Search full-page examples: dashboards, settings, sign-in and sign-up, verification, pricing, landing, about, contact, blog and legal pages, and more. Each is a real React component with source. Returns names, thumbnails, docs and preview links, what it composes, and the add command. Review several before choosing.",
            inputSchema: {
                query: querySchema('for example "settings with billing tab", "dashboard with sidebar" or "pricing page"'),
                platform: z
                    .enum(["app", "marketing"])
                    .optional()
                    .describe(
                        "Limit to application screens (dashboards, settings, auth, email) or marketing pages (landing, pricing, blog). Omit to search both.",
                    ),
                limit: limitSchema(8),
            },
            annotations: libraryAnnotations,
        },
        async (input) => runLibrary(() => searchScreens(ctx, input)),
    );

    server.registerTool(
        "search_sections",
        {
            title: "Search sections",
            description:
                "Search marketing page sections: heroes, headers, pricing tables, feature grids, testimonials, FAQs, footers, banners, CTAs and similar variants. Sections are compositions to place inside a page, not whole screens.",
            inputSchema: {
                query: querySchema('for example "pricing with toggle", "hero with image" or "footer with newsletter"'),
                group: z
                    .string()
                    .trim()
                    .min(1)
                    .max(80)
                    .optional()
                    .describe(
                        'Limit to one section family by name, for example "pricing-sections", "hero-header-sections" or "footers". A partial name matches.',
                    ),
                limit: limitSchema(8),
            },
            annotations: libraryAnnotations,
        },
        async (input) => runLibrary(() => searchSections(ctx, input)),
    );

    server.registerTool(
        "search_flows",
        {
            title: "Search flows",
            description:
                "Search curated multi-step flows: ordered sequences of screens such as authentication, onboarding, settings, billing, a marketing site and email lifecycle. Each step names a screen and says what it is for, so the whole journey can be built.",
            inputSchema: {
                query: querySchema('for example "sign up and verify email", "billing" or "onboarding"'),
                limit: limitSchema(5),
            },
            annotations: libraryAnnotations,
        },
        async (input) => runLibrary(() => searchFlows(ctx, input)),
    );

    server.registerTool(
        "compare_screens",
        {
            title: "Compare screens",
            description:
                "Compare 2 to 5 registry entries side by side before choosing one: title, layer, thumbnail, docs and preview links, which composed components, design tokens and npm packages they share and which are unique to each, file counts and the add command. Works for screens, sections and components. Unknown names are reported with the nearest matches.",
            inputSchema: {
                names: z
                    .array(z.string().trim().min(1).max(120))
                    .min(2)
                    .max(5)
                    .describe('Registry names from search results, for example ["settings-13", "settings-12"]. Two to five.'),
                include_source: z
                    .boolean()
                    .optional()
                    .describe(
                        "Append the full source of every file of every entry. Default false. Source is long; ask for it only when the shortlist is down to two.",
                    ),
            },
            annotations: libraryAnnotations,
        },
        async (input) => runLibrary(() => compareScreens(ctx, input)),
    );

    server.registerTool(
        "get_install_plan",
        {
            title: "Get install plan",
            description:
                "Plan the install of one or more entries without writing anything: the registry entries pulled in as dependencies (optional ones listed separately), the npm packages needed, the files that would be written, and the exact CLI command to run in the project. Read-only.",
            inputSchema: {
                names: z
                    .array(z.string().trim().min(1).max(120))
                    .min(1)
                    .max(20)
                    .describe('Registry names to install, from search results, for example ["settings-13"].'),
            },
            annotations: libraryAnnotations,
        },
        async (input) => runLibrary(() => getInstallPlan(ctx, input)),
    );

    if (!ctx.hosted) {
        server.registerTool(
            "add_component",
            {
                title: "Add Proper UI components",
                description:
                    'Copy registry entries into the project exactly like `properui add`: resolves registryDependencies, rewrites @/ imports to the components.json alias, records the install in components.json and reports the missing npm packages with the command to install them. Existing files are skipped unless overwrite is true. Pass ["example", "<name>"] or just the example name for a full page. On a project whose components.json platform is "html", "<name>" resolves to the "<name>-html" snippet entry and React-only entries are refused with the HTML alternative named. Requires components.json (run `npx @properui/cli@latest init -y` first).',
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
                    "Same report as `properui info --json`: framework, platform (react or html: which registry layer add_component installs from), TypeScript, Tailwind version, package manager, components.json aliases and theme path, installed @properui packages, the registry source and whether it is reachable, and which entries are already installed.",
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
    }

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

    server.registerResource(
        "stats",
        "properui://stats",
        {
            title: "Proper UI library numbers",
            description: "Entry, group, variant, example and test counts, generated from the registry build.",
            mimeType: "application/json",
        },
        async (uri) => {
            const stats = await readStats(ctx.registry());
            const body = stats ? JSON.stringify(stats, null, 2) : JSON.stringify({ error: "stats.json is not published by this registry" });
            return { contents: [{ uri: uri.href, mimeType: "application/json", text: body }] };
        },
    );

    server.registerPrompt(
        "build_screen",
        {
            title: "Build a screen",
            description: "Research, then install: find the closest screens, flows and sections in the library, review several, install one and adapt it.",
            argsSchema: {
                description: z.string().describe('The screen, flow or section to build, in plain words, for example "settings page with a billing tab".'),
            },
        },
        ({ description }) => ({
            messages: [{ role: "user" as const, content: { type: "text" as const, text: buildScreenPrompt(description, !ctx.hosted) } }],
        }),
    );

    return server;
}
