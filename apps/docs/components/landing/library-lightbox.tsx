"use client";

import { type MouseEvent, type ReactNode, createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { CopyButton } from "./copy-button";

/** What the viewer labels an item. `flow-step` is a screen, section or component opened from inside a flow. */
export type LightboxKind = "screen" | "section" | "component" | "flow-step";

export type LightboxItem = {
    /** Registry entry name: drives the `add` command. */
    name: string;
    title: string;
    kind: LightboxKind;
    group: string;
    /** Site-relative thumbnail, shown as a placeholder while the real render loads. */
    thumb: string | null;
    /** Site-relative docs page. */
    docs: string;
    /** Site-relative chrome-less `/preview/variant/...` route; null renders the docs page instead. */
    preview: string | null;
    /** What this step does in its flow; only set when opened from a flow. */
    purpose?: string;
};

type LightboxApi = {
    /**
     * Open the viewer over `items`, starting at `index`. `opener` is the element focus returns to on
     * close; it defaults to `document.activeElement`, which is `body` in browsers that do not focus a
     * button on click (Safari), so click handlers should pass `event.currentTarget`.
     */
    open: (items: LightboxItem[], index: number, opener?: Element | null) => void;
};

const LightboxContext = createContext<LightboxApi | null>(null);

/** The viewer's `open`. Throws outside a `LibraryLightboxProvider`. */
export function useLibraryLightbox(): LightboxApi {
    const api = useContext(LightboxContext);
    if (!api) throw new Error("useLibraryLightbox must be used inside a LibraryLightboxProvider");
    return api;
}

/** Like `useLibraryLightbox`, but null when no provider is mounted (the /mcp page has none). */
export function useOptionalLibraryLightbox(): LightboxApi | null {
    return useContext(LightboxContext);
}

/** True for an unmodified primary click, the only kind a link should hand to the viewer; cmd/ctrl/shift/middle clicks keep their browser behaviour. */
export const isPlainClick = (event: MouseEvent): boolean => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const KIND_LABEL: Record<LightboxKind, string> = { screen: "Screen", section: "Section", component: "Component", "flow-step": "Flow step" };

type Viewport = "desktop" | "mobile";
const VIEWPORTS: Array<{ id: Viewport; label: string; width: number }> = [
    { id: "desktop", label: "Desktop", width: 1280 },
    { id: "mobile", label: "Mobile", width: 390 },
];

type Session = { items: LightboxItem[]; index: number };

/**
 * The preview, laid out at the chosen render width and scaled down to fit the box (the idea behind
 * `ExampleFrame`). Desktop fills the box at scale 1 once it is wider than 1280; mobile is a 390px
 * column centred in the box. Keyed by the item's URL, so each item starts with a fresh loading state.
 */
function Stage({ src, title, thumb, viewport, onEscape }: { src: string; title: string; thumb: string | null; viewport: Viewport; onEscape: () => void }) {
    const box = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const base = VIEWPORTS.find((entry) => entry.id === viewport)!.width;
    const scale = size.width > 0 ? Math.min(1, size.width / base) : 1;
    const width = viewport === "desktop" && scale === 1 ? size.width : base;
    const left = viewport === "mobile" ? Math.max(0, (size.width - width * scale) / 2) : 0;

    return (
        <div className="lib-lightbox-stage" ref={box}>
            {size.width > 0 ? (
                <iframe
                    className="lib-lightbox-frame"
                    src={src}
                    title={title}
                    data-viewport={viewport}
                    style={{ width, height: size.height / scale, left, transform: `scale(${scale})`, transformOrigin: "top left" }}
                    onLoad={(event) => {
                        setLoaded(true);
                        // Same origin, so Escape pressed while the page inside has focus can still close the viewer.
                        try {
                            event.currentTarget.contentWindow?.addEventListener("keydown", (keyEvent) => {
                                if (keyEvent.key === "Escape") onEscape();
                            });
                        } catch {
                            // A cross-origin frame cannot be reached; the Close button still works.
                        }
                    }}
                />
            ) : null}
            {loaded ? null : (
                <div className="lib-lightbox-loading" role="status">
                    {thumb ? <img className="lib-lightbox-poster" src={thumb} alt="" /> : null}
                    <span className="lib-lightbox-loading-chip">
                        <span className="lib-lightbox-spinner" aria-hidden="true" />
                        Loading preview
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * One native `<dialog>` for the whole landing page, opened with a list of items and a start index
 * through `useLibraryLightbox().open`. `showModal()` supplies the focus trap, the inert page behind
 * it and Escape-to-close; this adds the rest: body scroll lock, backdrop click, focus return to the
 * opener, wrap-around previous/next (buttons and arrow keys), and a desktop/mobile width toggle.
 * The provider is mounted inside `<main>`, so the dialog sits in the `.pui-landing`
 * tree and its selectors apply even though it paints in the top layer. The URL never changes.
 */
export function LibraryLightboxProvider({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const openerRef = useRef<Element | null>(null);
    const pressedOnBackdrop = useRef(false);
    const titleId = useId();

    const [session, setSession] = useState<Session | null>(null);
    const [viewport, setViewport] = useState<Viewport>("desktop");
    const isOpen = session !== null;

    const open = useCallback<LightboxApi["open"]>((items, index, opener) => {
        if (items.length === 0) return;
        openerRef.current = opener ?? document.activeElement;
        setViewport("desktop");
        setSession({ items, index: Math.min(Math.max(index, 0), items.length - 1) });
    }, []);

    const api = useMemo<LightboxApi>(() => ({ open }), [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !dialog) return;
        if (!dialog.open) dialog.showModal();
        closeRef.current?.focus();

        // Lock page scroll, keeping the scrollbar's width so the page does not shift sideways.
        const root = document.documentElement;
        const previous = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
        const gutter = window.innerWidth - root.clientWidth;
        root.style.overflow = "hidden";
        if (gutter > 0) root.style.paddingRight = `${gutter}px`;
        return () => {
            root.style.overflow = previous.overflow;
            root.style.paddingRight = previous.paddingRight;
        };
    }, [isOpen]);

    const close = useCallback(() => dialogRef.current?.close(), []);

    const go = (delta: number) =>
        setSession((current) => (current ? { items: current.items, index: (current.index + delta + current.items.length) % current.items.length } : current));

    const item = session ? session.items[session.index]! : null;
    const count = session?.items.length ?? 0;
    const neighbour = (delta: number) => (session ? session.items[(session.index + delta + count) % count]!.title : "");

    return (
        <LightboxContext.Provider value={api}>
            {children}
            {/* The dialog element handles Escape itself; the handlers here add the arrow keys and backdrop click, which have no native equivalent. */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <dialog
                ref={dialogRef}
                className="lib-lightbox"
                aria-labelledby={titleId}
                onPointerDown={(event) => {
                    pressedOnBackdrop.current = event.target === dialogRef.current;
                }}
                onClick={(event) => {
                    if (pressedOnBackdrop.current && event.target === dialogRef.current) close();
                    pressedOnBackdrop.current = false;
                }}
                onKeyDown={(event) => {
                    if (count < 2 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
                    if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        go(-1);
                    } else if (event.key === "ArrowRight") {
                        event.preventDefault();
                        go(1);
                    }
                }}
                onClose={() => {
                    setSession(null);
                    const opener = openerRef.current;
                    openerRef.current = null;
                    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
                }}
            >
                {item ? (
                    <>
                        <header className="lib-lightbox-head">
                            <div className="lib-lightbox-titlewrap">
                                <h2 id={titleId} className="lib-lightbox-title">
                                    {item.title}
                                </h2>
                                <p className="lib-lightbox-meta">
                                    <span className="lib-badge" data-kind={item.kind}>
                                        {KIND_LABEL[item.kind]}
                                    </span>
                                    <span>{item.group}</span>
                                    {item.purpose ? <span className="lib-lightbox-purpose">{item.purpose}</span> : null}
                                </p>
                            </div>
                            <div className="lib-lightbox-actions">
                                <a className="lib-lightbox-action" href={item.docs}>
                                    Docs
                                </a>
                                <a className="lib-lightbox-action" href={item.preview ?? item.docs} target="_blank" rel="noreferrer">
                                    Open in new tab
                                </a>
                                <button
                                    ref={closeRef}
                                    type="button"
                                    className="lib-lightbox-action lib-lightbox-close"
                                    aria-label="Close viewer"
                                    onClick={close}
                                >
                                    Close
                                </button>
                            </div>
                        </header>

                        <div className="lib-lightbox-toolbar">
                            <div className="lib-lightbox-command command">
                                <code>{`npx @properui/cli@latest add ${item.name}`}</code>
                                <CopyButton value={`npx @properui/cli@latest add ${item.name}`} successLabel="Copied">
                                    Copy
                                </CopyButton>
                            </div>
                            <div className="lib-lightbox-viewports" role="group" aria-label="Preview width">
                                {VIEWPORTS.map((entry) => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        className="lib-lightbox-viewport"
                                        aria-pressed={viewport === entry.id}
                                        onClick={() => setViewport(entry.id)}
                                    >
                                        {entry.label} <span className="lib-lightbox-viewport-width">{entry.width}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Stage
                            key={item.preview ?? item.docs}
                            src={item.preview ?? item.docs}
                            title={`${item.title} ${item.preview ? "preview" : "documentation page"}`}
                            thumb={item.thumb}
                            viewport={viewport}
                            onEscape={close}
                        />

                        {count > 1 ? (
                            <footer className="lib-lightbox-foot">
                                <button type="button" className="lib-lightbox-nav" aria-label={`Previous: ${neighbour(-1)}`} onClick={() => go(-1)}>
                                    <span aria-hidden="true">&larr; </span>Previous
                                </button>
                                <span className="lib-lightbox-count" role="status">
                                    {session!.index + 1} of {count}
                                </span>
                                <button type="button" className="lib-lightbox-nav" aria-label={`Next: ${neighbour(1)}`} onClick={() => go(1)}>
                                    Next<span aria-hidden="true"> &rarr;</span>
                                </button>
                            </footer>
                        ) : null}
                    </>
                ) : null}
            </dialog>
        </LightboxContext.Provider>
    );
}
