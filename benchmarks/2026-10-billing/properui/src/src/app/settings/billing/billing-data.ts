export type InvoiceStatus = "paid" | "refunded" | "failed";

export interface Invoice {
    id: string;
    number: string;
    date: string;
    amount: string;
    status: InvoiceStatus;
}

export interface UsageMeter {
    id: string;
    label: string;
    used: number;
    limit: number;
    unit: string;
}

export const plan = {
    name: "Team plan",
    interval: "Monthly",
    description: "For growing teams that need shared workspaces and priority support.",
    price: "49",
    renewalDate: "Nov 1, 2026",
} as const;

export const usage: UsageMeter[] = [
    { id: "seats", label: "Seats", used: 14, limit: 20, unit: "seats" },
    { id: "storage", label: "Storage", used: 62, limit: 100, unit: "GB" },
    { id: "requests", label: "API requests", used: 48200, limit: 100000, unit: "requests" },
];

export const paymentMethod = {
    brand: "Visa",
    last4: "4242",
    expiry: "06/2028",
    holder: "Alex Morgan",
    billingEmail: "billing@acme.example",
} as const;

export const invoices: Invoice[] = [
    { id: "inv-006", number: "INV-2026-010", date: "Oct 1, 2026", amount: "$49.00", status: "paid" },
    { id: "inv-005", number: "INV-2026-009", date: "Sep 1, 2026", amount: "$49.00", status: "paid" },
    { id: "inv-004", number: "INV-2026-008", date: "Aug 1, 2026", amount: "$49.00", status: "failed" },
    { id: "inv-003", number: "INV-2026-007", date: "Jul 1, 2026", amount: "$49.00", status: "paid" },
    { id: "inv-002", number: "INV-2026-006", date: "Jun 1, 2026", amount: "$49.00", status: "refunded" },
    { id: "inv-001", number: "INV-2026-005", date: "May 1, 2026", amount: "$49.00", status: "paid" },
];
