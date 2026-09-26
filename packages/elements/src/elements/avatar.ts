import { PuiElement, type Rendered, cls, defineProps, h } from "../base";
import { icon } from "../icons";

const SIZES = ["xs", "sm", "md", "lg", "xl", "2xl"];

/**
 * `<pui-avatar>`: the host is the `.pui-avatar`. Shows `src` as an image (with `alt`), falling back
 * to `initials` when there is no image or it fails to load. `size` xs to 2xl, `status` online/offline.
 */
export class PuiAvatar extends PuiElement {
    static props = { src: "string", alt: "string", initials: "string", size: "string", status: "string" } as const;

    declare src: string | undefined;
    declare alt: string | undefined;
    declare initials: string | undefined;
    declare size: string | undefined;
    declare status: string | undefined;

    #failed: string | null = null;

    protected render(): Rendered {
        const size = this.getAttribute("size") ?? "md";
        const src = this.getAttribute("src");
        const alt = this.getAttribute("alt") ?? "";
        const initials = this.getAttribute("initials");
        const status = this.getAttribute("status");
        this.setHostClasses("pui-avatar", `pui-avatar--${SIZES.includes(size) ? size : "md"}`);

        const nodes: Node[] = [];
        const showImage = src !== null && src !== "" && this.#failed !== src;
        if (showImage) {
            const img = h("img", { src, alt, loading: "lazy" });
            img.addEventListener(
                "error",
                () => {
                    this.#failed = src;
                    this.rerender();
                },
                { once: true },
            );
            nodes.push(img);
        } else if (initials) {
            nodes.push(h("span", { class: "pui-avatar__initials", "aria-hidden": "true" }, [initials]));
        } else {
            nodes.push(icon("user"));
        }
        // An image carries its own name; initials and the empty placeholder need one on the host.
        const named = !showImage && (alt || initials);
        this.setHostAttr("role", showImage ? null : named ? "img" : null);
        this.setHostAttr("aria-label", showImage ? null : named ? alt || initials : null);
        if (status === "online" || status === "offline") {
            const label = status === "online" ? "Online" : "Offline";
            nodes.push(
                h("span", { class: cls("pui-avatar__status", `pui-avatar__status--${status}`), "data-status": status, role: "img", "aria-label": label }),
            );
        }
        return { nodes, target: null };
    }
}
defineProps(PuiAvatar);
