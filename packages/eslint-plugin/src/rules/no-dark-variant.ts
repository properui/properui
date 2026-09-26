import type { Rule } from "eslint";
import { forEachToken, makeClassStringVisitor } from "../utils/extract-classes.js";
import { DARK_VARIANT_REGEX } from "../utils/patterns.js";

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow dark: utilities; a .dark-mode class on an ancestor repoints semantic tokens instead.",
        },
        schema: [],
        messages: {
            darkVariant:
                "'{{token}}' uses a dark: variant. A .dark-mode class on an ancestor repoints every semantic token, so a component written against the theme layer (packages/ui/src/styles/theme.css) is already correct in both themes; remove the dark: utility instead of hardcoding one.",
        },
    },
    create(context) {
        return makeClassStringVisitor(context, (hit) => {
            forEachToken(hit.raw, (token, index) => {
                if (!DARK_VARIANT_REGEX.test(token)) return;

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
