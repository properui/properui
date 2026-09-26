import { IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

/** Pre-launch newsletter capture with a pair of overlapping phone mockups on a tinted panel. */
export const NewsletterIphoneMockup03 = () => (
    <section className="bg-primary pt-16 md:py-24">
        <div className="max-w-container mx-auto grid w-full grid-cols-1 gap-16 px-4 md:px-8 lg:grid-cols-2 lg:items-center">
            <div className="z-20 flex flex-col items-start md:max-w-xl md:pe-18">
                <h2 className="text-display-sm text-primary md:text-display-md lg:text-display-lg font-semibold">Be the first to know when we launch</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-6 md:text-xl">
                    We&apos;re still building. Subscribe for updates and 20% off when we launch. <span className="max-md:hidden">No spam, we promise!</span>
                </p>

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

            <div className="bg-tertiary relative -mx-4 min-h-90 w-screen overflow-hidden md:mx-0 md:min-h-128 md:w-full">
                <IPhoneMockup
                    image={IMAGES.square[2].src}
                    className="drop-shadow-iphone-mockup absolute start-[47%] top-14 w-full max-w-67 -translate-x-[60%] sm:top-28 md:max-w-78.5 lg:start-12 lg:translate-x-0"
                />
                <IPhoneMockup
                    image={IMAGES.square[3].src}
                    className="drop-shadow-iphone-mockup absolute end-[47%] top-6 w-full max-w-67 translate-x-[60%] sm:top-12 md:max-w-78.5 lg:end-12 lg:translate-x-0"
                />
            </div>
        </div>
    </section>
);
