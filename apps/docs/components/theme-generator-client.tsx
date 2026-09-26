"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { cx } from "~/lib/cx";
import { ArrowRight, Check, Copy01, Mail01 } from "@properui/icons";
import { Badge, BadgeWithDot } from "@properui/ui/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@properui/ui/components/base/button-group/button-group";
import { Button } from "@properui/ui/components/base/buttons/button";
import { Checkbox } from "@properui/ui/components/base/checkbox/checkbox";
import { Input } from "@properui/ui/components/base/input/input";
import { Toggle } from "@properui/ui/components/base/toggle/toggle";
import { useClipboard } from "@properui/ui/hooks/use-clipboard";
import { useTheme } from "@properui/ui/providers";
import {
    type ColorScale,
    DEFAULT_PRESET,
    GRAY_NAMES,
    type GrayName,
    RADIUS_NAMES,
    type RadiusName,
    SCALE_STEPS,
    THEME_PRESETS,
    type ThemePreset,
    encodePreset,
    generateThemeCss,
    getPreset,
    parseHex,
    resolvePreset,
    rgbToHex,
    scaleFromHex,
    themePresetVariables,
} from "@properui/ui/styles/presets";
import { CodeBlock } from "./code-block";
import { utilityButtonClasses } from "./primitives";

/**
 * Interactive half of `<ThemeGenerator />`: pick a shipped preset or any hex colour, a base gray
 * and a radius scale, see real library components re-themed live, then copy the generated CSS,
 * the preset code, or the `theme apply` command. The preview wrapper overrides the primitive
 * custom properties inline; `scopedCss` (built from theme.css by the server wrapper) re-states
 * the semantic tokens that read them so the override actually reaches the components.
 */

type Mode = "light" | "dark";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain (unhighlighted) markup in the same shape Shiki emits, so `CodeBlock` styles it identically. */
const codeHtml = (code: string) => `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;

/** Lowercase, dash-separated, 1–40 chars — what `encodePreset` accepts. */
const toPresetName = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+/, "")
        .slice(0, 40);

const controlLabel = "text-sm font-medium text-secondary";

const Swatches = ({ scale }: { scale: ColorScale }) => (
    <ul className="grid grid-cols-11 gap-1" aria-label="Brand ramp">
        {SCALE_STEPS.map((step) => (
            <li key={step} className="flex min-w-0 flex-col items-center gap-1">
                <span
                    className="ring-secondary h-8 w-full rounded-md ring-1 ring-inset"
                    style={{ backgroundColor: scale[step] }}
                    title={`${step}: ${scale[step]}`}
                />
                <span className="text-quaternary text-xs tabular-nums">{step}</span>
            </li>
        ))}
    </ul>
);

const CopyInline = ({ value, label }: { value: string; label: string }) => {
    const { copied, copy } = useClipboard();
    return (
        <AriaButton aria-label={copied ? "Copied" : label} onPress={() => void copy(value)} className={utilityButtonClasses("outline")}>
            {copied ? <Check className="size-4" data-icon="true" /> : <Copy01 className="size-4" data-icon="true" />}
        </AriaButton>
    );
};

/** The live preview: a card-like surface with real library components, re-themed by `preset`. */
const PreviewSurface = ({ preset, mode }: { preset: ThemePreset; mode: Mode }) => {
    const style = useMemo(() => ({ ...themePresetVariables(preset), fontFamily: "var(--font-body)" }) as CSSProperties, [preset]);

    return (
        <div data-theme-preview={mode} style={style} className="bg-secondary text-primary flex flex-col gap-4 rounded-2xl p-4 sm:p-6">
            <div className="bg-primary ring-secondary flex flex-col gap-5 rounded-xl p-5 shadow-xs ring-1 ring-inset sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-primary text-lg font-semibold">Invite your team</p>
                        <p className="text-tertiary text-sm">Collaborators get access to every project in this workspace.</p>
                    </div>
                    <BadgeWithDot type="pill-color" color="brand" size="sm">
                        New
                    </BadgeWithDot>
                </div>
                <Input label="Email" placeholder="olivia@proper.example" icon={Mail01} hint="We will send them a link to join." />
                <div className="flex flex-col gap-3">
                    <Toggle label="Send a welcome email" defaultSelected />
                    <Checkbox label="Give admin rights" />
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                    <Button color="secondary" size="md">
                        Cancel
                    </Button>
                    <Button color="primary" size="md" iconTrailing={ArrowRight}>
                        Send invite
                    </Button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Badge type="pill-color" color="brand" size="md">
                    Brand
                </Badge>
                <Badge type="pill-color" color="gray" size="md">
                    Gray
                </Badge>
                <Badge type="color" color="success" size="md">
                    Success
                </Badge>
                <Badge type="modern" color="gray" size="md">
                    Modern
                </Badge>
                <Button color="link-color" size="sm">
                    Link button
                </Button>
            </div>
        </div>
    );
};

export const ThemeGeneratorClient = ({ scopedCss }: { scopedCss: string }) => {
    const { resolvedTheme } = useTheme();
    const [selected, setSelected] = useState<string>(DEFAULT_PRESET.name);
    const [brand, setBrand] = useState<ColorScale>(DEFAULT_PRESET.brand);
    const [hex, setHex] = useState<string>(rgbToHex(DEFAULT_PRESET.brand[600]) ?? "#7f56d9");
    const [gray, setGray] = useState<GrayName>(DEFAULT_PRESET.gray);
    const [radius, setRadius] = useState<RadiusName>(DEFAULT_PRESET.radius);
    const [name, setName] = useState<string>(DEFAULT_PRESET.name);
    const [mode, setMode] = useState<Mode>("light");
    const [loadedFromUrl, setLoadedFromUrl] = useState(false);

    const load = (preset: ThemePreset, selectedKey: string) => {
        setSelected(selectedKey);
        setBrand(preset.brand);
        setHex(rgbToHex(preset.brand[600]) ?? "");
        setGray(preset.gray);
        setRadius(preset.radius);
        setName(preset.name);
    };

    // Client-only one-shot sync: follow the site theme and restore a shared `?preset=` code.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (resolvedTheme === "dark" || resolvedTheme === "light") setMode(resolvedTheme);
    }, [resolvedTheme]);

    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get("preset");
        if (code) {
            try {
                const preset = resolvePreset(code);
                const shipped = getPreset(preset.name);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                load(preset, shipped && encodePreset(shipped) === encodePreset(preset) ? preset.name : "custom");
            } catch {
                // An invalid shared code just leaves the default preset selected.
            }
        }
        setLoadedFromUrl(true);
    }, []);

    const preset = useMemo<ThemePreset>(() => {
        const presetName = toPresetName(name) || "custom";
        return { name: presetName, label: getPreset(presetName)?.label ?? presetName, brand, gray, radius };
    }, [name, brand, gray, radius]);

    const code = useMemo(() => encodePreset(preset), [preset]);
    const css = useMemo(() => generateThemeCss(preset), [preset]);
    const command = `npx @properui/cli@latest theme apply ${code}`;

    // Keep the address bar shareable once the initial `?preset=` has been read.
    useEffect(() => {
        if (!loadedFromUrl) return;
        const url = new URL(window.location.href);
        url.searchParams.set("preset", code);
        window.history.replaceState(null, "", url);
    }, [code, loadedFromUrl]);

    const hexValid = parseHex(hex) !== null;
    const onHexChange = (value: string) => {
        setHex(value);
        if (!parseHex(value)) return;
        setBrand(scaleFromHex(value));
        setSelected("custom");
        if (getPreset(name)) setName("custom");
    };

    return (
        <div className="not-prose my-8 flex flex-col gap-8">
            <style dangerouslySetInnerHTML={{ __html: scopedCss }} />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <div className="flex flex-col gap-6">
                    <fieldset className="flex flex-col gap-2">
                        <legend className={cx(controlLabel, "mb-2")}>Start from a preset</legend>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            {THEME_PRESETS.map((entry) => {
                                const isSelected = selected === entry.name;
                                return (
                                    <AriaButton
                                        key={entry.name}
                                        aria-pressed={isSelected}
                                        onPress={() => load(entry, entry.name)}
                                        className={cx(
                                            "bg-primary text-secondary ring-primary outline-focus-ring hover:bg-primary_hover flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-start text-sm font-semibold shadow-xs ring-1 transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                                            isSelected && "ring-brand bg-primary_hover ring-2",
                                        )}
                                    >
                                        <span aria-hidden="true" className="size-4 shrink-0 rounded-full" style={{ backgroundColor: entry.brand[600] }} />
                                        <span className="truncate">{entry.label.replace(" (default)", "")}</span>
                                    </AriaButton>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-end gap-3">
                            <Input
                                label="Or any brand colour (hex)"
                                value={hex}
                                onChange={onHexChange}
                                isInvalid={!hexValid}
                                hint={hexValid ? "Derives an 11-step ramp in OKLCH." : "Enter a hex colour like #0ea5e9."}
                                className="flex-1"
                            />
                            <input
                                type="color"
                                aria-label="Pick a brand colour"
                                value={
                                    hexValid ? `#${(parseHex(hex) ?? [0, 0, 0]).map((channel) => channel.toString(16).padStart(2, "0")).join("")}` : "#000000"
                                }
                                onChange={(event) => onHexChange(event.target.value)}
                                className="bg-primary ring-primary outline-focus-ring mb-7 h-10 w-12 shrink-0 cursor-pointer rounded-lg p-1 ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2"
                            />
                        </div>
                        <Swatches scale={brand} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span id="theme-generator-gray" className={controlLabel}>
                            Base gray
                        </span>
                        <ButtonGroup
                            aria-labelledby="theme-generator-gray"
                            size="sm"
                            disallowEmptySelection
                            selectedKeys={[gray]}
                            onSelectionChange={(keys) => {
                                const [next] = [...keys];
                                if (next) setGray(next as GrayName);
                            }}
                        >
                            {GRAY_NAMES.map((option) => (
                                <ButtonGroupItem key={option} id={option}>
                                    {option}
                                </ButtonGroupItem>
                            ))}
                        </ButtonGroup>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span id="theme-generator-radius" className={controlLabel}>
                            Radius
                        </span>
                        <ButtonGroup
                            aria-labelledby="theme-generator-radius"
                            size="sm"
                            disallowEmptySelection
                            selectedKeys={[radius]}
                            onSelectionChange={(keys) => {
                                const [next] = [...keys];
                                if (next) setRadius(next as RadiusName);
                            }}
                        >
                            {RADIUS_NAMES.map((option) => (
                                <ButtonGroupItem key={option} id={option}>
                                    {option}
                                </ButtonGroupItem>
                            ))}
                        </ButtonGroup>
                    </div>

                    <Input
                        label="Preset name"
                        value={name}
                        onChange={(value) => setName(toPresetName(value))}
                        hint="Lowercase letters, digits and dashes. Stored in the preset code."
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <span id="theme-generator-mode" className={controlLabel}>
                            Preview
                        </span>
                        <ButtonGroup
                            aria-labelledby="theme-generator-mode"
                            size="sm"
                            disallowEmptySelection
                            selectedKeys={[mode]}
                            onSelectionChange={(keys) => {
                                const [next] = [...keys];
                                if (next === "light" || next === "dark") setMode(next);
                            }}
                        >
                            <ButtonGroupItem id="light">Light</ButtonGroupItem>
                            <ButtonGroupItem id="dark">Dark</ButtonGroupItem>
                        </ButtonGroup>
                    </div>
                    <PreviewSurface preset={preset} mode={mode} />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <p className={controlLabel}>Preset code</p>
                <div className="bg-secondary_alt ring-secondary flex items-center gap-3 rounded-xl p-2 ps-4 ring-1 ring-inset">
                    <code className="text-primary min-w-0 flex-1 truncate font-mono text-sm font-semibold">{code}</code>
                    <CopyInline value={code} label="Copy preset code" />
                </div>
                <p className={controlLabel}>Apply it with the CLI</p>
                <CodeBlock code={command} html={codeHtml(command)} />
                <p className={controlLabel}>Or paste this after your Proper UI stylesheet import</p>
                <CodeBlock code={css} html={codeHtml(css)} maxHeight={420} />
            </div>
        </div>
    );
};
