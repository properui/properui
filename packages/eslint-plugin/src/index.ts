import type { ESLint, Linter } from "eslint";
import noArbitraryValues from "./rules/no-arbitrary-values.js";
import noDarkVariant from "./rules/no-dark-variant.js";
import noPhysicalProperties from "./rules/no-physical-properties.js";
import noRawPalette from "./rules/no-raw-palette.js";

const rules = {
    "no-raw-palette": noRawPalette,
    "no-arbitrary-values": noArbitraryValues,
    "no-dark-variant": noDarkVariant,
    "no-physical-properties": noPhysicalProperties,
};

interface ProperUiEslintPlugin {
    meta: { name: string; version: string };
    rules: typeof rules;
    configs: { recommended: Linter.Config };
}

// The `recommended` config's `plugins` entry references `plugin` itself: the standard flat-config
// self-reference (see typescript-eslint, eslint-plugin-import-x) so `configs.recommended` alone is
// a complete flat config entry a consumer can spread into their `eslint.config.mjs` without also
// importing and registering the plugin by hand.
const plugin: ProperUiEslintPlugin = {
    meta: { name: "@properui/eslint-plugin", version: "0.1.0" },
    rules,
    configs: {} as { recommended: Linter.Config },
};

plugin.configs.recommended = {
    plugins: { "@properui": plugin as unknown as ESLint.Plugin },
    rules: {
        "@properui/no-raw-palette": "error",
        "@properui/no-arbitrary-values": "warn",
        "@properui/no-dark-variant": "error",
        "@properui/no-physical-properties": "error",
    },
};

export default plugin;
export { rules };
export type { ProperUiEslintPlugin };
