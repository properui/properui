/**
 * Accessibility of every snippet in src/components: rendered into jsdom as authored, again after
 * `init()` (which adds roles, ARIA and the tooltip elements), and, for dropdowns, with the menu
 * open. Zero axe violations in all three states. The page examples run as whole documents.
 */
import axe from "axe-core";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { init } from "./js/init";

const componentsDir = join(dirname(fileURLToPath(import.meta.url)), "components");

const snippets = readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
        readdirSync(join(componentsDir, dir.name))
            .filter((file) => file.endsWith(".html"))
            .map((file) => join(componentsDir, dir.name, file)),
    )
    .sort();

const isPage = (html: string) => /<!doctype html>/i.test(html);

function render(html: string): void {
    if (isPage(html)) {
        const parsed = new DOMParser().parseFromString(html, "text/html");
        document.documentElement.lang = parsed.documentElement.lang;
        document.head.innerHTML = parsed.head.innerHTML;
        document.body.innerHTML = parsed.body.innerHTML;
    } else {
        document.documentElement.lang = "en";
        document.head.innerHTML = "<title>Snippet</title>";
        document.body.innerHTML = `<main>${html}</main>`;
    }
}

async function violations(page: boolean) {
    const results = await axe.run(document, {
        resultTypes: ["violations"],
        rules: {
            // jsdom does no layout, so contrast cannot be computed there.
            "color-contrast": { enabled: false },
            // A fragment is not a page: it has no h1 of its own.
            "page-has-heading-one": { enabled: page },
        },
    });
    return results.violations.map((v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.html).join("\n  ")}`);
}

describe("snippets have no axe violations", () => {
    it("found the snippets", () => {
        expect(snippets.length).toBeGreaterThanOrEqual(30);
    });

    for (const file of snippets) {
        const name = relative(componentsDir, file);
        it(name, async () => {
            const html = readFileSync(file, "utf8");
            const page = isPage(html);
            render(html);
            expect(await violations(page), "as authored").toEqual([]);

            init();
            expect(await violations(page), "after init()").toEqual([]);

            const trigger = document.querySelector<HTMLElement>('[data-pui="dropdown"] .pui-dropdown__trigger');
            if (trigger) {
                trigger.click();
                expect(trigger.getAttribute("aria-expanded")).toBe("true");
                expect(await violations(page), "with the menu open").toEqual([]);
                document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
            }
        });
    }
});
