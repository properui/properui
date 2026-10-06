import type { Metadata } from "next";
import { BrandMark } from "~/components/landing/brand-mark";
import "~/components/landing/landing-animations.css";
import "~/components/landing/landing-content.css";
import "~/components/landing/landing-proof.css";
import "~/components/landing/landing-setup.css";
import "~/components/landing/landing.css";
import { AgentSetup } from "~/components/landing/sections/agent-setup";
import { Comparison } from "~/components/landing/sections/comparison";
import { Consistency } from "~/components/landing/sections/consistency";
import { ExampleShowcase } from "~/components/landing/sections/example-showcase";
import { Faq } from "~/components/landing/sections/faq";
import { FinalCta } from "~/components/landing/sections/final-cta";
import { Hero } from "~/components/landing/sections/hero";
import { McpCallout } from "~/components/landing/sections/mcp-callout";
import { ProofStrip } from "~/components/landing/sections/proof-strip";
import { Trust } from "~/components/landing/sections/trust";
import { Workflow } from "~/components/landing/sections/workflow";
import { SITE_NAME } from "~/lib/site";

const TITLE = "Proper UI: Your AI stops inventing UI. It installs real components.";
const DESCRIPTION =
    "The design system for AI coding agents. Claude Code, Codex, Cursor, Lovable and any MCP client search Proper UI's registry and install real, axe-tested React components, with tokens, HTML components and custom elements for Vue, Angular and plain HTML.";

/** Canonical origin for the marketing site, which is not the docs origin in `~/lib/site`. */
const CANONICAL = "https://properui.dev/";

export const metadata: Metadata = {
    // Set here rather than in the shared layout: this route is the only one that lives on the
    // marketing origin, so it is the only one whose social-image URLs resolve against it.
    metadataBase: new URL(CANONICAL),
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    icons: { icon: "/favicon.svg" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/** JSON-LD SoftwareSourceCode block; every field is a real, verified fact about this repository. */
const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "Proper UI",
    description: DESCRIPTION,
    url: "https://properui.dev/",
    codeRepository: "https://github.com/properui/properui",
    programmingLanguage: ["TypeScript", "TSX", "CSS"],
    runtimePlatform: "React 19",
    license: "https://github.com/properui/properui/blob/main/LICENSE",
};

/**
 * The marketing landing page, rebuilt from `docs/spec/landing-variants/variant-b.html` (the
 * owner-chosen design) per `docs/spec/landing-variants/improvement-brief.md`.
 *
 * The generic CSS this markup shares with every section (buttons, container, header, footer,
 * command rows, and so on) lives in `~/components/landing/landing.css`, scoped under the
 * `.pui-landing` class below so none of it leaks into the rest of the docs site: see that file's
 * header comment for exactly how each global selector (`:root`, `*`, `html`, `body`, `a`, and so
 * on) was rewritten. The page's colours are fixed light (not theme-aware): every rule sets its
 * own hardcoded color/background rather than reading the docs' semantic tokens, so the root
 * `ThemeProvider`'s dark mode cannot partially apply to it.
 */
export default function LandingPage() {
    return (
        <div className="pui-landing">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

            <header className="site-header">
                <div className="header-inner container">
                    <a className="brand" href="#top" aria-label="Proper UI home">
                        <BrandMark />
                        <span>Proper UI</span>
                    </a>

                    <nav className="main-nav" aria-label="Main navigation">
                        <a href="/components">Components</a>
                        <a href="#examples">Examples</a>
                        <a href="#setup">For AI</a>
                        <a href="/docs">Documentation</a>
                        <a href="https://github.com/properui/properui" target="_blank" rel="noreferrer">
                            GitHub
                        </a>
                    </nav>

                    <div className="header-actions">
                        <a className="button button-primary" href="#setup">
                            Get started
                        </a>
                    </div>
                </div>
            </header>

            <main id="top">
                <Hero />
                <ProofStrip />
                <Comparison />
                <ExampleShowcase />
                <Consistency />
                <Workflow />
                <AgentSetup />
                <McpCallout />
                <Trust />
                <Faq />
                <FinalCta />
            </main>

            <footer className="site-footer">
                <div className="footer-main container">
                    <div>
                        <a className="brand inverse" href="#top">
                            <BrandMark />
                            <span>Proper UI</span>
                        </a>
                        <p>The open-source React design system for AI coding agents.</p>
                    </div>
                    <nav aria-label="Footer navigation">
                        <div>
                            <strong>Explore</strong>
                            <a href="/components">Components</a>
                            <a href="#examples">Examples</a>
                            <a href="/docs/agents">For AI agents</a>
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
