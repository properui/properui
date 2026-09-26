import type { ReactNode } from "react";
import { sortCx } from "../../../utils/cx";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { ProperLogo } from "../../foundations/logo/proper-logo";
import { RatingBadge } from "../../foundations/rating/rating-badge";
import { AngelList, Dribbble, Facebook, GitHub, Layers, LinkedIn, X } from "../../foundations/social-icons";

const styles = sortCx({
    columnTitle: "text-quaternary_on-brand text-sm font-semibold",
    navLink: "max-h-5 text-footer-button-fg hover:text-footer-button-fg_hover",
    // The badge sits on the solid brand fill, where the neutral badge tokens have no contrast.
    badge: "ms-1 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white ring-1 ring-white/30 ring-inset",
    socialLink:
        "text-icon-fg-brand_on-brand outline-focus-ring hover:text-fg-quaternary_hover flex rounded-xs transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
});

const badge = (label: string): ReactNode => <span className={styles.badge}>{label}</span>;

const columns = [
    {
        title: "Product",
        items: [
            { label: "Overview" },
            { label: "Features" },
            { label: "Solutions", badge: "New" },
            { label: "Tutorials" },
            { label: "Pricing" },
            { label: "Releases" },
        ],
    },
    {
        title: "Company",
        items: [{ label: "About us" }, { label: "Careers" }, { label: "Press" }, { label: "News" }, { label: "Media kit" }, { label: "Contact" }],
    },
    {
        title: "Resources",
        items: [{ label: "Blog" }, { label: "Newsletter" }, { label: "Events" }, { label: "Help centre" }, { label: "Tutorials" }, { label: "Support" }],
    },
    {
        title: "Social",
        items: [{ label: "X" }, { label: "LinkedIn" }, { label: "Facebook" }, { label: "GitHub" }, { label: "AngelList" }, { label: "Dribbble" }],
    },
    {
        title: "Legal",
        items: [{ label: "Terms" }, { label: "Privacy" }, { label: "Cookies" }, { label: "Licenses" }, { label: "Settings" }, { label: "Contact" }],
    },
];

const socialLinks = [
    { label: "X", href: "https://x.com/", icon: X },
    { label: "LinkedIn", href: "https://www.linkedin.com/", icon: LinkedIn },
    { label: "Facebook", href: "https://www.facebook.com/", icon: Facebook },
    { label: "GitHub", href: "https://github.com/", icon: GitHub },
    { label: "AngelList", href: "https://angel.co/", icon: AngelList },
    { label: "Dribbble", href: "https://dribbble.com/", icon: Dribbble },
    { label: "Layers", href: "https://layers.com/", icon: Layers },
];

/**
 * The brand-background twin of `FooterLarge06`: a newsletter band above a five-column footer
 * whose first column carries the logo, the mission statement and a rating badge.
 */
export const FooterLarge06Brand = () => {
    return (
        <footer>
            <div className="bg-brand-section relative py-10 md:py-12">
                <div className="max-w-container mx-auto px-4 md:px-8">
                    <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
                        <div className="flex flex-col gap-2">
                            <p className="text-primary_on-brand text-lg font-semibold md:text-xl">Join our newsletter</p>
                            <p className="text-tertiary_on-brand text-md">We'll send you a nice letter once per week. No spam.</p>
                        </div>

                        <Form className="w-full sm:w-100">
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Input isRequired size="lg" name="email" type="email" placeholder="Enter your email" wrapperClassName="flex-1" />
                                <Button type="submit" size="lg">
                                    Subscribe
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>

                {/* Absolutely positioned so the rule spans the band without adding a border box. */}
                <div className="bg-border-brand_alt absolute start-0 bottom-0 h-px w-full" />
            </div>

            <div className="bg-brand-section py-12 md:pt-16">
                <div className="max-w-container mx-auto px-4 md:px-8">
                    <div className="flex flex-col gap-8 md:gap-16 xl:flex-row">
                        <div className="flex flex-col gap-6 md:w-80 md:gap-8">
                            {/* The mark is always the light lockup on the solid brand background. */}
                            <ProperLogo className="dark-mode" />

                            <p className="text-tertiary_on-brand text-md">Design amazing digital experiences that create more happy in the world.</p>

                            <RatingBadge theme="light" className="origin-top-left scale-[0.78]" />
                        </div>

                        <nav className="flex-1">
                            <ul className="grid grid-cols-2 gap-8 md:grid-cols-5">
                                {columns.map((column) => (
                                    <li key={column.title}>
                                        <h3 className={styles.columnTitle}>{column.title}</h3>

                                        <ul className="mt-4 flex flex-col gap-3">
                                            {column.items.map((item) => (
                                                <li key={item.label} className="flex">
                                                    <Button
                                                        href="#"
                                                        size="md"
                                                        color="link-color"
                                                        className={styles.navLink}
                                                        iconTrailing={item.badge ? badge(item.badge) : undefined}
                                                    >
                                                        {item.label}
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <div className="relative mt-12 flex flex-col-reverse justify-between gap-6 pt-8 md:mt-16 md:flex-row">
                        {/* Absolutely positioned so the rule spans the row without adding a border box. */}
                        <div className="bg-border-brand_alt absolute start-0 top-0 h-px w-full" />

                        <p className="text-quaternary_on-brand text-sm">© 2077 Proper UI. All rights reserved.</p>

                        <ul className="flex gap-4">
                            {socialLinks.map(({ label, href, icon: Icon }) => (
                                <li key={label}>
                                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={styles.socialLink}>
                                        <Icon aria-hidden="true" className="size-5" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};
