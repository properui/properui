import { type Area, type ContentPage, getContentPages } from "./content";

/**
 * The sidebar. Group order and membership are fixed by
 * docs/spec/00-foundation/08-docs-site.md § "Global chrome"; the generated
 * `lib/nav.ts` is only a flat list, so the grouping is rebuilt here from the
 * `section` front-matter of every MDX page.
 */

export type SiteNavItem = {
    title: string;
    href: string;
    /** Present on "Integrations", the one nested collapsible in the sidebar. */
    items?: SiteNavItem[];
    external?: boolean;
};

export type SiteNavGroup = {
    title: string;
    items: SiteNavItem[];
};

/** Fixed order of the Documentation group (spec § Global chrome). */
const DOCS_ORDER = [
    "introduction",
    "installation",
    "theming",
    "theme-generator",
    "dark-mode",
    "typography",
    "frameworks",
    "tokens",
    "html",
    "elements",
    "cli",
    "agents",
    "linting",
    "accessibility",
    "quality",
    "rtl",
    "upgrade",
    "icons",
];

/** Fixed order of the nested Integrations list. */
const INTEGRATIONS_ORDER = [
    "nextjs",
    "vite",
    "vue",
    "angular",
    "svelte",
    "astro",
    "plain-html",
    "vanilla-js",
    "claude",
    "codex",
    "cursor",
    "lovable",
    "v0",
    "bolt",
    "replit",
    "gemini",
    "shadcn",
    "monorepo",
    "mcp",
    "components-json",
];

/** `section: app-examples` pages that belong to "Application UI examples". */
const APP_EXAMPLE_SLUGS = ["dashboards", "dashboards-02", "settings-pages", "settings-pages-02", "informational-pages", "informational-pages-02"];

/** `section: app-examples` pages that belong to "Shared page examples". */
const SHARED_EXAMPLE_SLUGS = ["log-in-pages", "sign-up-pages", "verification-pages", "forgot-password-pages", "404-sections", "email-templates"];

/**
 * Static links; these live outside the docs app, so they are not MDX pages. No Figma entry:
 * there is no Figma file yet, and a link to figma.com's front page said otherwise.
 */
const RESOURCES: SiteNavItem[] = [
    { title: "Icons", href: "/docs/icons" },
    { title: "File icons", href: "/docs/icons#file-icons" },
    { title: "Flag icons", href: "/docs/icons#flag-icons" },
    { title: "Avatars", href: "/components/avatars" },
    { title: "Logos", href: "/components/logos" },
];

const toItem = (page: ContentPage): SiteNavItem => ({ title: page.frontmatter.title, href: page.href });

/** Orders pages by an explicit slug list, dropping anything that does not exist yet. */
const inSlugOrder = (pages: ContentPage[], order: string[]): SiteNavItem[] =>
    order.flatMap((slug) => {
        const page = pages.find((candidate) => candidate.slug === slug);
        return page ? [toItem(page)] : [];
    });

const bySection = (pages: ContentPage[], section: string, exclude: string[] = []): SiteNavItem[] =>
    pages.filter((page) => page.frontmatter.section === section && !exclude.includes(page.slug)).map(toItem);

export const getSiteNav = (): SiteNavGroup[] => {
    const docs = getContentPages("docs");
    const integrations = getContentPages("integrations");
    const components = getContentPages("components");
    const marketing = getContentPages("marketing");

    const documentation: SiteNavItem[] = [...inSlugOrder(docs, DOCS_ORDER), ...docs.filter((page) => !DOCS_ORDER.includes(page.slug)).map(toItem)];

    const integrationItems: SiteNavItem[] = [
        ...inSlugOrder(integrations, INTEGRATIONS_ORDER),
        ...integrations.filter((page) => !INTEGRATIONS_ORDER.includes(page.slug)).map(toItem),
    ];

    documentation.push({ title: "Integrations", href: "/integrations", items: integrationItems });

    const exampleSlugs = [...APP_EXAMPLE_SLUGS, ...SHARED_EXAMPLE_SLUGS];

    // Resources point at pages that may not be published yet; drop the dead ones.
    const published = new Set([...docs, ...integrations, ...components, ...marketing].map((page) => page.href));
    const resources = RESOURCES.filter((item) => item.external || published.has(item.href.split("#")[0] ?? item.href));

    return [
        { title: "Documentation", items: documentation },
        { title: "Resources", items: resources },
        { title: "Base components", items: [{ title: "Overview", href: "/components" }, ...bySection(components, "base")] },
        {
            title: "Application UI components",
            items: [{ title: "Overview", href: "/application-ui" }, ...bySection(components, "application", exampleSlugs)],
        },
        {
            title: "Application UI examples",
            items: [{ title: "Overview", href: "/application-ui" }, ...inSlugOrder(components, APP_EXAMPLE_SLUGS)],
        },
        {
            title: "Shared page examples",
            items: [{ title: "Overview", href: "/application-ui" }, ...inSlugOrder(components, SHARED_EXAMPLE_SLUGS)],
        },
        { title: "Marketing components", items: [{ title: "Overview", href: "/marketing" }, ...bySection(marketing, "marketing")] },
        { title: "Marketing examples", items: [{ title: "Overview", href: "/marketing" }, ...bySection(marketing, "marketing-examples")] },
    ];
};

/** Flattened, de-duplicated reading order — this is what prev/next follows. */
export const getNavOrder = (nav: SiteNavGroup[] = getSiteNav()): SiteNavItem[] => {
    const seen = new Set<string>();
    const flat: SiteNavItem[] = [];

    const visit = (items: SiteNavItem[]) => {
        for (const item of items) {
            // Items with children are collapsible headers, not pages of their own.
            if (!item.external && !item.items && !seen.has(item.href)) {
                seen.add(item.href);
                flat.push(item);
            }
            if (item.items) visit(item.items);
        }
    };

    for (const group of nav) visit(group.items);
    return flat;
};

export type NavSiblings = { prev?: SiteNavItem; next?: SiteNavItem };

export const getSiblings = (href: string, nav: SiteNavGroup[] = getSiteNav()): NavSiblings => {
    const order = getNavOrder(nav);
    const index = order.findIndex((item) => item.href === href);
    if (index === -1) return {};
    return { prev: order[index - 1], next: order[index + 1] };
};

const AREA_LABELS: Record<Area, string> = {
    docs: "Documentation",
    integrations: "Integrations",
    components: "Components",
    marketing: "Marketing",
};

/** Areas that have a real overview route to link the middle crumb to. */
const AREA_ROOTS: Partial<Record<Area, string>> = { components: "/components", marketing: "/marketing" };

export type Crumb = { title: string; href?: string };

/** `Base components › Components › Buttons`, as in the reference top bar. */
export const getBreadcrumbs = (href: string, title: string, area: Area, nav: SiteNavGroup[] = getSiteNav()): Crumb[] => {
    const group = nav.find((candidate) => candidate.items.some((item) => item.href === href || item.items?.some((child) => child.href === href)));
    const overview = group?.items.find((item) => item.title === "Overview");

    const crumbs: Crumb[] = [];
    if (group) crumbs.push({ title: group.title, href: overview?.href });
    if (AREA_LABELS[area] !== group?.title) crumbs.push({ title: AREA_LABELS[area], href: AREA_ROOTS[area] });
    crumbs.push({ title });
    return crumbs;
};
