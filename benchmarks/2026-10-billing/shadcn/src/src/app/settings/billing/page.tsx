import { CreditCard } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type InvoiceStatus, formatCurrency, formatDate, formatNumber, invoices, paymentMethod, plan, usage } from "@/lib/billing";
import { CancelSubscription } from "./cancel-subscription";
import { DownloadInvoice } from "./download-invoice";

export const metadata: Metadata = {
    title: "Billing settings",
    description: "Manage your plan, payment method and invoices.",
};

const statusBadge: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    paid: { label: "Paid", variant: "secondary" },
    open: { label: "Open", variant: "outline" },
    failed: { label: "Failed", variant: "destructive" },
    refunded: { label: "Refunded", variant: "outline" },
};

export default function BillingSettingsPage() {
    const renewal = formatDate(plan.renewsOn);

    return (
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
                <p className="text-muted-foreground mt-1 text-sm">Manage your plan, payment method and invoices.</p>
            </header>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Current plan</CardTitle>
                        <CardDescription>
                            Renews on {renewal}. You will be charged {formatCurrency(plan.priceCents)}.
                        </CardDescription>
                        <CardAction>
                            <Button variant="outline">Change plan</Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-xl font-semibold">{plan.name}</span>
                            <Badge>Active</Badge>
                            <span className="text-muted-foreground text-sm">
                                {formatCurrency(plan.priceCents)} per {plan.interval}, up to {plan.seatsIncluded} seats
                            </span>
                        </div>

                        <ul className="text-muted-foreground grid gap-1 text-sm sm:grid-cols-2">
                            {plan.features.map((feature) => (
                                <li key={feature}>{feature}</li>
                            ))}
                        </ul>

                        <section aria-labelledby="usage-heading" className="grid gap-4">
                            <h2 id="usage-heading" className="text-sm font-medium">
                                Usage this billing period
                            </h2>
                            {usage.map((meter) => {
                                const percent = Math.min(100, Math.round((meter.used / meter.limit) * 100));
                                return (
                                    <Progress
                                        key={meter.id}
                                        value={percent}
                                        aria-valuetext={`${formatNumber(meter.used)} of ${formatNumber(meter.limit)} ${meter.unit} used`}
                                        className="gap-2"
                                    >
                                        <ProgressLabel>{meter.label}</ProgressLabel>
                                        <span className="text-muted-foreground ml-auto flex items-center gap-2 text-sm tabular-nums">
                                            {percent >= 80 ? <Badge variant="outline">Near limit</Badge> : null}
                                            {formatNumber(meter.used)} of {formatNumber(meter.limit)} {meter.unit}
                                        </span>
                                    </Progress>
                                );
                            })}
                        </section>
                    </CardContent>
                    <CardFooter className="flex-wrap justify-between gap-3">
                        <p className="text-muted-foreground text-sm">Need to stop? You keep access until the end of the period.</p>
                        <CancelSubscription planName={plan.name} endsOn={renewal} />
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Payment method</CardTitle>
                        <CardDescription>Your card is charged automatically on each renewal.</CardDescription>
                        <CardAction>
                            <Button variant="outline">Update</Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg" aria-hidden>
                                <CreditCard className="size-5" />
                            </div>
                            <div className="min-w-0 text-sm">
                                <p className="font-medium">
                                    {paymentMethod.brand} ending in {paymentMethod.last4}
                                </p>
                                <p className="text-muted-foreground">
                                    Expires {String(paymentMethod.expMonth).padStart(2, "0")}/{paymentMethod.expYear} · {paymentMethod.holder}
                                </p>
                                <p className="text-muted-foreground truncate">Receipts go to {paymentMethod.billingEmail}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Invoice history</CardTitle>
                        <CardDescription>Your most recent invoices and their payment status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableCaption className="sr-only">Invoices, newest first</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-10">
                                        <span className="sr-only">Download</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => {
                                    const status = statusBadge[invoice.status];
                                    return (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{invoice.id}</TableCell>
                                            <TableCell>
                                                <time dateTime={invoice.issuedOn}>{formatDate(invoice.issuedOn)}</time>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground hidden sm:table-cell">{invoice.description}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatCurrency(invoice.amountCents)}</TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DownloadInvoice invoice={invoice} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
