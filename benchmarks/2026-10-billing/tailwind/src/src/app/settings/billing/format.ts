const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});

export const formatMoney = (cents: number) => currency.format(cents / 100);
export const formatNumber = (n: number) => number.format(n);
export const formatDate = (iso: string) => date.format(new Date(`${iso}T00:00:00Z`));
