import { Check } from "@properui/icons";
import { IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";

const benefits = ["Latest releases and tips", "Our favorite articles each week", "Exclusive interviews with big names"];

/** A benefit checklist beside a desktop screen mockup that bleeds past the container on `lg`. */
export const NewsletterScreenMockup01 = () => (
    <section className="bg-primary overflow-hidden py-16 md:py-24">
        <div className="max-w-container mx-auto grid grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
            <div className="flex w-full max-w-3xl flex-col">
                <h2 className="text-display-sm text-primary md:text-display-lg font-semibold">We&apos;ll send you a nice letter once per week</h2>

                <ul className="mt-8 flex flex-col gap-4 ps-2 md:gap-5 md:ps-4">
                    {benefits.map((benefit) => (
                        <li key={benefit} className="flex gap-3">
                            <div className="bg-brand-primary text-featured-icon-light-fg-brand flex size-7 shrink-0 items-center justify-center rounded-full">
                                <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                            </div>
                            <span className="text-md text-tertiary pt-0.5 md:pt-0 md:text-lg">{benefit}</span>
                        </li>
                    ))}
                </ul>

                <Form className="mt-8 flex w-full flex-col gap-4 md:mt-12 md:max-w-120 md:flex-row">
                    <Input
                        isRequired
                        size="lg"
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        wrapperClassName="py-0.5 md:max-w-86.25"
                        hint={
                            <span>
                                We care about your data in our{" "}
                                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- placeholder href for a marketing section */}
                                <a
                                    href="#"
                                    className="outline-focus-ring rounded-xs underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    privacy policy
                                </a>
                                .
                            </span>
                        }
                    />
                    <Button type="submit" size="xl">
                        Subscribe
                    </Button>
                </Form>
            </div>

            <div className="relative mx-auto w-full lg:h-128">
                {/* Screen mockup bezel: outer frame, inner shadow ring, then the screen itself. */}
                <div className="bg-primary ring-utility-neutral-300 start-0 top-0 w-full max-w-5xl rounded-[9.03px] p-[0.9px] shadow-lg ring-[0.56px] ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px] lg:absolute lg:w-max">
                    <div className="bg-primary shadow-modern-mockup-inner-md md:shadow-modern-mockup-inner-lg rounded-[7.9px] p-0.5 md:rounded-[23.58px] md:p-1">
                        <div className="bg-utility-neutral-50 ring-utility-neutral-200 relative overflow-hidden rounded-[6.77px] ring-[0.56px] md:rounded-[20.21px] md:ring-[1.68px]">
                            <img
                                src={IMAGES.landscape[0].src}
                                alt="Dashboard mockup showing the Proper UI application interface"
                                className="w-full object-cover object-left-top"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
