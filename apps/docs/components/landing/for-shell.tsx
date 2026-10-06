import { Inline, plain } from "~/app/mcp/inline";
import { BrandMark } from "~/components/landing/brand-mark";
import { CopyButton } from "~/components/landing/copy-button";

/**
 * Shared pieces for the two search-landing pages, `/for/claude-code` and
 * `/guides/consistent-ai-dashboards`: the same header and footer as `/mcp`, a labelled command
 * row, the limits list, and the FAQ with its JSON-LD. Styles live in `landing-for.css` under the
 * `for-` prefix and rely on the generic classes in `landing.css`.
 */

export type FaqItem = { question: string; answer: string };

/** FAQPage structured data. Answers may use backticks for inline code; they are stripped for JSON-LD. */
export function faqJsonLd(items: FaqItem[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map(({ question, answer }) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: plain(answer) },
        })),
    };
}

export function ForHeader({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
    return (
        <header className="site-header">
            <div className="header-inner container">
                <a className="brand" href="/" aria-label="Proper UI home">
                    <BrandMark />
                    <span>Proper UI</span>
                </a>

                <nav className="main-nav" aria-label="Main navigation">
                    <a href="/components">Components</a>
                    <a href="/#flows">Flows</a>
                    <a href="/#setup">For AI</a>
                    <a href="/mcp">MCP</a>
                    <a href="/docs">Documentation</a>
                    <a href="https://github.com/properui/properui" target="_blank" rel="noreferrer">
                        GitHub
                    </a>
                </nav>

                <div className="header-actions">
                    <a className="button button-primary" href={ctaHref}>
                        {ctaLabel}
                    </a>
                </div>
            </div>
        </header>
    );
}

export function ForFooter() {
    return (
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
                        <a href="/#flows">Flows</a>
                        <a href="/for/claude-code">For Claude Code</a>
                        <a href="/guides/consistent-ai-dashboards">Consistent AI dashboards</a>
                        <a href="/compare/shadcn-ui">Proper UI vs shadcn/ui</a>
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
    );
}

/** One labelled, copyable command. `id` ties the visible label to the command group. */
export function CommandRow({ id, label, value }: { id: string; label: string; value: string }) {
    return (
        <div className="for-command">
            <span id={id}>{label}</span>
            <div className="command" role="group" aria-labelledby={id}>
                <code>{value}</code>
                <CopyButton value={value}>Copy</CopyButton>
            </div>
        </div>
    );
}

export function LimitsList({ items }: { items: string[] }) {
    return (
        <ul className="for-limits">
            {items.map((item) => (
                <li key={item}>
                    <Inline text={item} />
                </li>
            ))}
        </ul>
    );
}

export function FaqList({ items, name }: { items: FaqItem[]; name: string }) {
    return (
        <div className="for-faq">
            {items.map(({ question, answer }) => (
                <details className="for-faq-item" name={name} key={question}>
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
    );
}
