"use client";

import type { ClipboardEvent, Key, KeyboardEvent, ReactNode } from "react";
import { useCallback, useId, useRef, useState } from "react";
import { Group as AriaGroup, Input as AriaInput } from "react-aria-components";
import { HelpCircle, InfoCircle } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";
import { HintText } from "../input/hint-text";
import { Label } from "../input/label";
import { Tag, TagGroup, TagList } from "../tags/tags";
import { Tooltip, TooltipTrigger } from "../tooltip/tooltip";

interface TagEntry {
    id: number;
    label: string;
}

/** Why a candidate tag was rejected instead of added. */
export type TagInputRejectReason = "empty" | "duplicate" | "max-tags" | "invalid";

export interface TagInputProps {
    /** Label text displayed above the input. */
    label?: string;
    /** Helper text displayed below the input. */
    hint?: ReactNode;
    /** Tooltip message displayed via a help icon inside the input. */
    tooltip?: string;
    /**
     * Input size variant.
     *
     * @default "md"
     */
    size?: "sm" | "md" | "lg";
    /** Placeholder text for the input field, shown only while there are no tags yet. */
    placeholder?: string;
    /** Whether the field is required. */
    isRequired?: boolean;
    /** Whether the field is disabled. */
    isDisabled?: boolean;
    /** Whether the field is in an invalid/error state. */
    isInvalid?: boolean;
    /**
     * Whether the tags can be viewed but not added to or removed — the text input is hidden and
     * every tag's remove button is omitted, but the tags themselves stay visible.
     */
    isReadOnly?: boolean;
    /**
     * Whether to allow duplicate tag values.
     *
     * @default false
     */
    allowDuplicates?: boolean;
    /** Maximum number of tags allowed. */
    maxTags?: number;
    /** Controlled value: array of tag strings. */
    value?: string[];
    /** Default tags for uncontrolled mode. */
    defaultValue?: string[];
    /** Called when the tags array changes. */
    onChange?: (tags: string[]) => void;
    /** Called when a tag is added. */
    onTagAdded?: (tag: string) => void;
    /** Called when a tag is removed. */
    onTagRemoved?: (tag: string) => void;
    /**
     * Validation callback for a candidate tag (already trimmed and non-empty). Return `true` to
     * accept it, `false` to reject it — a rejected value is left in the input rather than cleared.
     */
    validate?: (value: string) => boolean;
    /**
     * Called whenever a candidate tag is rejected, whether because it failed `validate`, is a
     * duplicate, or `maxTags` has been reached — useful for surfacing feedback (a shake, a toast)
     * without re-deriving why the tag didn't get added.
     */
    onInvalidTag?: (value: string, reason: TagInputRejectReason) => void;
    /** Optional className for the outer container. */
    className?: string;
    /** Whether to hide the required indicator from the label. */
    hideRequiredIndicator?: boolean;
}

/**
 * Type-to-add tags on <kbd>Enter</kbd> or <kbd>,</kbd>, <kbd>Backspace</kbd> at the start of an
 * empty input removes the last tag, and pasting a comma-separated string adds every value at
 * once. Built on `TagGroup`/`TagList`/`Tag` (`base/tags`) for the chips themselves and styled like
 * `base/input`'s text fields for the surrounding field chrome.
 */
export const TagInput = ({
    size = "md",
    label,
    hint,
    tooltip,
    placeholder,
    isRequired,
    isDisabled,
    isInvalid,
    isReadOnly,
    allowDuplicates = false,
    maxTags,
    value,
    defaultValue,
    onChange,
    onTagAdded,
    onTagRemoved,
    validate,
    onInvalidTag,
    className,
    hideRequiredIndicator,
}: TagInputProps) => {
    const isControlled = value !== undefined;
    const idCounter = useRef(0);
    const nextId = () => idCounter.current++;
    const labelId = `tag-input-label-${useId()}`;

    const inputRef = useRef<HTMLInputElement>(null);
    const tagGroupRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState("");

    // eslint-disable-next-line react-hooks/refs -- lazy `useState` initializer runs once on mount only.
    const [internalEntries, setInternalEntries] = useState<TagEntry[]>(() => (defaultValue ?? []).map((label) => ({ id: nextId(), label })));

    // For controlled mode, maintain stable IDs across renders so React keys don't shift
    const prevControlledValue = useRef<string[]>([]);
    const controlledEntries = useRef<TagEntry[]>([]);

    /* eslint-disable react-hooks/refs -- intentional in-render ref read/write: memoizes stable tag
     * ids across renders of a controlled `value` array without a `useMemo` (which would still read
     * the same refs). Reads/writes are synchronous and idempotent for a given `value` reference. */
    const entries = (() => {
        if (!isControlled) return internalEntries;

        const prev = prevControlledValue.current;
        if (prev === value) return controlledEntries.current;

        // Reconcile: reuse existing IDs for tags that haven't changed position,
        // assign new IDs only for genuinely new entries
        const oldEntries = controlledEntries.current;
        const newEntries: TagEntry[] = [];
        const usedOldIndices = new Set<number>();

        for (const label of value) {
            // Try to find a matching old entry (same label, not yet used)
            const oldIndex = oldEntries.findIndex((e, i) => e.label === label && !usedOldIndices.has(i));
            if (oldIndex !== -1) {
                usedOldIndices.add(oldIndex);
                newEntries.push(oldEntries[oldIndex]!);
            } else {
                newEntries.push({ id: nextId(), label });
            }
        }

        prevControlledValue.current = value;
        controlledEntries.current = newEntries;
        return newEntries;
    })();
    /* eslint-enable react-hooks/refs */

    const commit = useCallback(
        (newEntries: TagEntry[]) => {
            if (!isControlled) {
                setInternalEntries(newEntries);
            }
            onChange?.(newEntries.map((e) => e.label));
        },
        [isControlled, onChange],
    );

    // Pure: validates a candidate tag against a given base list and either returns the extended
    // list or `null` for a rejection, reporting why via `onInvalidTag`/`onTagAdded` either way.
    // Taking `base` as a parameter (rather than closing over `entries`) is what lets a multi-tag
    // paste accumulate several additions in one synchronous pass — each call sees the previous
    // one's result immediately, instead of the stale `entries` every call would otherwise share
    // until React re-renders.
    const tryAddTag = useCallback(
        (base: TagEntry[], text: string): TagEntry[] | null => {
            const trimmed = text.trim();
            const labels = base.map((e) => e.label);

            if (!trimmed) {
                onInvalidTag?.(text, "empty");
                return null;
            }
            if (!allowDuplicates && labels.includes(trimmed)) {
                onInvalidTag?.(trimmed, "duplicate");
                return null;
            }
            if (maxTags && base.length >= maxTags) {
                onInvalidTag?.(trimmed, "max-tags");
                return null;
            }
            if (validate && !validate(trimmed)) {
                onInvalidTag?.(trimmed, "invalid");
                return null;
            }

            onTagAdded?.(trimmed);
            return [...base, { id: nextId(), label: trimmed }];
        },
        [allowDuplicates, maxTags, validate, onTagAdded, onInvalidTag],
    );

    const addTag = useCallback(
        (text: string) => {
            const result = tryAddTag(entries, text);
            if (!result) return false;
            commit(result);
            return true;
        },
        [entries, tryAddTag, commit],
    );

    const removeTag = useCallback(
        (id: number) => {
            const entry = entries.find((e) => e.id === id);
            if (!entry) return;

            const newEntries = entries.filter((e) => e.id !== id);

            if (!isControlled) {
                setInternalEntries(newEntries);
            }
            onChange?.(newEntries.map((e) => e.label));
            onTagRemoved?.(entry.label);
        },
        [entries, isControlled, onChange, onTagRemoved],
    );

    const handleRemove = useCallback(
        (keys: Set<Key>) => {
            for (const key of keys) {
                removeTag(key as number);
            }
            if (entries.length - keys.size <= 0) {
                setTimeout(() => inputRef.current?.focus(), 0);
            }
        },
        [removeTag, entries.length],
    );

    const focusLastTag = useCallback(() => {
        const tagEls = tagGroupRef.current?.querySelectorAll<HTMLElement>('[role="row"]');
        if (tagEls && tagEls.length > 0) {
            tagEls[tagEls.length - 1]!.focus();
        }
    }, []);

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const isCaretAtStart = input.selectionStart === 0 && input.selectionEnd === 0;

        switch (event.key) {
            case "Enter":
            case ",":
                event.preventDefault();
                if (addTag(inputValue)) {
                    setInputValue("");
                }
                break;
            case "Backspace":
                // Removes the last tag outright rather than merely focusing it — with an empty
                // input and the caret already at the start, there's nothing else Backspace could
                // usefully do here.
                if (isCaretAtStart && inputValue === "" && entries.length > 0) {
                    event.preventDefault();
                    removeTag(entries[entries.length - 1]!.id);
                }
                break;
            case "ArrowLeft":
                if (isCaretAtStart) {
                    focusLastTag();
                }
                break;
        }
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        const pasted = event.clipboardData.getData("text");
        if (!pasted.includes(",")) return;

        event.preventDefault();

        // Every comma-delimited piece becomes a tag immediately; a trailing piece with no comma
        // after it (e.g. the "baz" in "foo, bar, baz") is left in the input for further editing.
        const parts = pasted.split(",");
        const trailing = parts.pop() ?? "";

        let working = entries;
        for (const candidate of parts) {
            working = tryAddTag(working, candidate) ?? working;
        }
        if (working !== entries) commit(working);

        setInputValue(trailing.trim());
    };

    const handleTagGroupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowRight") {
            const tagEls = tagGroupRef.current?.querySelectorAll<HTMLElement>('[role="row"]');
            if (tagEls && tagEls.length > 0) {
                const lastTag = tagEls[tagEls.length - 1]!;
                if (document.activeElement === lastTag || lastTag.contains(document.activeElement)) {
                    inputRef.current?.focus();
                }
            }
        }
    };

    const isEmpty = entries.length === 0;
    const hasTrailingIcon = tooltip || isInvalid;

    const sizes = sortCx({
        sm: {
            root: cx("gap-2 px-3 py-2 text-sm", !isEmpty && "py-1.5 ps-2", hasTrailingIcon && "pe-9"),
            iconTrailing: "end-3",
        },
        md: {
            root: cx("gap-2 px-3 py-2 text-md", !isEmpty && "ps-2", hasTrailingIcon && "pe-9"),
            iconTrailing: "end-3",
        },
        lg: {
            root: cx("gap-2 px-3.5 py-2.5 text-md", !isEmpty && "ps-2.5", hasTrailingIcon && "pe-9.5"),
            iconTrailing: "end-3.5",
        },
    });

    return (
        <div className={cx("flex flex-col gap-1.5", className)}>
            {label && (
                <Label id={labelId} isRequired={hideRequiredIndicator ? false : isRequired}>
                    {label}
                </Label>
            )}

            <AriaGroup
                isDisabled={isDisabled}
                isInvalid={isInvalid}
                className={({ isFocusWithin, isDisabled, isInvalid }) =>
                    cx(
                        "group/input bg-primary ring-primary relative flex w-full items-center rounded-lg shadow-xs ring-1 outline-hidden transition duration-100 ease-linear ring-inset",
                        isDisabled && "cursor-not-allowed opacity-50",
                        isFocusWithin && !isDisabled && "ring-brand ring-2",
                        isInvalid && !isFocusWithin && "ring-error_subtle",
                        isInvalid && isFocusWithin && "ring-error ring-2",
                        sizes[size].root,
                    )
                }
            >
                {({ isDisabled }) => (
                    <>
                        <div className={cx("relative flex w-full flex-1 flex-row flex-wrap items-center justify-start", size === "sm" ? "gap-1.5" : "gap-2")}>
                            {!isEmpty && (
                                // The keydown listener only rebounds focus to the adjacent text input; the actual
                                // interactive rows (with roles/tabIndex) are rendered by `TagGroup`/`TagList` below.
                                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                                <div ref={tagGroupRef} onKeyDown={handleTagGroupKeyDown} className="contents">
                                    <TagGroup
                                        label={label || "Tags"}
                                        size={size === "lg" ? "md" : size}
                                        onRemove={isReadOnly ? undefined : handleRemove}
                                        className="contents"
                                    >
                                        <TagList className="flex flex-wrap gap-1.5 focus:outline-hidden" items={entries}>
                                            {(item) => (
                                                <Tag
                                                    id={item.id}
                                                    isDisabled={isDisabled}
                                                    className="focus-visible:ring-focus-ring focus-visible:ring-2 focus-visible:ring-offset-[-2px] focus-visible:outline-hidden"
                                                >
                                                    {item.label}
                                                </Tag>
                                            )}
                                        </TagList>
                                    </TagGroup>
                                </div>
                            )}

                            {!isReadOnly && (
                                <div className="relative flex min-w-[20%] flex-1 flex-row items-center">
                                    <AriaInput
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        disabled={isDisabled}
                                        placeholder={isEmpty ? placeholder : undefined}
                                        aria-label={label ? undefined : "Tags"}
                                        aria-labelledby={label ? labelId : undefined}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        onPaste={handlePaste}
                                        className="text-primary caret-alpha-black/90 placeholder:text-placeholder w-full flex-[1_0_0] appearance-none bg-transparent text-ellipsis outline-hidden focus:outline-hidden disabled:cursor-not-allowed"
                                    />
                                </div>
                            )}
                        </div>

                        {tooltip && (
                            <Tooltip title={tooltip} placement="top">
                                <TooltipTrigger
                                    aria-label="More information"
                                    className={cx(
                                        "text-fg-quaternary hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover absolute cursor-pointer transition duration-100 ease-linear group-invalid/input:hidden",
                                        sizes[size].iconTrailing,
                                    )}
                                >
                                    <HelpCircle className="size-4 stroke-[2.25px]" />
                                </TooltipTrigger>
                            </Tooltip>
                        )}

                        <InfoCircle
                            className={cx(
                                "text-fg-error-secondary pointer-events-none absolute hidden size-4 stroke-[2.25px] group-invalid/input:block",
                                sizes[size].iconTrailing,
                            )}
                        />
                    </>
                )}
            </AriaGroup>

            {hint && (
                <HintText isInvalid={isInvalid} className={cx(size === "sm" && "text-xs")}>
                    {hint}
                </HintText>
            )}
        </div>
    );
};

TagInput.displayName = "TagInput";
