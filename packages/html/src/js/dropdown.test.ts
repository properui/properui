import { beforeEach, describe, expect, it, vi } from "vitest";
import { initDropdowns } from "./dropdown";

const markup = `
    <button id="outside" type="button">Outside</button>
    <div class="pui-dropdown" data-pui="dropdown">
        <button class="pui-btn pui-dropdown__trigger" type="button">Options</button>
        <div class="pui-menu" hidden>
            <button class="pui-menu__item" type="button">Edit</button>
            <button class="pui-menu__item" type="button" disabled>Archive</button>
            <button class="pui-menu__item" type="button">Duplicate</button>
            <div class="pui-menu__separator"></div>
            <a class="pui-menu__item" href="#delete">Delete</a>
        </div>
    </div>`;

const get = () => {
    const trigger = document.querySelector<HTMLButtonElement>(".pui-dropdown__trigger")!;
    const menu = document.querySelector<HTMLElement>(".pui-menu")!;
    const items = Array.from(menu.querySelectorAll<HTMLElement>(".pui-menu__item"));
    return { trigger, menu, items };
};

const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));

describe("initDropdowns", () => {
    beforeEach(() => {
        document.body.innerHTML = markup;
        initDropdowns();
    });

    it("sets the menu button and menu ARIA", () => {
        const { trigger, menu, items } = get();
        expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(trigger.getAttribute("aria-controls")).toBe(menu.id);
        expect(menu.getAttribute("role")).toBe("menu");
        expect(menu.getAttribute("aria-labelledby")).toBe(trigger.id);
        expect(menu.hidden).toBe(true);
        expect(items.every((item) => item.getAttribute("role") === "menuitem")).toBe(true);
        expect(items[1]!.getAttribute("aria-disabled")).toBe("true");
        expect(menu.querySelector(".pui-menu__separator")!.getAttribute("role")).toBe("separator");
    });

    it("opens on click, focuses the first item, and toggles aria-expanded", () => {
        const { trigger, menu, items } = get();
        trigger.click();
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
        expect(menu.hidden).toBe(false);
        expect(document.activeElement).toBe(items[0]);
        trigger.click();
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(menu.hidden).toBe(true);
    });

    it("moves with the arrow keys, skipping disabled items and wrapping", () => {
        const { trigger, menu, items } = get();
        trigger.click();
        key(menu, "ArrowDown");
        expect(document.activeElement).toBe(items[2]);
        key(menu, "ArrowDown");
        expect(document.activeElement).toBe(items[3]);
        key(menu, "ArrowDown");
        expect(document.activeElement).toBe(items[0]);
        key(menu, "End");
        expect(document.activeElement).toBe(items[3]);
        key(menu, "Home");
        expect(document.activeElement).toBe(items[0]);
        key(menu, "d");
        expect(document.activeElement).toBe(items[2]);
    });

    it("opens from the keyboard: ArrowDown focuses the first item, ArrowUp the last", () => {
        const { trigger, items } = get();
        key(trigger, "ArrowUp");
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(items[3]);
    });

    it("closes on Escape and returns focus to the trigger", () => {
        const { trigger, menu } = get();
        trigger.click();
        key(menu, "Escape");
        expect(menu.hidden).toBe(true);
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(trigger);
    });

    it("closes on a click outside", () => {
        const { trigger, menu } = get();
        trigger.click();
        expect(menu.hidden).toBe(false);
        const outside = document.getElementById("outside")!;
        outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        outside.click();
        expect(menu.hidden).toBe(true);
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });

    it("fires pui:select and closes when an item is chosen", () => {
        const { trigger, menu, items } = get();
        const onSelect = vi.fn();
        document.addEventListener("pui:select", onSelect);
        trigger.click();
        items[2]!.click();
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect((onSelect.mock.calls[0]![0] as CustomEvent).detail.value).toBe("Duplicate");
        expect(menu.hidden).toBe(true);
        document.removeEventListener("pui:select", onSelect);
    });
});
