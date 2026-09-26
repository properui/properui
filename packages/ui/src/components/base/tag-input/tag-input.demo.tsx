"use client";

import { useState } from "react";
import { TagInput } from "./tag-input";

export const TagInputExample = () => (
    <div className="w-full max-w-sm">
        <TagInput label="Skills" hint="Press Enter or , to add a skill." placeholder="Add a skill…" defaultValue={["React", "TypeScript"]} />
    </div>
);

/** A controlled `TagInput` — the parent owns the array of tags. */
export const Controlled = () => {
    const [tags, setTags] = useState<string[]>(["design", "engineering"]);

    return (
        <div className="flex w-full max-w-sm flex-col gap-2">
            <TagInput label="Topics" value={tags} onChange={setTags} placeholder="Add a topic…" />
            <p className="text-tertiary text-sm">
                {tags.length} topic(s): {tags.join(", ") || "none"}
            </p>
        </div>
    );
};

/** `maxTags` caps the count; `onInvalidTag` reports every rejected attempt, whatever the reason. */
export const MaxTagsWithFeedback = () => {
    const [message, setMessage] = useState<string | null>(null);

    return (
        <div className="flex w-full max-w-sm flex-col gap-2">
            <TagInput
                label="Reviewers"
                hint="Up to 3 reviewers."
                maxTags={3}
                defaultValue={["olivia", "phoenix"]}
                onInvalidTag={(value, reason) =>
                    setMessage(reason === "max-tags" ? "Only 3 reviewers allowed." : reason === "duplicate" ? `"${value}" is already added.` : null)
                }
                onTagAdded={() => setMessage(null)}
            />
            {message && <p className="text-error-primary text-sm">{message}</p>}
        </div>
    );
};

/** `validate` rejects a candidate tag before it's added — here, only lowercase, hyphenated slugs are accepted. */
export const WithValidation = () => (
    <div className="w-full max-w-sm">
        <TagInput label="Slugs" hint="Lowercase letters, numbers and hyphens only." placeholder="my-slug" validate={(value) => /^[a-z0-9-]+$/.test(value)} />
    </div>
);

/** `isReadOnly` keeps the tags visible without an input or remove buttons; `isInvalid` and `isDisabled` mirror `Input`'s states. */
export const States = () => (
    <div className="flex w-full max-w-sm flex-col gap-4">
        <TagInput label="Read only" isReadOnly defaultValue={["archived", "read-only"]} />
        <TagInput label="Disabled" isDisabled defaultValue={["locked"]} />
        <TagInput label="Required field" isRequired isInvalid hint="At least one tag is required." />
    </div>
);
