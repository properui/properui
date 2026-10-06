export type InvoiceStatus = "paid" | "open" | "failed" | "refunded";

export type Invoice = {
    id: string;
    date: string; // ISO date
    description: string;
    amountCents: number;
    status: InvoiceStatus;
};

export const plan = {
    name: "Team",
    priceCents: 4900,
    interval: "month",
    seats: { used: 8, total: 10 },
    renewsOn: "2026-11-01",
    usage: [
        { label: "Seats", used: 8, limit: 10, unit: "" },
        { label: "Projects", used: 37, limit: 50, unit: "" },
        { label: "Storage", used: 41.2, limit: 50, unit: "GB" },
        { label: "API requests", used: 912_400, limit: 1_000_000, unit: "" },
    ],
};

export const paymentMethod = {
    brand: "Visa",
    last4: "4242",
    expMonth: 8,
    expYear: 2028,
    holder: "Ayman Shabaro",
    billingEmail: "billing@example.com",
};

export const invoices: Invoice[] = [
    { id: "INV-2026-010", date: "2026-10-01", description: "Team plan, October 2026", amountCents: 4900, status: "paid" },
    { id: "INV-2026-009", date: "2026-09-01", description: "Team plan, September 2026", amountCents: 4900, status: "paid" },
    { id: "INV-2026-008", date: "2026-08-14", description: "Additional seats (2)", amountCents: 1800, status: "failed" },
    { id: "INV-2026-007", date: "2026-08-01", description: "Team plan, August 2026", amountCents: 4900, status: "paid" },
    { id: "INV-2026-006", date: "2026-07-01", description: "Team plan, July 2026", amountCents: 4900, status: "refunded" },
    { id: "INV-2026-005", date: "2026-06-01", description: "Team plan, June 2026", amountCents: 4900, status: "paid" },
];
