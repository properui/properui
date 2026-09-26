import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./init";

const markup = `
    <div class="pui-dropdown" data-pui="dropdown">
        <button class="pui-dropdown__trigger" type="button" data-pui-tooltip="More">Menu</button>
        <div class="pui-menu" hidden><button class="pui-menu__item" type="button">A</button></div>
    </div>
    <div class="pui-tabs" data-pui="tabs">
        <div class="pui-tabs__list" aria-label="T"><button class="pui-tab" type="button">One</button><button class="pui-tab" type="button">Two</button></div>
        <div class="pui-tabs__panel">1</div><div class="pui-tabs__panel">2</div>
    </div>
    <div class="pui-accordion" data-pui="accordion" data-pui-exclusive>
        <details><summary>One</summary><div class="pui-accordion__panel">1</div></details>
    </div>
    <button id="open" type="button" data-pui-modal-open="d">Open</button>
    <dialog class="pui-modal" id="d"><button type="button" data-pui-modal-close>Close</button></dialog>
    <button id="toast" type="button" data-pui-toast="Hi" data-pui-toast-duration="0">Toast</button>`;

describe("init", () => {
    beforeEach(() => {
        document.body.innerHTML = markup;
    });

    it("initialises every behaviour once, however often it runs", () => {
        init();
        init();
        init(document.body);
        const trigger = document.querySelector<HTMLButtonElement>(".pui-dropdown__trigger")!;
        expect(trigger.getAttribute("data-pui-ready")).toBe("tooltip");
        expect(document.querySelector('[data-pui="dropdown"]')!.getAttribute("data-pui-ready")).toBe("dropdown");
        expect(document.querySelector('[data-pui="tabs"]')!.getAttribute("data-pui-ready")).toBe("tabs");
        expect(document.querySelectorAll(".pui-tooltip")).toHaveLength(1);

        // One click listener, not three: a click opens, a second click closes.
        trigger.click();
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
        trigger.click();
        expect(trigger.getAttribute("aria-expanded")).toBe("false");

        document.getElementById("toast")!.click();
        expect(document.querySelectorAll(".pui-toast")).toHaveLength(1);
    });

    it("picks up markup added after the first run when called on the new subtree", () => {
        init();
        const added = document.createElement("div");
        added.innerHTML = `<div class="pui-tabs" data-pui="tabs"><div class="pui-tabs__list" aria-label="New"><button class="pui-tab" type="button">A</button></div><div class="pui-tabs__panel">a</div></div>`;
        document.body.append(added);
        init(added);
        expect(added.querySelector(".pui-tab")!.getAttribute("aria-selected")).toBe("true");
        expect(document.querySelector('[data-pui="tabs"]')!.getAttribute("data-pui-ready")).toBe("tabs");
    });
});
