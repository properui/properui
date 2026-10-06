/**
 * The ten questions from the improvement brief (Priority 9), in order, with answers verified
 * against the repository (README.md, agents.mdx, registry-metadata.mdx, adopting.mdx, cli.mdx,
 * skills/properui/SKILL.md, packages/cli/src/commands/agent.ts, packages/cli/src/registry.ts,
 * LICENSE). Every answer was directly supported by the repository; none required guessing.
 */
const QUESTIONS: Array<{ question: string; answer: React.ReactNode }> = [
    {
        question: "How is this different from a library of screenshots?",
        answer: (
            <>
                The references are components with source, not pictures. Your agent installs the one it picks, with its tokens and accessibility behaviour,
                instead of imitating an image and guessing the markup.
            </>
        ),
    },
    {
        question: "Where do the screens come from?",
        answer: (
            <>They are built in this repository from one design system. Demo data and assets are placeholders, and nothing is scraped from other products.</>
        ),
    },
    {
        question: "Why does AI need a UI library designed for agents?",
        answer: (
            <>
                Without one, an agent invents markup, class names and layout decisions from memory on every prompt, so screens drift from each other. Proper UI
                gives it a registry it can search and real component source it can install, instead of guessing an API.
            </>
        ),
    },
    {
        question: "How is Proper UI different from shadcn/ui?",
        answer: (
            <>
                The install workflow is shadcn-style: the CLI copies real <code>.tsx</code> source into your project rather than adding a runtime dependency,
                and Proper UI also publishes a shadcn-compatible registry namespace so <code>npx shadcn add @properui/&lt;name&gt;</code> works. The components
                themselves differ: they are built on React Aria Components rather than Radix, styled with Tailwind CSS v4 semantic tokens, and the agent surface
                is a dedicated CLI (<code>info</code>, <code>search</code>, <code>add</code>) plus a Skill and <code>/llms.txt</code>, not just component files.
            </>
        ),
    },
    {
        question: "Does the agent use real components or generate approximations?",
        answer: (
            <>
                Real components. The CLI copies actual source files from the registry into your project; nothing is generated from a text description. The
                Proper UI Skill tells an agent to search the registry and install with the CLI before writing any markup by hand.
            </>
        ),
    },
    {
        question: "How does Proper UI keep screens consistent?",
        answer: (
            <>
                Colors, spacing and other values live in one shared semantic token file (<code>packages/ui/src/styles/theme.css</code>) rather than being
                hard-coded into each component. Every screen that reuses the same installed components inherits the same tokens and the same Skill rules
                automatically, across every screen in your product.
            </>
        ),
    },
    {
        question: "Can I use Proper UI in an existing Tailwind project?",
        answer: (
            <>
                Yes, but check for collisions first: Proper UI declares <code>bg-*</code>, <code>text-*</code>, <code>border-*</code>, <code>ring-*</code> and{" "}
                <code>outline-*</code> primary/secondary utilities that can silently win over (or lose to) an existing theme's utilities of the same name. The{" "}
                <a href="/docs/adopting">adopting guide</a> documents which side wins for each collision type and how to migrate safely.
            </>
        ),
    },
    {
        question: "What does the agent setup command change in my repository?",
        answer: (
            <>
                Exactly what each tool's setup card lists: a <code>SKILL.md</code> or rule file, a short pointer or marked block appended to{" "}
                <code>CLAUDE.md</code> or <code>AGENTS.md</code> where applicable, and a <code>properui</code> entry for the MCP server in{" "}
                <code>.mcp.json</code> or <code>.cursor/mcp.json</code>, merged into any servers already there (<code>--no-mcp</code> skips it). Nothing else in
                the project is modified, and re-running the command only updates those sections in place.
            </>
        ),
    },
    {
        question: "Can I customize the installed components?",
        answer: (
            <>
                Yes. The CLI copies real <code>.tsx</code> source into your project, so you edit it like any other file you own. Run{" "}
                <code>npx @properui/cli@latest diff</code> to see how an installed component has drifted from the current registry version before deciding
                whether to update it.
            </>
        ),
    },
    {
        question: "Does it work with Claude Code, Codex, Cursor and Lovable?",
        answer: (
            <>
                Claude Code, Codex and Cursor each get a one-command setup that writes a skill or rule file directly into the project, and any assistant that
                speaks MCP can connect to <code>npx -y @properui/mcp</code> to search the registry and install components as tools. Lovable runs in the browser
                with no access to local files, so it uses the same instructions pasted into its Knowledge panel instead. v0 and Bolt have no{" "}
                <code>agent init</code> for them, but can read Proper UI's documentation and <code>/llms.txt</code> directly.
            </>
        ),
    },
    {
        question: "Can I use Proper UI without React?",
        answer: (
            <>
                Partly. The full library is React. Vue, Angular, Svelte, Astro and plain-HTML projects get the same tokens through <code>@properui/tokens</code>{" "}
                (including a prebuilt stylesheet you can link from a CDN), about twenty components as HTML classes with small vanilla-JS behaviours in{" "}
                <code>@properui/html</code>, and matching custom elements such as <code>&lt;pui-button&gt;</code> in <code>@properui/elements</code>. Data
                tables, charts, date pickers, the marketing sections and the page examples stay React-only; the <a href="/docs/frameworks">frameworks page</a>{" "}
                lists exactly what each platform gets.
            </>
        ),
    },
    {
        question: "Can I use Proper UI in commercial applications?",
        answer: (
            <>Yes. Proper UI is MIT licensed, including every base component, application screen and marketing section. There is no account and no paid tier.</>
        ),
    },
    {
        question: "Is any private application code sent to Proper UI?",
        answer: (
            <>
                No. The CLI only fetches registry JSON over HTTPS, from <code>properui.dev</code> or a local directory you point it at, and has no telemetry. It
                does not read or transmit your application code, and the documentation site itself is static.
            </>
        ),
    },
];

/** Landing section "faq" (brief Priority 9): developer-objection FAQ as a native accordion. */
export function Faq() {
    return (
        <section className="section faq" id="faq" aria-labelledby="faq-title">
            <div className="container">
                <div className="section-heading">
                    <span className="eyebrow">Before you start</span>
                    <h2 id="faq-title">Frequently asked questions</h2>
                </div>

                <div className="faq-list">
                    {QUESTIONS.map(({ question, answer }) => (
                        // `name` groups every entry so opening one closes the others (native browser behaviour,
                        // no script required); browsers without support simply allow more than one open at once.
                        <details className="faq-item" name="faq-accordion" key={question}>
                            <summary>
                                {question}
                                <b aria-hidden="true">+</b>
                            </summary>
                            <p>{answer}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
