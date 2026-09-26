import { PuiElement, type Rendered, defineProps, readBool } from "../base";

const COLORS = ["gray", "brand", "error", "warning", "success", "blue", "indigo", "purple", "pink", "orange"];

/**
 * `<pui-badge>`: the host is the `.pui-badge`. `color` (gray, brand, error, warning, success, blue,
 * indigo, purple, pink, orange), `size` (sm, md, lg), `type` (`pill-color` default, `modern`) and
 * `dot` for a leading status dot, as on the React `Badge` / `BadgeWithDot`.
 */
export class PuiBadge extends PuiElement {
    static props = { color: "string", size: "string", type: "string", dot: "boolean" } as const;

    declare color: string | undefined;
    declare size: string | undefined;
    declare type: string | undefined;
    declare dot: boolean;

    protected render(content: Node[]): Rendered {
        const color = this.getAttribute("color") ?? "gray";
        const size = this.getAttribute("size") ?? "md";
        const type = this.getAttribute("type");
        this.setHostClasses(
            "pui-badge",
            `pui-badge--${COLORS.includes(color) ? color : "gray"}`,
            `pui-badge--${["sm", "md", "lg"].includes(size) ? size : "md"}`,
            readBool(this, "dot") && "pui-badge--dot",
            type === "modern" ? "pui-badge--modern" : "pui-badge--pill",
        );
        return { nodes: content, target: null };
    }
}
defineProps(PuiBadge);
