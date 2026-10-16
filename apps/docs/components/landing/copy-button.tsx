"use client";

import { useEffect, useRef, useState } from "react";
import { copyLabel, track } from "~/lib/analytics";

type CopyButtonProps = {
    /** Text written to the clipboard. */
    value: string;
    /** Default label, shown until copy is pressed. */
    children: React.ReactNode;
    /** Shown for 1600ms after a successful copy, then reverts to `children`. */
    successLabel?: string;
    /** Shown (and left showing) if `navigator.clipboard.writeText` throws. */
    failureLabel?: string;
    className?: string;
    id?: string;
};

/**
 * Ports the `[data-copy]` button behaviour from the supplied `script.js`: copy `value` to the
 * clipboard, show `successLabel` for 1600ms, or fall back to `failureLabel` (and leave it, same
 * as the source) if the clipboard write fails.
 */
export function CopyButton({ value, children, successLabel = "Copied", failureLabel = "Select & copy", className, id }: CopyButtonProps) {
    const [status, setStatus] = useState<"idle" | "success" | "failure">("idle");
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        },
        [],
    );

    const handleClick = async () => {
        try {
            await navigator.clipboard.writeText(value);
            track("copy", { label: copyLabel(value) });
            setStatus("success");
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setStatus("idle"), 1600);
        } catch {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setStatus("failure");
        }
    };

    return (
        <button type="button" id={id} className={className} onClick={handleClick}>
            {status === "success" ? successLabel : status === "failure" ? failureLabel : children}
        </button>
    );
}
