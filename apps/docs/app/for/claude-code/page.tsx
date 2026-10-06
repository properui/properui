import type { Metadata } from "next";
import { MCP_STDIO, MCP_URL } from "~/app/mcp/clients";
import { Inline } from "~/app/mcp/inline";
import { CopyButton } from "~/components/landing/copy-button";
import { ExampleFrame } from "~/components/landing/example-frame";
import { CommandRow, type FaqItem, FaqList, ForFooter, ForHeader, LimitsList, faqJsonLd } from "~/components/landing/for-shell";
import { HeroVideo } from "~/components/landing/hero-video";
import "~/components/landing/landing-animations.css";
import "~/components/landing/landing-for.css";
import "~/components/landing/landing-proof.css";
import "~/components/landing/landing-session.css";
import "~/components/landing/landing.css";
import { COMPOSABLE_VARIANTS, FLOWS, PAGE_EXAMPLES, PUBLISHED_GROUPS } from "~/components/landing/stats";
import { SITE_NAME } from "~/lib/site";

const TITLE = "Proper UI for Claude Code: a UI library and MCP";
const DESCRIPTION = "A Skill, an MCP server and a CLI that let Claude Code search real web-app screens and install the source. Free, MIT, no account.";
const CANONICAL = "https://properui.dev/for/claude-code";
const SECTION_VARIANTS = COMPOSABLE_VARIANTS - PAGE_EXAMPLES;

export const metadata: Metadata = {
    metadataBase: new URL("https://properui.dev/"),
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    icons: { icon: "/favicon.svg" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const GETS = [
    {
        title: "The Skill",
        text: "A `SKILL.md` in `.claude/skills/properui` and a short pointer in `CLAUDE.md`. It tells Claude Code to check the project with `info --json`, search the registry before writing markup, install with the CLI, and keep the token and accessibility rules.",
        tag: "agent init",
    },
    {
        title: "The MCP server",
        text: "Four search tools return ranked results with thumbnails, docs links and what each entry is built from. A search that finds nothing says so.",
        tag: "search_screens, search_sections, search_flows, search_components",
    },
    {
        title: "Compare and plan",
        text: "`compare_screens` sets two to five candidates side by side. `get_install_plan` lists the files, the npm packages and the exact CLI command, before anything is written.",
        tag: "compare_screens, get_install_plan",
    },
    {
        title: "The CLI",
        text: "`add` copies real source into the project, resolves registry dependencies and rewrites imports to your alias. Claude Code runs it through its own shell tool, so each write goes through the approval Claude Code already asks for.",
        tag: "add",
    },
];

const SESSION_STEPS = [
    "Reads the Skill in the project, then checks the project's Proper UI setup. The first step in the Skill is `npx @properui/cli@latest info --json`.",
    "Searches the registry for billing, settings and confirm dialog entries.",
    "Installs the `settings-13` example and the `confirm-dialog` component with `add`, then reads the installed source.",
    "Writes the billing route from them, builds the app and runs the token check. The recording ends on the finished page and its confirmation dialog.",
];

const SESSION_PROMPT =
    "Build a billing settings page at /settings/billing: current plan with usage, payment method on file, an invoice history table, and a cancel-subscription confirmation dialog. Use Proper UI components only, keep it production quality, then run next build.";

const EXAMPLES = [
    {
        label: "Settings page",
        name: "settings-13",
        title: "Billing settings example, settings-13",
        src: "/preview/variant/app-examples/settings-pages/settings-13",
        docs: "/components/settings-pages/settings-13",
    },
    {
        label: "Dashboard",
        name: "dashboard-04",
        title: "Dashboard example, dashboard-04",
        src: "/preview/variant/app-examples/dashboards/dashboard-04",
        docs: "/components/dashboards/dashboard-04",
    },
];

const LIMITS = [
    "The components are React 19 only. For Vue, Angular, Svelte, Astro or plain HTML you get the tokens, `@properui/html` and `@properui/elements`, a smaller curated set. See [Frameworks](/docs/frameworks).",
    "Examples ship with placeholder data and demo assets. Replace them before anything reaches a user.",
    "The MCP over HTTP cannot write files, because it cannot see your project. Claude Code runs the CLI, or you use the local package, whose `add_component` tool installs for you.",
    "Zero axe violations in the test suites is not the same as fully accessible. Automated checks miss things such as focus order and screen reader wording. See [Accessibility](/docs/accessibility).",
];

const FAQ: FaqItem[] = [
    {
        question: "Do I need an account or an API key?",
        answer: "No. There is no sign-in and no key. Proper UI is MIT licensed, the MCP is part of it, and there is no paid tier.",
    },
    {
        question: "What does `agent init --client claude` change in my repository?",
        answer: "It writes `.claude/skills/properui/SKILL.md`, appends a short pointer to `CLAUDE.md` between marker comments (the rest of the file is not touched, and running it again updates that block in place), and merges a `properui` entry into `.mcp.json`. An existing `properui` entry in `.mcp.json` is left alone unless you pass `--overwrite`. Pass `--no-mcp` to skip the MCP registration.",
    },
    {
        question: "Remote or local MCP in Claude Code?",
        answer: "The remote URL needs nothing installed and can search, inspect and plan. The local package, `npx -y @properui/mcp`, runs inside your project, so it also has `add_component`, `get_project_info` and `check_tokens`. The `.mcp.json` entry that `agent init` writes is the local one. Register the remote one instead when you do not want a local process.",
    },
    {
        question: "Does Claude Code write files through the MCP?",
        answer: "Only with the local package. Over HTTP the server searches, inspects and plans, and Claude Code runs `npx @properui/cli@latest add <name>` itself, so each write goes through the approval Claude Code already asks for.",
    },
    {
        question: "Does it work with other agents?",
        answer: "Yes. `agent init` also takes `--client codex`, `--client cursor` and `--client lovable`, or `--client all`. The MCP works in any client that supports MCP; the [MCP page](/mcp) lists setup for each.",
    },
];

const JSON_LD = [
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: TITLE,
        description: DESCRIPTION,
        url: CANONICAL,
    },
    faqJsonLd(FAQ),
];

/**
 * `/for/claude-code`: the page for "UI MCP for Claude Code" and "Claude Code design system".
 * Every command is verified against `app/mcp/clients.ts` and `components/landing/tool-setup.ts`;
 * the session bullets restate only what `scripts/record-demos.ts` and the recorded transcript show.
 */
export default function ForClaudeCodePage() {
    return (
        <div className="pui-landing">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

            <ForHeader ctaHref="#setup" ctaLabel="Set up" />

            <main id="top">
                <section className="hero for-hero" aria-labelledby="for-title">
                    <div className="hero-grid" aria-hidden="true" />
                    <div className="hero-glow" aria-hidden="true" />
                    <div className="hero-copy container">
                        <span className="eyebrow">For Claude Code</span>
                        <h1 id="for-title">A UI library and MCP built for Claude Code.</h1>
                        <p>
                            Claude Code gets a Skill that says how to build, an MCP server that searches {PAGE_EXAMPLES} screens, {SECTION_VARIANTS} sections,{" "}
                            {FLOWS} flows and {PUBLISHED_GROUPS} component groups, and a CLI that installs the source it picks. Free, MIT licensed, no account.
                        </p>
                        <div className="hero-actions">
                            <a className="button button-primary button-lg" href="#setup">
                                Set up in two commands
                            </a>
                            <a className="button button-secondary button-lg" href="/mcp">
                                About the MCP
                            </a>
                        </div>
                    </div>
                </section>

                <section className="section" id="gets" aria-labelledby="for-gets-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">What Claude Code gets</span>
                            <h2 id="for-gets-title">Four pieces that work together</h2>
                            <p>The Skill sets the rules, the MCP finds the right screen, and the CLI installs it.</p>
                        </div>
                        <ul className="for-cards">
                            {GETS.map((item) => (
                                <li className="for-card" key={item.title}>
                                    <h3>{item.title}</h3>
                                    <p>
                                        <Inline text={item.text} />
                                    </p>
                                    <code>{item.tag}</code>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="section for-alt" id="setup" aria-labelledby="for-setup-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Setup</span>
                            <h2 id="for-setup-title">Set up in two commands</h2>
                            <p>Run the first in your project. The second registers the MCP server with Claude Code.</p>
                        </div>

                        <ol className="for-steps">
                            <li>
                                <h3>Install the Skill</h3>
                                <p>
                                    Writes <code>.claude/skills/properui/SKILL.md</code> and appends a pointer to <code>CLAUDE.md</code>. It also merges the
                                    local MCP server into <code>.mcp.json</code>; add <code>--no-mcp</code> to skip that.
                                </p>
                                <CommandRow id="for-cmd-skill" label="Run in your project" value="npx @properui/cli@latest agent init --client claude" />
                            </li>
                            <li>
                                <h3>Add the MCP server</h3>
                                <p>
                                    The remote endpoint needs nothing installed. Add <code>--scope user</code> to make it available in every project. Then run{" "}
                                    <code>/mcp</code> inside Claude Code to confirm <code>properui</code> shows as connected.
                                </p>
                                <CommandRow id="for-cmd-remote" label="Remote (HTTP)" value={`claude mcp add --transport http properui ${MCP_URL}`} />
                                <CommandRow
                                    id="for-cmd-stdio"
                                    label="Or local (stdio), so add_component can install for you"
                                    value={`claude mcp add properui -- ${MCP_STDIO}`}
                                />
                            </li>
                        </ol>
                        <p className="for-after">
                            Prefer another client? See <a href="/mcp#setup">setup for Codex, Cursor, ChatGPT and more</a>.
                        </p>
                    </div>
                </section>

                <section className="section session" id="session" aria-labelledby="for-session-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">What a session looks like</span>
                            <h2 id="for-session-title">A real recording, not a mockup</h2>
                            <p>One prompt in Claude Code, recorded against the actual site and the app Claude Code built.</p>
                        </div>

                        <div className="session-frame">
                            <HeroVideo />
                        </div>

                        <div className="for-session">
                            <div>
                                <h3>What happened in it</h3>
                                <ol className="for-list">
                                    {SESSION_STEPS.map((step) => (
                                        <li key={step}>
                                            <Inline text={step} />
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <div>
                                <h3>The prompt</h3>
                                <div className="for-prompt">
                                    <p>{SESSION_PROMPT}</p>
                                    <CopyButton value={SESSION_PROMPT}>Copy prompt</CopyButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section for-alt" id="examples" aria-labelledby="for-examples-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">What you get</span>
                            <h2 id="for-examples-title">Real screens, installed as source</h2>
                            <p>
                                Both frames below are live pages rendered from the registry, not screenshots. Claude Code installs one with <code>add</code> and
                                edits it like any other file in your repository.
                            </p>
                        </div>

                        <div className="for-frames">
                            {EXAMPLES.map((example) => (
                                <div className="for-frame" key={example.name}>
                                    <h3>{example.label}</h3>
                                    <ExampleFrame
                                        src={example.src}
                                        title={example.title}
                                        openHref={example.docs}
                                        openLabel={`Open ${example.name}`}
                                        height={440}
                                    />
                                    <CommandRow id={`for-add-${example.name}`} label="Install" value={`npx @properui/cli@latest add ${example.name}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section" id="limits" aria-labelledby="for-limits-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Know the edges</span>
                            <h2 id="for-limits-title">Limits, plainly</h2>
                        </div>
                        <LimitsList items={LIMITS} />
                    </div>
                </section>

                <section className="section for-alt" id="faq" aria-labelledby="for-faq-title">
                    <div className="container">
                        <div className="section-heading">
                            <span className="eyebrow">Questions</span>
                            <h2 id="for-faq-title">Frequently asked questions</h2>
                        </div>
                        <FaqList items={FAQ} name="for-claude-code-faq" />
                    </div>
                </section>

                <section className="final-cta" id="get-started" aria-labelledby="for-cta-title">
                    <div className="final-cta-inner container">
                        <h2 id="for-cta-title">Give Claude Code a library to search.</h2>
                        <p>Add the Skill and the MCP once. Then ask for a screen and install the one you pick.</p>
                        <div className="final-cta-actions">
                            <a className="button light-button button-xl" href="/mcp">
                                See the MCP
                            </a>
                            <a className="button outline-button button-xl" href="/docs/agents">
                                Read the agent docs
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <ForFooter />
        </div>
    );
}
