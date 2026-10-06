import type { Metadata } from "next";
import { BrandMark } from "~/components/landing/brand-mark";
import { CopyButton } from "~/components/landing/copy-button";
import "~/components/landing/landing-mcp.css";
import "~/components/landing/landing.css";
import { COMPOSABLE_VARIANTS, FLOWS, PAGE_EXAMPLES, PUBLISHED_GROUPS } from "~/components/landing/stats";
import { SITE_NAME } from "~/lib/site";
import { ClientTabs } from "./client-tabs";
import { MCP_URL } from "./clients";
import { Inline, plain } from "./inline";

const TITLE = "Proper UI MCP: searchable web-app screens, flows and sections for AI agents";
const SECTION_VARIANTS = COMPOSABLE_VARIANTS - PAGE_EXAMPLES;
const DESCRIPTION = `Connect Claude, ChatGPT, Codex and Cursor to ${PAGE_EXAMPLES} screens, ${SECTION_VARIANTS} sections and curated flows. Real source, free, no account.`;

/** Canonical URL: the marketing origin, same as the landing page, not the docs origin in `~/lib/site`. */
const CANONICAL = "https://properui.dev/mcp";

export const metadata: Metadata = {
    metadataBase: new URL("https://properui.dev/"),
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    icons: { icon: "/favicon.svg" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const OUTCOMES = [
    {
        title: "Research a screen",
        text: "Describe the page you need and review ranked options with thumbnails, before anything is installed.",
        tool: "search_screens",
    },
    {
        title: "Follow a flow",
        text: "Find a sign up, onboarding or billing journey and read each step in order, with its purpose.",
        tool: "search_flows",
    },
    {
        title: "Compare approaches",
        text: "Put two to five candidates side by side: the components and tokens they share, and the ones only one of them uses.",
        tool: "compare_screens",
    },
    {
        title: "Find a section",
        text: "Look through marketing section variants for the hero, pricing block or footer that fits the page.",
        tool: "search_sections",
    },
    {
        title: "Install what you found",
        text: "Get the files and packages a choice would add. Over stdio the agent installs it; over HTTP it runs the CLI.",
        tool: "add_component or get_install_plan",
    },
];

const CARDS = [
    {
        title: "Screens",
        count: String(PAGE_EXAMPLES),
        unit: "full pages",
        body: "Dashboards, settings, auth, onboarding, billing, informational pages, 404s and email templates, each a complete page you can install.",
        tool: "search_screens",
    },
    {
        title: "Flows",
        count: String(FLOWS),
        unit: "ordered sequences",
        body: "Multi-step journeys such as sign up, onboarding and billing, built only from screens that exist, with each step's purpose named.",
        tool: "search_flows",
    },
    {
        title: "Sections",
        count: String(SECTION_VARIANTS),
        unit: "marketing variants",
        body: "Heroes, pricing, features, testimonials, FAQs, footers and the rest of a marketing site, one variant per layout.",
        tool: "search_sections",
    },
    {
        title: "Components",
        count: String(PUBLISHED_GROUPS),
        unit: "component groups",
        body: "The base and application components that screens and sections are built from, with props and docs links.",
        tool: "search_components",
    },
];

const RESULT_FIELDS = [
    { name: "Thumbnail", text: "A rendered image of the screen or section, light and dark where available, so the agent can look before it chooses." },
    { name: "Name and layer", text: "The registry name and the layer it lives in, such as app-examples or marketing." },
    { name: "Docs and preview links", text: "The documentation page and a live preview you can open in a browser." },
    { name: "Composes with", text: "The components the entry is built from, so you can see what installing it pulls in." },
    { name: "Semantic tokens", text: "The token contract the entry uses, so the result stays correct in light, dark and right to left." },
    { name: "Install command", text: "The exact CLI command. `get_install_plan` lists the files and npm packages before anything is written." },
];

const SAMPLE_RESULT = `{
  "name": "dashboard-04",
  "title": "Dashboard 04",
  "layer": "app-examples",
  "thumbnail": "https://properui.dev/thumbs/app-examples/dashboards/dashboard-04.webp",
  "docs": "https://properui.dev/components/dashboards/dashboard-04",
  "composes_with": ["app-navigation", "charts", "metrics", "table", "tabs"],
  "token_contract": ["bg-primary", "border-secondary", "text-primary", "text-tertiary"],
  "add": "npx @properui/cli@latest add dashboard-04"
}`;

const SKILL_COMMANDS = [
    { label: "With the Proper UI CLI", value: "npx @properui/cli@latest agent init" },
    { label: "With the skills registry", value: "npx skills add properui/properui" },
];

const STEPS = [
    {
        title: "Say what you are building",
        text: "Name the screen, flow or section, and who it is for. A billing page for a self-serve SaaS needs different things from one for an enterprise admin.",
    },
    {
        title: "Search and review several results",
        text: "Ask for three to five options, not the first match. Compare the thumbnails and what each composes with before you choose.",
    },
    {
        title: "Inspect with `get_component`",
        text: "Read the entry's files, dependencies and docs link. Open the source only for the one you are likely to use.",
    },
    {
        title: "Plan with `get_install_plan`",
        text: "See the files that will be written and the npm packages that will be needed. Nothing has changed in your project yet.",
    },
    {
        title: "Install, then adapt",
        text: "Over stdio, `add_component` writes the files. Over HTTP, the agent runs the CLI command from the plan. Then replace the placeholder copy and data with yours, and keep the semantic tokens.",
    },
];

const LIMITS = [
    "Examples ship with placeholder data and demo assets. Replace them before anything reaches a user.",
    "Sections are compositions from one design system. They are not screens captured from shipped products.",
    "Every component passes axe in tests, but accessibility has to be evaluated in your real page, with your content and your flows.",
    "Results are starting points. A pattern appearing in the library is not proof that it is right for your users.",
    "The remote endpoint cannot see your project, so it cannot install files or check tokens. Use the local package, or run the CLI command from `get_install_plan`.",
];

const FAQ: Array<{ question: string; answer: string }> = [
    {
        question: "Is it free?",
        answer: "Yes. Proper UI is MIT licensed and the MCP is part of it. There is no paid tier and no usage plan.",
    },
    {
        question: "Do I need an account?",
        answer: "No. There is no sign-in, no OAuth step and no API key. Add the URL to your client and it works.",
    },
    {
        question: "Does it write files?",
        answer: "It depends on how you connect. The remote endpoint never writes: it searches, inspects and plans, and your agent runs the CLI through its own shell tool, so each file write goes through the approval your client already asks for. The local stdio package runs in your project, so its `add_component` tool installs the files itself, the same way `properui add` would.",
    },
    {
        question: "Are there rate limits?",
        answer: "Fair use. There is no per-user quota today. For heavy or automated use, run the local stdio package against a copy of the registry instead.",
    },
    {
        question: "Remote or local?",
        answer: "Start with the remote URL: nothing to install, and it works in ChatGPT, Claude on the web and every client below. Choose the local stdio package when you want the agent to install straight into your project through `add_component`, when your client has no remote support, or when you need an offline registry.",
    },
    {
        question: "Does it work offline?",
        answer: "Yes, through the local stdio package: `npx -y @properui/mcp --registry <directory>` reads a local copy of the registry instead of properui.dev.",
    },
    {
        question: "What data is sent?",
        answer: "Only the tool arguments your agent passes, such as a search query. Your code, your files and your identity are never sent, and the server has no telemetry. The only usage signal is the aggregate request analytics Cloudflare provides for the endpoint.",
    },
    {
        question: "How is it different from the CLI?",
        answer: "The CLI installs. The MCP helps an agent decide what to install: it searches screens, flows and sections with thumbnails and links, then produces an install plan. Both read the same registry. Over stdio the MCP can run the install itself; over HTTP it hands the final step to the CLI.",
    },
    {
        question: "How is it different from the Skill?",
        answer: "The Skill is a set of instructions that lives in your repository and tells an agent how to work with Proper UI. The MCP is a tool the agent can call to search the library. They work together: when the MCP is connected, the Skill tells the agent to use `search_*` and `get_component` before the CLI.",
    },
];

const JSON_LD = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "SoftwareApplication",
            name: "Proper UI MCP",
            description: DESCRIPTION,
            url: CANONICAL,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            license: "https://github.com/properui/properui/blob/main/LICENSE",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
        {
            "@type": "FAQPage",
            mainEntity: FAQ.map(({ question, answer }) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: { "@type": "Answer", text: plain(answer) },
            })),
        },
    ],
};

/**
 * `/mcp`: the product page for the Proper UI MCP. A sibling of the landing page: same wrapper
 * class, header and footer, with section styles in `landing-mcp.css` under the `mcp-` prefix.
 * The per-client setup tabs live in `./client-tabs.tsx` (a client component) and read their
 * commands from `./clients.ts`.
 */
export default function McpPage() {
    return (
        <div className="pui-landing">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

            <header className="site-header">
                <div className="header-inner container">
                    <a className="brand" href="/" aria-label="Proper UI home">
                        <BrandMark />
                        <span>Proper UI</span>
                    </a>

                    <nav className="main-nav" aria-label="Main navigation">
                        <a href="/components">Components</a>
                        <a href="/#examples">Examples</a>
                        <a href="/#setup">For AI</a>
                        <a href="/mcp" aria-current="page">
                            MCP
                        </a>
                        <a href="/docs">Documentation</a>
                        <a href="https://github.com/properui/properui" target="_blank" rel="noreferrer">
                            GitHub
                        </a>
                    </nav>

                    <div className="header-actions">
                        <a className="button button-primary" href="#setup">
                            Set up your client
                        </a>
                    </div>
                </div>
            </header>

            <main id="top">
                <section className="hero mcp-hero" aria-labelledby="mcp-title">
                    <div className="hero-grid" aria-hidden="true" />
                    <div className="hero-glow" aria-hidden="true" />
                    <div className="hero-copy container">
                        <span className="eyebrow">Model Context Protocol</span>
                        <h1 id="mcp-title">Search real web-app screens, flows and sections. Then install them.</h1>
                        <p>
                            Connect Claude, ChatGPT, Codex, Cursor and other MCP clients to the Proper UI library. Every result is a real component with source,
                            so the agent can install what it found. Free, open source, no account.
                        </p>

                        <div className="mcp-hero-command">
                            <span id="mcp-endpoint-label">Remote endpoint</span>
                            <div className="command" role="group" aria-labelledby="mcp-endpoint-label">
                                <code>{MCP_URL}</code>
                                <CopyButton value={MCP_URL}>Copy</CopyButton>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <a className="button button-primary button-lg" href="#setup">
                                Set up your client
                            </a>
                            <a className="button button-secondary button-lg" href="/docs/mcp">
                                Read the reference
                            </a>
                        </div>
                        <p className="hero-microproof">MIT licensed. No sign-in, no API key. Remote URL or local package.</p>
                    </div>
                </section>

                <section className="section" id="outcomes" aria-labelledby="mcp-outcomes-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Outcomes</span>
                            <h2 id="mcp-outcomes-title">What your agent can do with it</h2>
                            <p>Five jobs the library is good for, each backed by one tool.</p>
                        </div>

                        <ul className="mcp-outcomes">
                            {OUTCOMES.map((outcome) => (
                                <li className="mcp-card" key={outcome.title}>
                                    <h3>{outcome.title}</h3>
                                    <p>{outcome.text}</p>
                                    <code>{outcome.tool}</code>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="section mcp-alt" id="search" aria-labelledby="mcp-search-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Library</span>
                            <h2 id="mcp-search-title">What your agent can search</h2>
                            <p>Four searchable collections, one tool each. Ask in plain language and get ranked results, or an honest no match.</p>
                        </div>

                        <ul className="mcp-cards">
                            {CARDS.map((card) => (
                                <li className="mcp-card" key={card.title}>
                                    <h3>{card.title}</h3>
                                    <p className="mcp-card-count">
                                        <strong>{card.count}</strong> <span>{card.unit}</span>
                                    </p>
                                    <p>{card.body}</p>
                                    <code>{card.tool}</code>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="section" id="results" aria-labelledby="mcp-results-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Results</span>
                            <h2 id="mcp-results-title">What results contain</h2>
                            <p>
                                Each result carries what an agent needs to compare options and act on one. The fields below come straight from the registry, so
                                nothing is invented at query time.
                            </p>
                        </div>

                        <div className="mcp-results">
                            <ul className="mcp-fields">
                                {RESULT_FIELDS.map((field) => (
                                    <li key={field.name}>
                                        <h3>{field.name}</h3>
                                        <p>
                                            <Inline text={field.text} />
                                        </p>
                                    </li>
                                ))}
                            </ul>

                            <figure className="mcp-sample">
                                <img
                                    src="/thumbs/app-examples/dashboards/dashboard-04.webp"
                                    alt="Thumbnail of the dashboard-04 example: a sidebar, metric cards, a chart and a table"
                                    width={640}
                                    height={400}
                                    loading="lazy"
                                />
                                <pre>
                                    <code>{SAMPLE_RESULT}</code>
                                </pre>
                                <figcaption>An abridged result for a dashboard screen.</figcaption>
                            </figure>
                        </div>
                    </div>
                </section>

                <section className="section mcp-alt" id="setup" aria-labelledby="mcp-setup-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Setup</span>
                            <h2 id="mcp-setup-title">Set up in your client</h2>
                            <p>
                                Pick your client and copy the command. The remote URL needs nothing installed. The local package runs in your project, so the
                                agent can install what it finds.
                            </p>
                        </div>

                        <ClientTabs />

                        <div className="mcp-skill">
                            <h3>Also install the Skill</h3>
                            <p>
                                The Skill tells your agent when and how to use Proper UI, including to search with the MCP first. Install it with the CLI, or
                                with the skills registry for agents the CLI does not target. It reaches 75+ agents through skills.sh.
                            </p>
                            <div className="mcp-commands">
                                {SKILL_COMMANDS.map((command) => (
                                    <div className="mcp-command" key={command.label}>
                                        <span>{command.label}</span>
                                        <div className="command">
                                            <code>{command.value}</code>
                                            <CopyButton value={command.value}>Copy</CopyButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section" id="how" aria-labelledby="mcp-how-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Workflow</span>
                            <h2 id="mcp-how-title">How to use it well</h2>
                            <p>Research first, then install. The agent gets a better result when it looks at several options before it commits to one.</p>
                        </div>

                        <ol className="mcp-steps">
                            {STEPS.map((step) => (
                                <li key={step.title}>
                                    <h3>
                                        <Inline text={step.title} />
                                    </h3>
                                    <p>
                                        <Inline text={step.text} />
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section className="section mcp-alt" id="limits" aria-labelledby="mcp-limits-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Know the edges</span>
                            <h2 id="mcp-limits-title">Honest limits</h2>
                            <p>This is a library of buildable references, not a catalogue of shipped products. Use it with that in mind.</p>
                        </div>

                        <ul className="mcp-limits">
                            {LIMITS.map((limit) => (
                                <li key={limit}>
                                    <Inline text={limit} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="section faq" id="faq" aria-labelledby="mcp-faq-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Before you connect</span>
                            <h2 id="mcp-faq-title">Frequently asked questions</h2>
                        </div>

                        <div className="mcp-faq">
                            {FAQ.map(({ question, answer }) => (
                                <details className="mcp-faq-item" name="mcp-faq" key={question}>
                                    <summary>
                                        {question}
                                        <b aria-hidden="true">+</b>
                                    </summary>
                                    <p>
                                        <Inline text={answer} />
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="final-cta" id="get-started" aria-labelledby="mcp-cta-title">
                    <div className="final-cta-inner container">
                        <h2 id="mcp-cta-title">Give your agent a library to search.</h2>
                        <p>Add the endpoint once. Then ask for a screen, a flow or a section, and install the one you pick.</p>

                        <div className="final-cta-command">
                            <span id="mcp-cta-label">Remote endpoint</span>
                            <div className="command" role="group" aria-labelledby="mcp-cta-label">
                                <code>{MCP_URL}</code>
                                <CopyButton value={MCP_URL}>Copy</CopyButton>
                            </div>
                        </div>

                        <div className="final-cta-actions">
                            <a className="button light-button button-xl" href="/docs/mcp">
                                Read the MCP docs
                            </a>
                            <a className="button outline-button button-xl" href="#setup">
                                Client setup
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <div className="footer-main container">
                    <div>
                        <a className="brand inverse" href="/">
                            <BrandMark />
                            <span>Proper UI</span>
                        </a>
                        <p>The open-source React design system for AI coding agents.</p>
                    </div>
                    <nav aria-label="Footer navigation">
                        <div>
                            <strong>Explore</strong>
                            <a href="/components">Components</a>
                            <a href="/#examples">Examples</a>
                            <a href="/docs/agents">For AI agents</a>
                            <a href="/docs/mcp">MCP reference</a>
                            <a href="/docs">Documentation</a>
                        </div>
                        <div>
                            <strong>Project</strong>
                            <a href="https://github.com/properui/properui" target="_blank" rel="noreferrer">
                                GitHub
                            </a>
                            <a href="https://www.npmjs.com/package/@properui/ui" target="_blank" rel="noreferrer">
                                npm
                            </a>
                            <a href="https://github.com/properui/properui/blob/main/LICENSE" target="_blank" rel="noreferrer">
                                MIT license
                            </a>
                            <a href="/llms.txt">llms.txt</a>
                        </div>
                    </nav>
                </div>
                <div className="footer-bottom container">
                    <span>© 2026 Proper UI</span>
                    <span>Built in public by Ayman Shabaro.</span>
                </div>
            </footer>
        </div>
    );
}
