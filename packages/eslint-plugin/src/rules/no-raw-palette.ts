import type { Rule } from "eslint";
import { forEachToken, makeClassStringVisitor } from "../utils/extract-classes.js";
import { PALETTE_REGEX, isUtilityToken } from "../utils/patterns.js";

interface Options {
    allow?: string[];
}

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow raw Tailwind palette utilities (bg-red-500, from-blue-50, ...) in favour of the semantic token layer.",
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
            rawPalette:
                "'{{token}}' is a raw Tailwind palette utility. Use a semantic token from the theme layer (packages/ui/src/styles/theme.css) instead, e.g. bg-primary, text-tertiary, border-secondary or bg-brand-solid.",
        },
    },
    create(context) {
        const options = (context.options[0] ?? {}) as Options;
        const allow = (options.allow ?? []).map((pattern) => new RegExp(pattern));
        const isAllowed = (token: string) => allow.some((pattern) => pattern.test(token));

        return makeClassStringVisitor(context, (hit) => {
            forEachToken(hit.raw, (token, index) => {
                if (isUtilityToken(token) || isAllowed(token)) return;
                const match = PALETTE_REGEX.exec(token);
                if (!match) return;

                const start = hit.rangeStart + index + match.index;
                const end = start + match[0].length;
                context.report({
                    node: hit.node,
                    loc: {
                        start: context.sourceCode.getLocFromIndex(start),
                        end: context.sourceCode.getLocFromIndex(end),
                    },
                    messageId: "rawPalette",
                    data: { token: match[0] },
                });
            });
        });
    },
};

export default rule;
