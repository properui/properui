import { Check } from "@properui/icons";
import { Button } from "../../base/buttons/button";

interface Plan {
    name: string;
    price: string;
    note: string;
    isPopular?: boolean;
    features: string[];
}

const plans: Plan[] = [
    {
        name: "Basic plan",
        price: "$10/mth",
        note: "Billed annually.",
        isPopular: true,
        features: [
            "Access to all basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
    },
    {
        name: "Business plan",
        price: "$20/mth",
        note: "Billed annually.",
        features: ["200+ integrations", "Advanced reporting", "Up to 20 individual users", "40 GB individual data", "Priority chat and email support"],
    },
];

/** Decorative hand-drawn arrow pointing from the "Most popular!" label onto the featured card. */
const CalloutArrow = () => (
    <svg width="60" height="46" viewBox="0 0 60 46" fill="none" aria-hidden="true">
        <path
            d="M59 2.5C45.5 2.5 29.5 6.5 18.5 15.5C10.5 22 5 30.5 2.5 43"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M2.5 43.5L1.5 33.5M2.5 43.5L11 38.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/** A left copy column beside two price-first cards, with a hand-drawn callout over the popular plan. */
export const PricingSectionFeaturedCards02 = () => (
    <section className="bg-primary py-16 md:py-24">
        <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="flex flex-col gap-16 xl:flex-row">
                <div className="w-full max-w-3xl xl:max-w-md">
                    <span className="text-brand-secondary md:text-md block text-sm font-semibold">Upgrade</span>
                    <h2 className="text-display-sm text-primary md:text-display-md mt-3 hidden font-semibold md:flex">Pricing plans that scale</h2>
                    <h2 className="text-display-sm text-primary md:text-display-md mt-3 flex font-semibold md:hidden">Pricing plans that scale with you</h2>
                    <p className="text-tertiary mt-4 text-lg md:mt-5">Simple, transparent pricing that grows with you. Try any plan free for 30 days.</p>
                </div>

                <div className="grid w-full grid-cols-1 items-start gap-4 md:-ms-2 md:grid-cols-2 md:gap-8">
                    {plans.map((plan) => (
                        <div key={plan.name} className="bg-primary ring-secondary_alt relative flex flex-col rounded-2xl shadow-lg ring-1">
                            {plan.isPopular && (
                                <div className="absolute end-2 -top-6 md:-right-16">
                                    <div className="text-brand-secondary flex">
                                        <CalloutArrow />
                                        <span className="-mt-2 text-sm font-semibold">Most popular!</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center px-6 pt-10 text-center md:px-8">
                                <p className="text-display-md text-primary md:text-display-lg font-semibold">{plan.price}</p>
                                <h3 className="text-primary mt-4 text-xl font-semibold">{plan.name}</h3>
                                <p className="text-md text-tertiary mt-1">{plan.note}</p>
                            </div>

                            <ul className="flex flex-col gap-4 px-6 pt-8 pb-8 md:p-8 md:pb-10">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex gap-3">
                                        <div className="bg-success-secondary text-featured-icon-light-fg-success flex size-6 shrink-0 items-center justify-center rounded-full">
                                            <Check className="size-3.5" />
                                        </div>
                                        <span className="text-tertiary text-md">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto flex flex-col gap-3 px-6 pb-8 md:px-8">
                                <Button size="xl">Get started</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);
