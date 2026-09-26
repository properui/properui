import { cx } from "../../../utils/cx";
import { AVATARS, IMAGES } from "../../../utils/demo-assets";
import { AppStoreButton, GooglePlayButton } from "../../base/buttons/app-store-buttons-outline";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

/** Decorative notification cards that overlap the device. Purely illustrative, hidden from AT. */
const notifications = [
    { avatar: AVATARS[0], lead: AVATARS[0].name, body: " followed you!", meta: AVATARS[0].username, opacity: "" },
    { avatar: AVATARS[4], lead: AVATARS[4].name, body: " and 2 others gave you kudos on your Clubhouse 101 post", meta: null, opacity: "" },
    { avatar: AVATARS[1], lead: AVATARS[1].name, body: " joined your team Melbourne Startups Growth", meta: null, opacity: "opacity-75" },
    { avatar: AVATARS[2], lead: AVATARS[2].name, body: " just launched The 10k users challenge", meta: null, opacity: "opacity-50" },
];

/** A branded card holding the app-store CTA, a phone mockup and floating notification cards. */
export const CtaIphoneMockup04 = () => (
    <section className="bg-primary py-16 md:py-24">
        <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="bg-brand-section relative grid grid-cols-1 overflow-hidden rounded-2xl md:rounded-3xl md:shadow-xl lg:min-h-120 lg:grid-cols-2 lg:items-center">
                <div className="flex flex-1 flex-col px-6 pt-10 pb-12 sm:p-12 lg:p-16">
                    <h2 className="text-display-sm text-primary_on-brand xl:text-display-md font-semibold">Start your free trial</h2>
                    <p className="text-tertiary_on-brand mt-4 text-lg md:mt-5 lg:text-xl">Personal performance tracking made easy.</p>

                    <div className="mt-8 flex w-full gap-3 md:mt-12">
                        {/* The card is permanently branded, so the outline badges resolve their dark tokens locally. */}
                        <AppStoreButton size="lg" href="#" className="dark-mode" />
                        <GooglePlayButton size="lg" href="#" className="dark-mode" />
                    </div>
                </div>

                <IPhoneMockup
                    image={IMAGES.square[2].src}
                    className="drop-shadow-iphone-mockup end-16 top-10 max-h-70 w-full max-w-67 justify-self-center lg:absolute lg:max-h-none lg:max-w-78.5"
                />

                <ul aria-hidden="true" className="absolute bottom-10 left-1/2 hidden -translate-x-2 flex-col gap-3 lg:flex">
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
            </div>
        </div>
    </section>
);
