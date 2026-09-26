import type { SVGProps } from "react";
import { AVATARS } from "../../../utils/demo-assets";
import { Avatar } from "../../base/avatar/avatar";
import { Button } from "../../base/buttons/button";
import { SocialButton } from "../../base/buttons/social-button";
import { Form } from "../../base/form/form";
import { Input } from "../../base/input/input";
import { ProperLogoMinimal } from "../../foundations/logo/proper-logo-minimal";
import { RatingStars } from "../../foundations/rating/rating-stars";
import { HeaderDropdownSimple } from "../header-navigations/header-dropdown-simple";

const reviewers = AVATARS.slice(0, 5);

/** Hand-drawn looping arrow that points from the copy column to the sign-up card. Decorative only. */
const LoopingArrow = (props: SVGProps<SVGSVGElement>) => (
    <svg width="317" height="155" viewBox="0 0 317 155" fill="none" aria-hidden="true" {...props}>
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5c-2 54 20 105 78 122 46 13 84-13 82-45-2-27-40-31-52-9-15 27 14 55 55 61 45 6 106-13 137-45" />
            <path d="M279 65l25 24-32 15" />
        </g>
    </svg>
);

/** Split hero: copy plus social proof on the left, a sign-up card on a subtle panel on the right. */
export const HeroSplitForm01 = () => (
    <>
        <HeaderDropdownSimple />

        <section className="bg-primary relative md:pt-16 md:pb-24">
            <div className="max-w-container mx-auto flex w-full flex-col items-center md:gap-24 md:px-8 lg:flex-row lg:justify-between lg:gap-8">
                <div className="flex w-full flex-col items-start px-4 pt-16 pb-12 md:p-0">
                    <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
                        Super simplified <br /> customer service
                    </h1>
                    <p className="text-tertiary mt-4 max-w-120 text-lg text-balance md:mt-6 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more.
                    </p>

                    <div className="mt-8 flex items-center gap-4 md:mt-12">
                        <div className="inline-flex -space-x-3 overflow-hidden">
                            {reviewers.map((person) => (
                                <Avatar
                                    key={person.username}
                                    size="md"
                                    src={person.src}
                                    alt={person.alt}
                                    contrastBorder
                                    className="ring-bg-primary ring-[1.5px]"
                                />
                            ))}
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <RatingStars rating={5} className="items-center gap-1" starClassName="relative shrink-0 grow-0" />
                                <span className="text-md text-secondary font-semibold">5.0</span>
                            </div>
                            <p className="text-md text-tertiary font-medium">from 200+ reviews</p>
                        </div>
                    </div>
                </div>

                <div className="bg-secondary relative w-full px-4 pt-12 pb-16 md:max-w-110 md:rounded-2xl md:px-10 md:py-8">
                    <LoopingArrow className="text-fg-brand-secondary absolute hidden xl:bottom-12 xl:block xl:-translate-x-[107%]" />
                    <LoopingArrow className="text-fg-brand-secondary absolute end-0 top-0 hidden translate-x-48 -translate-y-32 -scale-x-100 -rotate-90 md:block lg:hidden" />

                    <Form>
                        <div className="flex flex-col items-center gap-6">
                            <ProperLogoMinimal className="hidden size-10 md:block" />
                            <div className="flex flex-col gap-2 text-center md:gap-3">
                                <h2 className="text-display-xs text-primary md:text-display-sm font-semibold">Create an account</h2>
                                <p className="text-md text-tertiary">Start your 30-day free trial</p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-5 md:mt-6">
                            <Input isRequired size="lg" name="name" label="Name" placeholder="Enter your name" hideRequiredIndicator />
                            <Input isRequired size="lg" name="email" type="email" label="Email" placeholder="Enter your email" hideRequiredIndicator />
                        </div>

                        <div className="mt-6 flex flex-col gap-4">
                            <Button type="submit" size="lg">
                                Get started
                            </Button>
                            <SocialButton social="google" size="lg">
                                Sign up with Google
                            </SocialButton>
                        </div>

                        <div className="mt-8 flex justify-center gap-1 md:mt-6">
                            <span className="text-tertiary text-sm">Already have an account?</span>
                            <Button color="link-color" size="md" href="/login">
                                Log in
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </section>
    </>
);
