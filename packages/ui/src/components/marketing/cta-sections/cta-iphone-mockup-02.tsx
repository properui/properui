import { cx } from "../../../utils/cx";
import { AVATARS, IMAGES } from "../../../utils/demo-assets";
import { AppStoreButton, GooglePlayButton } from "../../base/buttons/app-store-buttons";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

/** Decorative notification cards that overlap the device. Purely illustrative, hidden from AT. */
const notifications = [
    { avatar: AVATARS[0], lead: AVATARS[0].name, body: " followed you!", meta: AVATARS[0].username, opacity: "" },
    { avatar: AVATARS[4], lead: AVATARS[4].name, body: " and 2 others gave you kudos on your Clubhouse 101 post", meta: null, opacity: "" },
    { avatar: AVATARS[1], lead: AVATARS[1].name, body: " joined your team Melbourne Startups Growth", meta: null, opacity: "opacity-75" },
    { avatar: AVATARS[2], lead: AVATARS[2].name, body: " just launched The 10k users challenge", meta: null, opacity: "opacity-50" },
];

/** App-store CTA with the device sitting on a tinted panel and floating notification cards. */
export const CtaIphoneMockup02 = () => (
    <section className="bg-primary pt-16 md:py-24">
        <div className="max-w-container relative mx-auto grid w-full grid-cols-1 gap-16 px-4 md:px-8 lg:grid-cols-2 lg:items-center">
            <div className="z-20 flex max-w-3xl flex-col items-start">
                <h2 className="text-display-sm text-primary md:text-display-md lg:text-display-lg font-semibold">Growth performance tracking made easy</h2>
                <p className="text-tertiary mt-4 text-lg md:mt-6 md:text-xl">Start your 30-day free trial today.</p>

                <div className="mt-8 flex w-full gap-3 md:mt-12">
                    <AppStoreButton size="lg" href="#" />
                    <GooglePlayButton size="lg" href="#" />
                </div>
            </div>

            <ul aria-hidden="true" className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-12 flex-col gap-3 lg:flex">
                {notifications.map((notification) => (
                    <li
                        key={notification.avatar.name}
                        className={cx("bg-alpha-white/90 flex w-full max-w-xs gap-3 rounded-lg p-4 backdrop-blur-lg", notification.opacity)}
                    >
                        <img
                            src={notification.avatar.src}
                            alt={notification.avatar.name}
                            className="size-10 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10"
                        />
                        <div>
                            <p className="text-tertiary text-sm">
                                <span className="text-brand-secondary font-medium">{notification.lead}</span>
                                {notification.body}
                            </p>
                            {notification.meta && <p className="text-tertiary text-sm">{notification.meta}</p>}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="bg-tertiary relative -mx-4 min-h-90 w-screen overflow-hidden md:mx-0 md:min-h-140 md:w-full">
                <IPhoneMockup
                    image={IMAGES.square[1].src}
                    className="drop-shadow-iphone-mockup absolute top-6 right-1/2 w-full max-w-71 translate-x-1/2 sm:top-16 md:max-w-79 lg:end-12 lg:translate-x-0"
                />
            </div>
        </div>
    </section>
);
