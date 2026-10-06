import type { Metadata } from "next";
import { BillingSettings } from "./billing-settings";

export const metadata: Metadata = {
    title: "Billing settings",
    description: "Manage your plan, payment method and invoices.",
};

export default function BillingPage() {
    return <BillingSettings />;
}
