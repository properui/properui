import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import type { MarketingNavItemType } from "../header-navigations/base-components/header";
import { MarketingHeader } from "../header-navigations/base-components/header";
import { ProductsMenu, SimpleResourcesMenu } from "../header-navigations/base-components/menus";

const navItems: MarketingNavItemType[] = [
    { label: "Products", menu: <ProductsMenu /> },
    { label: "Services", menu: <ProductsMenu /> },
    { label: "Pricing", href: "/pricing" },
    { label: "Resources", menu: <SimpleResourcesMenu /> },
    { label: "About", href: "/about" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Three fixed point series for the decorative chart. Hard-coded rather than generated so
 * every render — and every screenshot diff — is identical.
 */
const seriesPoints = [
    "0,211.4 12.5,204.8 25,205.8 37.5,209.6 50,202.8 62.5,198.4 75,200.8 87.5,199 100,184.9 112.5,195.4 125,182 137.5,179.4 150,188.1 162.5,172.7 175,174.8 187.5,167.5 200,165.7 212.5,171.7 225,172.8 237.5,168.8 250,165.5 262.5,153.6 275,158.9 287.5,154.8 300,148.4 312.5,155.6 325,141.7 337.5,149.6 350,138 362.5,133.9 375,141.2 387.5,139.1 400,138.4 412.5,135.4 425,133.2 437.5,129.5 450,117.3 462.5,119.1 475,114.1 487.5,118.8 500,112.5 512.5,109 525,113.4 537.5,104.4 550,109.8 562.5,103 575,95.6 587.5,96.9 600,96",
    "0,153.2 12.5,149.4 25,142.8 37.5,139.8 50,141.9 62.5,145 75,141.2 87.5,135.1 100,132.9 112.5,135.6 125,131.2 137.5,126.5 150,123.7 162.5,121.5 175,120.4 187.5,126.2 200,119.1 212.5,114.9 225,116.1 237.5,116.9 250,111.6 262.5,109.6 275,111.1 287.5,109 300,100.6 312.5,106.7 325,102.2 337.5,103.4 350,102.4 362.5,92.5 375,96.1 387.5,94.8 400,91 412.5,89.3 425,88.3 437.5,88.4 450,81.4 462.5,79 475,80 487.5,80.9 500,71.2 512.5,75 525,76.2 537.5,73.1 550,71.9 562.5,66.8 575,65.6 587.5,58.6 600,64.2",
    "0,98.1 12.5,87.9 25,95.8 37.5,94.8 50,89.8 62.5,86.4 75,85.8 87.5,85.3 100,84.4 112.5,77.3 125,76 137.5,79.5 150,73 162.5,79.9 175,79.5 187.5,77.1 200,68.9 212.5,75.4 225,74.4 237.5,65.7 250,67.9 262.5,67.4 275,61.9 287.5,61.1 300,65.7 312.5,52.9 325,61.4 337.5,55.8 350,55 362.5,52.9 375,46.1 387.5,53.4 400,45.9 412.5,44.6 425,48.6 437.5,49.8 450,45 462.5,40.9 475,35.7 487.5,39.7 500,31.1 512.5,34.7 525,34.5 537.5,31.1 550,25.8 562.5,25.4 575,25.7 587.5,24.5 600,26.8",
];

const seriesStroke = ["text-utility-brand-300", "text-utility-brand-500", "text-utility-brand-700"];

/** The dashed hatch that flanks the card on wide viewports. Purely decorative. */
const HatchPattern = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 240 320" fill="none" aria-hidden="true" className={className}>
        {Array.from({ length: 10 }).map((_, column) =>
            Array.from({ length: 16 }).map((__, row) => (
                <line
                    key={`${column}-${row}`}
                    x1={column * 24 + 6}
                    y1={row * 20 + 4}
                    x2={column * 24 + 16}
                    y2={row * 20 + 14}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            )),
        )}
    </svg>
);

/**
 * Brand card hero: the pitch and email capture sit on a rounded brand panel, and a
 * metrics card overlaps its bottom edge with a stat dial hanging off the end corner.
 */
export const HeroColorCard01 = () => (
    <div className="bg-primary relative overflow-hidden">
        <MarketingHeader items={navItems} />

        <section className="relative overflow-hidden pb-16 md:pt-8 md:pb-24">
            <div className="absolute start-[-98px] top-1/2 hidden -translate-y-1/2 md:block">
                <HatchPattern className="text-fg-brand-secondary hidden w-48.5 opacity-30 md:block md:w-74.5" />
            </div>
            <div className="absolute end-12 bottom-9 max-md:hidden">
                <HatchPattern className="text-fg-brand-secondary hidden w-48.5 opacity-30 md:block md:w-74.5" />
            </div>

            <div className="max-w-container mx-auto md:px-8">
                <div className="bg-brand-section flex w-full flex-col items-center px-4 pt-16 pb-24 text-center md:rounded-3xl md:px-8 md:pt-24 md:pb-48">
                    <h1 className="text-display-md text-primary_on-brand md:text-display-lg lg:text-display-2xl max-w-3xl font-semibold">
                        Grow your users. <br />
                        <span className="text-secondary_on-brand">Smarter.</span>
                    </h1>
                    <p className="text-tertiary_on-brand mt-4 max-w-3xl text-lg text-balance md:mt-6 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                    </p>

                    <Form className="mt-10 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                        <Input
                            isRequired
                            size="lg"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            aria-label="Enter your email"
                            wrapperClassName="py-0.5 not-focus:ring-transparent"
                            hint={
                                <span className="text-tertiary_on-brand">
                                    We care about your data in our{" "}
                                    <a
                                        href="/privacy"
                                        className="outline-focus-ring rounded-xs underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2"
                                    >
                                        privacy policy
                                    </a>
                                    .
                                </span>
                            }
                        />
                        <Button type="submit" size="xl">
                            Get started
                        </Button>
                    </Form>
                </div>

                <div className="relative mx-auto -mt-8 w-max max-w-full px-4 md:-mt-24 md:px-8 md:pb-8">
                    <div className="bg-primary ring-secondary_alt flex h-68 flex-col overflow-hidden rounded-xl p-5 shadow-2xl ring-1 md:h-90 md:p-8 lg:h-115">
                        <div className="text-primary text-sm font-semibold md:text-lg">Users over time</div>

                        <div className="relative flex min-h-0 min-w-0 flex-1 items-center">
                            <div className="absolute inset-0 flex size-full flex-col justify-between py-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <span key={index} className="bg-border-tertiary h-px w-full" />
                                ))}
                            </div>

                            <svg viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true" className="relative max-h-full w-full max-w-full">
                                {seriesPoints.map((points, index) => (
                                    <polyline
                                        key={index}
                                        points={points}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                        className={seriesStroke[index]}
                                    />
                                ))}
                            </svg>
                        </div>

                        <ul className="flex justify-between px-2 md:px-6">
                            {months.map((month, index) => (
                                <li key={month} className={index % 2 === 1 ? "text-tertiary hidden text-xs md:block" : "text-tertiary text-xs"}>
                                    {month}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="absolute -end-12 -bottom-10 md:end-[-65px] md:bottom-0">
                        <div className="relative flex size-[192px] items-center justify-center md:size-auto">
                            <svg viewBox="0 0 240 240" aria-hidden="true" className="h-full max-h-full w-full max-w-full md:size-60">
                                <circle cx="120" cy="120" r="112" fill="none" strokeWidth="10" className="stroke-utility-brand-100" />
                                <circle
                                    cx="120"
                                    cy="120"
                                    r="112"
                                    fill="none"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray="528 176"
                                    transform="rotate(-90 120 120)"
                                    className="stroke-utility-brand-700"
                                />
                                <circle cx="120" cy="120" r="94" fill="none" strokeWidth="10" className="stroke-utility-brand-100" />
                                <circle
                                    cx="120"
                                    cy="120"
                                    r="94"
                                    fill="none"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray="384 207"
                                    transform="rotate(-90 120 120)"
                                    className="stroke-utility-brand-500"
                                />
                                <circle cx="120" cy="120" r="76" fill="none" strokeWidth="10" className="stroke-utility-brand-100" />
                                <circle
                                    cx="120"
                                    cy="120"
                                    r="76"
                                    fill="none"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray="215 263"
                                    transform="rotate(-90 120 120)"
                                    className="stroke-utility-brand-300"
                                />
                            </svg>

                            <div className="absolute flex flex-col items-center text-center md:gap-0.5">
                                <p className="text-tertiary text-xs font-medium md:text-sm">Active users</p>
                                <p className="text-primary md:text-display-xs lg:text-display-sm text-xl font-semibold">1,000</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
);
