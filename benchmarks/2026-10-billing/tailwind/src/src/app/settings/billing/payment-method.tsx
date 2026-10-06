import { paymentMethod as pm } from "./data";

export function PaymentMethod() {
    return (
        <section aria-labelledby="payment-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
                <h2 id="payment-heading" className="text-base font-semibold">
                    Payment method
                </h2>
                <button
                    type="button"
                    className="rounded-md text-sm font-medium text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400"
                >
                    Update
                </button>
            </div>
            <div className="mt-4 flex items-center gap-4">
                <div
                    aria-hidden="true"
                    className="flex h-10 w-14 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-xs font-bold tracking-wide text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-300"
                >
                    {pm.brand.toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-medium">
                        {pm.brand} ending in <span className="tabular-nums">{pm.last4}</span>
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Expires {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                    </p>
                </div>
            </div>
            <dl className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
                <div className="flex justify-between gap-4">
                    <dt className="text-zinc-600 dark:text-zinc-400">Cardholder</dt>
                    <dd>{pm.holder}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-zinc-600 dark:text-zinc-400">Billing email</dt>
                    <dd className="text-end break-all">{pm.billingEmail}</dd>
                </div>
            </dl>
        </section>
    );
}
