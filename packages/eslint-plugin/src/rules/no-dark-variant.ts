import type { Rule } from "eslint";
import { forEachToken, makeClassStringVisitor } from "../utils/extract-classes.js";
import { DARK_VARIANT_REGEX } from "../utils/patterns.js";

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow dark: utilities; a .dark-mode class on an ancestor repoints semantic tokens instead.",
        },
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
            darkVariant:
                "'{{token}}' uses a dark: variant. A .dark-mode class on an ancestor repoints every semantic token, so a component written against the theme layer (packages/ui/src/styles/theme.css) is already correct in both themes; remove the dark: utility instead of hardcoding one.",
        },
    },
    create(context) {
        const options = (context.options[0] ?? {}) as { allow?: string[] };
        // Matched against the utility after the `dark:` variant, so `hidden` allows `dark:hidden` and `md:dark:hidden`.
        const allow = (options.allow ?? []).map((pattern) => new RegExp(pattern));
        return makeClassStringVisitor(context, (hit) => {
            forEachToken(hit.raw, (token, index) => {
                if (!DARK_VARIANT_REGEX.test(token)) return;
                const utility = token.slice(token.search(DARK_VARIANT_REGEX)).replace(/^:?dark:/, "");
                if (allow.some((pattern) => pattern.test(utility))) return;

                const start = hit.rangeStart + index;
                const end = start + token.length;
                context.report({
                    node: hit.node,
                    loc: {
                        start: context.sourceCode.getLocFromIndex(start),
                        end: context.sourceCode.getLocFromIndex(end),
                    },
                    messageId: "darkVariant",
                    data: { token },
                });
            });
        });
    },
};

export default rule;
