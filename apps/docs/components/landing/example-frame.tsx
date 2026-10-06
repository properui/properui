"use client";

import { useEffect, useRef, useState } from "react";
import { type LightboxItem, isPlainClick, useOptionalLibraryLightbox } from "~/components/landing/library-lightbox";
import { cx } from "~/lib/cx";

export type ExampleFrameProps = {
    /** `/preview/...` URL to embed (see `apps/docs/app/preview/[...path]/page.tsx`). */
    src: string;
    /** Accessible name for the iframe: required, describes what it renders. */
    title: string;
    /** Real docs page for the rendered example ("Open example" target). Never a page that doesn't exist. */
    openHref: string;
    openLabel?: string;
    /** Visible frame height in pixels. Fixed rather than aspect-ratio so panels line up at any viewport width. */
    height?: number;
    /**
     * The viewport width the example is laid out at. The iframe renders at this width and is scaled
     * down to fit its box, so a narrow column still shows the desktop layout instead of the
     * example's mobile breakpoint. Content taller than the box scrolls inside the iframe.
     */
    renderWidth?: number;
    className?: string;
    /**
     * When set and a `LibraryLightboxProvider` is mounted, a plain click on the "Open example" link
     * opens this item in the in-page viewer instead of navigating. Modified clicks (new tab) and
     * pages without a provider (the /mcp page) keep the plain link.
     */
    lightboxItem?: LightboxItem;
};

/**
 * Lazy `<iframe>` wrapper around one real registry example, rendered chrome-less through the
 * `/preview` route. Used by the "difference", "examples" and "consistency" landing sections so
 * every visual proof point is a genuinely rendered Proper UI page, not a screenshot or mockup.
 */
export function ExampleFrame({
    src,
    title,
    openHref,
    openLabel = "Open example",
    height = 520,
    renderWidth = 1280,
    className,
    lightboxItem,
}: ExampleFrameProps) {
    const lightbox = useOptionalLibraryLightbox();
    const box = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        const update = () => setScale(Math.min(1, el.clientWidth / renderWidth));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [renderWidth]);

    return (
        <div className={cx("ex-frame", className)}>
            <div className="ex-frame-box" ref={box} style={{ height }}>
                <iframe
                    src={src}
                    title={title}
                    loading="lazy"
                    style={{ width: renderWidth, height: height / scale, transform: `scale(${scale})`, transformOrigin: "top left" }}
                />
            </div>
            <a
                className="ex-frame-link"
                href={openHref}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                    if (!lightbox || !lightboxItem || !isPlainClick(event)) return;
                    event.preventDefault();
                    lightbox.open([lightboxItem], 0, event.currentTarget);
                }}
            >
                {openLabel} <span aria-hidden="true">&rarr;</span>
            </a>
        </div>
    );
}
