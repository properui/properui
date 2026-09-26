/**
 * A deliberately small, dependency-free parser for the markdown subset that chat models emit.
 * It is tolerant of half-written input, because it runs on every streamed chunk: an unclosed
 * code fence becomes a code block that runs to the end of the text, and an unclosed `**` or
 * backtick is rendered literally until its closing marker arrives.
 *
 * Supported: ATX headings (`#` to `######`), paragraphs, `-`/`*`/`+` and `1.`/`1)` lists (one
 * level, no nesting), `>` blockquotes, `---` rules, fenced code blocks (``` and ~~~, with a
 * language), and inline `**bold**`, `__bold__`, `*italic*`, `_italic_`, `` `code` `` and
 * `[text](url)` links.
 *
 * Not supported: tables, images, raw HTML (always rendered as text), nested lists, setext
 * headings, indented code blocks, reference-style links, footnotes, strikethrough, task lists,
 * math, and backslash escapes.
 */

/** One piece of inline content. */
export type AIInlineNode =
    | { type: "text"; value: string }
    | { type: "code"; value: string }
    | { type: "strong"; children: AIInlineNode[] }
    | { type: "emphasis"; children: AIInlineNode[] }
    | { type: "link"; href: string; children: AIInlineNode[] };

/** One block of a parsed response. */
export type AIBlockNode =
    | { type: "heading"; depth: 1 | 2 | 3 | 4 | 5 | 6; children: AIInlineNode[] }
    | { type: "paragraph"; children: AIInlineNode[] }
    | { type: "list"; ordered: boolean; start: number; items: AIInlineNode[][] }
    | { type: "blockquote"; children: AIInlineNode[] }
    | { type: "code"; language: string; value: string; isClosed: boolean }
    | { type: "rule" };

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)[^\n]*$/;
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const UNORDERED = /^ {0,3}[-*+]\s+(.*)$/;
const ORDERED = /^ {0,3}(\d{1,9})[.)]\s+(.*)$/;
const QUOTE = /^ {0,3}>\s?(.*)$/;
const RULE = /^ {0,3}([-*_])(\s*\1){2,}\s*$/;

/** Only these URL schemes survive; anything else (`javascript:`, `data:`) renders as text. */
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#|\.{0,2}\/)/i;

/** Whether `href` is safe to render as a link. */
export const isSafeHref = (href: string): boolean => SAFE_URL.test(href.trim());

/** Parses inline markdown (code, links, bold, italic) into nodes. */
export const parseInline = (source: string): AIInlineNode[] => {
    const nodes: AIInlineNode[] = [];
    let text = "";
    let index = 0;

    const flush = () => {
        if (text) nodes.push({ type: "text", value: text });
        text = "";
    };

    while (index < source.length) {
        const rest = source.slice(index);
        const char = source.charAt(index);

        // Inline code: no further parsing inside.
        if (char === "`") {
            const match = /^(`+)([\s\S]*?[^`])\1(?!`)/.exec(rest);
            if (match) {
                flush();
                const code = match[2] ?? "";
                nodes.push({ type: "code", value: code.trim() || code });
                index += match[0].length;
                continue;
            }
        }

        // Links: [text](href). Unsafe schemes fall through and render as literal text.
        if (char === "[") {
            const match = /^\[([^\]\n]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/.exec(rest);
            const [, label = "", href = ""] = match ?? [];
            if (match && isSafeHref(href)) {
                flush();
                nodes.push({ type: "link", href, children: parseInline(label) });
                index += match[0].length;
                continue;
            }
        }

        // Bold: **text** or __text__.
        if ((char === "*" || char === "_") && source.charAt(index + 1) === char) {
            const marker = char + char;
            const close = source.indexOf(marker, index + 2);
            if (close > index + 2 && source.charAt(index + 2) !== " ") {
                flush();
                nodes.push({ type: "strong", children: parseInline(source.slice(index + 2, close)) });
                index = close + 2;
                continue;
            }
        }

        // Italic: *text* or _text_. Underscores inside words (snake_case) are left alone.
        if (char === "*" || char === "_") {
            const isIntraword = char === "_" && index > 0 && /\w/.test(source.charAt(index - 1));
            const close = source.indexOf(char, index + 1);
            const closesIntraword = char === "_" && /\w/.test(source.charAt(close + 1));
            if (!isIntraword && close > index + 1 && source.charAt(index + 1) !== " " && source.charAt(close - 1) !== " " && !closesIntraword) {
                flush();
                nodes.push({ type: "emphasis", children: parseInline(source.slice(index + 1, close)) });
                index = close + 1;
                continue;
            }
        }

        text += char;
        index += 1;
    }

    flush();
    return nodes;
};

/** Whether `line` closes a fence opened with `marker`: the same character, at least as many times. */
const isClosingFence = (line: string, marker: string): boolean => {
    const trimmed = line.trim();
    if (trimmed.length < marker.length) return false;
    return [...trimmed].every((char) => char === marker[0]);
};

const toDepth = (hashes: string) => hashes.length as 1 | 2 | 3 | 4 | 5 | 6;

/** Parses a (possibly incomplete) markdown string into blocks. */
export const parseMarkdown = (source: string): AIBlockNode[] => {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const at = (i: number) => lines[i] ?? "";
    const blocks: AIBlockNode[] = [];
    let index = 0;

    while (index < lines.length) {
        const line = at(index);

        if (line.trim() === "") {
            index += 1;
            continue;
        }

        const fence = FENCE.exec(line);
        if (fence) {
            const marker = fence[1] ?? "```";
            const body: string[] = [];
            let isClosed = false;
            index += 1;
            while (index < lines.length) {
                const current = at(index);
                if (isClosingFence(current, marker)) {
                    isClosed = true;
                    index += 1;
                    break;
                }
                body.push(current);
                index += 1;
            }
            blocks.push({ type: "code", language: (fence[2] ?? "").toLowerCase(), value: body.join("\n"), isClosed });
            continue;
        }

        const heading = HEADING.exec(line);
        if (heading) {
            blocks.push({ type: "heading", depth: toDepth(heading[1] ?? "#"), children: parseInline(heading[2] ?? "") });
            index += 1;
            continue;
        }

        if (RULE.test(line)) {
            blocks.push({ type: "rule" });
            index += 1;
            continue;
        }

        if (QUOTE.test(line)) {
            const quoted: string[] = [];
            while (index < lines.length && QUOTE.test(at(index))) {
                quoted.push(QUOTE.exec(at(index))?.[1] ?? "");
                index += 1;
            }
            blocks.push({ type: "blockquote", children: parseInline(quoted.join(" ").trim()) });
            continue;
        }

        const unordered = UNORDERED.exec(line);
        const ordered = ORDERED.exec(line);
        if (unordered || ordered) {
            const isOrdered = Boolean(ordered);
            const pattern = isOrdered ? ORDERED : UNORDERED;
            const items: string[] = [];
            while (index < lines.length) {
                const current = at(index);
                const match = pattern.exec(current);
                if (match) {
                    items.push((isOrdered ? match[2] : match[1]) ?? "");
                } else if (current.trim() !== "" && /^\s+/.test(current) && items.length > 0) {
                    // An indented continuation line belongs to the previous item.
                    items[items.length - 1] += ` ${current.trim()}`;
                } else {
                    break;
                }
                index += 1;
            }
            blocks.push({
                type: "list",
                ordered: isOrdered,
                start: ordered ? Number(ordered[1]) : 1,
                items: items.map((item) => parseInline(item.trim())),
            });
            continue;
        }

        // Paragraph: consecutive lines until a blank line or the start of another block.
        const paragraph: string[] = [];
        while (index < lines.length) {
            const current = at(index);
            if (
                current.trim() === "" ||
                (paragraph.length > 0 &&
                    (FENCE.test(current) ||
                        HEADING.test(current) ||
                        RULE.test(current) ||
                        QUOTE.test(current) ||
                        UNORDERED.test(current) ||
                        ORDERED.test(current)))
            ) {
                break;
            }
            paragraph.push(current.trim());
            index += 1;
        }
        blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
    }

    return blocks;
};
