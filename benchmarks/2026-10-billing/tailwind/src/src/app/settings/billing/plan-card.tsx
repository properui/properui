"use client";

import { useRef, useState } from "react";
import { CancelDialog } from "./cancel-dialog";
import { plan } from "./data";
import { formatDate, formatMoney } from "./format";
import { UsageMeter } from "./usage-meter";

export function PlanCard() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [canceled, setCanceled] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const endDate = formatDate(plan.renewsOn);

    async function cancelSubscription() {
        // Replace with a real API call; throwing surfaces an error in the dialog.
        await new Promise((resolve) => setTimeout(resolve, 600));
        setCanceled(true);
        setDialogOpen(false);
    }

    return (
        <section aria-labelledby="plan-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 id="plan-heading" className="text-base font-semibold">
                        Current plan
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        {plan.name}
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                canceled
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            }`}
                        >
                            {canceled ? "Cancels soon" : "Active"}
                        </span>
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatMoney(plan.priceCents)} per {plan.interval}
                        {" · "}
                        {canceled ? `Access ends ${endDate}` : `Renews ${endDate}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        {canceled ? "Resubscribe" : "Change plan"}
                    </button>
                    {!canceled ? (
                        <button
                            ref={triggerRef}
                            type="button"
                            onClick={() => setDialogOpen(true)}
                            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-zinc-700 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                            Cancel subscription
                        </button>
                    ) : null}
                </div>
            </div>

            {canceled ? (
                <p
                    role="status"
                    className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                >
                    Your subscription is canceled. You keep full access until {endDate}.
                </p>
            ) : null}

            <h3 className="mt-8 text-sm font-semibold">Usage this billing period</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {plan.usage.map((u) => (
                    <UsageMeter key={u.label} {...u} />
                ))}
            </div>

            <CancelDialog open={dialogOpen} endDate={endDate} onClose={() => setDialogOpen(false)} onConfirm={cancelSubscription} />
        </section>
    );
}
