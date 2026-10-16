/**
 * Thin wrapper over the Umami tracker, which the root layout loads only when
 * `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set at build time. Cookieless, no personal data: event names
 * and short labels only. Safe to call anywhere; it is a no-op without the script.
 */
declare global {
    interface Window {
        umami?: { track: (event: string, data?: Record<string, string | number | boolean>) => void };
    }
}

export const ANALYTICS_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
export const ANALYTICS_SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "https://cloud.umami.is/script.js";

export function track(event: string, data?: Record<string, string | number | boolean>): void {
    if (typeof window === "undefined") return;
    try {
        window.umami?.track(event, data);
    } catch {
        // Analytics must never break the page.
    }
}

/** A short, non-identifying label for a copied value (the command's first words). */
export const copyLabel = (value: string): string => value.trim().split(/\s+/).slice(0, 5).join(" ").slice(0, 60);
