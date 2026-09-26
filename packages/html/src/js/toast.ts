import { claim, queryAll } from "./dom";

export interface ToastOptions {
    /** The one-line heading. */
    title: string;
    /** Supporting text under the title. */
    description?: string;
    /** Colours the icon. @default "info" */
    variant?: "success" | "error" | "warning" | "info";
    /** Milliseconds before it dismisses itself; `0` or `Infinity` keeps it until closed. @default 5000 */
    duration?: number;
}

const SVG_OPEN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
// Paths from @properui/icons: CheckCircle, AlertCircle, AlertTriangle, InfoCircle, XClose.
const ICONS: Record<NonNullable<ToastOptions["variant"]>, string> = {
    success: "m7.5 12 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z",
    error: "M12 8v4m0 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z",
    warning:
        "M12 9v4m0 4h.01M10.615 3.892 2.39 18.098c-.456.788-.684 1.182-.65 1.506a1 1 0 0 0 .406.705c.263.191.718.191 1.629.191h16.45c.91 0 1.365 0 1.628-.191a1 1 0 0 0 .407-.705c.034-.324-.195-.718-.65-1.506L13.383 3.892c-.454-.785-.681-1.178-.978-1.31a1 1 0 0 0-.813 0c-.296.132-.523.525-.978 1.31Z",
    info: "M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z",
};
const CLOSE = "M18 6 6 18M6 6l12 12";

const EXIT_MS = 150;

function svg(path: string): string {
    return `${SVG_OPEN}<path d="${path}"/></svg>`;
}

function toaster(doc: Document): HTMLElement {
    let region = doc.querySelector<HTMLElement>(".pui-toaster");
    if (!region) {
        region = doc.createElement("section");
        region.className = "pui-toaster";
        region.setAttribute("aria-label", "Notifications");
        region.setAttribute("aria-live", "polite");
        region.setAttribute("aria-relevant", "additions");
        doc.body.append(region);
    }
    return region;
}

function dismiss(el: HTMLElement): void {
    if (el.getAttribute("data-state") === "closing") return;
    el.setAttribute("data-state", "closing");
    setTimeout(() => el.remove(), EXIT_MS);
}

/**
 * Shows a toast in the `.pui-toaster` region (created on first use, `aria-live="polite"`, so it is
 * announced without interrupting). Title and description are set as text, never parsed as HTML.
 * It dismisses itself after `duration` ms, pausing while hovered or focused, and has a close button.
 */
export function toast(opts: ToastOptions): void {
    if (typeof document === "undefined") return;
    const { title, description, variant = "info", duration = 5000 } = opts;
    const doc = document;
    const region = toaster(doc);

    const el = doc.createElement("div");
    el.className = `pui-toast pui-toast--${variant}`;
    el.setAttribute("data-variant", variant);

    const icon = doc.createElement("span");
    icon.className = "pui-toast__icon";
    icon.innerHTML = svg(ICONS[variant] ?? ICONS.info);

    const content = doc.createElement("div");
    content.className = "pui-toast__content";
    const heading = doc.createElement("p");
    heading.className = "pui-toast__title";
    heading.textContent = title;
    content.append(heading);
    if (description) {
        const text = doc.createElement("p");
        text.className = "pui-toast__description";
        text.textContent = description;
        content.append(text);
    }

    const close = doc.createElement("button");
    close.type = "button";
    close.className = "pui-toast__close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.innerHTML = svg(CLOSE);
    close.addEventListener("click", () => dismiss(el));

    el.append(icon, content, close);
    region.append(el);

    if (!duration || !Number.isFinite(duration)) return;
    let remaining = duration;
    let started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => dismiss(el), remaining);
    const pause = () => {
        if (!timer) return;
        clearTimeout(timer);
        timer = undefined;
        remaining -= Date.now() - started;
    };
    const resume = () => {
        if (timer || el.contains(doc.activeElement) || el.matches(":hover")) return;
        started = Date.now();
        timer = setTimeout(() => dismiss(el), Math.max(remaining, 0));
    };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", () => setTimeout(resume, 0));
}

/**
 * `[data-pui-toast="Title"]` buttons show a toast on click, with `data-pui-toast-description`,
 * `data-pui-toast-variant` and `data-pui-toast-duration` (ms, `0` to keep it open).
 */
export function initToastTriggers(root: ParentNode = document): void {
    for (const button of queryAll(root, "[data-pui-toast]")) {
        if (!claim(button, "toast")) continue;
        button.addEventListener("click", () => {
            const variant = button.getAttribute("data-pui-toast-variant");
            const duration = button.getAttribute("data-pui-toast-duration");
            toast({
                title: button.getAttribute("data-pui-toast") ?? "",
                description: button.getAttribute("data-pui-toast-description") ?? undefined,
                variant: variant === "success" || variant === "error" || variant === "warning" || variant === "info" ? variant : undefined,
                duration: duration === null ? undefined : Number(duration),
            });
        });
    }
}
