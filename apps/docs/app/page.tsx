import type { Metadata } from "next";
import { BrandMark } from "~/components/landing/brand-mark";
import "~/components/landing/landing-animations.css";
import "~/components/landing/landing-content.css";
import "~/components/landing/landing-library.css";
import "~/components/landing/landing-proof.css";
import "~/components/landing/landing-session.css";
import "~/components/landing/landing-setup.css";
import "~/components/landing/landing.css";
import { LibraryLightboxProvider } from "~/components/landing/library-lightbox";
import { AgentSetup } from "~/components/landing/sections/agent-setup";
import { Comparison } from "~/components/landing/sections/comparison";
import { Consistency } from "~/components/landing/sections/consistency";
import { Faq } from "~/components/landing/sections/faq";
import { FinalCta } from "~/components/landing/sections/final-cta";
import { FlowsShowcase } from "~/components/landing/sections/flows-showcase";
import { Hero } from "~/components/landing/sections/hero";
import { ProofStrip } from "~/components/landing/sections/proof-strip";
import { Session } from "~/components/landing/sections/session";
import { Trust } from "~/components/landing/sections/trust";
import { Ways } from "~/components/landing/sections/ways";
import { Why } from "~/components/landing/sections/why";
import { SITE_NAME } from "~/lib/site";

const TITLE = "Proper UI: web-app design references your AI can install";
const DESCRIPTION =
    "Search real web-app screens, flows, sections and components from Claude Code, Cursor, Codex or ChatGPT, then install the source. Free and MIT.";

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
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: CANONICAL,
        siteName: SITE_NAME,
        type: "website",
        images: [{ url: `${CANONICAL}og.png`, width: 1200, height: 630, alt: "Proper UI: web-app design references your AI can install" }],
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [`${CANONICAL}og.png`] },
};

/** The four browsable collections, in the order the library presents them. Every route exists under `app/`. */
const COLLECTIONS = [
    { name: "Components", path: "/components" },
    { name: "Flows", path: "/flows" },
    { name: "Marketing sections", path: "/marketing" },
    { name: "Application UI", path: "/application-ui" },
];

/** JSON-LD: a SoftwareSourceCode block plus an ItemList of the four collections; every field is a real, verified fact about this repository. */
const JSON_LD = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareSourceCode",
        name: "Proper UI",
        description: DESCRIPTION,
        url: "https://properui.dev/",
        codeRepository: "https://github.com/properui/properui",
        programmingLanguage: ["TypeScript", "TSX", "CSS"],
        runtimePlatform: "React 19",
        license: "https://github.com/properui/properui/blob/main/LICENSE",
    },
    {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Proper UI collections",
        itemListElement: COLLECTIONS.map((collection, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: collection.name,
            url: `https://properui.dev${collection.path}`,
        })),
    },
];

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
                        <a href="/flows">Flows</a>
                        <a href="#ways">Ways to use it</a>
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
                <LibraryLightboxProvider>
                    <Hero />
                    <ProofStrip />
                    <FlowsShowcase />
                    <Why />
                    <Comparison />
                    <Consistency />
                    <Ways />
                    <AgentSetup />
                    <Session />
                    <Trust />
                    <Faq />
                    <FinalCta />
                </LibraryLightboxProvider>
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
                            <a href="/flows">Flows</a>
                            <a href="/for/claude-code">For Claude Code</a>
                            <a href="/guides/consistent-ai-dashboards">Consistent AI dashboards</a>
                            <a href="/compare/shadcn-ui">Proper UI vs shadcn/ui</a>
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
