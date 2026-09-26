/**
 * @properui/html: small, dependency-free behaviours for the `pui-*` markup. Each one attaches by
 * data attribute, sets the ARIA the pattern needs, and is idempotent (`data-pui-ready`).
 */
import { initAccordions } from "./js/accordion";
import { initDismiss } from "./js/dismiss";
import { initDropdowns } from "./js/dropdown";
import { init } from "./js/init";
import { closeModal, initModals, openModal } from "./js/modal";
import { initTabs } from "./js/tabs";
import { getTheme, initThemeToggles, setTheme } from "./js/theme";
import { initToastTriggers, toast } from "./js/toast";
import { initTooltips } from "./js/tooltip";

export {
    init,
    initDropdowns,
    initTabs,
    initModals,
    initAccordions,
    initTooltips,
    initDismiss,
    initThemeToggles,
    initToastTriggers,
    openModal,
    closeModal,
    toast,
    setTheme,
    getTheme,
};
export type { ToastOptions } from "./js/toast";
export type { Theme } from "./js/theme";

const ProperUI = {
    init,
    initDropdowns,
    initTabs,
    initModals,
    initAccordions,
    initTooltips,
    initDismiss,
    initThemeToggles,
    initToastTriggers,
    openModal,
    closeModal,
    toast,
    setTheme,
    getTheme,
};

export default ProperUI;
