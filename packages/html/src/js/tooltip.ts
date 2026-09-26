import { claim, ensureId, queryAll } from "./dom";

const GAP = 6;
const MARGIN = 8;

interface Tip {
    trigger: HTMLElement;
    tip: HTMLElement;
    timer?: ReturnType<typeof setTimeout>;
}

let visible: Tip | undefined;

/** Places the tooltip above the trigger, or below when there is not enough room above (or `data-pui-tooltip-placement="bottom"` asks for it and fits). */
function position({ trigger, tip }: Tip): void {
    const view = trigger.ownerDocument.defaultView;
    if (!view) return;
    const rect = trigger.getBoundingClientRect();
    const box = tip.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = view.innerHeight - rect.bottom;
    const wanted = trigger.getAttribute("data-pui-tooltip-placement") === "bottom" ? "bottom" : "top";
    const needed = box.height + GAP + MARGIN;
    let placement: "top" | "bottom" = wanted;
    if (wanted === "top" && spaceAbove < needed && spaceBelow > spaceAbove) placement = "bottom";
    if (wanted === "bottom" && spaceBelow < needed && spaceAbove > spaceBelow) placement = "top";

    const top = placement === "top" ? rect.top - box.height - GAP : rect.bottom + GAP;
    const centre = rect.left + rect.width / 2;
    const maxLeft = Math.max(MARGIN, view.innerWidth - box.width - MARGIN);
    const left = Math.min(Math.max(centre - box.width / 2, MARGIN), maxLeft);

    tip.setAttribute("data-placement", placement);
    // Viewport coordinates from getBoundingClientRect are physical, so these are too.
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
    tip.style.setProperty("--pui-tooltip-arrow-x", `${Math.round(centre - left)}px`);
}

function show(state: Tip): void {
    if (visible && visible !== state) hide(visible);
    clearTimeout(state.timer);
    state.tip.hidden = false;
    position(state);
    visible = state;
}

function hide(state: Tip): void {
    clearTimeout(state.timer);
    state.tip.hidden = true;
    if (visible === state) visible = undefined;
}

function setup(trigger: HTMLElement): void {
    const text = trigger.getAttribute("data-pui-tooltip") ?? "";
    const doc = trigger.ownerDocument;
    const tip = doc.createElement("div");
    tip.className = "pui-tooltip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    const title = doc.createElement("span");
    title.textContent = text;
    tip.append(title);
    const description = trigger.getAttribute("data-pui-tooltip-description");
    if (description) {
        tip.classList.add("pui-tooltip--description");
        const extra = doc.createElement("span");
        extra.className = "pui-tooltip__description";
        extra.textContent = description;
        tip.append(extra);
    }
    doc.body.append(tip);

    const id = ensureId(tip, "tooltip");
    const describedBy = (trigger.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
    if (!describedBy.includes(id)) trigger.setAttribute("aria-describedby", [...describedBy, id].join(" "));

    const state: Tip = { trigger, tip };
    const delay = Number(trigger.getAttribute("data-pui-tooltip-delay") ?? 300);

    trigger.addEventListener("mouseenter", () => {
        clearTimeout(state.timer);
        // Once one tooltip is showing, moving to the next shows it at once, as React Aria does.
        if (visible) show(state);
        else state.timer = setTimeout(() => show(state), delay);
    });
    trigger.addEventListener("mouseleave", () => hide(state));
    trigger.addEventListener("focus", () => {
        // Keyboard focus only: a mouse press that focuses the trigger should not pop the tooltip.
        let keyboard = true;
        try {
            keyboard = trigger.matches(":focus-visible");
        } catch {
            // Engines without :focus-visible: treat all focus as keyboard focus.
        }
        if (keyboard) show(state);
    });
    trigger.addEventListener("blur", () => hide(state));
    trigger.addEventListener("pointerdown", () => hide(state));
    trigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !tip.hidden) {
            event.stopPropagation();
            hide(state);
        }
    });
}

let globalListening = false;

/**
 * `[data-pui-tooltip="text"]` (optionally `data-pui-tooltip-description`, `data-pui-tooltip-delay`
 * in ms, default 300, and `data-pui-tooltip-placement="bottom"`): creates a `.pui-tooltip` with
 * `role="tooltip"`, links it with `aria-describedby`, shows it on hover (after the delay) and on
 * keyboard focus, hides it on leave, blur, press and Escape, and places it above the trigger or
 * below when the space above is too small.
 */
export function initTooltips(root: ParentNode = document): void {
    for (const el of queryAll(root, "[data-pui-tooltip]")) if (claim(el, "tooltip")) setup(el);
    if (!globalListening && typeof window !== "undefined") {
        globalListening = true;
        window.addEventListener("scroll", () => visible && position(visible), true);
        window.addEventListener("resize", () => visible && position(visible));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && visible) hide(visible);
        });
    }
}
