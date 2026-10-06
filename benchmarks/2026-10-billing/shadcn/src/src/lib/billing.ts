export type InvoiceStatus = "paid" | "open" | "failed" | "refunded";

export type Invoice = {
    id: string;
    issuedOn: string;
    description: string;
    amountCents: number;
    status: InvoiceStatus;
};

export type UsageMeter = {
    id: string;
    label: string;
    used: number;
    limit: number;
    unit: string;
};

export const plan = {
    name: "Team",
    priceCents: 4900,
    interval: "month",
    seatsIncluded: 10,
    renewsOn: "2026-11-01",
    features: ["Unlimited projects", "Priority email support", "SSO and audit logs", "90-day activity history"],
} as const;

export const usage: UsageMeter[] = [
    { id: "seats", label: "Seats", used: 8, limit: 10, unit: "seats" },
    {
        id: "requests",
        label: "API requests",
        used: 82_400,
        limit: 100_000,
        unit: "requests",
    },
    { id: "storage", label: "Storage", used: 41.2, limit: 50, unit: "GB" },
];

export const paymentMethod = {
    brand: "Visa",
    last4: "4242",
    expMonth: 8,
    expYear: 2028,
    holder: "Ayman Shabaro",
    billingEmail: "billing@example.com",
} as const;

export const invoices: Invoice[] = [
    {
        id: "INV-2026-010",
        issuedOn: "2026-10-01",
        description: "Team plan, October 2026",
        amountCents: 4900,
        status: "paid",
    },
    {
        id: "INV-2026-009",
        issuedOn: "2026-09-01",
        description: "Team plan, September 2026",
        amountCents: 4900,
        status: "paid",
    },
    {
        id: "INV-2026-008",
        issuedOn: "2026-08-01",
        description: "Team plan, August 2026 + 2 extra seats",
        amountCents: 6900,
        status: "failed",
    },
    {
        id: "INV-2026-007",
        issuedOn: "2026-07-01",
        description: "Team plan, July 2026",
        amountCents: 4900,
        status: "paid",
    },
    {
        id: "INV-2026-006",
        issuedOn: "2026-06-01",
        description: "Team plan, June 2026",
        amountCents: 4900,
        status: "refunded",
    },
    {
        id: "INV-2026-005",
        issuedOn: "2026-05-01",
        description: "Team plan, May 2026",
        amountCents: 4900,
        status: "paid",
    },
];

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});

export function formatCurrency(cents: number) {
    return currency.format(cents / 100);
}

export function formatDate(iso: string) {
    return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

export function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}
