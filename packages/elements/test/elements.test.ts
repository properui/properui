import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PuiButton, PuiInput, PuiModal, PuiPagination, defineElements, elements, pageRange } from "../src/index";

beforeAll(() => defineElements());

afterEach(() => {
    document.body.replaceChildren();
});

/** Parses markup into the document and waits for elements that initialise on a microtask (tabs, tooltips). */
async function mount<T extends Element = HTMLElement>(markup: string): Promise<T> {
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    return host.firstElementChild as T;
}

describe("registration", () => {
    it("defines every element", () => {
        for (const [tag, cls] of Object.entries(elements)) expect(customElements.get(tag)).toBe(cls);
    });

    it("is idempotent", () => {
        expect(() => defineElements()).not.toThrow();
    });

    it("injects the host display defaults once, first in <head>", () => {
        defineElements();
        const styles = document.querySelectorAll("style[data-pui-elements]");
        expect(styles).toHaveLength(1);
        expect(document.head.firstElementChild).toBe(styles[0]);
    });
});

describe("pui-button", () => {
    it("renders a .pui-btn <button> with the content moved inside", async () => {
        const el = await mount<PuiButton>(`<pui-button>Save</pui-button>`);
        const button = el.querySelector("button")!;
        expect(button.className).toBe("pui-btn pui-btn--primary pui-btn--sm");
        expect(button.type).toBe("button");
        expect(button.textContent).toBe("Save");
        expect(el.children).toHaveLength(1);
    });

    it.each([
        ["primary", "pui-btn--primary"],
        ["secondary", "pui-btn--secondary"],
        ["tertiary", "pui-btn--tertiary"],
        ["link-color", "pui-btn--link"],
        ["link-gray", "pui-btn--link-gray"],
        ["primary-destructive", "pui-btn--primary-destructive"],
        ["secondary-destructive", "pui-btn--secondary-destructive"],
        ["tertiary-destructive", "pui-btn--tertiary-destructive"],
    ])("maps color=%s to %s", async (color, expected) => {
        const el = await mount(`<pui-button color="${color}">Go</pui-button>`);
        expect(el.querySelector("button")!.classList).toContain(expected);
    });

    it.each(["sm", "md", "lg", "xl"])("maps size=%s", async (size) => {
        const el = await mount(`<pui-button size="${size}">Go</pui-button>`);
        expect(el.querySelector("button")!.classList).toContain(`pui-btn--${size}`);
    });

    it("updates classes in place when attributes change, keeping the same <button>", async () => {
        const el = await mount<PuiButton>(`<pui-button>Go</pui-button>`);
        const button = el.querySelector("button")!;
        el.setAttribute("color", "secondary");
        el.size = "lg";
        expect(el.querySelector("button")).toBe(button);
        expect(button.className).toBe("pui-btn pui-btn--secondary pui-btn--lg");
    });

    it("reflects is-disabled between the property and the attribute", async () => {
        const el = await mount<PuiButton>(`<pui-button is-disabled>Go</pui-button>`);
        const button = el.querySelector("button")!;
        expect(el.isDisabled).toBe(true);
        expect(button.disabled).toBe(true);

        el.isDisabled = false;
        expect(el.hasAttribute("is-disabled")).toBe(false);
        expect(button.disabled).toBe(false);

        el.isDisabled = true;
        expect(el.getAttribute("is-disabled")).toBe("");
        expect(button.disabled).toBe(true);

        // Vue 3 and Angular attribute bindings write the string "false" for a false value.
        el.setAttribute("is-disabled", "false");
        expect(el.isDisabled).toBe(false);
        expect(button.disabled).toBe(false);
    });

    it("is-loading marks the button busy and disables it", async () => {
        const el = await mount(`<pui-button is-loading>Save</pui-button>`);
        const button = el.querySelector("button")!;
        expect(button.hasAttribute("data-loading")).toBe(true);
        expect(button.getAttribute("aria-busy")).toBe("true");
        expect(button.disabled).toBe(true);
    });

    it("renders an <a> for href, and an inert link when disabled", async () => {
        const el = await mount<PuiButton>(`<pui-button href="/docs" color="secondary">Docs</pui-button>`);
        const link = el.querySelector("a")!;
        expect(link.getAttribute("href")).toBe("/docs");
        expect(link.className).toContain("pui-btn--secondary");
        el.isDisabled = true;
        expect(link.hasAttribute("href")).toBe(false);
        expect(link.getAttribute("aria-disabled")).toBe("true");
    });

    it("places slotted icons around the label and marks icon-only buttons", async () => {
        const el = await mount(`<pui-button><span slot="icon-leading"><svg></svg></span>Next<span slot="icon-trailing"><svg></svg></span></pui-button>`);
        const button = el.querySelector("button")!;
        const [first, , last] = Array.from(button.children);
        expect(first!.getAttribute("data-icon")).toBe("leading");
        expect(first!.classList).toContain("pui-btn__icon");
        expect(last!.getAttribute("data-icon")).toBe("trailing");

        const iconOnly = await mount(`<pui-button label="Settings"><span slot="icon-leading"><svg></svg></span></pui-button>`);
        const b = iconOnly.querySelector("button")!;
        expect(b.classList).toContain("pui-btn--icon-only");
        expect(b.getAttribute("aria-label")).toBe("Settings");
    });

    it("does not render twice when moved", async () => {
        const el = await mount(`<pui-button>Go</pui-button>`);
        const button = el.querySelector("button")!;
        const other = document.createElement("section");
        document.body.append(other);
        other.append(el);
        expect(el.querySelectorAll("button")).toHaveLength(1);
        expect(el.querySelector("button")).toBe(button);
    });

    it("forwards framework-style child patches into the rendered markup", async () => {
        const el = await mount(`<pui-button>Old</pui-button>`);
        const button = el.querySelector("button")!;
        // Vue patches a single text child with `textContent =`.
        el.textContent = "New";
        expect(el.querySelector("button")).toBe(button);
        expect(button.textContent).toBe("New");

        // Svelte and Vue insert before an anchor that has moved inside the button.
        const anchor = button.querySelector("[data-text]")!.firstChild!;
        const extra = document.createElement("b");
        el.insertBefore(extra, anchor);
        expect(extra.parentElement!.hasAttribute("data-text")).toBe(true);
        el.removeChild(extra);
        expect(extra.isConnected).toBe(false);

        // A plain append lands in the label, not beside the button.
        el.appendChild(document.createTextNode("!"));
        await Promise.resolve();
        expect(el.children).toHaveLength(1);
        expect(button.textContent).toBe("New!");
    });

    it("submits its form when type=submit", async () => {
        const form = await mount<HTMLFormElement>(`<form><pui-button type="submit">Send</pui-button></form>`);
        const onSubmit = vi.fn((event: Event) => event.preventDefault());
        form.addEventListener("submit", onSubmit);
        form.querySelector("button")!.click();
        expect(onSubmit).toHaveBeenCalledOnce();
    });
});

describe("pui-badge and pui-avatar", () => {
    it("puts the badge classes on the host and keeps author classes", async () => {
        const el = await mount(`<pui-badge class="mine" color="success" size="sm" dot>Active</pui-badge>`);
        expect(Array.from(el.classList)).toEqual(["mine", "pui-badge", "pui-badge--success", "pui-badge--sm", "pui-badge--dot", "pui-badge--pill"]);
        el.setAttribute("color", "error");
        expect(el.classList).toContain("pui-badge--error");
        expect(el.classList).not.toContain("pui-badge--success");
        expect(el.classList).toContain("mine");
        expect(el.textContent).toBe("Active");
    });

    it("shows initials with an accessible name when there is no image", async () => {
        const el = await mount(`<pui-avatar initials="OR" alt="Olivia Rhye" size="lg" status="online"></pui-avatar>`);
        expect(el.className).toBe("pui-avatar pui-avatar--lg");
        expect(el.getAttribute("role")).toBe("img");
        expect(el.getAttribute("aria-label")).toBe("Olivia Rhye");
        expect(el.querySelector(".pui-avatar__initials")!.textContent).toBe("OR");
        expect(el.querySelector(".pui-avatar__status--online")).not.toBeNull();
        el.setAttribute("src", "/a.png");
        expect(el.querySelector("img")!.getAttribute("alt")).toBe("Olivia Rhye");
        expect(el.hasAttribute("role")).toBe(false);
    });
});

describe("pui-input", () => {
    it("renders a labelled field and exposes .value", async () => {
        const el = await mount<PuiInput>(`<pui-input label="Email" hint="Work address" name="email" type="email" value="a@b.co"></pui-input>`);
        const input = el.querySelector("input")!;
        const label = el.querySelector("label")!;
        expect(input.className).toBe("pui-input pui-input--md");
        expect(input.type).toBe("email");
        expect(label.htmlFor).toBe(input.id);
        expect(label.textContent).toBe("Email");
        expect(input.getAttribute("aria-describedby")).toBe(el.querySelector(".pui-hint")!.id);
        expect(el.value).toBe("a@b.co");

        el.value = "c@d.co";
        expect(input.value).toBe("c@d.co");
    });

    it("re-dispatches input and change from the host with the current value", async () => {
        const el = await mount<PuiInput>(`<pui-input label="Name"></pui-input>`);
        const input = el.querySelector("input")!;
        const seen: [string, EventTarget | null, string][] = [];
        for (const type of ["input", "change"]) el.addEventListener(type, (e) => seen.push([e.type, e.target, (e.target as PuiInput).value]));
        input.value = "Ada";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        expect(seen).toEqual([
            ["input", el, "Ada"],
            ["change", el, "Ada"],
        ]);
    });

    it("error sets aria-invalid and replaces the hint", async () => {
        const el = await mount(`<pui-input label="Email" hint="Hint" error="Required"></pui-input>`);
        const input = el.querySelector("input")!;
        expect(input.getAttribute("aria-invalid")).toBe("true");
        const message = el.querySelector(".pui-error")!;
        expect(message.textContent).toBe("Required");
        expect(input.getAttribute("aria-describedby")).toBe(message.id);
    });

    it("keeps the same <input> (and focus) across attribute changes", async () => {
        const el = await mount(`<pui-input label="Name"></pui-input>`);
        const input = el.querySelector("input")!;
        input.focus();
        el.setAttribute("error", "Too short");
        el.setAttribute("size", "sm");
        expect(el.querySelector("input")).toBe(input);
        expect(document.activeElement).toBe(input);
        expect(input.className).toBe("pui-input pui-input--sm");
    });

    it("takes part in a form through the inner input where ElementInternals cannot submit (jsdom)", async () => {
        const form = await mount<HTMLFormElement>(`<form><pui-input label="Email" name="email" value="a@b.co"></pui-input></form>`);
        const el = form.querySelector<PuiInput>("pui-input")!;
        expect(new FormData(form).get("email")).toBe("a@b.co");
        el.value = "x@y.co";
        expect(new FormData(form).get("email")).toBe("x@y.co");
        expect(el.form).toBe(form);
    });

    it("is form-associated through ElementInternals when the browser supports it", async () => {
        expect((PuiInput as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
        const setFormValue = vi.fn();
        const setValidity = vi.fn();
        const original = HTMLElement.prototype.attachInternals;
        HTMLElement.prototype.attachInternals = function () {
            return {
                setFormValue,
                setValidity,
                form: null,
                validity: { valid: true },
                validationMessage: "",
                checkValidity: () => true,
                reportValidity: () => true,
            } as unknown as ElementInternals;
        };
        try {
            const form = await mount<HTMLFormElement>(`<form><pui-input label="Email" name="email" value="a@b.co" required></pui-input></form>`);
            const el = form.querySelector<PuiInput>("pui-input")!;
            const input = el.querySelector("input")!;
            // The host submits the value, so the inner input must not submit it a second time.
            expect(input.hasAttribute("name")).toBe(false);
            expect(setFormValue).toHaveBeenLastCalledWith("a@b.co");
            input.value = "typed";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            expect(setFormValue).toHaveBeenLastCalledWith("typed");
            el.setAttribute("error", "Taken");
            expect(setValidity).toHaveBeenLastCalledWith({ customError: true }, "Taken", input);

            // A form reset restores the `value` attribute.
            (el as unknown as { formResetCallback(): void }).formResetCallback();
            expect(el.value).toBe("a@b.co");
            expect(setFormValue).toHaveBeenLastCalledWith("a@b.co");
        } finally {
            HTMLElement.prototype.attachInternals = original;
        }
    });
});

describe("pui-checkbox, pui-toggle, pui-select, pui-textarea", () => {
    it("checkbox exposes .checked and submits its value when checked", async () => {
        const form = await mount<HTMLFormElement>(`<form><pui-checkbox name="terms" value="yes">Accept the terms</pui-checkbox></form>`);
        const el = form.querySelector("pui-checkbox") as HTMLElement & { checked: boolean };
        const input = el.querySelector("input")!;
        expect(el.querySelector(".pui-checkbox__label")!.textContent).toBe("Accept the terms");
        expect(new FormData(form).get("terms")).toBeNull();
        el.checked = true;
        expect(input.checked).toBe(true);
        expect(new FormData(form).get("terms")).toBe("yes");
    });

    it("toggle is a switch", async () => {
        const el = await mount(`<pui-toggle label="Email alerts" checked size="md"></pui-toggle>`);
        const input = el.querySelector("input")!;
        expect(input.getAttribute("role")).toBe("switch");
        expect(input.checked).toBe(true);
        expect(el.querySelector("label")!.className).toBe("pui-toggle pui-toggle--md");
    });

    it("select takes its options from its children", async () => {
        const el = await mount<HTMLElement & { value: string }>(
            `<pui-select label="Country" value="ca"><option value="us">United States</option><option value="ca">Canada</option></pui-select>`,
        );
        const select = el.querySelector("select")!;
        expect(select.options).toHaveLength(2);
        expect(select.value).toBe("ca");
        expect(el.value).toBe("ca");
        expect(select.parentElement!.className).toBe("pui-select pui-select--md");
    });

    it("textarea renders rows", async () => {
        const el = await mount(`<pui-textarea label="Bio" rows="6"></pui-textarea>`);
        expect(el.querySelector("textarea")!.rows).toBe(6);
    });
});

describe("pui-tabs", () => {
    const markup = `
        <pui-tabs label="Settings">
            <pui-tab value="account">Account</pui-tab>
            <pui-tab value="billing">Billing</pui-tab>
            <pui-tab value="team">Team</pui-tab>
            <pui-tab-panel value="account">Account panel</pui-tab-panel>
            <pui-tab-panel value="billing">Billing panel</pui-tab-panel>
            <pui-tab-panel value="team">Team panel</pui-tab-panel>
        </pui-tabs>`;

    it("renders the tab list and wires roles through the html behaviour", async () => {
        const el = await mount(markup);
        const list = el.querySelector(".pui-tabs__list")!;
        expect(el.classList).toContain("pui-tabs");
        expect(list.getAttribute("role")).toBe("tablist");
        expect(list.getAttribute("aria-label")).toBe("Settings");
        const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>("button.pui-tab"));
        expect(tabs).toHaveLength(3);
        expect(tabs.map((t) => t.getAttribute("role"))).toEqual(["tab", "tab", "tab"]);
        expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
        const panels = Array.from(el.querySelectorAll("pui-tab-panel"));
        expect(panels.map((p) => (p as HTMLElement).hidden)).toEqual([false, true, true]);
        expect(tabs[1]!.getAttribute("aria-controls")).toBe(panels[1]!.id);
    });

    it("moves and selects with the arrow keys, emitting pui-change", async () => {
        const el = await mount(markup);
        const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>("button.pui-tab"));
        const onChange = vi.fn();
        el.addEventListener("pui-change", (e) => onChange((e as CustomEvent).detail));
        tabs[0]!.focus();
        tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        expect(document.activeElement).toBe(tabs[1]);
        expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");
        expect(tabs[1]!.tabIndex).toBe(0);
        expect(tabs[0]!.tabIndex).toBe(-1);
        expect(onChange).toHaveBeenLastCalledWith({ value: "billing", index: 1 });

        tabs[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
        expect(document.activeElement).toBe(tabs[2]);
        expect((el.querySelectorAll("pui-tab-panel")[2] as HTMLElement).hidden).toBe(false);
    });

    it("honours the selected attribute, initially and when it changes", async () => {
        const el = await mount(markup.replace('label="Settings"', 'label="Settings" selected="team"'));
        const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>("button.pui-tab"));
        expect(tabs[2]!.getAttribute("aria-selected")).toBe("true");
        el.setAttribute("selected", "account");
        expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
        expect((el.querySelectorAll("pui-tab-panel")[0] as HTMLElement).hidden).toBe(false);
        expect((el.querySelectorAll("pui-tab-panel")[2] as HTMLElement).hidden).toBe(true);
    });
});

describe("pui-dropdown", () => {
    it("opens through the html behaviour and emits pui-select with the item value", async () => {
        const el = await mount(`
            <pui-dropdown label="Actions">
                <pui-menu-item value="edit">Edit</pui-menu-item>
                <hr />
                <pui-menu-item value="delete">Delete</pui-menu-item>
            </pui-dropdown>`);
        const trigger = el.querySelector<HTMLButtonElement>(".pui-dropdown__trigger")!;
        const menu = el.querySelector<HTMLElement>(".pui-menu")!;
        expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
        expect(menu.hidden).toBe(true);
        trigger.click();
        expect(menu.hidden).toBe(false);
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
        expect(el.querySelector("hr")!.getAttribute("role")).toBe("separator");

        const onSelect = vi.fn();
        el.addEventListener("pui-select", (e) => onSelect((e as CustomEvent).detail.value));
        el.querySelectorAll<HTMLButtonElement>(".pui-menu__item")[1]!.click();
        expect(onSelect).toHaveBeenCalledWith("delete");
        expect(menu.hidden).toBe(true);
    });
});

describe("pui-modal", () => {
    it("opens with .show() and the open attribute, closes with .close() and emits pui-close", async () => {
        const el = await mount<PuiModal>(
            `<pui-modal id="invite" title="Invite" description="Add a teammate">Body<div slot="footer"><pui-button>Send</pui-button></div></pui-modal>`,
        );
        const dialog = el.querySelector("dialog")!;
        expect(dialog.className).toBe("pui-modal pui-modal--md");
        expect(el.hasAttribute("title")).toBe(false);
        expect(dialog.querySelector(".pui-modal__title")!.textContent).toBe("Invite");
        expect(dialog.getAttribute("aria-labelledby")).toBe(dialog.querySelector(".pui-modal__title")!.id);
        expect(dialog.querySelector(".pui-modal__body")!.textContent).toBe("Body");
        expect(dialog.querySelector(".pui-modal__footer")).not.toBeNull();
        expect(dialog.open).toBe(false);

        el.show();
        expect(el.open).toBe(true);
        expect(dialog.open).toBe(true);

        const onClose = vi.fn();
        el.addEventListener("pui-close", (e) => onClose((e as CustomEvent).detail));
        el.close("sent");
        expect(dialog.open).toBe(false);
        expect(el.hasAttribute("open")).toBe(false);
        expect(onClose).toHaveBeenCalledWith({ returnValue: "sent" });

        el.setAttribute("open", "");
        expect(dialog.open).toBe(true);
        dialog.querySelector<HTMLButtonElement>(".pui-modal__close")!.click();
        expect(dialog.open).toBe(false);
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("opens from a data-pui-modal-open trigger and closes on a backdrop click", async () => {
        const root = await mount(`<div><button type="button" data-pui-modal-open="m">Open</button><pui-modal id="m" title="Hi">Body</pui-modal></div>`);
        const modal = root.querySelector<PuiModal>("pui-modal")!;
        root.querySelector("button")!.click();
        expect(modal.open).toBe(true);
        modal.dialog!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(modal.open).toBe(false);
    });
});

describe("pui-pagination", () => {
    it("computes the visible range", () => {
        expect(pageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(pageRange(2, 20)).toEqual([1, 2, 3, 4, 5, null, 20]);
        expect(pageRange(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
        expect(pageRange(19, 20)).toEqual([1, null, 16, 17, 18, 19, 20]);
    });

    it("emits pui-page-change with the new and previous page", async () => {
        const el = await mount<PuiPagination>(`<pui-pagination page="3" total="10"></pui-pagination>`);
        const events: unknown[] = [];
        el.addEventListener("pui-page-change", (e) => events.push((e as CustomEvent).detail));
        el.querySelector<HTMLButtonElement>(".pui-pagination__next")!.click();
        expect(events).toEqual([{ page: 4, previous: 3 }]);
        expect(el.getAttribute("page")).toBe("4");
        expect(el.querySelector('[aria-current="page"]')!.textContent).toBe("4");

        el.querySelector<HTMLButtonElement>('.pui-pagination__item[aria-label="Page 1"]')!.click();
        expect(events[1]).toEqual({ page: 1, previous: 4 });
        expect(el.querySelector<HTMLButtonElement>(".pui-pagination__prev")!.disabled).toBe(true);
    });

    it("does not change page when the event is cancelled", async () => {
        const el = await mount<PuiPagination>(`<pui-pagination page="1" total="3"></pui-pagination>`);
        el.addEventListener("pui-page-change", (e) => e.preventDefault());
        el.querySelector<HTMLButtonElement>(".pui-pagination__next")!.click();
        expect(el.getAttribute("page")).toBe("1");
    });
});

describe("pui-alert, pui-progress, pui-theme-toggle, pui-tooltip", () => {
    it("alert renders title and body, and dismisses", async () => {
        const el = await mount(`<pui-alert variant="error" title="Payment failed" dismissible>Check your card.</pui-alert>`);
        expect(el.className).toBe("pui-alert pui-alert--error");
        expect(el.getAttribute("role")).toBe("alert");
        expect(el.hasAttribute("title")).toBe(false);
        expect(el.querySelector(".pui-alert__title")!.textContent).toBe("Payment failed");
        expect(el.querySelector(".pui-alert__body")!.textContent).toContain("Check your card.");
        const onDismiss = vi.fn();
        el.addEventListener("pui-dismiss", onDismiss);
        el.querySelector<HTMLButtonElement>(".pui-alert__close")!.click();
        expect(onDismiss).toHaveBeenCalledOnce();
        expect((el as HTMLElement).hidden).toBe(true);
    });

    it("progress sets the ARIA values and width", async () => {
        const el = await mount(`<pui-progress value="30" max="60" label="Upload" show-value></pui-progress>`);
        const track = el.querySelector("[role=progressbar]")!;
        expect(track.getAttribute("aria-valuenow")).toBe("30");
        expect(track.getAttribute("aria-label")).toBe("Upload");
        expect(el.querySelector<HTMLElement>(".pui-progress__bar")!.style.width).toBe("50%");
        expect(el.querySelector(".pui-progress__label")!.textContent).toBe("50%");
    });

    it("theme toggle switches .dark-mode on <html>", async () => {
        document.documentElement.classList.remove("dark-mode");
        const el = await mount(`<pui-theme-toggle></pui-theme-toggle>`);
        const button = el.querySelector("button")!;
        expect(button.getAttribute("aria-label")).toBe("Switch to dark theme");
        const onChange = vi.fn();
        el.addEventListener("pui-theme-change", (e) => onChange((e as CustomEvent).detail));
        button.click();
        expect(document.documentElement.classList.contains("dark-mode")).toBe(true);
        expect(onChange).toHaveBeenCalledWith({ theme: "dark" });
        expect(button.getAttribute("aria-label")).toBe("Switch to light theme");
        button.click();
        expect(document.documentElement.classList.contains("dark-mode")).toBe(false);
    });

    it("tooltip describes the focusable trigger inside it", async () => {
        const el = await mount(`<pui-tooltip text="Saves a draft"><pui-button>Save</pui-button></pui-tooltip>`);
        const button = el.querySelector("button")!;
        expect(button.getAttribute("data-pui-tooltip")).toBe("Saves a draft");
        const tip = document.getElementById(button.getAttribute("aria-describedby")!)!;
        expect(tip.getAttribute("role")).toBe("tooltip");
        expect(tip.textContent).toBe("Saves a draft");
        el.setAttribute("text", "Saves it");
        expect(tip.textContent).toBe("Saves it");
    });
});
