import type { Rule } from "eslint";
import { forEachToken, makeClassStringVisitor } from "../utils/extract-classes.js";
import { PHYSICAL_MAPPINGS, splitToken } from "../utils/patterns.js";

/**
 * `left-1/2` / `right-1/2` paired with `-translate-x-1/2` centre an element, which reads the same in
 * both directions; rewriting them to `start-1/2` would break the centring under `dir="rtl"`.
 */
const SYMMETRIC_REGEX = /^-?(?:left|right)-1\/2$/;

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description:
                'Disallow physical directional utilities (ml-, pr-, left-, text-left, rounded-l-, border-r-, ...); use the logical equivalent so dir="rtl" works.',
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    allow: { type: "array", items: { type: "string" } },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            physicalProperty: "'{{token}}' is a physical directional utility. Use the logical equivalent '{{fixed}}' so dir=\"rtl\" works.",
        },
    },
    create(context) {
        const options = (context.options[0] ?? {}) as { allow?: string[] };
        const allow = (options.allow ?? []).map((pattern) => new RegExp(pattern));
        return makeClassStringVisitor(context, (hit) => {
            forEachToken(hit.raw, (token, index) => {
                const { prefix, important, base } = splitToken(token);
                if (SYMMETRIC_REGEX.test(base)) return;
                if (allow.some((pattern) => pattern.test(base) || pattern.test(token))) return;
                const mapping = PHYSICAL_MAPPINGS.find((candidate) => candidate.test.test(base));
                if (!mapping) return;

                const fixedBase = mapping.fix(base);
                const fixedToken = `${prefix}${important ? "!" : ""}${fixedBase}`;
                const start = hit.rangeStart + index;
                const end = start + token.length;
                context.report({
                    node: hit.node,
                    loc: {
                        start: context.sourceCode.getLocFromIndex(start),
                        end: context.sourceCode.getLocFromIndex(end),
                    },
                    messageId: "physicalProperty",
                    data: { token, fixed: fixedToken },
                    fix(fixer) {
                        return fixer.replaceTextRange([start, end], fixedToken);
                    },
                });
            });
        });
    },
};

export default rule;
