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
 * linking to that page's docs; the strip scrolls inside its own box so the page never overflows
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
                            <ol className="lib-steps">
                                {flow.steps.map((step, index) => (
                                    <li className="lib-step" key={`${step.item.name}-${index}`}>
                                        <a className="lib-step-link" href={step.item.docs}>
                                            <span className="lib-thumb">
                                                {step.item.thumb ? <img src={step.item.thumb.light} alt="" loading="lazy" width="640" height="400" /> : null}
                                            </span>
                                            <span className="lib-step-title">{step.item.title}</span>
                                        </a>
                                        {index < flow.steps.length - 1 ? (
                                            <svg className="lib-step-arrow" viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
                                                <path
                                                    d="M5 12h14m-5-5 5 5-5 5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ) : null}
                                    </li>
                                ))}
                            </ol>
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
