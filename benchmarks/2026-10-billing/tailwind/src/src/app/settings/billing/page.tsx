import type { Metadata } from "next";
import { InvoiceTable } from "./invoice-table";
import { PaymentMethod } from "./payment-method";
import { PlanCard } from "./plan-card";

export const metadata: Metadata = {
    title: "Billing settings",
    description: "Manage your plan, payment method and invoices.",
};

export default function BillingPage() {
    return (
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
            <header className="mb-8">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Settings</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Billing</h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Manage your subscription, payment details and past invoices.</p>
            </header>
            <div className="space-y-6">
                <PlanCard />
                <PaymentMethod />
                <InvoiceTable />
            </div>
        </main>
    );
}
