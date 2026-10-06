"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Invoice, formatCurrency, formatDate } from "@/lib/billing";

// Generates a plain-text receipt locally. Swap for a link to your invoice PDF.
export function DownloadInvoice({ invoice }: { invoice: Invoice }) {
    function download() {
        const body = [
            `Invoice ${invoice.id}`,
            `Date: ${formatDate(invoice.issuedOn)}`,
            `Description: ${invoice.description}`,
            `Amount: ${formatCurrency(invoice.amountCents)}`,
            `Status: ${invoice.status}`,
        ].join("\n");
        const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${invoice.id}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <Button variant="ghost" size="icon-sm" onClick={download} aria-label={`Download invoice ${invoice.id}`}>
            <Download aria-hidden />
        </Button>
    );
}
