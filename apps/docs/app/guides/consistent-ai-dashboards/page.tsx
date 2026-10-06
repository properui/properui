import type { Metadata } from "next";
import { MCP_URL } from "~/app/mcp/clients";
import { Inline } from "~/app/mcp/inline";
import { CopyButton } from "~/components/landing/copy-button";
import { ExampleFrame } from "~/components/landing/example-frame";
import { CommandRow, type FaqItem, FaqList, ForFooter, ForHeader, LimitsList, faqJsonLd } from "~/components/landing/for-shell";
import "~/components/landing/landing-for.css";
import "~/components/landing/landing-proof.css";
import "~/components/landing/landing.css";
import { PUBLISHED_GROUPS } from "~/components/landing/stats";
import { SITE_NAME } from "~/lib/site";

const TITLE = "Consistent AI-generated dashboards: fixing design drift";
const DESCRIPTION =
    "Why a second AI-generated screen never matches the first, and three fixes you can check: shared tokens, one component set, a rule the agent reads.";
const CANONICAL = "https://properui.dev/guides/consistent-ai-dashboards";

export const metadata: Metadata = {
    metadataBase: new URL("https://properui.dev/"),
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    icons: { icon: "/favicon.svg" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, siteName: SITE_NAME, type: "article" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const CAUSES = [
    {
        title: "No shared tokens",
        text: "Each screen picks its own colors, spacing and radius, so two screens made an hour apart use two slightly different grays and two different paddings.",
    },
    {
        title: "No component set",
        text: "With nothing to reuse, the agent writes buttons, tables and cards from memory on every prompt, and memory differs from prompt to prompt.",
    },
    {
        title: "No rule the agent follows",
        text: "Nothing in the repository says what to do instead, so every prompt starts from the agent's defaults, not from your product.",
    },
];

const RULES = [
    "React Aria props, not DOM props: `onPress` not `onClick`, `isDisabled` not `disabled`.",
    "Semantic tokens only: `bg-primary`, `text-tertiary`, never `bg-purple-600` or `p-[13px]`.",
    "No `dark:` utilities: a `.dark-mode` class on an ancestor repoints every token, so a token-based component is already correct in both themes.",
    'Logical properties for anything directional: `ms-*` and `pe-*` not `ml-*` and `pr-*`, so `dir="rtl"` works.',
];

const FRAMES = [
    {
        label: "Dashboard",
        name: "dashboard-04",
        title: "Dashboard example, dashboard-04",
        src: "/preview/variant/app-examples/dashboards/dashboard-04",
        docs: "/components/dashboards/dashboard-04",
    },
    {
        label: "Settings page",
        name: "settings-13",
        title: "Billing settings example, settings-13",
        src: "/preview/variant/app-examples/settings-pages/settings-13",
        docs: "/components/settings-pages/settings-13",
    },
];

const DASHBOARD_PROMPT = "Build an analytics dashboard with KPI cards, a revenue chart and a recent activity table using Proper UI";

const LIMITS = [
    "The components are React 19 only. For Vue, Angular, Svelte, Astro or plain HTML you get the same tokens plus `@properui/html` and `@properui/elements`, a smaller curated set. See [Frameworks](/docs/frameworks).",
    "Examples ship with placeholder data and demo assets. Replace them before anything reaches a user.",
    "A rule is an instruction, not a guarantee. The agent can still ignore it, so run `npx @properui/cli@latest check`, which flags raw palette classes and arbitrary values, and review the result.",
    "Shared tokens keep colors, spacing and type aligned. They do not make a layout right for your users. That is still a design decision.",
    "Zero axe violations in the test suites is not the same as fully accessible. Automated checks miss things such as focus order and screen reader wording. See [Accessibility](/docs/accessibility).",
];

const FAQ: FaqItem[] = [
    {
        question: "Why do AI-generated screens drift apart?",
        answer: "Each prompt is generated on its own. Without shared tokens, a reusable component set and a written rule, the agent fills every gap from its defaults, and those defaults vary from one prompt to the next.",
    },
    {
        question: "Does this only work with Claude Code?",
        answer: "No. `agent init` also supports Codex, Cursor and Lovable, and the MCP server works in any client that supports MCP. See [For Claude Code](/for/claude-code) and the [MCP page](/mcp).",
    },
    {
        question: "Can I use my own brand colors?",
        answer: "Yes. Every visual decision is a CSS variable in `theme.css`. Editing the base palette re-brands every installed screen at once, including dark mode. See [Theming](/docs/theming).",
    },
    {
        question: "How do I catch drift that slips through?",
        answer: "Run `npx @properui/cli@latest check`. It flags raw palette classes and arbitrary values that should have been semantic tokens. Over the local MCP package the same check is the `check_tokens` tool.",
    },
];

const JSON_LD = [
    {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        url: CANONICAL,
        author: { "@type": "Person", name: "Ayman Shabaro" },
    },
    faqJsonLd(FAQ),
];

/**
 * `/guides/consistent-ai-dashboards`: the page for "consistent AI-generated dashboards" and
 * "AI code design drift". The three mechanisms each point at something in this repository: the
 * token file (`/docs/theming`), the component set (`/components`) and the Skill, whose four rules
 * are the ones listed under "Writing component code" in `AGENTS.md`.
 */
export default function ConsistentAiDashboardsPage() {
    return (
        <div className="pui-landing">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

            <ForHeader ctaHref="#try" ctaLabel="Try it" />

            <main id="top">
                <section className="hero for-hero" aria-labelledby="guide-title">
                    <div className="hero-grid" aria-hidden="true" />
                    <div className="hero-glow" aria-hidden="true" />
                    <div className="hero-copy container">
                        <span className="eyebrow">Guide</span>
                        <h1 id="guide-title">How to keep AI-generated dashboards consistent.</h1>
                        <p>
                            The second screen your agent builds rarely matches the first. Here is why it happens and three changes that stop it, each one
                            something you can open and check in this repository.
                        </p>
                        <div className="hero-actions">
                            <a className="button button-primary button-lg" href="#fix">
                                See the fix
                            </a>
                            <a className="button button-secondary button-lg" href="#try">
                                Try it
                            </a>
                        </div>
                    </div>
                </section>

                <section className="section" id="problem" aria-labelledby="guide-problem-title">
                    <div className="for-prose container">
                        <div className="section-heading">
                            <span className="eyebrow">The problem</span>
                            <h2 id="guide-problem-title">The second screen never matches the first</h2>
                        </div>
                        <p>
                            Ask an AI coding agent for an analytics dashboard, then ask for a settings page. Both work, and they do not look like the same
                            product: the buttons have different radii, the grays differ by a shade, the spacing follows a different rhythm. Nothing is broken.
                            Each screen was generated on its own, and nothing told the agent to reuse what the first one decided. The result is design drift,
                            and it grows with every screen.
                        </p>

                        <h3 className="for-subhead">Why it happens</h3>
                        <ul className="for-cards for-cards-3">
                            {CAUSES.map((cause) => (
                                <li className="for-card" key={cause.title}>
                                    <h4>{cause.title}</h4>
                                    <p>{cause.text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="section for-alt" id="fix" aria-labelledby="guide-fix-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">The fix</span>
                            <h2 id="guide-fix-title">Three mechanisms, one per cause</h2>
                            <p>Each one removes a cause of drift. Together they give the agent something to reuse and something to obey.</p>
                        </div>

                        <div className="for-mech">
                            <h3>
                                <span className="for-num" aria-hidden="true">
                                    1
                                </span>
                                One token file
                            </h3>
                            <p>
                                Color, spacing, radius, shadow and type scale are CSS variables defined once in <code>theme.css</code>. Components read semantic
                                tokens such as <code>bg-primary</code> and <code>text-tertiary</code> and never hard-code a value, so editing the file changes
                                every screen. See <a href="/docs/theming">Theming</a>.
                            </p>
                            <div className="for-frames">
                                {FRAMES.map((frame) => (
                                    <div className="for-frame" key={frame.name}>
                                        <h4>{frame.label}</h4>
                                        <ExampleFrame src={frame.src} title={frame.title} openHref={frame.docs} openLabel={`Open ${frame.name}`} height={400} />
                                    </div>
                                ))}
                            </div>
                            <p className="for-caption">
                                A dashboard and a settings page, rendered live. They are different screens that share one token file, so their colors, type and
                                corner radius change together.
                            </p>
                        </div>

                        <div className="for-mech">
                            <h3>
                                <span className="for-num" aria-hidden="true">
                                    2
                                </span>
                                One component set
                            </h3>
                            <p>
                                The agent installs buttons, tables, cards and charts from the same registry instead of rewriting them. There are{" "}
                                {PUBLISHED_GROUPS} published component groups, built on React Aria Components, and the full-page examples above are assembled
                                from them. Browse them in <a href="/components">Components</a>.
                            </p>
                        </div>

                        <div className="for-mech">
                            <h3>
                                <span className="for-num" aria-hidden="true">
                                    3
                                </span>
                                A rule the agent reads
                            </h3>
                            <p>
                                The Proper UI Skill is a file in your repository that the agent reads before it writes UI. Its component rules, the same ones
                                listed under &ldquo;Writing component code&rdquo; in this repository&apos;s <code>AGENTS.md</code>, are:
                            </p>
                            <ul className="for-list">
                                {RULES.map((rule) => (
                                    <li key={rule}>
                                        <Inline text={rule} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="section" id="try" aria-labelledby="guide-try-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Try it</span>
                            <h2 id="guide-try-title">Set up, then ask for a dashboard</h2>
                            <p>Two commands, then one prompt. Run the first in your project.</p>
                        </div>

                        <div className="for-try">
                            <CommandRow
                                id="guide-cmd-skill"
                                label="1. Install the Skill (Claude Code)"
                                value="npx @properui/cli@latest agent init --client claude"
                            />
                            <CommandRow
                                id="guide-cmd-mcp"
                                label="2. Add the MCP server (Claude Code, remote)"
                                value={`claude mcp add --transport http properui ${MCP_URL}`}
                            />
                            <p className="for-after">
                                Using Codex, Cursor or another client? Change <code>--client</code> to <code>codex</code>, <code>cursor</code> or{" "}
                                <code>all</code>, and find the MCP setup for your client on the <a href="/mcp#setup">MCP page</a>.
                            </p>

                            <div className="for-prompt">
                                <span>Prompt</span>
                                <p>{DASHBOARD_PROMPT}</p>
                                <CopyButton value={DASHBOARD_PROMPT}>Copy prompt</CopyButton>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section for-alt" id="limits" aria-labelledby="guide-limits-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Know the edges</span>
                            <h2 id="guide-limits-title">Limits, plainly</h2>
                        </div>
                        <LimitsList items={LIMITS} />
                    </div>
                </section>

                <section className="section" id="faq" aria-labelledby="guide-faq-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Questions</span>
                            <h2 id="guide-faq-title">Frequently asked questions</h2>
                        </div>
                        <FaqList items={FAQ} name="consistent-dashboards-faq" />
                    </div>
                </section>

                <section className="final-cta" id="get-started" aria-labelledby="guide-cta-title">
                    <div className="final-cta-inner container">
                        <h2 id="guide-cta-title">Give the agent something to reuse.</h2>
                        <p>Browse the components, then read how tokens work.</p>
                        <div className="final-cta-actions">
                            <a className="button light-button button-xl" href="/components">
                                Browse components
                            </a>
                            <a className="button outline-button button-xl" href="/docs/theming">
                                Read about theming
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <ForFooter />
        </div>
    );
}
