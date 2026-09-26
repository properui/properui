import { HeroVideo } from "~/components/landing/hero-video";
import { AXE_SUITES, AXE_VIOLATIONS, PAGE_EXAMPLES, PUBLISHED_GROUPS } from "~/components/landing/stats";
import { ToolSelector } from "~/components/landing/tool-selector";

/**
 * Landing hero (brief Priority 1). The claim is deliberately checkable: "installs real
 * components" is literally what the CLI's `add` and the MCP server's `add_component` do, and
 * every number in the subhead and the microproof line is read from the built registry
 * (`~/components/landing/stats`), so the copy cannot drift from what ships. "Vue, Angular &
 * HTML" names the platforms the tokens, `@properui/html` and `@properui/elements` packages
 * serve; the React-only scope is spelled out on /docs/frameworks. The interactive tool selector
 * and setup preview live in `ToolSelector` (a client component) so the primary CTA can focus the
 * selector's checked radio.
 */
export function Hero() {
    return (
        <section className="hero" id="top-hero">
            <div className="hero-grid" aria-hidden="true" />
            <div className="hero-glow" aria-hidden="true" />
            <div className="hero-copy container">
                <span className="eyebrow">THE DESIGN SYSTEM FOR AI-BUILT PRODUCTS</span>
                <h1>Your AI stops inventing UI. It installs real components.</h1>
                <p>
                    Claude, Codex, Cursor, Lovable and any MCP client search {PUBLISHED_GROUPS} component groups and {PAGE_EXAMPLES} full pages, then install
                    the real source. Every component is axe-tested, built on your tokens, and consistent on every screen.
                </p>

                <ToolSelector
                    microproof={[
                        "React 19",
                        "Vue, Angular & HTML",
                        "MCP server",
                        `${AXE_SUITES} axe suites, ${AXE_VIOLATIONS} violations`,
                        "MIT licensed, no paid tier",
                    ]}
                />

                <div className="hero-video">
                    <p className="hero-video-caption">A real Claude Code session: one prompt, a production billing page, built from Proper UI components.</p>
                    <HeroVideo />
                </div>
            </div>
        </section>
    );
}
