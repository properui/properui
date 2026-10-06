"use client";

import { useState } from "react";
import { DownloadCloud02 } from "@properui/icons";
import { ConfirmDialog } from "@/components/application/confirm-dialog/confirm-dialog";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table } from "@/components/application/table/table";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { VisaIcon } from "@/components/foundations/payment-icons";
import { type Invoice, type InvoiceStatus, type UsageMeter, invoices, paymentMethod, plan, usage } from "./billing-data";

const numberFormat = new Intl.NumberFormat("en-US");

const statusBadge: Record<InvoiceStatus, { label: string; color: "success" | "gray" | "error" }> = {
    paid: { label: "Paid", color: "success" },
    refunded: { label: "Refunded", color: "gray" },
    failed: { label: "Failed", color: "error" },
};

const sectionCard = "bg-primary ring-secondary rounded-xl shadow-xs ring-1 ring-inset";

const UsageRow = ({ meter }: { meter: UsageMeter }) => {
    const percentage = Math.round((meter.used / meter.limit) * 100);
    const labelId = `usage-${meter.id}`;

    return (
        <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
                <p id={labelId} className="text-primary text-sm font-medium">
                    {meter.label}
                </p>
                <p className="text-tertiary text-sm tabular-nums">
                    {numberFormat.format(meter.used)} of {numberFormat.format(meter.limit)} {meter.unit} ({percentage}%)
                </p>
            </div>
            <ProgressBarBase value={meter.used} max={meter.limit} />
        </div>
    );
};

export const BillingSettings = () => {
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isCancelScheduled, setIsCancelScheduled] = useState(false);
    const [announcement, setAnnouncement] = useState("");

    const cancelSubscription = async () => {
        // Stand-in for the real API call; the dialog shows its loading state while this is pending.
        await new Promise((resolve) => setTimeout(resolve, 800));
        setIsCancelScheduled(true);
        setAnnouncement(`Subscription cancelled. Your plan stays active until ${plan.renewalDate}.`);
    };

    const resumeSubscription = () => {
        setIsCancelScheduled(false);
        setAnnouncement("Subscription resumed. Your plan will renew automatically.");
    };

    const downloadInvoice = (invoice: Invoice) => {
        setAnnouncement(`Downloading invoice ${invoice.number}.`);
    };

    return (
        <main className="bg-primary min-h-screen">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-primary text-display-xs font-semibold">Billing</h1>
                    <p className="text-tertiary text-md">Manage your plan, payment method and invoices.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                    <section aria-labelledby="plan-heading" className={`${sectionCard} flex flex-col lg:col-span-3`}>
                        <div className="flex flex-col gap-6 p-4 pt-5 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 id="plan-heading" className="text-primary text-lg font-semibold">
                                            {plan.name}
                                        </h2>
                                        <Badge size="md" type="modern" color="gray">
                                            {plan.interval}
                                        </Badge>
                                        {isCancelScheduled && (
                                            <Badge size="md" type="pill-color" color="warning">
                                                Cancels {plan.renewalDate}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-tertiary text-sm">{plan.description}</p>
                                </div>

                                <p className="flex items-baseline gap-1">
                                    <span className="text-display-sm text-primary font-semibold">${plan.price}</span>
                                    <span className="text-md text-tertiary font-medium">per month</span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-secondary text-sm font-semibold">Usage this billing period</h3>
                                {usage.map((meter) => (
                                    <UsageRow key={meter.id} meter={meter} />
                                ))}
                            </div>
                        </div>

                        <div className="border-secondary flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                            <p className="text-tertiary text-sm">
                                {isCancelScheduled ? `Your plan ends on ${plan.renewalDate}.` : `Renews automatically on ${plan.renewalDate}.`}
                            </p>
                            {isCancelScheduled ? (
                                <Button color="secondary" size="md" onPress={resumeSubscription}>
                                    Resume subscription
                                </Button>
                            ) : (
                                <Button color="secondary-destructive" size="md" onPress={() => setIsCancelOpen(true)}>
                                    Cancel subscription
                                </Button>
                            )}
                        </div>
                    </section>

                    <section aria-labelledby="payment-heading" className={`${sectionCard} flex flex-col p-4 pt-5 sm:p-6 lg:col-span-2`}>
                        <h2 id="payment-heading" className="text-md text-primary font-semibold">
                            Payment method
                        </h2>
                        <p className="text-tertiary mt-0.5 text-sm">The card charged for your plan.</p>

                        <div className="ring-secondary mt-5 flex gap-3 rounded-lg p-4 ring-1 ring-inset">
                            <VisaIcon aria-label={paymentMethod.brand} className="h-8 w-auto shrink-0" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <p className="text-secondary text-sm font-medium">
                                    {paymentMethod.brand} ending in {paymentMethod.last4}
                                </p>
                                <p className="text-tertiary text-sm">Expires {paymentMethod.expiry}</p>
                                <p className="text-tertiary text-sm">{paymentMethod.holder}</p>
                            </div>
                        </div>

                        <p className="text-tertiary mt-4 text-sm">
                            Receipts are sent to <span className="text-secondary font-medium">{paymentMethod.billingEmail}</span>.
                        </p>
                    </section>
                </div>

                <section aria-labelledby="invoices-heading" className="flex flex-col gap-5">
                    <SectionHeader title={<span id="invoices-heading">Invoice history</span>} description="Download receipts for your past payments." />

                    <div className="bg-primary ring-secondary overflow-hidden rounded-xl shadow-xs ring-1">
                        <Table aria-label="Invoice history" size="sm">
                            <Table.Header>
                                <Table.Head id="invoice" label="Invoice" isRowHeader className="w-full" />
                                <Table.Head id="date" label="Billing date" />
                                <Table.Head id="status" label="Status" />
                                <Table.Head id="amount" label="Amount" />
                                <Table.Head id="actions">
                                    <span className="sr-only">Actions</span>
                                </Table.Head>
                            </Table.Header>

                            <Table.Body items={invoices}>
                                {(invoice) => (
                                    <Table.Row id={invoice.id}>
                                        <Table.Cell className="text-primary font-medium whitespace-nowrap">{invoice.number}</Table.Cell>
                                        <Table.Cell className="whitespace-nowrap">{invoice.date}</Table.Cell>
                                        <Table.Cell>
                                            <BadgeWithDot size="sm" type="modern" color={statusBadge[invoice.status].color}>
                                                {statusBadge[invoice.status].label}
                                            </BadgeWithDot>
                                        </Table.Cell>
                                        <Table.Cell className="whitespace-nowrap tabular-nums">{invoice.amount}</Table.Cell>
                                        <Table.Cell className="px-3">
                                            <div className="flex justify-end">
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={`Download ${invoice.number}`}
                                                    icon={DownloadCloud02}
                                                    onPress={() => downloadInvoice(invoice)}
                                                />
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    </div>
                </section>
            </div>

            <p role="status" aria-live="polite" className="sr-only">
                {announcement}
            </p>

            <ConfirmDialog
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                tone="destructive"
                title="Cancel subscription?"
                description={`You will keep access to the ${plan.name} until ${plan.renewalDate}. After that your workspace moves to the free tier and extra seats and storage are removed.`}
                confirmLabel="Cancel subscription"
                cancelLabel="Keep plan"
                onConfirm={cancelSubscription}
            />
        </main>
    );
};
