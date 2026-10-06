import { getAllContentPages } from "~/lib/content";
import { SITE_NAME, absoluteUrl, markdownUrl } from "~/lib/site";

/**
 * `/llms.txt` — the index an LLM can crawl to find the plain-markdown twin of every
 * page (spec 08-docs-site.md § "Copy page as Markdown" / LLM integrations).
 */
export const dynamic = "force-static";

export function GET() {
    const pages = getAllContentPages();

    const body = [
        `# ${SITE_NAME}`,
        "",
        `> Open-source React 19 component library built for AI-generated code. Behaviour comes from React Aria Components;`,
        `> styling is Tailwind CSS v4 resolved through semantic tokens. MIT licensed. Every page below is plain markdown.`,
        "",
        "## Conventions",
        "",
        "- Check the platform first: on a non-React project, write `pui-*` HTML or `<pui-*>` custom elements, never TSX. The rules below apply to React projects; tokens, no `dark:` and logical properties apply everywhere.",
        "- React Aria props: `onPress` not `onClick`, `isDisabled` not `disabled`.",
        "- Semantic tokens only: `bg-primary`, `text-tertiary`, `bg-brand-solid`. Never a raw palette or arbitrary value.",
        "- No `dark:` utilities: a `.dark-mode` ancestor class repoints every token.",
        "- Logical properties for direction: `ms-*`, `pe-*`, `start-*`, `text-start`.",
        "- Icons are passed as component references: `<Button iconLeading={ArrowRight}>`, except inside a React Server",
        '  Component, which needs the element form instead: `<Button iconTrailing={<ArrowRight data-icon="trailing" />}>`.',
        "",
        "## Machine-readable endpoints",
        "",
        `- [Registry index](${absoluteUrl("/r/index.json")}): every component, its layer, type and dependencies.`,
        `- Component entry: \`${absoluteUrl("/r")}/<name>.json\` (includes the component's source).`,
        `- [components.json schema](${absoluteUrl("/schema.json")}).`,
        `- Semantic manifest: entries also carry optional \`intent\`, \`avoid_when\`, \`composes_with\`, \`a11y_contract\`, \`responsive_contract\`, \`token_contract\` and \`requires_data\` fields for choosing a component, not just installing it: see [Registry metadata for agents](${absoluteUrl(markdownUrl("/docs/registry-metadata"))}).`,
        "- CLI: `npx @properui/cli@latest add <component>` writes the files and resolves dependencies.",
        "- CLI: `npx @properui/cli@latest check` flags raw palette classes and arbitrary values in place of semantic tokens.",
        "- CLI: `npx @properui/cli@latest icons` lists and installs icon components the same way `add` handles the rest of the registry.",
        `- MCP: search screens, flows, sections and components, then plan or run the install. Remote \`${absoluteUrl("/api/mcp")}\` (Streamable HTTP, no account; \`search_screens\`, \`search_sections\`, \`search_flows\`, \`search_components\`, \`compare_screens\`, \`get_component\`, \`get_install_plan\`) or local \`npx -y @properui/mcp\` (adds \`add_component\`, \`get_project_info\`, \`check_tokens\`). Overview: [${absoluteUrl("/mcp")}](${absoluteUrl("/mcp")}); reference: [MCP server](${absoluteUrl(markdownUrl("/docs/mcp"))}).`,
        `- Non-React projects: \`info --json\` reports \`platform\`; on \`html\` (Vue, Nuxt, Angular, Svelte, Astro, plain HTML) \`add <name>\` installs the \`<name>-html\` snippet entry, and [${absoluteUrl("/css/properui.min.css")}](${absoluteUrl("/css/properui.min.css")}) is a prebuilt stylesheet with the tokens and the \`pui-*\` component classes. What each platform gets: [Frameworks](${absoluteUrl(markdownUrl("/docs/frameworks"))}).`,
        `- [Flows](${absoluteUrl("/flows")}): curated user journeys (sign up, onboarding, billing and more) as ordered, installable screens; each flow page lists the \`add\` command for every step.`,
        `- Testing components against jsdom needs a few shims React Aria doesn't ship by default: see [Testing](${absoluteUrl(markdownUrl("/docs/testing"))}).`,
        `- Importing Proper UI into an app with its own Tailwind theme: ten utility names collide and Proper UI's namespaces win regardless of import order; see [Adopting Proper UI](${absoluteUrl(markdownUrl("/docs/adopting"))}).`,
        "",
        "## Pages",
        "",
        // Overview routes are generated, so they have no markdown twin — link the pages themselves.
        ...["/", "/mcp", "/components", "/application-ui", "/marketing"].map((route) => `- [${route}](${absoluteUrl(route)})`),
        ...pages.map(
            (page) =>
                `- [${page.frontmatter.title}](${absoluteUrl(markdownUrl(page.href))})${page.frontmatter.description ? `: ${page.frontmatter.description}` : ""}`,
        ),
        "",
    ].join("\n");

    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
