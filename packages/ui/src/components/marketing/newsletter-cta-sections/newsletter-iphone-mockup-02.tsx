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

/** Pre-launch newsletter capture with the device on a tinted panel and floating notification cards. */
export const NewsletterIphoneMockup02 = () => (
    <section className="bg-primary pt-16 md:py-24">
        <div className="max-w-container relative mx-auto grid w-full grid-cols-1 gap-16 px-4 md:px-8 lg:grid-cols-2 lg:items-center">
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

            <ul aria-hidden="true" className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-12 flex-col gap-3 lg:flex">
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

            <div className="bg-tertiary relative -mx-4 min-h-90 w-screen overflow-hidden md:mx-0 md:min-h-140 md:w-full">
                <IPhoneMockup
                    image={IMAGES.square[1].src}
                    className="md:drop-shadow-iphone-mockup absolute top-6 right-1/2 w-full max-w-71 translate-x-1/2 sm:top-16 md:max-w-78.5 lg:end-12.5 lg:translate-x-0"
                />
            </div>
        </div>
    </section>
);
