/**
 * Finds every "class-bearing" string in a file: JSX `className`/`class` attribute values,
 * template literals, and the arguments of `cx()`/`cn()`/`clsx()`/`sortCx()` calls (including
 * object values, so `sortCx({ base: "...", size: { sm: "..." } })` and clsx's conditional-object
 * form `{ "bg-red-500": isActive }` are both covered), wherever they're nested (ternaries, `&&`,
 * arrays, further calls).
 *
 * Node shapes are read loosely (no JSX/TS-AST type package is a dependency of this plugin), which
 * is why traversal here uses plain property access rather than a typed AST visitor.
 */
import type { Rule } from "eslint";

const CLASS_FUNCTIONS = new Set(["cx", "cn", "clsx", "sortCx"]);
const CLASS_ATTRIBUTES = new Set(["className", "class"]);

/** A single class-bearing string (or template chunk) found in the source. */
export interface ClassHit {
    /** The string's content, already unescaped (`Literal.value` / `TemplateElement.value.cooked`). */
    raw: string;
    /** Absolute source offset that `raw[0]` corresponds to. */
    rangeStart: number;
    /** The `Literal` or `TemplateElement` node the string came from, for `context.report`. */
    node: Rule.Node;
}

function isClassFunctionCall(node: any): boolean {
    return node?.type === "CallExpression" && node.callee?.type === "Identifier" && CLASS_FUNCTIONS.has(node.callee.name);
}

function stringInfo(node: any): { raw: string; rangeStart: number } | null {
    if (node.type === "Literal" && typeof node.value === "string") {
        return { raw: node.value, rangeStart: node.range[0] + 1 };
    }
    if (node.type === "TemplateElement") {
        const raw = node.value.cooked ?? node.value.raw;
        return { raw, rangeStart: node.range[0] };
    }
    return null;
}

/**
 * Builds the pair of visitor entries (`JSXAttribute`, `CallExpression`) that finds every
 * class-bearing string in a file and invokes `onHit` once per unique string node. Return the
 * result directly from a rule's `create(context)`.
 */
export function makeClassStringVisitor(_context: Rule.RuleContext, onHit: (hit: ClassHit) => void): Rule.RuleListener {
    const seen = new WeakSet<object>();

    function push(node: any): void {
        if (seen.has(node)) return;
        const info = stringInfo(node);
        if (!info) return;
        seen.add(node);
        onHit({ raw: info.raw, rangeStart: info.rangeStart, node });
    }

    function walk(node: any): void {
        if (!node || typeof node !== "object") return;
        switch (node.type) {
            case "Literal":
            case "TemplateElement":
                push(node);
                return;
            case "TemplateLiteral":
                node.quasis.forEach(walk);
                node.expressions.forEach(walk);
                return;
            case "ConditionalExpression":
                walk(node.consequent);
                walk(node.alternate);
                return;
            case "LogicalExpression":
                walk(node.left);
                walk(node.right);
                return;
            case "ArrayExpression":
                node.elements.forEach((element: any) => element && walk(element));
                return;
            case "ObjectExpression":
                for (const prop of node.properties) {
                    if (prop.type !== "Property") continue;
                    if (!prop.computed && prop.key?.type === "Literal" && typeof prop.key.value === "string") {
                        walk(prop.key);
                    }
                    walk(prop.value);
                }
                return;
            case "CallExpression":
                if (isClassFunctionCall(node)) node.arguments.forEach(walk);
                return;
            default:
                return;
        }
    }

    return {
        JSXAttribute(node: any) {
            if (node.name?.type !== "JSXIdentifier" || !CLASS_ATTRIBUTES.has(node.name.name)) return;
            const value = node.value;
            if (!value) return;
            if (value.type === "Literal" && typeof value.value === "string") walk(value);
            else if (value.type === "JSXExpressionContainer") walk(value.expression);
        },
        CallExpression(node: any) {
            if (isClassFunctionCall(node)) node.arguments.forEach(walk);
        },
    };
}

/** Calls `cb(token, indexWithinRaw)` for every whitespace-separated token in `raw`. */
export function forEachToken(raw: string, cb: (token: string, index: number) => void): void {
    const re = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(raw))) {
        cb(match[0], match.index);
    }
}
