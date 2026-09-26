import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initToastTriggers, toast } from "./toast";

describe("toast", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("creates the polite live region once and renders the toast in it", () => {
        toast({ title: "Saved", description: "All good.", variant: "success" });
        toast({ title: "Second" });
        const regions = document.querySelectorAll(".pui-toaster");
        expect(regions).toHaveLength(1);
        expect(regions[0]!.getAttribute("aria-live")).toBe("polite");
        const toasts = document.querySelectorAll(".pui-toast");
        expect(toasts).toHaveLength(2);
        expect(toasts[0]!.classList.contains("pui-toast--success")).toBe(true);
        expect(toasts[0]!.querySelector(".pui-toast__title")!.textContent).toBe("Saved");
        expect(toasts[0]!.querySelector(".pui-toast__description")!.textContent).toBe("All good.");
        expect(toasts[1]!.classList.contains("pui-toast--info")).toBe(true);
    });

    it("dismisses itself after the duration", () => {
        toast({ title: "Bye", duration: 2000 });
        expect(document.querySelectorAll(".pui-toast")).toHaveLength(1);
        vi.advanceTimersByTime(1999);
        expect(document.querySelector(".pui-toast")!.getAttribute("data-state")).toBeNull();
        vi.advanceTimersByTime(1);
        expect(document.querySelector(".pui-toast")!.getAttribute("data-state")).toBe("closing");
        vi.advanceTimersByTime(200);
        expect(document.querySelectorAll(".pui-toast")).toHaveLength(0);
    });

    it("stays with duration 0 until its close button is pressed", () => {
        toast({ title: "Sticky", duration: 0 });
        vi.advanceTimersByTime(60_000);
        const el = document.querySelector(".pui-toast")!;
        expect(el).not.toBeNull();
        el.querySelector<HTMLButtonElement>(".pui-toast__close")!.click();
        vi.advanceTimersByTime(200);
        expect(document.querySelector(".pui-toast")).toBeNull();
    });

    it("treats the title as text, not HTML", () => {
        toast({ title: '<img src=x onerror="alert(1)">' });
        const title = document.querySelector(".pui-toast__title")!;
        expect(title.querySelector("img")).toBeNull();
        expect(title.textContent).toContain("<img");
    });

    it("shows a toast from a data-pui-toast button", () => {
        document.body.innerHTML = `<button type="button" data-pui-toast="Exported" data-pui-toast-variant="warning" data-pui-toast-duration="0">Export</button>`;
        initToastTriggers();
        initToastTriggers();
        document.querySelector("button")!.click();
        const toasts = document.querySelectorAll(".pui-toast");
        expect(toasts).toHaveLength(1);
        expect(toasts[0]!.classList.contains("pui-toast--warning")).toBe(true);
    });
});
