import { RuleTester } from "eslint";
import rule from "./no-arbitrary-values.js";

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run("no-arbitrary-values", rule, {
    valid: [
        { code: `<div className="bg-primary p-4 text-md" />` },
        // Bare arbitrary properties (no utility prefix before the bracket) are allowed by default.
        { code: `<div className="[mask-image:linear-gradient(to_bottom,black,transparent)]" />` },
        { code: `<div className="sm:[mask-image:linear-gradient(to_bottom,black,transparent)]" />` },
        { code: `<div className="bg-[#7f56d9]" />`, options: [{ allow: ["^bg-\\[#7f56d9\\]$"] }] },
    ],
    invalid: [
        {
            code: `<div className="bg-[#7f56d9]" />`,
            errors: [{ messageId: "arbitraryValue" }],
        },
        {
            code: `<div className="p-[13px]" />`,
            errors: [{ messageId: "arbitraryValue" }],
        },
        {
            code: `<div className="text-[13px]" />`,
            errors: [{ messageId: "arbitraryValue" }],
        },
        {
            code: `<div className="hover:bg-[rgba(0,0,0,.5)]" />`,
            errors: [{ messageId: "arbitraryValue" }],
        },
        {
            code: `const styles = sortCx({ base: "w-[calc(100%_-_1rem)]" });`,
            errors: [{ messageId: "arbitraryValue" }],
        },
        {
            code: `<div className="bg-[#7f56d9]" />`,
            options: [{ allow: ["^bg-\\[#000000\\]$"] }],
            errors: [{ messageId: "arbitraryValue" }],
        },
    ],
});
