import { cx } from "../../../utils/cx";
import { AVATARS, IMAGES } from "../../../utils/demo-assets";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { IPhoneMockup } from "../../shared-assets/mockups/iphone-mockup";

/** Decorative notification cards that overlap the device. Purely illustrative, hidden from AT. */
const notifications = [
    {
        avatar: AVATARS[0],
        className: "",
        text: (
            <>
                <span className="text-brand-secondary font-medium">{AVATARS[0].name}</span> followed you!
            </>
        ),
        meta: AVATARS[0].username,
    },
    {
        avatar: AVATARS[4],
        className: "",
        text: (
            <>
                <span className="text-brand-secondary font-medium">{AVATARS[4].name}</span> and 2 other gave you kudos on{" "}
                <span className="text-brand-secondary font-medium">Clubhouse 101</span> post
            </>
        ),
        meta: null,
    },
    {
        avatar: AVATARS[1],
        className: "opacity-75",
        text: (
            <>
                <span className="text-brand-secondary font-medium">{AVATARS[1].name}</span> joined your team{" "}
                <span className="text-brand-secondary font-medium">Melbourne Startups Growth</span>
            </>
        ),
        meta: null,
    },
    {
        avatar: AVATARS[2],
        className: "opacity-50",
        text: (
            <>
                <span className="text-brand-secondary font-medium">{AVATARS[2].name}</span> just launched{" "}
                <span className="text-brand-secondary font-medium">The 10k users challenge workbook</span>
            </>
        ),
        meta: null,
    },
];

/** A branded card holding the newsletter capture, a phone mockup and floating notification cards. */
export const NewsletterIphoneMockup04 = () => (
    <section className="bg-primary py-16 md:py-24">
        <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="bg-brand-section relative grid grid-cols-1 overflow-hidden rounded-2xl md:rounded-3xl md:shadow-xl lg:min-h-120 lg:grid-cols-2 lg:items-center">
                <div className="flex flex-1 flex-col px-6 pt-10 pb-12 md:p-12 lg:p-16">
                    <h2 className="text-display-sm text-primary_on-brand xl:text-display-md font-semibold">
                        Be the first to know when we launch our new platform
                    </h2>
                    <p className="text-tertiary_on-brand mt-4 text-lg md:mt-5 lg:text-xl">
                        We&apos;re still building. Subscribe for updates and 20% off <span className="max-md:hidden">when we launch. No spam, we promise!</span>
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
                                <span className="text-tertiary_on-brand">
                                    <span className="md:hidden">Read about our</span>
                                    <span className="max-md:hidden">We care about your data in our</span>{" "}
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

                <IPhoneMockup
                    image={IMAGES.square[2].src}
                    className="drop-shadow-iphone-mockup end-16 top-10 max-h-70 w-full max-w-67 justify-self-center lg:absolute lg:max-h-none lg:max-w-78.5"
                />

                <ul aria-hidden="true" className="absolute bottom-10 left-1/2 hidden -translate-x-2 flex-col gap-3 lg:flex">
                    {notifications.map((notification) => (
                        <li
                            key={notification.avatar.name}
                            className={cx("bg-primary/90 flex w-full max-w-xs gap-3 rounded-lg p-4 backdrop-blur-lg", notification.className)}
                        >
                            <img src={notification.avatar.src} alt={notification.avatar.name} className="size-10 rounded-full object-cover" />
                            <div>
                                <p className="text-tertiary text-sm">{notification.text}</p>
                                {notification.meta && <p className="text-tertiary text-sm">{notification.meta}</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </section>
);
