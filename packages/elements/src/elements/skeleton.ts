import { PuiElement, type Rendered, defineProps } from "../base";

/**
 * `<pui-skeleton>`: a loading placeholder, the host is the `.pui-skeleton`. `variant` (text,
 * circle, rect), `width` and `height` (any CSS length). Hidden from assistive technology; mark the
 * region that is loading with `aria-busy="true"` instead.
 */
export class PuiSkeleton extends PuiElement {
    static props = { variant: "string", width: "string", height: "string" } as const;

    declare variant: string | undefined;
    declare width: string | undefined;
    declare height: string | undefined;

    protected render(): Rendered {
        const variant = this.getAttribute("variant") ?? "text";
        this.setHostClasses("pui-skeleton", `pui-skeleton--${["text", "circle", "rect"].includes(variant) ? variant : "text"}`);
        this.setHostAttr("aria-hidden", "true");
        this.style.width = this.getAttribute("width") ?? "";
        this.style.height = this.getAttribute("height") ?? "";
        return { nodes: [], target: null };
    }
}
defineProps(PuiSkeleton);
