"use client";

import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { Check, Code02 } from "@properui/icons";
import { cx } from "../../../utils/cx";
import { SidebarNavigationSectionsSubheadings } from "../../application/app-navigation/sidebar-navigation/sidebar-sections-subheadings";
import { SectionFooter } from "../../application/section-footers/section-footers";
import { SectionHeader } from "../../application/section-headers/section-headers";
import { Button } from "../../base/buttons/button";
import { RadioButtonBase } from "../../base/radio-buttons/radio-buttons";
import { NativeSelect } from "../../base/select/select-native";
import { Toggle } from "../../base/toggle/toggle";
import { ProperLogo } from "../../foundations/logo/proper-logo";
import {
    SettingsFormRow,
    SettingsMain,
    SettingsPage,
    SettingsPageTitle,
    SettingsRowDivider,
    type SettingsTabItem,
    SettingsTabPanel,
    SettingsTabsRoot,
    SettingsTabsRow,
    navItemsWithSubheadings,
} from "./settings-shared.a";

/**
 * A colour swatch radio. Built directly on `AriaRadio` because the swatch replaces the radio dot
 * entirely — `RadioButton` always renders its own control.
 */
const ColorSwatchRadio = ({ value, label, swatch }: { value: string; label: string; swatch: string }) => (
    <AriaRadio
        value={value}
        aria-label={label}
        className="outline-focus-ring cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
    >
        {({ isSelected }) => (
            <span className={cx("flex size-7 items-center justify-center rounded-full outline-1 -outline-offset-1 outline-black/10", swatch)}>
                {isSelected && <Check aria-hidden="true" className="text-fg-white size-4" />}
            </span>
        )}
    </AriaRadio>
);

/** A preview card radio: the artwork on top, the radio dot in its corner and the label underneath. */
const PreviewCardRadio = ({ value, label, hint, preview }: { value: string; label: string; hint?: string; preview: string }) => (
    <AriaRadio
        value={value}
        className="outline-focus-ring flex cursor-pointer flex-col gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
    >
        {({ isSelected, isDisabled, isFocusVisible }) => (
            <>
                <span className={cx("ring-secondary relative block h-33 w-50 rounded-[10px] ring-1 ring-inset", preview)}>
                    <RadioButtonBase
                        size="md"
                        isSelected={isSelected}
                        isDisabled={isDisabled}
                        isFocusVisible={isFocusVisible}
                        className="absolute start-2 bottom-2"
                    />
                </span>
                <span className="flex w-full flex-col gap-0.5">
                    <span className="text-primary text-sm font-semibold">{label}</span>
                    {hint && <span className="text-tertiary text-sm">{hint}</span>}
                </span>
            </>
        )}
    </AriaRadio>
);

const tabs: SettingsTabItem[] = [
    { id: "details", label: "My details" },
    { id: "profile", label: "Profile" },
    { id: "password", label: "Password" },
    { id: "team", label: "Team" },
    { id: "appearance", label: "Appearance" },
    { id: "billing", label: "Billing" },
    { id: "email", label: "Email" },
    { id: "notifications", label: "Notifications", badge: 2 },
    { id: "integrations", label: "Integrations" },
    { id: "api", label: "API" },
];

/** The eight preset brand colors, drawn from the chart utility scale so both themes stay in range. */
const brandColors = [
    { id: "neutral", label: "Neutral", swatch: "bg-utility-neutral-500" },
    { id: "green", label: "Green", swatch: "bg-utility-green-500" },
    { id: "blue", label: "Blue", swatch: "bg-utility-blue-500" },
    { id: "indigo", label: "Indigo", swatch: "bg-utility-indigo-500" },
    { id: "purple", label: "Purple", swatch: "bg-utility-purple-500" },
    { id: "pink", label: "Pink", swatch: "bg-utility-pink-500" },
    { id: "orange", label: "Orange", swatch: "bg-utility-orange-500" },
    { id: "red", label: "Red", swatch: "bg-utility-red-500" },
];

const displayPreferences = [
    { id: "system", label: "System preference", preview: "bg-utility-neutral-100" },
    { id: "light", label: "Light mode", preview: "bg-utility-neutral-50" },
    { id: "dark", label: "Dark mode", preview: "bg-utility-neutral-800" },
];

const bannerAppearances = [
    { id: "default", label: "Default", hint: "Default solid brand color.", preview: "bg-brand-solid" },
    { id: "simplified", label: "Simplified", hint: "Minimal and simplified.", preview: "bg-secondary" },
];

/** Appearance settings: brand color, display mode, language and banner style. */
export const Settings06 = () => (
    <SettingsPage>
        <SidebarNavigationSectionsSubheadings activeUrl="/settings" items={navItemsWithSubheadings} />

        <SettingsMain>
            <SettingsTabsRoot selectedTab="appearance">
                <SettingsPageTitle title="Settings" withSearch>
                    <SettingsTabsRow items={tabs} selectedTab="appearance" type="button-border" />
                </SettingsPageTitle>

                <SettingsTabPanel id="appearance">
                    <div className="flex flex-col gap-6">
                        <SectionHeader title="Appearance" description="Change how your dashboard looks and feels." />

                        <div className="flex flex-col gap-5">
                            <SettingsFormRow label="Company logo" hint="Update your company logo.">
                                <div className="flex items-center gap-5">
                                    <ProperLogo className="h-8" />
                                    <Button color="secondary" size="md">
                                        Replace logo
                                    </Button>
                                </div>
                            </SettingsFormRow>

                            <SettingsRowDivider />

                            <SettingsFormRow label="Brand color" hint="Select or customize your brand color.">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                    <AriaRadioGroup aria-label="Brand color" defaultValue="purple" className="flex flex-row flex-wrap items-center gap-2">
                                        {brandColors.map((color) => (
                                            <ColorSwatchRadio key={color.id} value={color.id} label={color.label} swatch={color.swatch} />
                                        ))}
                                    </AriaRadioGroup>

                                    <Button color="secondary" size="md">
                                        Custom
                                    </Button>
                                </div>
                            </SettingsFormRow>

                            <SettingsRowDivider />

                            <SettingsFormRow label="Display preference" hint="Switch between light and dark modes.">
                                <div className="scrollbar-hide -mx-4 w-screen overflow-auto p-4 lg:mx-0 lg:w-full">
                                    <AriaRadioGroup aria-label="Display preference" defaultValue="system" className="flex gap-5">
                                        {displayPreferences.map((preference) => (
                                            <PreviewCardRadio key={preference.id} value={preference.id} label={preference.label} preview={preference.preview} />
                                        ))}
                                    </AriaRadioGroup>
                                </div>
                            </SettingsFormRow>

                            <SettingsRowDivider />

                            <SettingsFormRow label="Transparent sidebar" hint="Make the sidebar transparent.">
                                <Toggle size="md" aria-label="Transparent sidebar" />
                            </SettingsFormRow>

                            <SettingsRowDivider />

                            <SettingsFormRow label="Language" hint="Default language for public dashboard.">
                                <NativeSelect
                                    aria-label="Language"
                                    defaultValue="en-US"
                                    options={[
                                        { label: "English (US)", value: "en-US" },
                                        { label: "German (DE)", value: "de-DE" },
                                        { label: "Spanish (ES)", value: "es-ES" },
                                    ]}
                                />
                            </SettingsFormRow>

                            <SettingsRowDivider />

                            <SettingsFormRow label="Banner appearance" hint="Change how banners appear to visitors.">
                                <AriaRadioGroup aria-label="Banner appearance" defaultValue="default" className="flex flex-col gap-5 sm:flex-row">
                                    {bannerAppearances.map((banner) => (
                                        <PreviewCardRadio key={banner.id} value={banner.id} label={banner.label} hint={banner.hint} preview={banner.preview} />
                                    ))}
                                </AriaRadioGroup>
                            </SettingsFormRow>

                            <SettingsRowDivider />

                            <SettingsFormRow label="Custom styling" hint="Manage styling with CSS.">
                                <Button color="secondary" size="md" iconLeading={Code02} className="w-max">
                                    Edit CSS
                                </Button>
                            </SettingsFormRow>
                        </div>

                        <SectionFooter
                            contentLeading={
                                <Button color="link-gray" size="md">
                                    Reset to default
                                </Button>
                            }
                        >
                            <Button color="secondary" size="md">
                                Cancel
                            </Button>
                            <Button size="md">Save changes</Button>
                        </SectionFooter>
                    </div>
                </SettingsTabPanel>
            </SettingsTabsRoot>
        </SettingsMain>
    </SettingsPage>
);
