"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
    open: boolean;
    endDate: string;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
};

export function CancelDialog({ open, endDate, onClose, onConfirm }: Props) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descId = useId();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    async function confirm() {
        setPending(true);
        setError(null);
        try {
            await onConfirm();
        } catch {
            setError("We could not cancel your subscription. Please try again.");
        } finally {
            setPending(false);
        }
    }

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            aria-describedby={descId}
            onCancel={(e) => {
                if (pending) e.preventDefault();
            }}
            onClose={onClose}
            onClick={(e) => {
                if (e.target === ref.current && !pending) onClose();
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        >
            <div className="p-6">
                <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5">
                        <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <h2 id={titleId} className="mt-4 text-lg font-semibold">
                    Cancel your subscription?
                </h2>
                <p id={descId} className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Your Team plan stays active until <strong className="text-foreground">{endDate}</strong>. After that, your workspace becomes read-only and
                    members lose access to paid features. You can resubscribe at any time.
                </p>
                {error ? (
                    <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
                        {error}
                    </p>
                ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-zinc-800 dark:bg-zinc-950/50">
                <button
                    type="button"
                    autoFocus
                    disabled={pending}
                    onClick={onClose}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                    Keep subscription
                </button>
                <button
                    type="button"
                    disabled={pending}
                    onClick={confirm}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
                >
                    {pending ? "Cancelling..." : "Yes, cancel subscription"}
                </button>
            </div>
        </dialog>
    );
}
