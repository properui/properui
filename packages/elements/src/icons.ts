/**
 * The handful of inline icons the elements render themselves (close buttons, alert glyphs, pagination
 * arrows, the theme toggle). 24px grid, 2px stroke, `currentColor`, same drawing style as the icons
 * the React components use. Everything else an author passes in through a slot.
 */
const paths = {
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    info: '<path d="M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z"/>',
    success: '<path d="m7.5 12 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z"/>',
    warning:
        '<path d="M12 9v4m0 4h.01M10.615 3.892 2.39 18.098c-.456.788-.684 1.182-.65 1.506a1 1 0 0 0 .406.705c.263.191.718.191 1.629.191h16.45c.91 0 1.365 0 1.628-.191a1 1 0 0 0 .407-.705c.034-.324-.195-.718-.65-1.506L13.383 3.892c-.454-.785-.681-1.178-.978-1.31a1 1 0 0 0-.813 0c-.296.132-.523.525-.978 1.31Z"/>',
    error: '<path d="M12 8v4m0 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    sun: '<path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.343-5.657L19.07 4.93M4.93 19.071l1.414-1.414m0-11.314L4.93 4.93m14.142 14.142-1.414-1.414M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"/>',
    user: '<path d="M20 21c0-1.396 0-2.093-.172-2.661a4 4 0 0 0-2.667-2.667C16.593 15.5 15.896 15.5 14.5 15.5h-5c-1.396 0-2.093 0-2.661.172a4 4 0 0 0-2.667 2.667C4 18.907 4 19.604 4 21M16.5 7.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/>',
    moon: '<path d="M22 15.844A10.5 10.5 0 1 1 8.156 2 8 8 0 0 0 22 15.844Z"/>',
} as const;

export type IconName = keyof typeof paths;

/** An `aria-hidden` inline SVG icon element. */
export function icon(name: IconName, className?: string): SVGSVGElement {
    const template = document.createElement("template");
    template.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
    const svg = template.content.firstElementChild as SVGSVGElement;
    if (className) svg.setAttribute("class", className);
    return svg;
}
