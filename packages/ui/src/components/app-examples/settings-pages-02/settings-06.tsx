"use client";

import type { ReactNode } from "react";
import { Radio as AriaRadio } from "react-aria-components";
import { Code01 } from "@properui/icons";
import { countries } from "../../../utils/countries";
import { cx } from "../../../utils/cx";
import { LOGOS } from "../../../utils/demo-assets";
import { SectionHeader } from "../../application/section-headers/section-headers";
import { Tabs } from "../../application/tabs/tabs";
import { Button } from "../../base/buttons/button";
import { Form } from "../../base/form/form";
import { InputBase } from "../../base/input/input";
import { RadioButtonBase, RadioGroup } from "../../base/radio-buttons/radio-buttons";
import { Select } from "../../base/select/select";
import { NativeSelect } from "../../base/select/select-native";
import { Toggle } from "../../base/toggle/toggle";
import { Divider, FieldLabel, PageContainer, SettingsHeaderNav, styles } from "./settings-shell";

const sections = [
    { id: "details", label: "My details" },
    { id: "profile", label: "Profile" },
    { id: "password", label: "Password" },
    { id: "team", label: "Team" },
    { id: "appearance", label: "Appearance" },
    { id: "billing", label: "Billing" },
    { id: "email", label: "Email" },
    { id: "notifications", label: "Notifications" },
    { id: "integrations", label: "Integrations" },
    { id: "api", label: "API" },
];

const sectionOptions = sections.map((section) => ({ label: section.label, value: section.id }));

/** The eight preset brand hues offered by the picker, as raw CSS values driving `background-color`. */
const brandSwatches = ["#535862", "#099250", "#1570EF", "#444CE7", "#6938EF", "#BA24D5", "#DD2590", "#E04F16"];
const customBrandColor = "#7F56D9";

const languages = [
    { id: "en-US", label: "English (US)", code: "US" },
    { id: "de-DE", label: "German (DE)", code: "DE" },
    { id: "fr-FR", label: "French (FR)", code: "FR" },
];

const flagFor = (code: string) => countries.find((country) => country.code === code)?.flag ?? "";

/** A schematic of an application shell, standing in for the rendered screenshot previews. */
const ShellPreview = ({ tone }: { tone: "light" | "dark" | "split" }) => (
    <div aria-hidden="true" className="absolute inset-2 flex gap-1.5 overflow-hidden rounded-md">
        <div className={cx("w-1/4 rounded-sm", tone === "dark" ? "bg-quaternary" : "bg-secondary", tone === "split" && "bg-quaternary")} />
        <div className={cx("flex flex-1 flex-col gap-1 rounded-sm p-1.5", tone === "dark" ? "bg-tertiary" : "bg-primary")}>
            <div className="bg-quaternary h-1.5 w-2/3 rounded-full" />
            <div className="bg-secondary h-1 w-full rounded-full" />
            <div className="bg-secondary h-1 w-5/6 rounded-full" />
            <div className="bg-secondary mt-auto h-6 w-full rounded-sm" />
        </div>
    </div>
);

/** A schematic of a marketing banner, standing in for the rendered screenshot previews. */
const BannerPreview = ({ tone }: { tone: "solid" | "minimal" | "custom" }) => (
    <div aria-hidden="true" className="absolute inset-3 flex flex-col gap-1.5 overflow-hidden rounded-md">
        <div className={cx("h-8 w-full rounded-sm", tone === "solid" ? "bg-brand-solid" : "bg-secondary")} />
        <div className="bg-quaternary h-1.5 w-2/3 rounded-full" />
        <div className="bg-secondary h-1 w-full rounded-full" />
        {tone !== "minimal" && <div className="bg-secondary h-1 w-4/5 rounded-full" />}
    </div>
);

interface PreviewRadioProps {
    value: string;
    label: string;
    description?: string;
    overlay?: ReactNode;
    bordered?: boolean;
    children: ReactNode;
}

const PreviewRadio = ({ value, label, description, overlay, bordered, children }: PreviewRadioProps) => (
    <AriaRadio value={value} className="flex cursor-pointer flex-col gap-3">
        {({ isSelected, isFocusVisible }) => (
            <>
                <span
                    className={cx(
                        "bg-utility-neutral-100 relative block h-33 w-50 rounded-[10px]",
                        bordered && "before:border-primary before:absolute before:inset-0 before:z-10 before:rounded-[10px] before:border",
                        (isSelected || isFocusVisible) && "outline-focus-ring outline-2 outline-offset-2",
                    )}
                >
                    {children}
                    {overlay}
                    {isSelected && <RadioButtonBase isSelected size="md" className="absolute start-2 bottom-2 z-20" />}
                </span>

                <span className="block w-full">
                    <span className="text-primary block text-sm font-semibold">{label}</span>
                    {description && <span className="text-tertiary block text-sm">{description}</span>}
                </span>
            </>
        )}
    </AriaRadio>
);

/** Appearance settings: logo, brand color, theme, language and banner style. */
export const Settings06 = () => (
    <div className="bg-primary">
        <SettingsHeaderNav />

        <main className="bg-primary pt-8 pb-12 lg:pt-12 lg:pb-24">
            <div className="flex flex-col gap-8 lg:gap-12">
                <div className="flex flex-col gap-8">
                    <PageContainer className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 lg:flex-row">
                            <div className="flex flex-1 flex-col gap-0.5">
                                <h1 className={styles.pageTitle}>Settings</h1>
                                <p className={styles.pageDescription}>Manage your team and preferences here.</p>
                            </div>
                        </div>

                        <NativeSelect size="sm" aria-label="Page tabs" defaultValue="appearance" options={sectionOptions} className="w-full lg:hidden" />
                    </PageContainer>

                    <div className="max-w-container mx-auto flex w-full gap-16 px-4 lg:px-8">
                        <Tabs orientation="vertical" defaultSelectedKey="appearance" className="hidden w-auto lg:flex">
                            <Tabs.List type="line" items={sections} aria-label="Settings sections">
                                {(item) => <Tabs.Item {...item} badge={item.id === "notifications" ? 2 : undefined} />}
                            </Tabs.List>
                            {sections.map((item) => (
                                <Tabs.Panel key={item.id} id={item.id} />
                            ))}
                        </Tabs>

                        <Form className="flex min-w-0 flex-1 flex-col gap-6">
                            <SectionHeader size="sm" title="Appearance" description="Change how your dashboard looks and feels." />

                            <div className="flex flex-col gap-5">
                                <div className={styles.rowWide}>
                                    <FieldLabel title="Company logo" description="Update your company logo." />

                                    <div className="flex items-center gap-5">
                                        <img
                                            src={LOGOS[0].src}
                                            alt={LOGOS[0].name}
                                            className="size-16 rounded-2xl object-contain p-2 ring-1 ring-black/10 ring-inset"
                                        />

                                        <Button size="sm" color="secondary">
                                            Replace logo
                                        </Button>
                                    </div>
                                </div>

                                <Divider />

                                <div className={styles.rowWide}>
                                    <FieldLabel title="Brand color" description="Select or customize your brand color." />

                                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                        <RadioGroup
                                            aria-label="Brand color"
                                            defaultValue={customBrandColor}
                                            className="flex flex-col items-start gap-4 md:flex-row md:items-center"
                                        >
                                            <div className="flex gap-2">
                                                {brandSwatches.map((swatch) => (
                                                    <AriaRadio key={swatch} value={swatch} aria-label={swatch}>
                                                        {({ isSelected, isFocusVisible }) => (
                                                            <span
                                                                style={{ backgroundColor: swatch }}
                                                                className={cx(
                                                                    "block size-7 cursor-pointer rounded-full outline-1 -outline-offset-1 outline-black/10",
                                                                    (isSelected || isFocusVisible) &&
                                                                        "ring-focus-ring ring-offset-bg-primary ring-2 ring-offset-2",
                                                                )}
                                                            />
                                                        )}
                                                    </AriaRadio>
                                                ))}
                                            </div>

                                            <AriaRadio value={customBrandColor} className="flex shrink-0 items-center gap-3">
                                                {({ isSelected, isFocusVisible }) => (
                                                    <>
                                                        <span className="text-secondary cursor-pointer text-sm font-semibold">Custom</span>
                                                        <span
                                                            style={{ backgroundColor: customBrandColor }}
                                                            className={cx(
                                                                "block size-7 shrink-0 cursor-pointer rounded-full outline-1 -outline-offset-1 outline-black/10",
                                                                (isSelected || isFocusVisible) && "ring-focus-ring ring-offset-bg-primary ring-2 ring-offset-2",
                                                            )}
                                                        />
                                                    </>
                                                )}
                                            </AriaRadio>
                                        </RadioGroup>

                                        <InputBase aria-label="Custom color" defaultValue={customBrandColor} wrapperClassName="w-24" />
                                    </div>
                                </div>

                                <Divider />

                                <div className={styles.rowWide}>
                                    <FieldLabel title="Display preference" description="Switch between light and dark modes." />

                                    <div className="-m-4 overflow-x-auto p-4">
                                        <RadioGroup aria-label="Display preference" defaultValue="system" className="flex flex-row gap-5">
                                            <PreviewRadio value="system" label="System preference">
                                                <ShellPreview tone="split" />
                                            </PreviewRadio>
                                            <PreviewRadio value="light" label="Light mode">
                                                <ShellPreview tone="light" />
                                            </PreviewRadio>
                                            <PreviewRadio value="dark" label="Dark mode">
                                                <ShellPreview tone="dark" />
                                            </PreviewRadio>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <Divider />

                                <div className={styles.rowWide}>
                                    <FieldLabel title="Transparent sidebar" description="Make the sidebar transparent." />

                                    <Toggle defaultSelected size="md" aria-label="Transparent sidebar" />
                                </div>

                                <Divider />

                                <div className={styles.rowWide}>
                                    <FieldLabel title="Language" description="Default language for public dashboard." />

                                    <Select
                                        size="sm"
                                        aria-label="Language"
                                        name="language"
                                        className="w-max min-w-50"
                                        defaultSelectedKey="en-US"
                                        items={languages.map((language) => ({
                                            id: language.id,
                                            label: language.label,
                                            icon: () => <img src={flagFor(language.code)} alt="" className="size-5" />,
                                        }))}
                                    >
                                        {(item) => (
                                            <Select.Item id={item.id} icon={item.icon}>
                                                {item.label}
                                            </Select.Item>
                                        )}
                                    </Select>
                                </div>

                                <Divider />

                                <div className={styles.rowWide}>
                                    <FieldLabel title="Banner appearance" description="Change how banners appear to visitors." />

                                    <div className="-m-4 overflow-x-auto p-4">
                                        <RadioGroup aria-label="Banner appearance" defaultValue="simplified" className="flex flex-row gap-5">
                                            <PreviewRadio bordered value="default" label="Default" description="Default solid brand color.">
                                                <BannerPreview tone="solid" />
                                            </PreviewRadio>
                                            <PreviewRadio bordered value="simplified" label="Simplified" description="Minimal and simplified.">
                                                <BannerPreview tone="minimal" />
                                            </PreviewRadio>
                                            <PreviewRadio
                                                bordered
                                                value="custom"
                                                label="Custom styling"
                                                description="Manage styling with CSS."
                                                overlay={
                                                    <span className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] bg-black/10 backdrop-blur-[1.875px]">
                                                        <Button size="sm" color="secondary" iconLeading={Code01}>
                                                            Edit CSS
                                                        </Button>
                                                    </span>
                                                }
                                            >
                                                <BannerPreview tone="custom" />
                                            </PreviewRadio>
                                        </RadioGroup>
                                    </div>
                                </div>
                            </div>

                            <div className={cx(styles.footer, "-mt-1")}>
                                <Button color="link-gray" size="md">
                                    Reset <span className="max-lg:hidden">to default</span>
                                </Button>

                                <div className="flex flex-1 justify-end gap-3">
                                    <Button size="sm" color="secondary">
                                        Cancel
                                    </Button>
                                    <Button size="sm" type="submit">
                                        Save changes
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </main>
    </div>
);
