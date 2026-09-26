import type { Rule } from "eslint";
import { forEachToken, makeClassStringVisitor } from "../utils/extract-classes.js";
import { ARBITRARY_VALUE_REGEX } from "../utils/patterns.js";

interface Options {
    allow?: string[];
}

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow arbitrary Tailwind values (bg-[#7f56d9], p-[13px], text-[13px]) in favour of the semantic token layer.",
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
            arbitraryValue:
                "'{{token}}' is an arbitrary Tailwind value. Use a semantic token from the theme layer (packages/ui/src/styles/theme.css) instead of a raw arbitrary value.",
        },
    },
    create(context) {
        const options = (context.options[0] ?? {}) as Options;
        const allow = (options.allow ?? []).map((pattern) => new RegExp(pattern));
        const isAllowed = (token: string) => allow.some((pattern) => pattern.test(token));

        return makeClassStringVisitor(context, (hit) => {
            forEachToken(hit.raw, (token, index) => {
                if (isAllowed(token)) return;
                // Bare arbitrary properties (`[mask-image:...]`, or `sm:[mask-image:...]` once its
                // variant prefix is stripped) are allowed by default: the regex below requires a
                // hyphen directly before the bracket, which a bare arbitrary property never has.
                const match = ARBITRARY_VALUE_REGEX.exec(token);
                if (!match) return;

                const start = hit.rangeStart + index + match.index;
                const end = start + match[0].length;
                context.report({
                    node: hit.node,
                    loc: {
                        start: context.sourceCode.getLocFromIndex(start),
                        end: context.sourceCode.getLocFromIndex(end),
                    },
                    messageId: "arbitraryValue",
                    data: { token: match[0] },
                });
            });
        });
    },
};

export default rule;
