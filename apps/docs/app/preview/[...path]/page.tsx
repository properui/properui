import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewPresetFrame } from "~/components/preview-preset-frame";
import { demos } from "~/lib/demos";
import { variants } from "~/lib/variants";

/**
 * Bare, chrome-less render of one example. Two shapes:
 *   /preview/<demoFile>/<Export>
 *   /preview/variant/<section>/<slug>/<variant>
 * Used by "Open in new tab", the screenshot scripts and `pnpm shots:thumbs`.
 *
 * Every path is prerendered at build time (`generateStaticParams` below, `dynamicParams` off), so
 * on Cloudflare Workers these are static assets and cost no CPU at request time. An optional token
 * preset (`#preset=teal`) is applied on the client by `PreviewPresetFrame` from the URL hash; see
 * `~/lib/preview-presets` for why it is not a search param.
 */

type Params = { params: Promise<{ path: string[] }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

const resolve = (path: string[]) => {
    if (path[0] === "variant") {
        const [, section, slug, variant] = path;
        if (!section || !slug || !variant) return undefined;
        return (variants[slug] ?? []).find((entry) => entry.section === section && entry.variant === variant);
    }

    const [demoFile, exportName] = path;
    const component = demoFile && exportName ? demos[`${demoFile}:${exportName}`] : undefined;
    return component ? { component } : undefined;
};

export function generateStaticParams(): Array<{ path: string[] }> {
    const variantPaths = Object.values(variants).flatMap((entries) =>
        entries.map((entry) => ({ path: ["variant", entry.section, entry.slug, entry.variant] })),
    );
    const demoPaths = Object.keys(demos).map((key) => ({ path: key.split(":") }));
    return [...variantPaths, ...demoPaths];
}

export default async function PreviewPage({ params }: Params) {
    const { path } = await params;
    const match = resolve(path);
    if (!match) notFound();

    const Component = match.component;

    return (
        <PreviewPresetFrame>
            <Component />
        </PreviewPresetFrame>
    );
}
