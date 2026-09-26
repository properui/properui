/**
 * The classic-script build (`window.ProperUIElements`). Loading it defines every element; the
 * `@properui/html` behaviours are bundled in, so a page needs only this script and the stylesheet.
 */
import { defineElements } from "./define";

export * from "./index";

defineElements();
