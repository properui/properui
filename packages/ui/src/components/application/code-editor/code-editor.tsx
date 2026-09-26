"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { Fragment, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useControlledState } from "@react-stately/utils";
import { AlertCircle, AlertTriangle, Check, Copy01, InfoCircle } from "@properui/icons";
import { useClipboard } from "../../../hooks/use-clipboard";
import { cx, sortCx } from "../../../utils/cx";
import { ButtonUtility } from "../../base/buttons/button-utility";
import type { CodeLanguage } from "../code-snippet/highlight";
import { highlight } from "../code-snippet/highlight";

export type { CodeLanguage } from "../code-snippet/highlight";

/** How serious a diagnostic is. Sets the line decoration colour and the gutter icon. */
export type CodeEditorDiagnosticSeverity = "error" | "warning" | "info";

export interface CodeEditorDiagnostic {
    /** The 1-based line the diagnostic applies to. */
    line: number;
    /** Optional 1-based column, shown next to the line number in the problems list. */
    column?: number;
    /** How serious the diagnostic is. @default "error" */
    severity?: CodeEditorDiagnosticSeverity;
    /** The message shown in the problems list and announced to assistive technology. */
    message: string;
}

/** Line height in pixels. Must match `leading-6` on both the textarea and the highlighted layer. */
const LINE_HEIGHT = 24;
/** Vertical padding in pixels. Must match `py-3` on both layers. */
const PADDING_Y = 12;

/** Opening characters that auto-close, and what closes them. */
const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
const CLOSERS = new Set(Object.values(PAIRS));
const QUOTES = new Set(['"', "'", "`"]);
const BRACKET_OPENERS = new Set(["(", "[", "{"]);

const SEVERITY_RANK: Record<CodeEditorDiagnosticSeverity, number> = { info: 0, warning: 1, error: 2 };
const SEVERITY_LABEL: Record<CodeEditorDiagnosticSeverity, string> = { error: "Error", warning: "Warning", info: "Info" };
const SEVERITY_ICON = { error: AlertCircle, warning: AlertTriangle, info: InfoCircle };

export const styles = sortCx({
    root: "flex w-full flex-col gap-1.5",
    label: "text-sm font-medium text-secondary",
    frame: {
        common: "relative flex flex-col overflow-hidden rounded-xl bg-primary shadow-xs ring-1 transition duration-100 ease-linear",
        idle: "ring-primary",
        focused: "ring-2 ring-brand",
        invalid: "ring-error_subtle",
        invalidFocused: "ring-2 ring-error",
        disabled: "cursor-not-allowed opacity-50",
    },
    toolbar: "flex min-h-10 items-center gap-2 border-b border-secondary bg-secondary px-3 py-1",
    scroller: "relative overflow-auto",
    content: "flex w-max min-w-full",
    gutter: "sticky start-0 z-10 shrink-0 border-e border-secondary bg-secondary py-3 font-mono text-sm leading-6 text-quaternary select-none",
    gutterLine: "flex h-6 min-w-12 items-center justify-end gap-1 ps-2 pe-3",
    code: "relative grow",
    /** Both layers share these metrics so every glyph of the textarea sits over its highlighted twin. */
    metrics: "m-0 border-0 py-3 font-mono text-sm leading-6 tracking-normal whitespace-pre",
    pre: "pointer-events-none text-primary",
    line: "block h-6 px-4",
    activeLine: "bg-secondary",
    textarea:
        "absolute inset-0 size-full resize-none overflow-hidden bg-transparent px-4 text-transparent caret-fg-primary outline-hidden placeholder:text-placeholder disabled:cursor-not-allowed",
    severity: {
        error: { line: "bg-error-primary", gutter: "text-fg-error-secondary", icon: "text-fg-error-secondary" },
        warning: { line: "bg-warning-primary", gutter: "text-fg-warning-secondary", icon: "text-fg-warning-secondary" },
        info: { line: "bg-brand-primary", gutter: "text-fg-brand-secondary", icon: "text-fg-brand-secondary" },
    },
    problems: "flex flex-col gap-1 border-t border-secondary bg-primary px-3 py-2",
    problem: "flex items-start gap-2 text-sm",
    hint: "text-sm text-tertiary",
    /** Semantic colour per token category, matching `CodeSnippet`. */
    token: {
        plain: "",
        string: "text-primary",
        comment: "text-quaternary",
        keyword: "text-utility-pink-600",
        constant: "text-utility-blue-600",
        function: "text-utility-brand-600",
    },
});

export interface CodeEditorProps {
    /** The code, for a controlled editor. */
    value?: string;
    /** The initial code, for an uncontrolled editor. @default "" */
    defaultValue?: string;
    /** Called with the full new code on every edit. */
    onChange?: (value: string) => void;
    /** Grammar used by the built-in highlighter. @default "typescript" */
    language?: CodeLanguage;
    /** Visible label. Either this or `aria-label` is required for an accessible name. */
    label?: ReactNode;
    /** Accessible name when there is no visible label. */
    "aria-label"?: string;
    /** Helper text shown below the editor and linked to it with `aria-describedby`. */
    hint?: ReactNode;
    /** Content for the toolbar row above the code, such as a file name or actions. */
    toolbar?: ReactNode;
    /** Whether to show the copy-to-clipboard button in the toolbar row. @default true */
    showCopyButton?: boolean;
    /** Whether to show the line-number gutter. @default true */
    showLineNumbers?: boolean;
    /** Whether to highlight the line holding the caret while the editor has focus. @default true */
    highlightActiveLine?: boolean;
    /** Whether typing an opening bracket or quote inserts its closing pair. @default true */
    autoCloseBrackets?: boolean;
    /** Number of spaces inserted by Tab and used for auto-indent. @default 2 */
    tabSize?: number;
    /** Minimum visible number of lines. @default 4 */
    minRows?: number;
    /** Maximum height of the code area before it scrolls, in pixels or any CSS length. */
    maxHeight?: CSSProperties["maxHeight"];
    /** Error, warning and info decorations. Listed below the code and linked to the textarea. */
    diagnostics?: CodeEditorDiagnostic[];
    /** Makes the code selectable and focusable but not editable. Tab moves focus as usual. */
    isReadOnly?: boolean;
    /** Disables the editor entirely. */
    isDisabled?: boolean;
    /** Placeholder shown while the editor is empty. */
    placeholder?: string;
    /** Name submitted with a surrounding form. */
    name?: string;
    /** Id of the textarea. Generated when omitted. */
    id?: string;
    className?: string;
}

const CopyCodeButton = ({ code }: { code: string }) => {
    const { copied, copy } = useClipboard();

    return <ButtonUtility size="xs" color="tertiary" aria-label={copied ? "Copied" : "Copy code"} icon={copied ? Check : Copy01} onPress={() => copy(code)} />;
};

/** The 1-based line holding character offset `index`. */
const lineAt = (value: string, index: number) => {
    let line = 1;
    for (let i = 0; i < index; i++) if (value.charCodeAt(i) === 10) line++;
    return line;
};

/**
 * An editable code area: a transparent `<textarea>` laid over a syntax-highlighted `<pre>`.
 * The textarea owns the text, caret, selection and undo history; the `<pre>` only paints.
 *
 * Keyboard: Tab and Shift+Tab indent and outdent, Enter keeps the current indentation.
 * Because Tab is captured for indentation, press Escape and then Tab (or Shift+Tab) to move
 * focus out of the editor. In read-only mode Tab is never captured.
 */
export const CodeEditor = ({
    value,
    defaultValue = "",
    onChange,
    language = "typescript",
    label,
    "aria-label": ariaLabel,
    hint,
    toolbar,
    showCopyButton = true,
    showLineNumbers = true,
    highlightActiveLine = true,
    autoCloseBrackets = true,
    tabSize = 2,
    minRows = 4,
    maxHeight,
    diagnostics = [],
    isReadOnly = false,
    isDisabled = false,
    placeholder,
    name,
    id: idProp,
    className,
}: CodeEditorProps) => {
    const generatedId = useId();
    const id = idProp ?? `code-editor-${generatedId}`;
    const instructionsId = `${id}-instructions`;
    const problemsId = `${id}-problems`;
    const hintId = `${id}-hint`;

    const [code, setCode] = useControlledState(value, defaultValue, onChange);
    const [activeLine, setActiveLine] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const escapeArmedRef = useRef(false);
    const pendingSelectionRef = useRef<[number, number] | null>(null);

    const indentUnit = " ".repeat(tabSize);

    // `highlight` drops one trailing newline; appending one keeps a final empty line the caret can sit on.
    const lines = useMemo(() => highlight(`${code}\n`, language), [code, language]);

    const severityByLine = useMemo(() => {
        const map = new Map<number, CodeEditorDiagnosticSeverity>();
        for (const diagnostic of diagnostics) {
            const severity = diagnostic.severity ?? "error";
            const current = map.get(diagnostic.line);
            if (!current || SEVERITY_RANK[severity] > SEVERITY_RANK[current]) map.set(diagnostic.line, severity);
        }
        return map;
    }, [diagnostics]);

    const sortedDiagnostics = useMemo(() => [...diagnostics].sort((a, b) => a.line - b.line || (a.column ?? 0) - (b.column ?? 0)), [diagnostics]);
    const hasErrors = diagnostics.some((diagnostic) => (diagnostic.severity ?? "error") === "error");
    const isFocused = activeLine !== null;

    const syncActiveLine = () => {
        const textarea = textareaRef.current;
        if (textarea && document.activeElement === textarea) setActiveLine(lineAt(textarea.value, textarea.selectionStart));
    };

    // Restores the caret after an edit that had to go through React state (see `replaceRange`).
    useLayoutEffect(() => {
        const selection = pendingSelectionRef.current;
        const textarea = textareaRef.current;
        if (!selection || !textarea) return;

        pendingSelectionRef.current = null;
        textarea.setSelectionRange(selection[0], selection[1]);
        syncActiveLine();
    });

    /**
     * Replaces `[start, end)` with `text` and places the selection at `[selectionStart, selectionEnd]`.
     * Uses `insertText` where the browser supports it so the edit joins the native undo stack,
     * and falls back to a state update otherwise.
     */
    const replaceRange = (start: number, end: number, text: string, selectionStart = start + text.length, selectionEnd = selectionStart) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.setSelectionRange(start, end);

        let isNative = false;
        try {
            // Deprecated, but still the only API that keeps scripted edits on the native undo stack.
            isNative = typeof document.execCommand === "function" && document.execCommand(text ? "insertText" : "delete", false, text);
        } catch {
            isNative = false;
        }

        if (isNative) {
            textarea.setSelectionRange(selectionStart, selectionEnd);
            syncActiveLine();
            return;
        }

        pendingSelectionRef.current = [selectionStart, selectionEnd];
        setCode(code.slice(0, start) + text + code.slice(end));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Escape arms the escape hatch: the next Tab (or Shift+Tab) moves focus instead of indenting.
        if (event.key === "Escape") {
            escapeArmedRef.current = true;
            return;
        }

        if (event.key === "Tab" && escapeArmedRef.current) {
            escapeArmedRef.current = false;
            return;
        }

        if (!["Shift", "Control", "Alt", "Meta"].includes(event.key)) escapeArmedRef.current = false;

        if (isReadOnly || isDisabled || event.nativeEvent.isComposing) return;

        const textarea = event.currentTarget;
        const { selectionStart: start, selectionEnd: end, value: text } = textarea;
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

        if (event.key === "Tab" && !hasModifier) {
            event.preventDefault();

            const selected = text.slice(start, end);

            if (!event.shiftKey && !selected.includes("\n")) {
                replaceRange(start, end, indentUnit);
                return;
            }

            // Indent or outdent every line the selection touches. A selection ending at the very
            // start of a line does not include that line.
            const lastIndex = end > start && text[end - 1] === "\n" ? end - 1 : end;
            const blockEndIndex = text.indexOf("\n", lastIndex);
            const blockEnd = blockEndIndex === -1 ? text.length : blockEndIndex;
            const block = text.slice(lineStart, blockEnd).split("\n");

            const outdent = (line: string) => {
                if (line.startsWith("\t")) return line.slice(1);
                const spaces = line.match(/^ */)?.[0].length ?? 0;
                return line.slice(Math.min(spaces, tabSize));
            };
            const next = block.map((line) => (event.shiftKey ? outdent(line) : line ? indentUnit + line : line));
            const replacement = next.join("\n");

            if (replacement === block.join("\n")) return;

            if (selected.includes("\n")) {
                replaceRange(lineStart, blockEnd, replacement, lineStart, lineStart + replacement.length);
            } else {
                const removed = (block[0]?.length ?? 0) - (next[0]?.length ?? 0);
                replaceRange(lineStart, blockEnd, replacement, Math.max(lineStart, start - removed), Math.max(lineStart, end - removed));
            }
            return;
        }

        if (event.key === "Enter" && !hasModifier) {
            event.preventDefault();

            const indent = text.slice(lineStart, start).match(/^[ \t]*/)?.[0] ?? "";
            const before = text[start - 1] ?? "";
            const after = text[end] ?? "";

            if (BRACKET_OPENERS.has(before)) {
                const inner = `\n${indent}${indentUnit}`;
                // Between a pair like `{|}`: open an indented line and push the closer below it.
                const insertion = PAIRS[before] === after ? `${inner}\n${indent}` : inner;
                replaceRange(start, end, insertion, start + inner.length);
                return;
            }

            replaceRange(start, end, `\n${indent}`);
            return;
        }

        if (!autoCloseBrackets || hasModifier) return;

        if (event.key === "Backspace" && start === end && start > 0) {
            const opener = text[start - 1] ?? "";
            if (PAIRS[opener] !== undefined && PAIRS[opener] === text[start]) {
                event.preventDefault();
                replaceRange(start - 1, start + 1, "");
            }
            return;
        }

        if (event.key.length !== 1) return;

        // Typing a closer that is already next to the caret steps over it.
        if (CLOSERS.has(event.key) && start === end && text[start] === event.key) {
            event.preventDefault();
            textarea.setSelectionRange(start + 1, start + 1);
            return;
        }

        const closer = PAIRS[event.key];
        if (closer === undefined) return;

        if (start !== end) {
            event.preventDefault();
            replaceRange(start, end, event.key + text.slice(start, end) + closer, start + 1, end + 1);
            return;
        }

        // Leave apostrophes inside words (`don't`) and pairs typed before other code alone.
        if (QUOTES.has(event.key) && /\w/.test(text[start - 1] ?? "")) return;
        if (text[start] !== undefined && !/[\s)\]},;:]/.test(text[start] ?? "")) return;

        event.preventDefault();
        replaceRange(start, end, event.key + closer, start + 1);
    };

    const minHeight = minRows * LINE_HEIGHT + PADDING_Y * 2;
    const describedBy = [instructionsId, sortedDiagnostics.length > 0 && problemsId, hint && hintId].filter(Boolean).join(" ");
    const showToolbar = toolbar !== undefined || showCopyButton;

    return (
        <div className={cx(styles.root, className)}>
            {label && (
                <label htmlFor={id} className={styles.label}>
                    {label}
                </label>
            )}

            <div
                className={cx(
                    styles.frame.common,
                    hasErrors ? (isFocused ? styles.frame.invalidFocused : styles.frame.invalid) : isFocused ? styles.frame.focused : styles.frame.idle,
                    isDisabled && styles.frame.disabled,
                )}
            >
                {showToolbar && (
                    <div className={styles.toolbar}>
                        <div className="flex min-w-0 flex-1 items-center gap-2">{toolbar}</div>
                        {showCopyButton && <CopyCodeButton code={code} />}
                    </div>
                )}

                <div className={styles.scroller} style={{ maxHeight }}>
                    <div className={styles.content}>
                        {showLineNumbers && (
                            <div aria-hidden="true" data-gutter="" className={styles.gutter} style={{ minHeight }}>
                                {lines.map((_, index) => {
                                    const lineNumber = index + 1;
                                    const severity = severityByLine.get(lineNumber);
                                    const Icon = severity ? SEVERITY_ICON[severity] : null;

                                    return (
                                        <span
                                            key={lineNumber}
                                            className={cx(
                                                styles.gutterLine,
                                                highlightActiveLine && lineNumber === activeLine && "text-secondary",
                                                severity && styles.severity[severity].gutter,
                                            )}
                                        >
                                            {Icon && <Icon className="size-3.5 shrink-0" />}
                                            {lineNumber}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        <div className={styles.code} style={{ minHeight }}>
                            <pre aria-hidden="true" className={cx(styles.metrics, styles.pre)} style={{ tabSize }}>
                                {lines.map((tokens, index) => {
                                    const lineNumber = index + 1;
                                    const severity = severityByLine.get(lineNumber);

                                    return (
                                        <span
                                            key={lineNumber}
                                            className={cx(
                                                styles.line,
                                                highlightActiveLine && lineNumber === activeLine && styles.activeLine,
                                                severity && styles.severity[severity].line,
                                            )}
                                        >
                                            {tokens.map((token, tokenIndex) =>
                                                token.type === "plain" ? (
                                                    <Fragment key={tokenIndex}>{token.content}</Fragment>
                                                ) : (
                                                    <span key={tokenIndex} className={styles.token[token.type]}>
                                                        {token.content}
                                                    </span>
                                                ),
                                            )}
                                        </span>
                                    );
                                })}
                            </pre>

                            <textarea
                                ref={textareaRef}
                                id={id}
                                name={name}
                                value={code}
                                placeholder={placeholder}
                                aria-label={label ? undefined : ariaLabel}
                                aria-describedby={describedBy}
                                aria-invalid={hasErrors || undefined}
                                readOnly={isReadOnly}
                                disabled={isDisabled}
                                wrap="off"
                                spellCheck={false}
                                autoCapitalize="off"
                                autoComplete="off"
                                autoCorrect="off"
                                data-gramm="false"
                                className={cx(styles.metrics, styles.textarea)}
                                style={{ tabSize }}
                                onChange={(event) => setCode(event.target.value)}
                                onKeyDown={handleKeyDown}
                                onKeyUp={syncActiveLine}
                                onSelect={syncActiveLine}
                                onPointerDown={() => {
                                    escapeArmedRef.current = false;
                                }}
                                onFocus={(event) => setActiveLine(lineAt(event.currentTarget.value, event.currentTarget.selectionStart))}
                                onBlur={() => {
                                    escapeArmedRef.current = false;
                                    setActiveLine(null);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {sortedDiagnostics.length > 0 && (
                    <ul id={problemsId} aria-label="Problems" className={styles.problems}>
                        {sortedDiagnostics.map((diagnostic, index) => {
                            const severity = diagnostic.severity ?? "error";
                            const Icon = SEVERITY_ICON[severity];

                            return (
                                <li key={index} className={styles.problem}>
                                    <Icon aria-hidden="true" className={cx("mt-0.5 size-4 shrink-0", styles.severity[severity].icon)} />
                                    <span className="text-tertiary shrink-0 font-mono">
                                        <span className="sr-only">{SEVERITY_LABEL[severity]}, </span>
                                        Line {diagnostic.line}
                                        {diagnostic.column !== undefined && `:${diagnostic.column}`}
                                    </span>
                                    <span className="text-secondary min-w-0">{diagnostic.message}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {hint && (
                <p id={hintId} className={styles.hint}>
                    {hint}
                </p>
            )}

            <span id={instructionsId} hidden>
                {isReadOnly || isDisabled
                    ? "Read-only code."
                    : "Tab inserts indentation and Shift+Tab removes it. To leave the editor, press Escape, then Tab or Shift+Tab."}
            </span>
        </div>
    );
};
