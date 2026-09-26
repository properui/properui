import { IMAGES } from "../../../utils/demo-assets";
import { AppStoreButton, GooglePlayButton } from "../../base/buttons/app-store-buttons";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

/** App-store CTA with a pair of overlapping phone mockups on a tinted panel. */
export const CtaIphoneMockup03 = () => (
    <section className="bg-primary pt-16 md:py-24">
        <div className="max-w-container relative mx-auto grid w-full grid-cols-1 gap-16 px-4 md:px-8 lg:grid-cols-2 lg:items-center">
            <div className="flex max-w-3xl flex-col items-start">
                <h2 className="text-display-sm text-primary md:text-display-md lg:text-display-lg font-semibold">Growth performance tracking made easy</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-6 md:text-xl">Start your 30-day free trial today.</p>

                <div className="mt-8 flex w-full gap-3 md:mt-12">
                    <AppStoreButton size="lg" href="#" />
                    <GooglePlayButton size="lg" href="#" />
                </div>
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
