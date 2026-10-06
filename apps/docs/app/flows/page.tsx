import type { Metadata } from "next";
import Link from "next/link";
import { DocsShell } from "~/components/docs-shell";
import { FlowThumb } from "~/components/flow-thumb";
import { getFlows } from "~/lib/library-index";
import { SITE_NAME, absoluteUrl } from "~/lib/site";

const TITLE = "Flows";
const DESCRIPTION = "Curated user journeys made of real, installable screens: sign up, onboarding, billing and more, each step in order.";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: absoluteUrl("/flows") },
    openGraph: { title: `${TITLE} | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/flows"), siteName: SITE_NAME },
};

export default function FlowsIndexPage() {
    const flows = getFlows();

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
                    { "@type": "ListItem", position: 2, name: TITLE, item: absoluteUrl("/flows") },
                ],
            },
            {
                "@type": "ItemList",
                name: TITLE,
                itemListElement: flows.map((flow, index) => ({ "@type": "ListItem", position: index + 1, name: flow.title, url: absoluteUrl(flow.docs) })),
            },
        ],
    };

    return (
        <DocsShell crumbs={[{ title: TITLE, href: "/flows" }, { title: "Overview" }]}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="mb-10">
                <h1 className="text-primary md:text-display-xs max-w-3xl text-xl font-semibold text-balance md:text-wrap">{TITLE}</h1>
                <p className="text-md text-tertiary mt-3 max-w-3xl">{DESCRIPTION}</p>
            </div>

            {flows.length ? (
                <ul className="grid gap-4 xl:grid-cols-2">
                    {flows.map((flow) => (
                        <li key={flow.id}>
                            <Link
                                href={flow.docs}
                                className="bg-primary outline-focus-ring ring-secondary hover:bg-primary_hover flex h-full flex-col gap-4 rounded-xl p-5 ring-1 transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                <span className="flex flex-col gap-1">
                                    <span className="flex items-baseline justify-between gap-3">
                                        <span className="text-md text-primary font-semibold">{flow.title}</span>
                                        <span className="text-quaternary shrink-0 text-sm">{flow.steps.length} steps</span>
                                    </span>
                                    <span className="text-tertiary line-clamp-2 text-sm">{flow.description}</span>
                                </span>

                                <span className="flex gap-2 overflow-hidden" aria-hidden="true">
                                    {flow.steps.slice(0, 5).map((step) => (
                                        <span key={step.item.name} className="block w-1/5 min-w-0 shrink-0">
                                            <FlowThumb item={step.item} className="aspect-[4/5]" />
                                        </span>
                                    ))}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="border-secondary text-tertiary rounded-xl border border-dashed px-6 py-10 text-center text-sm">No flows published yet.</p>
            )}
        </DocsShell>
    );
}
