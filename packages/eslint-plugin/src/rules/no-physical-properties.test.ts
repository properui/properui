import { RuleTester } from "eslint";
import rule from "./no-physical-properties.js";

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run("no-physical-properties", rule, {
    valid: [
        { code: `<div className="ms-4 me-2 ps-4 pe-2 start-0 end-0 text-start text-end" />` },
        { code: `<div className="rounded-s-lg rounded-e-lg border-s border-e" />` },
        // Not physical: no hyphen right after "rounded-l"/"border-l" (rounded-lg, border-left-ish
        // names that don't actually exist, but the base pattern still must not misfire).
        { code: `<div className="rounded-lg" />` },
    ],
    invalid: [
        {
            code: `<div className="ml-4" />`,
            output: `<div className="ms-4" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="pr-2" />`,
            output: `<div className="pe-2" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="left-0" />`,
            output: `<div className="start-0" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="right-0" />`,
            output: `<div className="end-0" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="text-left" />`,
            output: `<div className="text-start" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="text-right" />`,
            output: `<div className="text-end" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="rounded-l-lg" />`,
            output: `<div className="rounded-s-lg" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="rounded-r-lg" />`,
            output: `<div className="rounded-e-lg" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="border-l" />`,
            output: `<div className="border-s" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="border-r-2" />`,
            output: `<div className="border-e-2" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="hover:ml-4" />`,
            output: `<div className="hover:ms-4" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `<div className="md:hover:!pr-2" />`,
            output: `<div className="md:hover:!pe-2" />`,
            errors: [{ messageId: "physicalProperty" }],
        },
        {
            code: `const styles = sortCx({ base: "ml-4 mr-2" });`,
            output: `const styles = sortCx({ base: "ms-4 me-2" });`,
            errors: [{ messageId: "physicalProperty" }, { messageId: "physicalProperty" }],
        },
    ],
});
