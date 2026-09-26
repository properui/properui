import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initTooltips } from "./tooltip";

describe("initTooltips", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = `<button id="t" type="button" aria-describedby="extra" data-pui-tooltip="Copy link">Share</button><p id="extra">More</p>`;
        initTooltips();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const parts = () => ({ trigger: document.getElementById("t")!, tip: document.querySelector<HTMLElement>(".pui-tooltip")! });

    it('creates a role="tooltip" element and links it with aria-describedby', () => {
        const { trigger, tip } = parts();
        expect(tip.getAttribute("role")).toBe("tooltip");
        expect(tip.textContent).toBe("Copy link");
        expect(tip.hidden).toBe(true);
        expect(trigger.getAttribute("aria-describedby")!.split(" ")).toEqual(["extra", tip.id]);
    });

    it("shows after the hover delay and hides on leave and Escape", () => {
        const { trigger, tip } = parts();
        trigger.dispatchEvent(new MouseEvent("mouseenter"));
        expect(tip.hidden).toBe(true);
        vi.advanceTimersByTime(300);
        expect(tip.hidden).toBe(false);
        trigger.dispatchEvent(new MouseEvent("mouseleave"));
        expect(tip.hidden).toBe(true);
        trigger.dispatchEvent(new MouseEvent("mouseenter"));
        vi.advanceTimersByTime(300);
        trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        expect(tip.hidden).toBe(true);
    });

    it("flips below the trigger when there is no room above", () => {
        const { trigger, tip } = parts();
        vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 4, 80, 32));
        vi.spyOn(tip, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 120, 30));
        trigger.focus();
        expect(tip.hidden).toBe(false);
        expect(tip.getAttribute("data-placement")).toBe("bottom");
        expect(parseFloat(tip.style.top)).toBeGreaterThan(36);
    });

    it("sits above the trigger when there is room", () => {
        const { trigger, tip } = parts();
        vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 400, 80, 32));
        vi.spyOn(tip, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 120, 30));
        trigger.focus();
        expect(tip.getAttribute("data-placement")).toBe("top");
        expect(parseFloat(tip.style.top)).toBeLessThan(400);
    });

    it("does not create a second tooltip when initialised again", () => {
        initTooltips();
        initTooltips(document.body);
        expect(document.querySelectorAll(".pui-tooltip")).toHaveLength(1);
    });
});
