/**
 * Shared route list + capture settings for scripts/visual-baseline.ts and scripts/visual-check.ts.
 * Not the full 1,720-page surface `docs:shot --all` can cover — a curated ~25-route sample picked to
 * span the site's layers (docs, integrations, base components, application examples, marketing,
 * overview indexes) plus a handful of RTL passes on pages likely to expose a physical-property leak.
 */

export type ViewportName = "desktop" | "mobile";

/** Matches the viewport sizes requested for the baseline — independent of scripts/shot.ts's own 1600x1000. */
export const VIEWPORTS: Record<ViewportName, { width: number; height: number }> = {
    desktop: { width: 1280, height: 800 },
    mobile: { width: 390, height: 844 },
};

export type CaptureRoute = {
    /** Filesystem-safe id — also the baseline subdirectory name. */
    slug: string;
    /** URL path on the docs site. */
    route: string;
    /** What this route is standing in for, for humans reading the route list. */
    label: string;
    /** Also capture a light-theme, dir="rtl" pass of this route (kept to a handful, see quality.mdx). */
    rtl?: boolean;
};

export const ROUTES: CaptureRoute[] = [
    { slug: "home", route: "/", label: "Docs home" },
    { slug: "mcp", route: "/mcp", label: "MCP product page" },
    { slug: "flows", route: "/flows", label: "Flows index" },
    { slug: "docs-introduction", route: "/docs/introduction", label: "Docs: introduction" },
    { slug: "docs-quality", route: "/docs/quality", label: "Docs: quality page" },
    { slug: "docs-rtl", route: "/docs/rtl", label: "Docs: RTL support page" },
    { slug: "docs-installation", route: "/docs/installation", label: "Docs: installation" },
    { slug: "integrations-claude", route: "/integrations/claude", label: "Integrations: Claude Code" },
    { slug: "integrations-nextjs", route: "/integrations/nextjs", label: "Integrations: Next.js" },
    { slug: "components-index", route: "/components", label: "Base components: overview index" },
    { slug: "components-buttons", route: "/components/buttons", label: "Base component: buttons" },
    { slug: "components-badges", route: "/components/badges", label: "Base component: badges" },
    { slug: "components-avatars", route: "/components/avatars", label: "Base component: avatars" },
    { slug: "components-alerts", route: "/components/alerts", label: "Base component: alerts" },
    { slug: "components-dropdowns", route: "/components/dropdowns", label: "Base component: dropdowns" },
    { slug: "application-ui", route: "/application-ui", label: "Application UI: overview index" },
    { slug: "components-dashboards", route: "/components/dashboards", label: "Application: dashboard example (sidebar nav)", rtl: true },
    { slug: "components-dashboards-02", route: "/components/dashboards-02", label: "Application: dashboard example (header nav)" },
    { slug: "components-settings-pages", route: "/components/settings-pages", label: "Application: settings example (sidebar nav)" },
    { slug: "components-settings-pages-02", route: "/components/settings-pages-02", label: "Application: settings example (header nav)" },
    { slug: "components-sign-up-pages", route: "/components/sign-up-pages", label: "Application: sign-up page (form-heavy)", rtl: true },
    { slug: "components-informational-pages", route: "/components/informational-pages", label: "Application: informational page" },
    { slug: "marketing-landing-pages", route: "/marketing/landing-pages", label: "Marketing: landing page" },
    { slug: "marketing-hero-header-sections", route: "/marketing/hero-header-sections", label: "Marketing: hero header (marketing hero)", rtl: true },
    { slug: "marketing-contact-pages", route: "/marketing/contact-pages", label: "Marketing: contact page (form-heavy)" },
    { slug: "marketing-pricing-pages", route: "/marketing/pricing-pages", label: "Marketing: pricing page" },
    { slug: "marketing-footers", route: "/marketing/footers", label: "Marketing: footers" },
];

export const BASELINE_DIR = "tests/visual/baseline";
export const DIFF_DIR = "tests/visual/.diff";

/**
 * Diff threshold. The baseline is captured on Linux (mcr.microsoft.com/playwright, matching the
 * ubuntu-latest runner CI serves from — see tests/visual/README.md) specifically so this number
 * can be tight: same-platform Linux-vs-Linux reruns of all 106 captures measured 0.00% differing
 * pixels across the board (no exceptions). The old 8% figure dated from a macOS-captured baseline
 * checked in CI on Linux, where font rasterisation alone produced 2.8-9.42% noise on every single
 * capture — a threshold sized to tolerate platform mismatch, not to catch regressions. 1% keeps a
 * small margin for incidental rendering jitter (font hinting, animation timing) while catching
 * anything resembling a real layout change, which the 0.00% baseline suggests will read far higher
 * than 1% anyway.
 */
export const DIFF_THRESHOLD_PCT = 1;
export const PIXELMATCH_THRESHOLD = 0.2;

export const WEBP_QUALITY = 72;
