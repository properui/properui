import { type InvoiceStatus, invoices } from "./data";
import { formatDate, formatMoney } from "./format";

const statusStyles: Record<InvoiceStatus, { label: string; className: string }> = {
    paid: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
    open: { label: "Open", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
    failed: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
    refunded: { label: "Refunded", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

export function InvoiceTable() {
    return (
        <section aria-labelledby="invoices-heading" className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-6 pb-4">
                <h2 id="invoices-heading" className="text-base font-semibold">
                    Invoice history
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Download receipts for your records.</p>
            </div>
            {invoices.length === 0 ? (
                <p className="border-t border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    No invoices yet. They will appear here after your first payment.
                </p>
            ) : (
                <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800">
                    <table className="w-full min-w-[40rem] text-sm">
                        <caption className="sr-only">Invoice history</caption>
                        <thead className="bg-zinc-50 text-start text-xs tracking-wide text-zinc-600 uppercase dark:bg-zinc-950/50 dark:text-zinc-400">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-start font-medium">
                                    Invoice
                                </th>
                                <th scope="col" className="px-6 py-3 text-start font-medium">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-start font-medium">
                                    Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-end font-medium">
                                    Amount
                                </th>
                                <th scope="col" className="px-6 py-3 text-start font-medium">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-end font-medium">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {invoices.map((inv) => {
                                const s = statusStyles[inv.status];
                                return (
                                    <tr key={inv.id}>
                                        <th scope="row" className="px-6 py-4 text-start font-medium whitespace-nowrap">
                                            {inv.id}
                                        </th>
                                        <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                            <time dateTime={inv.date}>{formatDate(inv.date)}</time>
                                        </td>
                                        <td className="px-6 py-4">{inv.description}</td>
                                        <td className="px-6 py-4 text-end whitespace-nowrap tabular-nums">{formatMoney(inv.amountCents)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <a
                                                href={`#${inv.id}`}
                                                aria-label={`Download invoice ${inv.id}`}
                                                className="rounded-md font-medium text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400"
                                            >
                                                Download
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
