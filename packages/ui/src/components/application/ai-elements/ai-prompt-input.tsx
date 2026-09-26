"use client";

import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button as AriaButton, FileTrigger as AriaFileTrigger, TextArea as AriaTextArea, TextField as AriaTextField } from "react-aria-components";
import { ArrowUp, File04, Paperclip, Stop, XClose } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { Button } from "../../base/buttons/button";
import { ButtonUtility } from "../../base/buttons/button-utility";

/**
 * Where the conversation is, mirroring the usual chat-hook states:
 * - `ready` — idle, the prompt can be sent.
 * - `submitted` — sent, waiting for the first token.
 * - `streaming` — the response is arriving; the send button becomes Stop.
 * - `error` — the last request failed; the prompt can be sent again.
 */
export type AIPromptInputStatus = "ready" | "submitted" | "streaming" | "error";

/** A file attached to the prompt. */
export interface AIAttachment {
    /** Unique identifier. */
    id: string;
    /** File name. */
    name: string;
    /** MIME type, e.g. `image/png`. Image types render a thumbnail when `url` is set. */
    type?: string;
    /** Size in bytes. */
    size?: number;
    /** Preview URL. Set automatically (as an object URL) for images picked in uncontrolled mode. */
    url?: string;
    /** The underlying file, when it was picked in the browser. */
    file?: File;
}

/** What `onSubmit` receives. */
export interface AIPromptSubmission {
    /** The prompt text, untrimmed. */
    text: string;
    /** The attached files. */
    attachments: AIAttachment[];
}

export const styles = sortCx({
    root: [
        "bg-primary ring-primary flex w-full flex-col rounded-xl shadow-xs ring-1 transition duration-100 ease-linear ring-inset",
        "has-[textarea:focus]:ring-brand has-[textarea:focus]:ring-2",
    ].join(" "),
    disabled: "cursor-not-allowed opacity-50",
    attachments: "flex flex-wrap gap-2 px-3 pt-3",
    attachment: "group/attachment relative flex",
    image: "ring-secondary size-14 rounded-lg object-cover ring-1",
    file: "bg-secondary ring-secondary flex h-14 max-w-56 items-center gap-2 rounded-lg ps-2.5 pe-3 ring-1 ring-inset",
    fileIcon: "text-fg-quaternary size-5 shrink-0",
    fileName: "text-secondary truncate text-sm font-medium",
    fileSize: "text-tertiary text-xs",
    remove: [
        "bg-primary text-fg-quaternary ring-primary shadow-xs outline-focus-ring absolute -end-1.5 -top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full ring-1 ring-inset",
        "hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
    ].join(" "),
    textarea:
        "text-md text-primary placeholder:text-placeholder max-h-48 min-h-12 w-full resize-none bg-transparent px-3.5 pt-3 pb-1 outline-hidden disabled:cursor-not-allowed",
    footer: "flex items-center justify-between gap-2 px-2 pb-2",
    tools: "flex min-w-0 items-center gap-1",
    end: "flex shrink-0 items-center gap-2",
    counter: "text-quaternary text-xs tabular-nums",
});

/** Formats a byte count as `12 KB` / `1.4 MB`. */
export const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB"];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
};

const isImage = (attachment: AIAttachment) => Boolean(attachment.url && attachment.type?.startsWith("image/"));

export interface AIPromptInputProps {
    /** The prompt text (controlled). */
    value?: string;
    /** The initial prompt text (uncontrolled). */
    defaultValue?: string;
    /** Called on every keystroke with the new text. */
    onChange?: (value: string) => void;
    /**
     * Called when the prompt is sent, by Enter or the send button. Empty prompts are never sent.
     * The field and attachments are cleared afterwards (through `onChange` / `onAttachmentsChange`
     * when controlled).
     */
    onSubmit?: (submission: AIPromptSubmission) => void;
    /** Where the conversation is. `submitted` and `streaming` swap the send button for Stop. @default "ready" */
    status?: AIPromptInputStatus;
    /** Called when Stop is pressed. */
    onStop?: () => void;
    /** The attachments (controlled). */
    attachments?: AIAttachment[];
    /** The initial attachments (uncontrolled). */
    defaultAttachments?: AIAttachment[];
    /** Called whenever files are added or removed. */
    onAttachmentsChange?: (attachments: AIAttachment[]) => void;
    /** Whether to show the attach button. @default true */
    allowsAttachments?: boolean;
    /** MIME types the file picker offers, e.g. `["image/*", "application/pdf"]`. */
    acceptedFileTypes?: string[];
    /** Slot for an `AIModelSelector`, rendered in the footer after the attach button. */
    modelSelector?: ReactNode;
    /** Extra footer tools, e.g. a web-search toggle. */
    tools?: ReactNode;
    /** Character or token counter slot, rendered before the send button. A function receives the current text. */
    counter?: ReactNode | ((text: string) => ReactNode);
    /** Disables the whole input. */
    isDisabled?: boolean;
    /** Accessible name of the text field. @default "Message" */
    label?: string;
    /** Placeholder shown while empty. @default "Ask anything…" */
    placeholder?: string;
    /** `name` of the text field, for native form handling. @default "prompt" */
    name?: string;
    /** Accessible name of the send button. @default "Send message" */
    submitLabel?: string;
    /** Accessible name of the stop button. @default "Stop generating" */
    stopLabel?: string;
    /** Accessible name of the attach button. @default "Add attachments" */
    attachLabel?: string;
    /** Additional classes merged onto the form. */
    className?: string;
}

let attachmentCount = 0;

/**
 * The prompt box of a chat: an auto-growing field where Enter sends and Shift+Enter adds a line,
 * with attachments, a model selector slot, a counter slot, and a send button that turns into
 * Stop while a response streams.
 */
export const AIPromptInput = ({
    value,
    defaultValue = "",
    onChange,
    onSubmit,
    status = "ready",
    onStop,
    attachments: attachmentsProp,
    defaultAttachments = [],
    onAttachmentsChange,
    allowsAttachments = true,
    acceptedFileTypes,
    modelSelector,
    tools,
    counter,
    isDisabled = false,
    label = "Message",
    placeholder = "Ask anything…",
    name = "prompt",
    submitLabel = "Send message",
    stopLabel = "Stop generating",
    attachLabel = "Add attachments",
    className,
}: AIPromptInputProps) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [textState, setTextState] = useState(defaultValue);
    const [attachmentsState, setAttachmentsState] = useState(defaultAttachments);

    const text = value ?? textState;
    const attachments = attachmentsProp ?? attachmentsState;
    const isBusy = status === "submitted" || status === "streaming";
    const canSubmit = !isDisabled && !isBusy && (text.trim() !== "" || attachments.length > 0);

    const setText = (next: string) => {
        if (value === undefined) setTextState(next);
        onChange?.(next);
    };

    const setAttachments = (next: AIAttachment[]) => {
        if (attachmentsProp === undefined) setAttachmentsState(next);
        onAttachmentsChange?.(next);
    };

    // Grow with the content, up to the field's max height, after which it scrolls.
    useLayoutEffect(() => {
        const element = textAreaRef.current;
        if (!element) return;
        element.style.height = "auto";
        element.style.height = `${element.scrollHeight}px`;
    }, [text]);

    const submit = () => {
        if (!canSubmit) return;
        onSubmit?.({ text, attachments });
        setText("");
        setAttachments([]);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submit();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter sends; Shift+Enter falls through to a newline. Never interrupt an IME composition.
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
        event.preventDefault();
        submit();
    };

    const addFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const added = Array.from(files).map<AIAttachment>((file) => ({
            id: `attachment-${++attachmentCount}`,
            name: file.name,
            type: file.type,
            size: file.size,
            url: file.type.startsWith("image/") && typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : undefined,
            file,
        }));
        setAttachments([...attachments, ...added]);
    };

    const removeAttachment = (attachment: AIAttachment) => {
        // Only revoke URLs this component created; consumer-supplied URLs are theirs to manage.
        if (attachment.file && attachment.url?.startsWith("blob:") && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(attachment.url);
        setAttachments(attachments.filter((item) => item.id !== attachment.id));
        textAreaRef.current?.focus();
    };

    return (
        <form onSubmit={handleSubmit} className={cx(styles.root, isDisabled && styles.disabled, className)}>
            {attachments.length > 0 && (
                <ul aria-label="Attachments" className={styles.attachments}>
                    {attachments.map((attachment) => (
                        <li key={attachment.id} className={styles.attachment}>
                            {isImage(attachment) ? (
                                <img src={attachment.url} alt={attachment.name} className={styles.image} />
                            ) : (
                                <div className={styles.file}>
                                    <File04 aria-hidden="true" className={styles.fileIcon} />
                                    <div className="flex min-w-0 flex-col">
                                        <span className={styles.fileName}>{attachment.name}</span>
                                        {attachment.size !== undefined && <span className={styles.fileSize}>{formatBytes(attachment.size)}</span>}
                                    </div>
                                </div>
                            )}
                            <AriaButton
                                aria-label={`Remove ${attachment.name}`}
                                isDisabled={isDisabled}
                                onPress={() => removeAttachment(attachment)}
                                className={styles.remove}
                            >
                                <XClose aria-hidden="true" className="size-3" />
                            </AriaButton>
                        </li>
                    ))}
                </ul>
            )}

            <AriaTextField aria-label={label} name={name} value={text} onChange={setText} isDisabled={isDisabled} className="flex">
                <AriaTextArea ref={textAreaRef} rows={1} placeholder={placeholder} onKeyDown={handleKeyDown} className={styles.textarea} />
            </AriaTextField>

            <div className={styles.footer}>
                <div className={styles.tools}>
                    {allowsAttachments && (
                        <AriaFileTrigger allowsMultiple acceptedFileTypes={acceptedFileTypes} onSelect={addFiles}>
                            <ButtonUtility size="xs" color="tertiary" icon={Paperclip} tooltip={attachLabel} isDisabled={isDisabled} />
                        </AriaFileTrigger>
                    )}
                    {modelSelector}
                    {tools}
                </div>

                <div className={styles.end}>
                    {counter !== undefined && <span className={styles.counter}>{typeof counter === "function" ? counter(text) : counter}</span>}
                    {isBusy ? (
                        <Button type="button" size="sm" color="secondary" iconLeading={Stop} aria-label={stopLabel} onPress={onStop} isDisabled={isDisabled} />
                    ) : (
                        <Button type="submit" size="sm" color="primary" iconLeading={ArrowUp} aria-label={submitLabel} isDisabled={!canSubmit} />
                    )}
                </div>
            </div>
        </form>
    );
};
