import { CopyButton } from "~/components/landing/copy-button";

type Way = {
    title: string;
    text: string;
    /** Commands shown as copyable rows; empty when the card is a plain description. */
    commands: Array<{ label: string; value: string }>;
    link: { href: string; label: string };
};

const WAYS: Way[] = [
    {
        title: "On the site",
        text: "Browse screens, flows and sections, open any of them in a live preview, and copy the add command for the one you want.",
        commands: [],
        link: { href: "/components", label: "Browse the library" },
    },
    {
        title: "Through the MCP",
        text: "Add one URL to Claude, ChatGPT, Codex, Cursor or Gemini CLI and your agent searches the library itself. Prefer to run it locally? Use the stdio package.",
        commands: [
            { label: "Remote URL", value: "https://properui.dev/api/mcp" },
            { label: "Local (stdio)", value: "npx -y @properui/mcp" },
        ],
        link: { href: "/mcp", label: "See the MCP setup" },
    },
    {
        title: "Through the CLI",
        text: "Install by name, search the registry, or ask which framework and aliases your project already uses.",
        commands: [
            { label: "Install", value: "npx @properui/cli@latest add <name>" },
            { label: "Project facts", value: "npx @properui/cli@latest info --json" },
        ],
        link: { href: "/docs/cli", label: "Read the CLI docs" },
    },
    {
        title: "Through the Skill",
        text: "A durable skill or rule that tells your agent to search Proper UI before it writes UI code.",
        commands: [
            { label: "Project setup", value: "npx @properui/cli@latest agent init" },
            { label: "Or from skills.sh", value: "npx skills add properui/properui" },
        ],
        link: { href: "/docs/agents", label: "Read the agent guide" },
    },
];

/** Landing section "ways" (id `ways`): the four ways to use the library. Commands match `tool-setup.ts` and the MCP page. */
export function Ways() {
    return (
        <section className="section ways" id="ways" aria-labelledby="ways-title">
            <div className="container">
                <div className="section-heading">
                    <span className="eyebrow">Ways to use it</span>
                    <h2 id="ways-title">Browse it, search it from your agent, or install it directly.</h2>
                </div>

                <div className="ways-grid">
                    {WAYS.map((way) => (
                        <article className="ways-card" key={way.title}>
                            <h3>{way.title}</h3>
                            <p>{way.text}</p>
                            {way.commands.map((command) => (
                                <div className="ways-command" key={command.value}>
                                    <span>{command.label}</span>
                                    <div className="command">
                                        <code>{command.value}</code>
                                        <CopyButton value={command.value}>Copy</CopyButton>
                                    </div>
                                </div>
                            ))}
                            <a className="ways-link" href={way.link.href}>
                                {way.link.label} <span aria-hidden="true">&rarr;</span>
                            </a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
