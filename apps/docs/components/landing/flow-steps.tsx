"use client";

import { type LightboxItem, isPlainClick, useLibraryLightbox } from "./library-lightbox";

export type FlowStepData = { name: string; title: string; group: string; thumb: string | null; docs: string; preview: string | null; purpose: string };

/**
 * The horizontal step strip of one flow on the home page. Each step stays a real link to that
 * step's docs page (so it is crawlable and cmd-click still opens it), but a plain click opens the
 * in-page viewer over this flow's steps instead.
 */
export function FlowSteps({ flowTitle, steps }: { flowTitle: string; steps: FlowStepData[] }) {
    const lightbox = useLibraryLightbox();
    const items: LightboxItem[] = steps.map((step) => ({
        name: step.name,
        title: step.title,
        kind: "flow-step",
        group: flowTitle,
        thumb: step.thumb,
        docs: step.docs,
        preview: step.preview,
        purpose: step.purpose,
    }));

    return (
        <ol className="lib-steps">
            {steps.map((step, index) => (
                <li className="lib-step" key={`${step.name}-${index}`}>
                    <a
                        className="lib-step-link"
                        href={step.docs}
                        aria-haspopup="dialog"
                        onClick={(event) => {
                            if (!isPlainClick(event)) return;
                            event.preventDefault();
                            lightbox.open(items, index, event.currentTarget);
                        }}
                    >
                        <span className="lib-thumb">{step.thumb ? <img src={step.thumb} alt="" loading="lazy" width="640" height="400" /> : null}</span>
                        <span className="lib-step-title">{step.title}</span>
                    </a>
                    {index < steps.length - 1 ? (
                        <svg className="lib-step-arrow" viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
                            <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : null}
                </li>
            ))}
        </ol>
    );
}
