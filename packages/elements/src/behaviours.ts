/**
 * The `@properui/html` behaviours the elements call. This is the only module that imports the html
 * package, so the dependency surface stays in one place: the elements render the html package's
 * markup and hand it to these functions, which are idempotent (an initialised node is skipped).
 */
export { getTheme, initDropdowns, initTabs, initTooltips, setTheme, toast } from "@properui/html";
