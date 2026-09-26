import { claim, queryAll } from "./dom";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const QUERY = "(prefers-color-scheme: dark)";

let systemListener: ((event: MediaQueryListEvent) => void) | undefined;

function media(): MediaQueryList | undefined {
    return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(QUERY) : undefined;
}

function apply(dark: boolean): void {
    const html = document.documentElement;
    html.classList.toggle("dark-mode", dark);
    html.classList.toggle("light-mode", !dark);
    html.style.colorScheme = dark ? "dark" : "light";
    for (const toggle of Array.from(document.querySelectorAll<HTMLElement>('[data-pui="theme-toggle"]'))) {
        toggle.setAttribute("aria-pressed", String(dark));
    }
}

/**
 * Switches the theme: `.dark-mode` (or `.light-mode`) on `<html>`, which repoints every token.
 * `"system"` follows `prefers-color-scheme` and keeps following it while it stays selected.
 * The choice is saved in `localStorage` under `"theme"`, the same key and values the React
 * `ThemeProvider` (next-themes) uses, so a page mixing both layers agrees.
 */
export function setTheme(theme: Theme): void {
    if (typeof document === "undefined") return;
    const mq = media();
    if (systemListener && mq) {
        mq.removeEventListener("change", systemListener);
        systemListener = undefined;
    }
    if (theme === "system") {
        apply(Boolean(mq?.matches));
        if (mq) {
            systemListener = (event) => apply(event.matches);
            mq.addEventListener("change", systemListener);
        }
    } else {
        apply(theme === "dark");
    }
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Storage can be unavailable (private mode, blocked cookies); the theme still applies.
    }
}

/** The saved theme, or `"system"` when nothing (valid) is saved. */
export function getTheme(): Theme {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") return saved;
    } catch {
        // Fall through to the default.
    }
    return "system";
}

let restored = false;

/** Re-applies a theme saved by `setTheme` (once per page), so a reload keeps the choice. */
export function restoreTheme(): void {
    if (restored || typeof document === "undefined") return;
    restored = true;
    try {
        if (localStorage.getItem(STORAGE_KEY)) setTheme(getTheme());
    } catch {
        // No storage, nothing to restore.
    }
}

/** `[data-pui="theme-toggle"]` buttons flip between light and dark (`aria-pressed` reflects dark). */
export function initThemeToggles(root: ParentNode = document): void {
    const toggles = queryAll(root, '[data-pui="theme-toggle"]');
    for (const toggle of toggles) {
        if (!claim(toggle, "theme-toggle")) continue;
        toggle.setAttribute("aria-pressed", String(document.documentElement.classList.contains("dark-mode")));
        toggle.addEventListener("click", () => {
            setTheme(document.documentElement.classList.contains("dark-mode") ? "light" : "dark");
        });
    }
}
