import { describe, expect, it } from "vitest";
import { initAccordions } from "./accordion";

const markup = (exclusive: boolean) => `
    <div class="pui-accordion" data-pui="accordion" ${exclusive ? "data-pui-exclusive" : ""}>
        <details class="pui-accordion__item" open><summary class="pui-accordion__trigger">One</summary><div class="pui-accordion__panel">1</div></details>
        <details class="pui-accordion__item"><summary class="pui-accordion__trigger">Two</summary><div class="pui-accordion__panel">2</div></details>
        <details class="pui-accordion__item"><summary class="pui-accordion__trigger">Three</summary><div class="pui-accordion__panel">3</div></details>
    </div>`;

const items = () => Array.from(document.querySelectorAll<HTMLDetailsElement>("details"));

/** Opens an item the way a click on its summary does, and lets the `toggle` event run. */
const open = async (details: HTMLDetailsElement) => {
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
    await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("initAccordions", () => {
    it("keeps one item open in exclusive mode", async () => {
        document.body.innerHTML = markup(true);
        initAccordions();
        const [one, two, three] = items();
        await open(two!);
        expect(items().map((d) => d.open)).toEqual([false, true, false]);
        await open(three!);
        expect(items().map((d) => d.open)).toEqual([false, false, true]);
        expect(one!.getAttribute("name")).toBe(two!.getAttribute("name"));
    });

    it("lets several items stay open without data-pui-exclusive", async () => {
        document.body.innerHTML = markup(false);
        initAccordions();
        const [, two] = items();
        await open(two!);
        expect(items().map((d) => d.open)).toEqual([true, true, false]);
        expect(items()[0]!.hasAttribute("name")).toBe(false);
    });

    it("links each summary to its panel", () => {
        document.body.innerHTML = markup(false);
        initAccordions();
        for (const details of items()) {
            const panel = details.querySelector(".pui-accordion__panel")!;
            expect(details.querySelector("summary")!.getAttribute("aria-controls")).toBe(panel.id);
        }
    });
});
