import { PuiElement, type Rendered, defineProps } from "../base";
import { initTooltips } from "../behaviours";

const FOCUSABLE = "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

/**
 * `<pui-tooltip>`: wraps one trigger and gives it a tooltip through `initTooltips` from
 * `@properui/html` (hover after a delay, keyboard focus, Escape, `role="tooltip"` linked with
 * `aria-describedby`). `text`, `description` (a second line), `placement` (`top` default, or
 * `bottom`; flips when there is no room), `delay` in ms. The trigger is the first focusable element
 * inside, so `<pui-tooltip text="Save"><pui-button ...></pui-button></pui-tooltip>` describes the
 * rendered `<button>`. A tooltip supplements a label; it is never the only name of a control.
 */
export class PuiTooltip extends PuiElement {
    static props = { text: "string", description: "string", placement: "string", delay: "number" } as const;

    declare text: string | undefined;
    declare description: string | undefined;
    declare placement: string | undefined;
    declare delay: number | undefined;

    #trigger: HTMLElement | null = null;

    protected render(content: Node[]): Rendered {
        return { nodes: content, target: null };
    }

    protected connected(): void {
        // Children that are elements themselves (a <pui-button>) render after this one.
        queueMicrotask(() => this.#attach());
    }

    protected changed(): void {
        this.#attach();
    }

    #attach(): void {
        for (const child of Array.from(this.querySelectorAll("*"))) if (child instanceof PuiElement) child.renderNow();
        const first = this.firstElementChild as HTMLElement | null;
        const trigger = (first?.matches(FOCUSABLE) ? first : this.querySelector<HTMLElement>(FOCUSABLE)) ?? first;
        if (!trigger) return;
        const text = this.getAttribute("text") ?? "";
        const description = this.getAttribute("description");
        const placement = this.getAttribute("placement");
        const delay = this.getAttribute("delay");
        const set = (name: string, value: string | null) => (value === null ? trigger.removeAttribute(name) : trigger.setAttribute(name, value));
        set("data-pui-tooltip", text);
        set("data-pui-tooltip-description", description);
        set("data-pui-tooltip-placement", placement === "bottom" ? "bottom" : null);
        set("data-pui-tooltip-delay", delay);
        if (this.#trigger && this.#trigger === trigger) {
            // Already initialised: update the tooltip element in place.
            const tip = (trigger.getAttribute("aria-describedby") ?? "")
                .split(" ")
                .map((id) => document.getElementById(id))
                .find((el) => el?.classList.contains("pui-tooltip"));
            const title = tip?.firstElementChild;
            if (title) title.textContent = text;
            return;
        }
        this.#trigger = trigger;
        initTooltips(trigger);
    }
}
defineProps(PuiTooltip);
