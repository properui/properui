import { IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

/** A left-aligned CTA with a phone mockup overlapping a bordered desktop screenshot. */
export const CtaScreenMockup02 = () => (
    <section className="bg-primary overflow-hidden pt-16 md:py-24">
        <div className="max-w-container mx-auto grid grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
            <div className="flex w-full max-w-3xl flex-col">
                <h2 className="text-display-sm text-primary md:text-display-lg font-semibold">Join 4,000+ startups growing with Proper UI</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-6 md:text-xl">Start your 30-day free trial today.</p>

                <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                    <Button size="xl" color="secondary">
                        Learn more
                    </Button>
                    <Button size="xl">Get started</Button>
                </div>
            </div>

            <div className="relative mx-auto min-h-90 md:min-h-100 lg:mx-0 lg:min-h-142">
                <img
                    src={IMAGES.landscape[6].src}
                    alt="Dashboard mockup showing the Proper UI application interface"
                    className="ring-screen-mockup-border shadow-3xl aspect-3/2 h-auto w-full max-w-5xl rounded object-cover ring-4 max-md:hidden md:ms-24 md:h-90 md:w-auto md:rounded-xl lg:absolute lg:inset-0 lg:start-24 lg:ms-0 lg:h-128"
                />

                <IPhoneMockup
                    image={IMAGES.square[1].src}
                    className="absolute left-1/2 max-w-71 -translate-x-1/2 md:start-0 md:top-12 md:max-w-45 md:translate-x-0 lg:top-18 lg:max-w-61"
                />
            </div>
        </div>
    </section>
);
