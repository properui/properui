import { ExampleFrame } from "~/components/landing/example-frame";
import { WithoutProperUiBilling } from "~/components/landing/without-properui-billing";

const PROMPT = "Build a professional billing settings page with plan details, payment method, invoices and a cancellation action.";

const WITHOUT_POINTS = [
    "Invented or inconsistent component APIs",
    "Arbitrary spacing and colours",
    "Generic Tailwind composition",
    "Incomplete focus, error and empty states",
    "Style drift when a second screen is generated",
];

const WITH_POINTS = [
    "Real searchable registry components",
    "Shared semantic tokens",
    "React Aria interaction foundations",
    "Complete page or section examples where available",
    "Future screens reuse the same components and rules",
];

/**
 * Landing section "difference" (brief Priority 3). Same prompt, two genuinely rendered results:
 * a billing page composed by hand from bare Tailwind utilities (`WithoutProperUiBilling`, owned
 * by this task), and the real `settings-13` registry example rendered through `/preview`.
 *
 * `settings-13` covers plan details, payment method and invoice history, the closest match in
 * the registry to the prompt below, but has no dedicated cancellation control; no example does
 * (verified across every `settings-pages`/`settings-pages-02` variant). The prompt is shown
 * verbatim as asked on both sides rather than trimmed to only what's delivered; the note under
 * the grid says so plainly instead of implying the feature exists.
 */
export function Comparison() {
    return (
        <section className="section" id="difference" aria-labelledby="difference-title">
            <div className="container">
                <div className="section-heading">
                    <span className="eyebrow">Same prompt, two results</span>
                    <h2 id="difference-title">The difference</h2>
                    <p>Two genuinely rendered screens, not illustrations. Both sides start from the same prompt.</p>
                </div>

                <div className="cmp-prompt">
                    <span className="cmp-prompt-label">The prompt</span>
                    <p>&ldquo;{PROMPT}&rdquo;</p>
                </div>

                <div className="cmp-grid">
                    <article className="cmp-panel">
                        <header className="cmp-panel-head">
                            <h3>Without Proper UI</h3>
                            <span className="cmp-tag cmp-tag-bad">Composed from bare Tailwind</span>
                        </header>

                        <div className="cmp-frame" style={{ height: 560 }}>
                            <WithoutProperUiBilling />
                        </div>

                        <ul className="cmp-list cmp-list-bad">
                            {WITHOUT_POINTS.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </article>

                    <article className="cmp-panel cmp-panel-good">
                        <header className="cmp-panel-head">
                            <h3>With Proper UI</h3>
                            <span className="cmp-tag cmp-tag-good">Real registry example</span>
                        </header>

                        <ExampleFrame
                            src="/preview/variant/app-examples/settings-pages/settings-13"
                            title="Billing settings example rendered with Proper UI"
                            openHref="/components/settings-pages/settings-13"
                            lightboxItem={{
                                name: "settings-13",
                                title: "Billing settings",
                                kind: "screen",
                                group: "Settings pages",
                                thumb: null,
                                docs: "/components/settings-pages/settings-13",
                                preview: "/preview/variant/app-examples/settings-pages/settings-13",
                            }}
                            height={560}
                        />

                        <ul className="cmp-list cmp-list-good">
                            {WITH_POINTS.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </article>
                </div>

                <p className="cmp-note">
                    Registry example: <code>settings-13</code>: current plan, payment method and invoice history, built from Proper UI&apos;s <code>table</code>
                    , <code>badges</code> and <code>progress-indicators</code> components. No example in the registry has a dedicated cancellation control yet,
                    so that part of the prompt above is shown as asked rather than claimed as delivered.
                </p>
            </div>
        </section>
    );
}
