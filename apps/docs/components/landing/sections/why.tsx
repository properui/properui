import { AXE_SUITES, AXE_VIOLATIONS } from "~/components/landing/stats";

type Reason = { title: string; text: React.ReactNode };

const REASONS: Reason[] = [
    {
        title: "Real source, not a picture",
        text: "Every screen, flow and section is React 19, React Aria and Tailwind v4 source. Your agent installs it into your project instead of imitating an image.",
    },
    {
        title: "One design system",
        text: "Every reference is built from the same components and tokens, so screens stay consistent when the next prompt lands.",
    },
    {
        title: "Accessibility tested",
        text: (
            <>
                {AXE_SUITES} axe suites with {AXE_VIOLATIONS} detected violations in the markup those suites render. Not a guarantee against every accessibility
                issue.
            </>
        ),
    },
    {
        title: "Tokens in one file",
        text: (
            <>
                Colors, spacing, radius and type live in <code>theme.css</code>. Change it once and every installed reference follows, so you can re-brand
                everything at once.
            </>
        ),
    },
    {
        title: "Free and MIT",
        text: "No account, no paid tier, no credits. Copy the source, edit it, ship it in commercial products.",
    },
];

/** Landing section "why" (id `why`): why these references are trustworthy. Numbers come from `stats.ts`. */
export function Why() {
    return (
        <section className="section why" id="why" aria-labelledby="why-title">
            <div className="container">
                <div className="section-heading">
                    <span className="eyebrow">Why these references</span>
                    <h2 id="why-title">References you can ship, not screenshots.</h2>
                </div>

                <ul className="why-grid">
                    {REASONS.map((reason) => (
                        <li className="why-card" key={reason.title}>
                            <h3>{reason.title}</h3>
                            <p>{reason.text}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
