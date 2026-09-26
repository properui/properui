import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";
import properui from "@properui/eslint-plugin";

export default tseslint.config(
    {
        ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/storybook-static/**", "docs/spec/reference/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y, "simple-import-sort": simpleImportSort, "unused-imports": unusedImports },
        settings: { react: { version: "detect" } },
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
            "unused-imports/no-unused-imports": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
            // House rules from docs/spec/00-foundation/05-component-conventions.md
            "no-restricted-syntax": [
                "error",
                {
                    selector: "ImportDeclaration[source.value='react-aria-components'] > ImportSpecifier[local.name!=/^Aria/]",
                    message: "Import with an Aria* alias: import { Button as AriaButton } from 'react-aria-components'.",
                },
            ],
        },
    },
    {
        files: ["packages/ui/src/components/**/*.{ts,tsx}"],
        plugins: { "@properui": properui },
        rules: {
            "@properui/no-raw-palette": "error",
            // Arbitrary spacing and size values are widespread in the ported sections and are tracked by
            // `properui check` instead; colour arbitrary values are still caught by no-raw-palette's sibling in the CLI.
            "@properui/no-arbitrary-values": "off",
            // Image and logo swaps (`dark:hidden` / `dark:block` / `dark:invert`) and the textarea resize
            // handle image are the cases a token cannot express; everything else must go through the theme.
            "@properui/no-dark-variant": ["error", { allow: ["^(hidden|block|inline|inline-block|flex|invert)$", "^\\[&::-webkit-resizer\\]:"] }],
            "@properui/no-physical-properties": "error",
        },
    },
    {
        // Artwork with fixed colours: a credit card and a phone mockup are the same in both themes by design.
        files: ["packages/ui/src/components/shared-assets/{credit-card,mockups}/**/*.{ts,tsx}"],
        rules: {
            "@properui/no-raw-palette": "off",
            "@properui/no-dark-variant": "off",
        },
    },
    prettier,
);
