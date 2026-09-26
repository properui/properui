"use client";

import type { ReactNode } from "react";
import { Fragment, createElement, useMemo } from "react";
import { cx, sortCx } from "../../../utils/cx";
import type { CodeLanguage } from "../code-snippet/code-snippet";
import { CodeSnippet } from "../code-snippet/code-snippet";
import { AIStreamingCaret, useAIMessage } from "./ai-message";
import type { AIBlockNode, AIInlineNode } from "./ai-response-parser";
import { parseMarkdown } from "./ai-response-parser";

export type { AIBlockNode, AIInlineNode } from "./ai-response-parser";
export { parseMarkdown } from "./ai-response-parser";

export const styles = sortCx({
    root: "text-md text-primary flex flex-col gap-3 wrap-break-word",
    heading: {
        1: "text-xl text-primary mt-2 font-semibold",
        2: "text-lg text-primary mt-2 font-semibold",
        3: "text-md text-primary mt-1 font-semibold",
        4: "text-md text-primary font-semibold",
        5: "text-sm text-primary font-semibold",
        6: "text-sm text-secondary font-semibold",
    },
    paragraph: "text-md text-primary",
    list: {
        common: "text-md text-primary flex flex-col gap-1.5 ps-6",
        ordered: "list-decimal",
        unordered: "list-disc",
    },
    listItem: "marker:text-fg-quaternary ps-1",
    blockquote: "border-brand text-md text-tertiary border-s-2 ps-3",
    rule: "border-secondary my-1 border-t",
    strong: "font-semibold",
    emphasis: "italic",
    code: "bg-secondary text-secondary ring-secondary rounded-md px-1 py-0.5 font-mono text-sm ring-1 ring-inset",
    link: "text-brand-secondary hover:text-brand-secondary_hover outline-focus-ring rounded-xs underline underline-offset-2 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
});

const LANGUAGE_ALIASES: Record<string, CodeLanguage> = {
    js: "javascript",
    javascript: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    typescript: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    json: "json",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    shell: "shell",
    console: "shell",
};

/** Maps a fence's info string to a grammar the built-in highlighter knows; anything else is plain text. */
export const toCodeLanguage = (language: string): CodeLanguage => LANGUAGE_ALIASES[language] ?? "plaintext";

export interface AIResponseProps {
    /** The markdown text of the response. Safe to pass while it is still streaming in. */
    children: string;
    /**
     * Whether the response is still arriving, which appends a blinking caret to the last block.
     * Defaults to the `isStreaming` state of the enclosing `AIMessage`.
     */
    isStreaming?: boolean;
    /**
     * The HTML heading level a markdown `#` maps to. `##` is one level deeper, and so on, capped
     * at `h6`. Keeps a response's headings under the page's own outline.
     *
     * @default 3
     */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /**
     * Where links open. External links always get `rel="noopener noreferrer"`.
     *
     * @default "_blank"
     */
    linkTarget?: "_blank" | "_self";
    /** Whether code blocks render a line-number gutter. @default false */
    showLineNumbers?: boolean;
    /** Additional classes merged onto the response. */
    className?: string;
}

const renderInline = (nodes: AIInlineNode[], linkTarget: AIResponseProps["linkTarget"]): ReactNode =>
    nodes.map((node, index) => {
        switch (node.type) {
            case "text":
                return <Fragment key={index}>{node.value}</Fragment>;
            case "code":
                return (
                    <code key={index} className={styles.code}>
                        {node.value}
                    </code>
                );
            case "strong":
                return (
                    <strong key={index} className={styles.strong}>
                        {renderInline(node.children, linkTarget)}
                    </strong>
                );
            case "emphasis":
                return (
                    <em key={index} className={styles.emphasis}>
                        {renderInline(node.children, linkTarget)}
                    </em>
                );
            case "link": {
                const opensNewTab = linkTarget === "_blank" && !node.href.startsWith("#");
                return (
                    <a
                        key={index}
                        href={node.href}
                        target={opensNewTab ? "_blank" : undefined}
                        rel={opensNewTab ? "noopener noreferrer" : undefined}
                        className={styles.link}
                    >
                        {renderInline(node.children, linkTarget)}
                        {opensNewTab && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                );
            }
        }
    });

/**
 * Renders the markdown an assistant streams back: headings, paragraphs, lists, blockquotes,
 * rules, inline code, bold, italic, links and fenced code blocks (highlighted by `CodeSnippet`).
 * Raw HTML is never interpreted, and links with unsafe schemes render as text.
 */
export const AIResponse = ({
    children,
    isStreaming: isStreamingProp,
    headingLevel = 3,
    linkTarget = "_blank",
    showLineNumbers = false,
    className,
}: AIResponseProps) => {
    const message = useAIMessage();
    const isStreaming = isStreamingProp ?? message?.isStreaming ?? false;
    const blocks = useMemo(() => parseMarkdown(children), [children]);

    const lastIndex = blocks.length - 1;
    // 1-based position of each code block among the response's code blocks, so their regions get distinct names.
    const codeOrdinals = useMemo(() => {
        let count = 0;
        return blocks.map((block) => (block.type === "code" ? ++count : 0));
    }, [blocks]);

    const renderBlock = (block: AIBlockNode, index: number): ReactNode => {
        // The caret trails the last text block; a trailing code block shows it underneath instead.
        const caret = isStreaming && index === lastIndex ? <AIStreamingCaret /> : null;

        switch (block.type) {
            case "heading": {
                const level = Math.min(6, headingLevel + block.depth - 1);
                return createElement(`h${level}`, { key: index, className: styles.heading[block.depth] }, renderInline(block.children, linkTarget), caret);
            }
            case "paragraph":
                return (
                    <p key={index} className={styles.paragraph}>
                        {renderInline(block.children, linkTarget)}
                        {caret}
                    </p>
                );
            case "blockquote":
                return (
                    <blockquote key={index} className={styles.blockquote}>
                        {renderInline(block.children, linkTarget)}
                        {caret}
                    </blockquote>
                );
            case "rule":
                return <hr key={index} className={styles.rule} />;
            case "list": {
                const ListTag = block.ordered ? "ol" : "ul";
                const lastItem = block.items.length - 1;
                return (
                    <ListTag
                        key={index}
                        start={block.ordered && block.start !== 1 ? block.start : undefined}
                        className={cx(styles.list.common, block.ordered ? styles.list.ordered : styles.list.unordered)}
                    >
                        {block.items.map((item, itemIndex) => (
                            <li key={itemIndex} className={styles.listItem}>
                                {renderInline(item, linkTarget)}
                                {itemIndex === lastItem && caret}
                            </li>
                        ))}
                    </ListTag>
                );
            }
            case "code": {
                const ordinal = codeOrdinals[index] ?? 1;
                const language = toCodeLanguage(block.language);
                const name = block.language || "Code";
                return (
                    <Fragment key={index}>
                        <CodeSnippet
                            code={block.value}
                            language={language}
                            showLineNumbers={showLineNumbers}
                            aria-label={`${name} code block${ordinal > 1 ? ` ${ordinal}` : ""}`}
                        />
                        {caret && <p>{caret}</p>}
                    </Fragment>
                );
            }
        }
    };

    return (
        <div data-ai-response="" className={cx(styles.root, className)}>
            {blocks.map(renderBlock)}
            {blocks.length === 0 && isStreaming && (
                <p>
                    <AIStreamingCaret />
                </p>
            )}
        </div>
    );
};
