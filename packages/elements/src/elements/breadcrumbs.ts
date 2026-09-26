import { PuiElement, type Rendered, defineProps, h, isMeaningful } from "../base";
import { icon } from "../icons";

/**
 * `<pui-breadcrumbs>`: each child element (an `<a>`, or a `<span>` for the current page) becomes a
 * crumb, and the last one is marked `aria-current="page"`. `label` names the landmark (default
 * "Breadcrumb").
 */
export class PuiBreadcrumbs extends PuiElement {
    static props = { label: "string" } as const;

    declare label: string | undefined;

    #list: HTMLOListElement | null = null;

    protected render(content: Node[]): Rendered {
        const list = (this.#list ??= h("ol", { class: "pui-breadcrumbs__list" }));
        // After the first render the content is this element's own <li> items: unwrap them to re-wrap in order.
        const crumbs = content
            .flatMap((n) => (n instanceof HTMLLIElement && n.classList.contains("pui-breadcrumbs__item") ? Array.from(n.childNodes) : [n]))
            .filter((n) => isMeaningful(n) && !(n instanceof SVGElement && n.classList.contains("pui-breadcrumbs__separator")));
        const items = crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            const node = crumb instanceof Element ? crumb : h("span", {}, [crumb]);
            if (last) node.setAttribute("aria-current", "page");
            else if (node.getAttribute("aria-current") === "page") node.removeAttribute("aria-current");
            return h("li", { class: "pui-breadcrumbs__item" }, [index > 0 ? icon("chevronRight", "pui-breadcrumbs__separator") : null, node]);
        });
        list.replaceChildren(...items);
        const nav = h("nav", { class: "pui-breadcrumbs", "aria-label": this.getAttribute("label") ?? "Breadcrumb" }, [list]);
        return { nodes: [nav], target: list };
    }
}
defineProps(PuiBreadcrumbs);
