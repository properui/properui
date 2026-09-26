import { PuiElement, type Rendered, defineProps, emit, h } from "../base";
import { getTheme, setTheme } from "../behaviours";
import { icon } from "../icons";

const isDark = (): boolean => document.documentElement.classList.contains("dark-mode");

/**
 * `<pui-theme-toggle>`: an icon button that switches between the light and dark theme with
 * `setTheme` from `@properui/html` (the `.dark-mode` class on `<html>`, persisted in
 * `localStorage` under `theme`). Stays in sync when something else changes the theme. `size`
 * (sm, md, lg), `label-light` / `label-dark` for the accessible names. Emits `pui-theme-change`
 * with `{ theme }`.
 */
export class PuiThemeToggle extends PuiElement {
    static props = { size: "string", labelLight: "string", labelDark: "string" } as const;

    declare size: string | undefined;
    declare labelLight: string | undefined;
    declare labelDark: string | undefined;

    #button: HTMLButtonElement | null = null;

    protected render(): Rendered {
        const dark = isDark();
        const button = (this.#button ??= this.#create());
        button.className = `pui-btn pui-btn--tertiary pui-btn--${this.getAttribute("size") ?? "sm"} pui-btn--icon-only`;
        const label = dark ? (this.getAttribute("label-light") ?? "Switch to light theme") : (this.getAttribute("label-dark") ?? "Switch to dark theme");
        button.setAttribute("aria-label", label);
        button.title = label;
        const glyph = icon(dark ? "sun" : "moon", "pui-btn__icon");
        glyph.setAttribute("data-icon", "leading");
        button.replaceChildren(glyph);
        return { nodes: [button], target: null };
    }

    protected connected(): void {
        // Re-apply a choice saved on an earlier visit (the server-rendered class may not know it).
        const saved = getTheme();
        if (saved !== "system" && (saved === "dark") !== isDark()) {
            setTheme(saved);
            this.rerender();
        }
        new MutationObserver(() => this.rerender()).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    #create(): HTMLButtonElement {
        const button = h("button", { type: "button" });
        button.addEventListener("click", () => {
            const theme = isDark() ? "light" : "dark";
            setTheme(theme);
            this.rerender();
            emit(this, "pui-theme-change", { theme });
        });
        return button;
    }
}
defineProps(PuiThemeToggle);
