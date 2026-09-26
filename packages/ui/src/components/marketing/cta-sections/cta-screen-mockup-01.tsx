import { CheckCircle } from "@properui/icons";
import { IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";

const benefits = ["30-day free trial", "Personalized onboarding", "Access to all features"];

/** A benefit checklist beside a desktop screen mockup that bleeds past the container on `lg`. */
export const CtaScreenMockup01 = () => (
    <section className="bg-primary overflow-hidden py-16 md:py-24">
        <div className="max-w-container mx-auto grid grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
            <div className="flex w-full max-w-3xl flex-col">
                <h2 className="text-display-sm text-primary md:text-display-lg font-semibold">Join 4,000+ startups growing with Proper UI</h2>

                <ul className="mt-8 flex flex-col gap-4 ps-2 md:gap-5 md:ps-4">
                    {benefits.map((benefit) => (
                        <li key={benefit} className="flex gap-3">
                            <CheckCircle aria-hidden="true" className="text-fg-brand-primary size-7 shrink-0" />
                            <span className="text-md text-tertiary pt-0.5 md:pt-0 md:text-lg">{benefit}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                    <Button size="xl" color="secondary">
                        Learn more
                    </Button>
                    <Button size="xl">Get started</Button>
                </div>
            </div>

            <div className="relative mx-auto w-full lg:h-128">
                {/* Screen mockup bezel: outer frame, inner shadow ring, then the screen itself. */}
                <div className="bg-primary ring-utility-neutral-300 start-0 top-0 w-full max-w-5xl rounded-[9.03px] p-[0.9px] shadow-lg ring-[0.56px] ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px] lg:absolute lg:w-max">
                    <div className="bg-primary shadow-modern-mockup-inner-md md:shadow-modern-mockup-inner-lg rounded-[7.9px] p-0.5 md:rounded-[23.58px] md:p-1">
                        <div className="bg-utility-neutral-50 ring-utility-neutral-200 relative overflow-hidden rounded-[6.77px] ring-[0.56px] md:rounded-[20.21px] md:ring-[1.68px]">
                            <img
                                src={IMAGES.landscape[4].src}
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
