import { PuiElement, type Rendered, defineProps, h, readBool } from "../base";

/**
 * `<pui-progress>`: the host is the `.pui-progress` row; the track inside carries
 * `role="progressbar"`. `value`, `max` (default 100), `label` (the accessible name, default
 * "Progress"), `size` (sm, md), `show-value` to print the percentage beside the bar.
 */
export class PuiProgress extends PuiElement {
    static props = { value: "number", max: "number", label: "string", size: "string", showValue: "boolean" } as const;

    declare value: number | undefined;
    declare max: number | undefined;
    declare label: string | undefined;
    declare size: string | undefined;
    declare showValue: boolean;

    protected render(): Rendered {
        const max = Math.max(Number(this.getAttribute("max")) || 100, 0.0001);
        const value = Math.min(Math.max(Number(this.getAttribute("value")) || 0, 0), max);
        const percent = Math.round((value / max) * 100);
        const size = this.getAttribute("size") === "sm" ? "sm" : "md";
        this.setHostClasses("pui-progress", `pui-progress--${size}`);

        const track = h(
            "div",
            {
                class: "pui-progress__track",
                role: "progressbar",
                "aria-label": this.getAttribute("label") ?? "Progress",
                "aria-valuemin": 0,
                "aria-valuemax": max,
                "aria-valuenow": value,
                "aria-valuetext": `${percent}%`,
            },
            [h("div", { class: "pui-progress__bar", style: `width: ${percent}%` })],
        );
        const nodes: Node[] = [track];
        if (readBool(this, "show-value")) nodes.push(h("span", { class: "pui-progress__label", "aria-hidden": "true" }, [`${percent}%`]));
        return { nodes, target: null };
    }
}
defineProps(PuiProgress);
