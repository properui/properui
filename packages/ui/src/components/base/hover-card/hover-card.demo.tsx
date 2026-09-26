"use client";

import { useState } from "react";
import { Link as AriaLink } from "react-aria-components";
import { Calendar, MarkerPin01 } from "@properui/icons";
import { AVATARS } from "../../../utils/demo-assets";
import { Avatar } from "../avatar/avatar";
import { Button } from "../buttons/button";
import { HoverCard, HoverCardTrigger } from "./hover-card";

const user = AVATARS[2];

/** A user profile card: an avatar, a name, a bio and a follow button, opened from a name link. */
export const HoverCardExample = () => (
    <div className="flex justify-center p-12">
        <p className="text-secondary text-sm">
            Reviewed by{" "}
            <HoverCard
                arrow
                trigger={
                    <AriaLink href="#" className="text-brand-secondary outline-focus-ring rounded font-semibold hover:underline focus-visible:outline-2">
                        {user.name}
                    </AriaLink>
                }
            >
                <div className="flex w-72 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <Avatar size="lg" src={user.src} alt={user.name} />
                        <Button size="sm" color="secondary">
                            Follow
                        </Button>
                    </div>
                    <div>
                        <p className="text-primary text-sm font-semibold">{user.name}</p>
                        <p className="text-tertiary text-sm">{user.username}</p>
                    </div>
                    <p className="text-secondary text-sm">Design engineer building accessible component libraries. Previously at Acme Inc.</p>
                    <div className="text-tertiary flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                            <MarkerPin01 className="size-3.5" aria-hidden="true" />
                            San Francisco
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" aria-hidden="true" />
                            Joined 2019
                        </span>
                    </div>
                </div>
            </HoverCard>{" "}
            on March 3rd.
        </p>
    </div>
);

/** The follow button inside the card is a real, independent control — pressing it does not close the card. */
export const WithInteractiveContent = () => {
    const [isFollowing, setIsFollowing] = useState(false);

    return (
        <div className="flex justify-center p-12">
            <HoverCard
                arrow
                trigger={
                    <HoverCardTrigger aria-label={`Preview ${user.name}`}>
                        <Avatar size="md" src={user.src} alt={user.name} />
                    </HoverCardTrigger>
                }
            >
                <div className="flex w-64 flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Avatar size="sm" src={user.src} alt="" />
                            <p className="text-primary text-sm font-semibold">{user.name}</p>
                        </div>
                        <Button size="sm" color={isFollowing ? "secondary" : "primary"} onPress={() => setIsFollowing((value) => !value)}>
                            {isFollowing ? "Following" : "Follow"}
                        </Button>
                    </div>
                    <p className="text-secondary text-sm">Loves building design systems and hiking on weekends.</p>
                </div>
            </HoverCard>
        </div>
    );
};

const placements = [
    { placement: "top", avatar: AVATARS[6] },
    { placement: "bottom", avatar: AVATARS[7] },
    { placement: "left", avatar: AVATARS[8] },
    { placement: "right", avatar: AVATARS[9] },
] as const;

/** Every `placement` the underlying `Popover` supports, opened around a plain avatar trigger. */
export const Placements = () => (
    <div className="grid grid-cols-2 gap-16 p-16">
        {placements.map(({ placement, avatar }) => (
            <div key={placement} className="flex flex-col items-center gap-2">
                <p className="text-tertiary text-xs font-medium capitalize">{placement}</p>
                <HoverCard
                    placement={placement}
                    trigger={
                        <HoverCardTrigger aria-label={`Preview ${avatar.name}`}>
                            <Avatar size="md" src={avatar.src} alt={avatar.name} />
                        </HoverCardTrigger>
                    }
                >
                    <p className="text-primary w-48 text-sm font-semibold">{avatar.name}</p>
                    <p className="text-tertiary text-sm">{avatar.username}</p>
                </HoverCard>
            </div>
        ))}
    </div>
);

/** A short open delay keeps the card from flashing open on a passing cursor. */
export const CustomDelays = () => (
    <div className="flex justify-center gap-8 p-12">
        <HoverCard
            openDelay={0}
            closeDelay={0}
            trigger={
                <HoverCardTrigger aria-label="Preview, no delay">
                    <Avatar size="md" src={AVATARS[4].src} alt={AVATARS[4].name} />
                </HoverCardTrigger>
            }
        >
            <p className="text-primary text-sm font-semibold">Opens instantly</p>
            <p className="text-tertiary text-sm">openDelay=0, closeDelay=0</p>
        </HoverCard>

        <HoverCard
            openDelay={1000}
            trigger={
                <HoverCardTrigger aria-label="Preview, long delay">
                    <Avatar size="md" src={AVATARS[5].src} alt={AVATARS[5].name} />
                </HoverCardTrigger>
            }
        >
            <p className="text-primary text-sm font-semibold">Opens after a second</p>
            <p className="text-tertiary text-sm">openDelay=1000</p>
        </HoverCard>
    </div>
);
