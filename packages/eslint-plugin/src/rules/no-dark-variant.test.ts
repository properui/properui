import { RuleTester } from "eslint";
import rule from "./no-dark-variant.js";

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run("no-dark-variant", rule, {
    valid: [
        { code: `<div className="bg-primary text-tertiary" />` },
        { code: `const styles = sortCx({ base: "bg-brand-solid" });` },
        { code: `const label = "darkness falls";` },
        // The allow option matches the utility after dark:, through stacked variants too.
        { code: `<img className="dark:hidden" />`, options: [{ allow: ["^hidden$"] }] },
        { code: `<img className="md:dark:block" />`, options: [{ allow: ["^(hidden|block)$"] }] },
        { code: `<img className="dark:invert" />`, options: [{ allow: ["^invert$"] }] },
    ],
    invalid: [
        {
            code: `<div className="dark:bg-black" />`,
            errors: [{ messageId: "darkVariant" }],
        },
        {
            code: `<div className="dark:bg-black" />`,
            options: [{ allow: ["^hidden$"] }],
            errors: [{ messageId: "darkVariant" }],
        },
        {
            code: `<div className="bg-purple-600 dark:bg-black" />`,
            errors: [{ messageId: "darkVariant" }],
        },
        {
            code: `<div className="group-hover:dark:bg-primary" />`,
            errors: [{ messageId: "darkVariant" }],
        },
        {
            code: `const styles = cx("bg-primary", isActive && "dark:text-white");`,
            errors: [{ messageId: "darkVariant" }],
        },
    ],
});
