import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "~/components/docs-shell";
import { FlowThumb } from "~/components/flow-thumb";
import { buttonClasses } from "~/components/primitives";
import { getFlow, getFlows } from "~/lib/library-index";
import { SITE_NAME, absoluteUrl } from "~/lib/site";

export const dynamicParams = false;

export const generateStaticParams = () => getFlows().map((flow) => ({ id: flow.id }));

const descriptionOf = (flow: { description: string; steps: unknown[] }) => {
    const text = `${flow.description} ${flow.steps.length} real screens, in order, each one installable.`;
    return text.length <= 155 ? text : flow.description.slice(0, 155);
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const flow = getFlow((await params).id);
    if (!flow) return {};

    const title = `${flow.title} flow`;
    const description = descriptionOf(flow);
    return {
        title,
        description,
        alternates: { canonical: absoluteUrl(flow.docs) },
        openGraph: { title: `${title} | ${SITE_NAME}`, description, url: absoluteUrl(flow.docs), siteName: SITE_NAME },
    };
}

const ADD_COMMAND = "npx @properui/cli@latest add";

const Command = ({ children }: { children: string }) => (
    <code className="bg-secondary text-secondary block overflow-x-auto rounded-lg px-3 py-2 font-mono text-sm whitespace-pre">{children}</code>
);

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
    const flow = getFlow((await params).id);
    if (!flow) notFound();

    const names = [...new Set(flow.steps.map((step) => step.item.name))];
    const installCommand = `${ADD_COMMAND} ${names.join(" ")}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
                    { "@type": "ListItem", position: 2, name: "Flows", item: absoluteUrl("/flows") },
                    { "@type": "ListItem", position: 3, name: flow.title, item: absoluteUrl(flow.docs) },
                ],
            },
            {
                "@type": "ItemList",
                name: `${flow.title} flow`,
                description: flow.description,
                numberOfItems: flow.steps.length,
                itemListOrder: "https://schema.org/ItemListOrderAscending",
                itemListElement: flow.steps.map((step, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: step.item.title,
                    description: step.purpose,
                    url: absoluteUrl(step.item.docs),
                })),
            },
        ],
    };

    return (
        <DocsShell crumbs={[{ title: "Flows", href: "/flows" }, { title: flow.title }]}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="mb-10">
                <h1 className="text-primary md:text-display-xs max-w-3xl text-xl font-semibold text-balance md:text-wrap">{flow.title}</h1>
                <p className="text-md text-tertiary mt-3 max-w-3xl">{flow.description}</p>
                <p className="text-quaternary mt-3 text-sm">{flow.steps.length} steps</p>
            </div>

            <ol className="flex flex-col gap-12">
                {flow.steps.map((step, index) => (
                    <li key={step.item.name} className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-8">
                        <div>
                            <FlowThumb item={step.item} />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-quaternary text-sm font-medium">Step {index + 1}</span>
                                <h2 className="text-primary text-lg font-semibold">{step.item.title}</h2>
                                <p className="text-tertiary text-sm">{step.purpose}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link href={step.item.docs} className={buttonClasses("secondary")}>
                                    Docs
                                </Link>
                                {step.item.preview && (
                                    <Link href={step.item.preview} className={buttonClasses("secondary")}>
                                        Open example
                                    </Link>
                                )}
                            </div>

                            <Command>{`${ADD_COMMAND} ${step.item.name}`}</Command>
                        </div>
                    </li>
                ))}
            </ol>

            <section className="border-secondary mt-14 flex max-w-3xl flex-col gap-4 border-t pt-10">
                <h2 className="text-primary text-lg font-semibold">Install this flow</h2>
                <p className="text-tertiary text-sm">One command writes every step and the components they compose.</p>
                <Command>{installCommand}</Command>
                <p className="text-tertiary text-sm">Working in an agent? Ask the MCP server for the same journey.</p>
                <Command>{`search_flows "${flow.title}"`}</Command>
            </section>
        </DocsShell>
    );
}
