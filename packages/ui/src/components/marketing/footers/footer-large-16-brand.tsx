import { sortCx } from "../../../utils/cx";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { ProperLogo } from "../../foundations/logo/proper-logo";

const styles = sortCx({
    navLink: "max-h-5 text-footer-button-fg hover:text-footer-button-fg_hover",
});

const navItems = ["Overview", "Features", "Pricing", "Careers", "Help", "Privacy"];

/**
 * A brand footer with a centred logo and inline navigation, closed by a row that pairs the
 * newsletter subscribe form with the copyright line.
 */
export const FooterLarge16Brand = () => {
    return (
        <footer className="bg-brand-section py-12 md:pt-16">
            <div className="max-w-container mx-auto px-4 md:px-8">
                <div className="flex flex-col gap-8 md:items-center">
                    {/* The mark is always the light lockup on the solid brand background. */}
                    <ProperLogo className="dark-mode" />

                    <nav>
                        <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-[repeat(6,max-content)]">
                            {navItems.map((item) => (
                                <li key={item} className="flex">
                                    <Button href="#" size="md" color="link-color" className={styles.navLink}>
                                        {item}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="relative mt-12 flex flex-col justify-between gap-8 pt-8 md:mt-16 md:flex-row md:items-center">
                    {/* Absolutely positioned so the rule spans the row without adding a border box. */}
                    <div className="bg-border-brand_alt absolute start-0 top-0 h-px w-full" />

                    <Form className="flex w-full flex-col gap-4 sm:flex-row md:max-w-100">
                        <Input isRequired size="lg" name="email" type="email" placeholder="Enter your email" wrapperClassName="flex-1" />
                        <Button type="submit" size="lg">
                            Subscribe
                        </Button>
                    </Form>

                    <p className="text-quaternary_on-brand text-sm">© 2077 Proper UI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
