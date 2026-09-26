import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTheme, initThemeToggles, setTheme } from "./theme";

type Listener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initial: boolean) {
    const listeners = new Set<Listener>();
    const mql = {
        matches: initial,
        media: "(prefers-color-scheme: dark)",
        addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
        removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    };
    window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList);
    return {
        change(matches: boolean) {
            mql.matches = matches;
            for (const listener of listeners) listener({ matches } as MediaQueryListEvent);
        },
        listeners,
    };
}

const html = () => document.documentElement.classList;

describe("setTheme", () => {
    beforeEach(() => {
        localStorage.clear();
        html().remove("dark-mode", "light-mode");
    });

    afterEach(() => {
        // @ts-expect-error: jsdom has no matchMedia; remove the mock again.
        delete window.matchMedia;
    });

    it('toggles .dark-mode on <html> and persists the choice under "theme"', () => {
        setTheme("dark");
        expect(html().contains("dark-mode")).toBe(true);
        expect(localStorage.getItem("theme")).toBe("dark");
        expect(getTheme()).toBe("dark");
        setTheme("light");
        expect(html().contains("dark-mode")).toBe(false);
        expect(html().contains("light-mode")).toBe(true);
        expect(localStorage.getItem("theme")).toBe("light");
    });

    it("follows prefers-color-scheme for system, and keeps following it", () => {
        const media = mockMatchMedia(true);
        setTheme("system");
        expect(html().contains("dark-mode")).toBe(true);
        expect(localStorage.getItem("theme")).toBe("system");
        media.change(false);
        expect(html().contains("dark-mode")).toBe(false);
        setTheme("dark");
        expect(media.listeners.size).toBe(0);
        media.change(false);
        expect(html().contains("dark-mode")).toBe(true);
    });

    it("works without matchMedia (system falls back to light)", () => {
        setTheme("system");
        expect(html().contains("dark-mode")).toBe(false);
    });

    it('flips the theme from a data-pui="theme-toggle" button and reflects it in aria-pressed', () => {
        document.body.innerHTML = `<button type="button" data-pui="theme-toggle" aria-label="Dark mode">Theme</button>`;
        initThemeToggles();
        const button = document.querySelector("button")!;
        expect(button.getAttribute("aria-pressed")).toBe("false");
        button.click();
        expect(html().contains("dark-mode")).toBe(true);
        expect(button.getAttribute("aria-pressed")).toBe("true");
        button.click();
        expect(html().contains("dark-mode")).toBe(false);
    });
});
