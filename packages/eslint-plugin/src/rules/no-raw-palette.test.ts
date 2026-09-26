import { RuleTester } from "eslint";
import rule from "./no-raw-palette.js";

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run("no-raw-palette", rule, {
    valid: [
        { code: `<div className="bg-primary text-tertiary border-secondary" />` },
        // The kit's own semantic-colour utilities (outline-utility-*) are not raw palette usage.
        { code: `<div className="outline-utility-blue-500" />` },
        { code: `const styles = sortCx({ base: "bg-brand-solid text-white" });` },
        { code: `<div className="bg-black bg-white" />` },
        { code: `<div className="bg-red-500" />`, options: [{ allow: ["^bg-red-500$"] }] },
        { code: `const label = "just a sentence about a red-500 error code";` },
    ],
    invalid: [
        {
            code: `<div className="bg-red-500" />`,
            errors: [{ messageId: "rawPalette" }],
        },
        {
            code: `<div className="hover:bg-red-500" />`,
            errors: [{ messageId: "rawPalette" }],
        },
        {
            code: `<div className="!bg-red-500" />`,
            errors: [{ messageId: "rawPalette" }],
        },
        {
            code: `<div className="md:group-hover:text-gray-900" />`,
            errors: [{ messageId: "rawPalette" }],
        },
        {
            code: `<div className="from-blue-50 to-purple-600" />`,
            errors: [{ messageId: "rawPalette" }, { messageId: "rawPalette" }],
        },
        {
            code: `const styles = sortCx({ base: "text-gray-900" });`,
            errors: [{ messageId: "rawPalette" }],
        },
        {
            code: `clsx({ "border-purple-200": isActive })`,
            errors: [{ messageId: "rawPalette" }],
        },
        {
            code: 'const styles = cx(`bg-red-500 ${isActive ? "ring-blue-500" : ""}`);',
            errors: [{ messageId: "rawPalette" }, { messageId: "rawPalette" }],
        },
        {
            code: `<div className="bg-red-500" />`,
            options: [{ allow: ["^bg-blue-500$"] }],
            errors: [{ messageId: "rawPalette" }],
        },
    ],
});
