import { FlowSteps } from "~/components/landing/flow-steps";
import type { Flow } from "~/lib/library-index";
import { getFlows, getLibraryCounts } from "~/lib/library-index";

const PREFERRED = ["auth", "billing", "marketing-site"];
const SHOWN = 3;

/** auth, billing and marketing-site when present (matched on the flow id), topped up with the first flows in order. */
function pickFlows(flows: Flow[]): Flow[] {
    const preferred = PREFERRED.map((key) => flows.find((flow) => flow.id === key) ?? flows.find((flow) => flow.id.includes(key))).filter(
        (flow): flow is Flow => flow !== undefined,
    );
    const unique = [...new Set(preferred)];
    const rest = flows.filter((flow) => !unique.includes(flow));
    return [...unique, ...rest].slice(0, SHOWN);
}

/**
 * Landing section "flows": three real flows as horizontal step strips. Each step is a thumbnail
 * that opens the in-page viewer (and still links to that page's docs); the strip scrolls inside its own box so the page never overflows
 * sideways on a phone.
 */
export function FlowsShowcase() {
    const flows = pickFlows(getFlows());
    const { flows: flowCount } = getLibraryCounts();

    return (
        <section className="section" id="flows" aria-labelledby="flows-title">
            <div className="container">
                <div className="section-heading">
                    <span className="eyebrow">FLOWS</span>
                    <h2 id="flows-title">Whole journeys, not single screens.</h2>
                    <p>Each flow is an ordered set of real pages your agent can install together.</p>
                </div>

                <div className="lib-flows">
                    {flows.map((flow) => (
                        <article className="lib-flow" key={flow.id} aria-labelledby={`flow-${flow.id}-title`}>
                            <header className="lib-flow-head">
                                <h3 id={`flow-${flow.id}-title`}>
                                    <a href={`/flows/${flow.id}`}>{flow.title}</a>
                                </h3>
                                <span className="lib-flow-steps-count">{flow.steps.length} steps</span>
                            </header>
                            <FlowSteps
                                flowTitle={flow.title}
                                steps={flow.steps.map((step) => ({
                                    name: step.item.name,
                                    title: step.item.title,
                                    group: step.item.group,
                                    thumb: step.item.thumb?.light ?? null,
                                    docs: step.item.docs,
                                    preview: step.item.preview,
                                    purpose: step.purpose,
                                }))}
                            />
                        </article>
                    ))}
                </div>

                <p className="lib-flows-cta">
                    <a className="button button-secondary button-lg" href="/flows">
                        See all {flowCount} flows
                    </a>
                </p>
            </div>
        </section>
    );
}
