import { PuiElement, type Rendered, defineProps, emit, h } from "../base";

/** Page numbers to show, with `null` for an ellipsis: all of them up to 7, otherwise first, last and a window around `page`. */
export function pageRange(page: number, total: number): (number | null)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, null, total];
    if (page >= total - 3) return [1, null, total - 4, total - 3, total - 2, total - 1, total];
    return [1, null, page - 1, page, page + 1, null, total];
}

/**
 * `<pui-pagination>`: previous/next buttons around numbered pages. `page` (1-based, default 1),
 * `total` (the number of pages), `label` (default "Pagination"). Choosing a page emits a cancelable
 * `pui-page-change` with `{ page, previous }` and, unless cancelled, updates `page`.
 */
export class PuiPagination extends PuiElement {
    static props = { page: "number", total: "number", label: "string", previousLabel: "string", nextLabel: "string" } as const;

    declare page: number | undefined;
    declare total: number | undefined;
    declare label: string | undefined;
    declare previousLabel: string | undefined;
    declare nextLabel: string | undefined;

    #focus: string | null = null;

    /** Moves to `page` (clamped to 1..total), emitting `pui-page-change`. Returns false if a listener cancelled it. */
    goTo(page: number): boolean {
        const total = this.#total();
        const previous = this.#page();
        const next = Math.min(Math.max(Math.round(page), 1), total);
        if (next === previous) return true;
        if (!emit(this, "pui-page-change", { page: next, previous }, true)) return false;
        this.setAttribute("page", String(next));
        return true;
    }

    #total(): number {
        return Math.max(1, Math.floor(Number(this.getAttribute("total")) || 1));
    }

    #page(): number {
        return Math.min(Math.max(Math.floor(Number(this.getAttribute("page")) || 1), 1), this.#total());
    }

    protected render(): Rendered {
        const total = this.#total();
        const page = this.#page();
        const button = (key: string, target: number, text: string, extra: Record<string, string | boolean | null> = {}) => {
            const el = h("button", { type: "button", "data-key": key, ...extra }, [text]);
            el.addEventListener("click", () => {
                this.#focus = key;
                this.goTo(target);
            });
            return el;
        };
        const prev = button("prev", page - 1, this.getAttribute("previous-label") ?? "Previous", {
            class: "pui-btn pui-btn--secondary pui-btn--sm pui-pagination__prev",
            disabled: page <= 1,
        });
        const next = button("next", page + 1, this.getAttribute("next-label") ?? "Next", {
            class: "pui-btn pui-btn--secondary pui-btn--sm pui-pagination__next",
            disabled: page >= total,
        });
        const pages = h(
            "ol",
            { class: "pui-pagination__pages" },
            pageRange(page, total).map((n) =>
                h("li", {}, [
                    n === null
                        ? h("span", { class: "pui-pagination__ellipsis", "aria-hidden": "true" }, ["…"])
                        : button(String(n), n, String(n), {
                              class: "pui-pagination__item",
                              "aria-current": n === page ? "page" : null,
                              "aria-label": `Page ${n}`,
                          }),
                ]),
            ),
        );
        const summary = h("p", { class: "pui-pagination__summary", "aria-live": "polite" }, [`Page ${page} of ${total}`]);
        const nav = h("nav", { class: "pui-pagination", "aria-label": this.getAttribute("label") ?? "Pagination" }, [prev, pages, summary, next]);

        // Keep keyboard focus on the control that was used, or the current page if that one is now disabled.
        const key = this.#focus;
        this.#focus = null;
        if (key) {
            queueMicrotask(() => {
                const wanted =
                    nav.querySelector<HTMLButtonElement>(`[data-key="${key}"]:not(:disabled)`) ?? nav.querySelector<HTMLButtonElement>('[aria-current="page"]');
                wanted?.focus();
            });
        }
        return { nodes: [nav], target: null };
    }
}
defineProps(PuiPagination);
