"use client";

import { useState } from "react";
import { ExampleFrame } from "~/components/landing/example-frame";

type Preset = "violet" | "teal";

type ConsistencyScreen = {
    id: string;
    label: string;
    src: string;
    openHref: string;
    frameTitle: string;
    /** Registry entry name and docs group, for the in-page viewer. */
    name: string;
    group: string;
};

// Pricing stands in for "Checkout": there is no checkout example in the registry (verified — no
// entry matches "checkout"). Reusing the three examples already introduced earlier on the page
// (dashboard-04, pricing-page-03, settings-13) keeps this section's proof anchored to examples the
// visitor has already seen rendered for real, rather than introducing new unverified ones.
const SCREENS: ConsistencyScreen[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        src: "/preview/variant/app-examples/dashboards/dashboard-04",
        openHref: "/components/dashboards/dashboard-04",
        frameTitle: "Dashboard example",
        name: "dashboard-04",
        group: "Dashboards",
    },
    {
        id: "pricing",
        label: "Pricing",
        src: "/preview/variant/marketing-examples/pricing-pages/pricing-page-03",
        openHref: "/marketing/pricing-pages/pricing-page-03",
        frameTitle: "Pricing example",
        name: "pricing-page-03",
        group: "Pricing pages",
    },
    {
        id: "settings",
        label: "Settings",
        src: "/preview/variant/app-examples/settings-pages/settings-13",
        openHref: "/components/settings-pages/settings-13",
        frameTitle: "Billing settings example",
        name: "settings-13",
        group: "Settings pages",
    },
];

const SHARED_DECISIONS = [
    "Typography scale",
    "Spacing rhythm",
    "Buttons and inputs",
    "Cards and borders",
    "Semantic colours",
    "Focus, loading, error and disabled states",
];

const withPreset = (src: string, preset: Preset) => (preset === "teal" ? `${src}#preset=teal` : src);

/**
 * Landing section "consistency" (brief Priority 5). Three real, already-rendered screens stacked
 * on mobile, side by side from tablet up (CSS grid in `landing-proof.css`, no separate tabbed
 * viewer needed at this width). The preset toggle appends `#preset=teal` (a hash, so
 * the prerendered preview route stays static) to all three `ExampleFrame` sources at once; the
 * preview page reads the hash client-side to override the brand ramp and radius tokens for that
 * render only. A hash-only change navigates inside the iframe without a reload.
 */
export function Consistency() {
    const [preset, setPreset] = useState<Preset>("violet");

    return (
        <section className="section" id="consistency" aria-labelledby="consistency-title">
            <div className="container">
                <div className="section-heading">
                    <span className="eyebrow">Same tokens, every screen</span>
                    <h2 id="consistency-title">One system. Every screen stays consistent.</h2>
                    <p>Your agent reuses the same components, semantic tokens and interaction patterns instead of redesigning the product with every prompt.</p>
                </div>

                <ul className="consist-shared">
                    {SHARED_DECISIONS.map((decision) => (
                        <li key={decision}>{decision}</li>
                    ))}
                </ul>

                <div className="consist-preset">
                    <div className="consist-preset-toggle" role="group" aria-label="Token preset">
                        <button type="button" aria-pressed={preset === "violet"} className="consist-preset-btn" onClick={() => setPreset("violet")}>
                            Violet (default)
                        </button>
                        <button type="button" aria-pressed={preset === "teal"} className="consist-preset-btn" onClick={() => setPreset("teal")}>
                            Teal, tighter radius
                        </button>
                    </div>
                    <p className="consist-preset-note">
                        Switching the preset changes the brand colour scale and corner radius across every screen in your product, not just the three below.
                    </p>
                </div>

                <div className="consist-grid">
                    {SCREENS.map((screen) => (
                        <div className="consist-screen" key={screen.id}>
                            <span className="consist-screen-label">{screen.label}</span>
                            <ExampleFrame
                                src={withPreset(screen.src, preset)}
                                title={`${screen.frameTitle} (${preset === "teal" ? "teal, tighter radius" : "violet, default"} preset)`}
                                openHref={screen.openHref}
                                lightboxItem={{
                                    name: screen.name,
                                    title: `${screen.label} example`,
                                    kind: "screen",
                                    group: screen.group,
                                    thumb: null,
                                    docs: screen.openHref,
                                    preview: withPreset(screen.src, preset),
                                }}
                                height={460}
                                className="consist-frame"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
