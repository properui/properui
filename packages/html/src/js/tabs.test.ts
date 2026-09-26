import { beforeEach, describe, expect, it } from "vitest";
import { initTabs } from "./tabs";

const markup = (dir = "ltr") => `
    <div dir="${dir}">
        <div class="pui-tabs" data-pui="tabs">
            <div class="pui-tabs__list" aria-label="Settings">
                <button class="pui-tab" type="button">One</button>
                <button class="pui-tab" type="button" aria-selected="true">Two</button>
                <button class="pui-tab" type="button">Three</button>
            </div>
            <div class="pui-tabs__panel">Panel one</div>
            <div class="pui-tabs__panel">Panel two</div>
            <div class="pui-tabs__panel">Panel three</div>
        </div>
    </div>`;

const parts = () => ({
    list: document.querySelector<HTMLElement>(".pui-tabs__list")!,
    tabs: Array.from(document.querySelectorAll<HTMLElement>(".pui-tab")),
    panels: Array.from(document.querySelectorAll<HTMLElement>(".pui-tabs__panel")),
});

const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));

const selected = () => parts().tabs.map((tab) => tab.getAttribute("aria-selected"));

describe("initTabs", () => {
    beforeEach(() => {
        document.body.innerHTML = markup();
        initTabs();
    });

    it("sets roles, pairs tabs with panels and honours the authored selection", () => {
        const { list, tabs, panels } = parts();
        expect(list.getAttribute("role")).toBe("tablist");
        tabs.forEach((tab, index) => {
            expect(tab.getAttribute("role")).toBe("tab");
            expect(tab.getAttribute("aria-controls")).toBe(panels[index]!.id);
            expect(panels[index]!.getAttribute("role")).toBe("tabpanel");
            expect(panels[index]!.getAttribute("aria-labelledby")).toBe(tab.id);
        });
        expect(selected()).toEqual(["false", "true", "false"]);
        expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"]);
        expect(panels.map((panel) => panel.hidden)).toEqual([true, false, true]);
    });

    it("moves and selects with the arrow keys, wrapping at the ends, and Home/End", () => {
        const { tabs, panels } = parts();
        tabs[1]!.focus();
        key(tabs[1]!, "ArrowRight");
        expect(selected()).toEqual(["false", "false", "true"]);
        expect(document.activeElement).toBe(tabs[2]);
        expect(panels[2]!.hidden).toBe(false);
        key(tabs[2]!, "ArrowRight");
        expect(selected()).toEqual(["true", "false", "false"]);
        key(tabs[0]!, "ArrowLeft");
        expect(selected()).toEqual(["false", "false", "true"]);
        key(tabs[2]!, "Home");
        expect(selected()).toEqual(["true", "false", "false"]);
        key(tabs[0]!, "End");
        expect(selected()).toEqual(["false", "false", "true"]);
        expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual(["-1", "-1", "0"]);
    });

    it("selects on click", () => {
        const { tabs, panels } = parts();
        tabs[0]!.click();
        expect(selected()).toEqual(["true", "false", "false"]);
        expect(panels.map((panel) => panel.hidden)).toEqual([false, true, true]);
    });

    it("mirrors the arrow keys in RTL", () => {
        document.body.innerHTML = markup("rtl");
        initTabs();
        const { tabs } = parts();
        key(tabs[1]!, "ArrowLeft");
        expect(selected()).toEqual(["false", "false", "true"]);
    });
});
