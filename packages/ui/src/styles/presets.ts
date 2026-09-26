/**
 * Theme presets: a brand ramp, a base gray, a radius scale and (optionally) fonts, as pure data.
 *
 * A preset never touches the semantic token layer in `theme.css`. It only re-points the three
 * primitive families that layer is built on:
 *
 * - `--color-brand-50` … `--color-brand-950` (every `*-brand-*` semantic token reads these);
 * - `--color-neutral-50` … `--color-neutral-950` (every gray semantic token, in both light and
 *   dark mode, reads these, so swapping the base gray means redeclaring this one ramp with the
 *   values of `gray`, `slate`, `zinc` or `stone`);
 * - `--radius-xs` … `--radius-4xl` (what `rounded-*` utilities resolve to).
 *
 * `generateThemeCss()` returns the `@theme` override block a consumer appends *after*
 * `@import "@properui/ui/styles/globals.css"` (or after their copied `theme.css`), wrapped in
 * `properui:theme-preset` markers so `properui theme apply` can replace it idempotently.
 * `encodePreset()`/`decodePreset()` turn a preset into a short url-safe code that can be pasted
 * into the CLI or handed to an agent.
 *
 * No React, no DOM, no Node APIs: the docs generator, the CLI and the tests all import this file.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** The eleven steps of every colour ramp, lightest first. */
export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** One step of a colour ramp. */
export type ScaleStep = (typeof SCALE_STEPS)[number];

/** An eleven-step colour ramp, keyed by step. */
export type ColorScale = Record<ScaleStep, string>;

/** Base gray ramps a preset can use for every neutral surface, border and text colour. */
export const GRAY_NAMES = ["gray", "slate", "zinc", "neutral", "stone"] as const;

/** A base gray ramp name. `neutral` is the shipped default. */
export type GrayName = (typeof GRAY_NAMES)[number];

/** Radius scales a preset can use. `md` is Tailwind's stock scale and the shipped default. */
export const RADIUS_NAMES = ["none", "sm", "md", "lg", "xl"] as const;

/** A radius scale name. */
export type RadiusName = (typeof RADIUS_NAMES)[number];

/** The `--radius-*` tokens a preset redeclares (the ones `rounded-*` utilities read). */
export const RADIUS_TOKENS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const;

/** One `--radius-*` token suffix. */
export type RadiusToken = (typeof RADIUS_TOKENS)[number];

export interface ThemePreset {
    /** Kebab-case identifier used by the CLI, e.g. `teal`. Lowercase letters, digits and dashes only. */
    name: string;
    /** Human-readable name, e.g. `Teal`. */
    label: string;
    /** Eleven-step brand ramp as `rgb(r g b)` strings. Step 600 is the solid button colour. */
    brand: ColorScale;
    /** Base gray ramp for every neutral surface, border and text colour. */
    gray: GrayName;
    /** Radius scale. */
    radius: RadiusName;
    /** Optional replacement for `--font-body`, e.g. `"Geist", system-ui, sans-serif`. */
    fontBody?: string;
    /** Optional replacement for `--font-display`. */
    fontDisplay?: string;
}

/* -------------------------------------------------------------------------- */
/* Primitive data                                                             */
/* -------------------------------------------------------------------------- */

/** Tailwind CSS v4's stock gray ramps, verbatim (`tailwindcss/theme.css`). */
export const GRAY_SCALES: Record<GrayName, ColorScale> = {
    gray: {
        50: "oklch(98.5% 0.002 247.839)",
        100: "oklch(96.7% 0.003 264.542)",
        200: "oklch(92.8% 0.006 264.531)",
        300: "oklch(87.2% 0.01 258.338)",
        400: "oklch(70.7% 0.022 261.325)",
        500: "oklch(55.1% 0.027 264.364)",
        600: "oklch(44.6% 0.03 256.802)",
        700: "oklch(37.3% 0.034 259.733)",
        800: "oklch(27.8% 0.033 256.848)",
        900: "oklch(21% 0.034 264.665)",
        950: "oklch(13% 0.028 261.692)",
    },
    slate: {
        50: "oklch(98.4% 0.003 247.858)",
        100: "oklch(96.8% 0.007 247.896)",
        200: "oklch(92.9% 0.013 255.508)",
        300: "oklch(86.9% 0.022 252.894)",
        400: "oklch(70.4% 0.04 256.788)",
        500: "oklch(55.4% 0.046 257.417)",
        600: "oklch(44.6% 0.043 257.281)",
        700: "oklch(37.2% 0.044 257.287)",
        800: "oklch(27.9% 0.041 260.031)",
        900: "oklch(20.8% 0.042 265.755)",
        950: "oklch(12.9% 0.042 264.695)",
    },
    zinc: {
        50: "oklch(98.5% 0 none)",
        100: "oklch(96.7% 0.001 286.375)",
        200: "oklch(92% 0.004 286.32)",
        300: "oklch(87.1% 0.006 286.286)",
        400: "oklch(70.5% 0.015 286.067)",
        500: "oklch(55.2% 0.016 285.938)",
        600: "oklch(44.2% 0.017 285.786)",
        700: "oklch(37% 0.013 285.805)",
        800: "oklch(27.4% 0.006 286.033)",
        900: "oklch(21% 0.006 285.885)",
        950: "oklch(14.1% 0.005 285.823)",
    },
    neutral: {
        50: "oklch(98.5% 0 none)",
        100: "oklch(97% 0 none)",
        200: "oklch(92.2% 0 none)",
        300: "oklch(87% 0 none)",
        400: "oklch(70.8% 0 none)",
        500: "oklch(55.6% 0 none)",
        600: "oklch(43.9% 0 none)",
        700: "oklch(37.1% 0 none)",
        800: "oklch(26.9% 0 none)",
        900: "oklch(20.5% 0 none)",
        950: "oklch(14.5% 0 none)",
    },
    stone: {
        50: "oklch(98.5% 0.001 106.423)",
        100: "oklch(97% 0.001 106.424)",
        200: "oklch(92.3% 0.003 48.717)",
        300: "oklch(86.9% 0.005 56.366)",
        400: "oklch(70.9% 0.01 56.259)",
        500: "oklch(55.3% 0.013 58.071)",
        600: "oklch(44.4% 0.011 73.639)",
        700: "oklch(37.4% 0.01 67.558)",
        800: "oklch(26.8% 0.007 34.298)",
        900: "oklch(21.6% 0.006 56.043)",
        950: "oklch(14.7% 0.004 49.25)",
    },
};

/** Tailwind's stock radius scale in rem; every other radius option is a multiple of it. */
const STOCK_RADIUS_REM: Record<RadiusToken, number> = { xs: 0.125, sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75, "2xl": 1, "3xl": 1.5, "4xl": 2 };

const RADIUS_FACTOR: Record<RadiusName, number> = { none: 0, sm: 0.5, md: 1, lg: 1.5, xl: 2 };

const formatRem = (value: number) => (value === 0 ? "0px" : `${Number(value.toFixed(4))}rem`);

/** Every radius option, resolved to concrete `--radius-*` values. `md` equals Tailwind's defaults. */
export const RADIUS_SCALES: Record<RadiusName, Record<RadiusToken, string>> = Object.fromEntries(
    RADIUS_NAMES.map((name) => [name, Object.fromEntries(RADIUS_TOKENS.map((token) => [token, formatRem(STOCK_RADIUS_REM[token] * RADIUS_FACTOR[name])]))]),
) as Record<RadiusName, Record<RadiusToken, string>>;

/* -------------------------------------------------------------------------- */
/* Colour helpers                                                             */
/* -------------------------------------------------------------------------- */

type Rgb = [number, number, number];

const toRgbString = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;

/** Parses `#rgb`, `#rrggbb` (with or without `#`) into 0–255 channels, or `null`. */
export const parseHex = (hex: string): Rgb | null => {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!match?.[1]) return null;
    const digits = match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join("") : match[1];
    return [0, 2, 4].map((offset) => parseInt(digits.slice(offset, offset + 2), 16)) as Rgb;
};

/** Parses `rgb(r g b)` or `rgb(r, g, b)` with integer channels into 0–255 channels, or `null`. */
export const parseRgb = (value: string): Rgb | null => {
    const match = /^rgb\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)$/i.exec(value.trim());
    if (!match) return null;
    const channels = [match[1], match[2], match[3]].map(Number) as Rgb;
    return channels.every((channel) => channel <= 255) ? channels : null;
};

/** `rgb(r g b)` → `#rrggbb`. Returns `null` for anything `parseRgb` rejects. */
export const rgbToHex = (value: string): string | null => {
    const rgb = parseRgb(value);
    return rgb ? `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}` : null;
};

const hexScale = (hexes: readonly string[]): ColorScale =>
    Object.fromEntries(
        SCALE_STEPS.map((step, index) => {
            const rgb = parseHex(hexes[index] ?? "");
            if (!rgb) throw new Error(`Invalid hex colour for step ${step}: ${hexes[index]}`);
            return [step, toRgbString(rgb)];
        }),
    ) as ColorScale;

const srgbToLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055);

/** An OKLCH colour: lightness 0–1, chroma ≥ 0, hue in degrees 0–360. */
export interface Oklch {
    l: number;
    c: number;
    h: number;
}

/** Converts a hex colour to OKLCH. Throws on an invalid hex string. */
export const hexToOklch = (hex: string): Oklch => {
    const rgb = parseHex(hex);
    if (!rgb) throw new Error(`Invalid hex colour: ${hex}`);
    const [r, g, b] = rgb.map((channel) => srgbToLinear(channel / 255)) as Rgb;

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

    const c = Math.sqrt(A * A + B * B);
    const h = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
    return { l: L, c, h };
};

/** OKLCH → linear-light sRGB channels (may fall outside 0–1 when out of gamut). */
const oklchToLinearRgb = ({ l: L, c, h }: Oklch): Rgb => {
    const radians = (h * Math.PI) / 180;
    const a = c * Math.cos(radians);
    const b = c * Math.sin(radians);

    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
};

const inGamut = (rgb: Rgb) => rgb.every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);

/** OKLCH → `rgb(r g b)`, reducing chroma (keeping lightness and hue) until the colour fits sRGB. */
export const oklchToRgbString = (color: Oklch): string => {
    let chroma = Math.max(0, color.c);
    if (!inGamut(oklchToLinearRgb({ ...color, c: chroma }))) {
        let low = 0;
        let high = chroma;
        for (let iteration = 0; iteration < 24; iteration += 1) {
            const mid = (low + high) / 2;
            if (inGamut(oklchToLinearRgb({ ...color, c: mid }))) low = mid;
            else high = mid;
        }
        chroma = low;
    }
    const channels = oklchToLinearRgb({ ...color, c: chroma }).map((channel) =>
        Math.round(Math.min(1, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, channel))))) * 255),
    ) as Rgb;
    return toRgbString(channels);
};

/** Lightness per step: tuned so step 600 carries white text at ≥ 4.5:1 and 50 reads as a tint. */
const SCALE_LIGHTNESS: Record<ScaleStep, number> = {
    50: 0.977,
    100: 0.952,
    200: 0.902,
    300: 0.83,
    400: 0.73,
    500: 0.635,
    600: 0.54,
    700: 0.478,
    800: 0.412,
    900: 0.358,
    950: 0.27,
};

/** Share of the base chroma used per step: tints and the darkest shades are less saturated. */
const SCALE_CHROMA: Record<ScaleStep, number> = {
    50: 0.1,
    100: 0.2,
    200: 0.38,
    300: 0.62,
    400: 0.86,
    500: 1,
    600: 1,
    700: 0.92,
    800: 0.8,
    900: 0.68,
    950: 0.55,
};

/** Default base chroma for `scaleFromHue`, close to the shipped purple brand's. */
export const DEFAULT_SCALE_CHROMA = 0.19;

/**
 * Derives an eleven-step brand ramp from one hue (degrees) in OKLCH. Lightness follows a fixed
 * curve; chroma peaks at 500–600 and tapers towards both ends; every step is gamut-mapped into
 * sRGB by reducing chroma only, so hue and lightness stay put.
 */
export const scaleFromHue = (hue: number, chroma: number = DEFAULT_SCALE_CHROMA): ColorScale => {
    const h = ((hue % 360) + 360) % 360;
    const c = Math.min(0.4, Math.max(0, chroma));
    return Object.fromEntries(SCALE_STEPS.map((step) => [step, oklchToRgbString({ l: SCALE_LIGHTNESS[step], c: c * SCALE_CHROMA[step], h })])) as ColorScale;
};

/** Derives an eleven-step brand ramp from any hex colour, using its OKLCH hue and chroma. */
export const scaleFromHex = (hex: string): ColorScale => {
    const { c, h } = hexToOklch(hex);
    return scaleFromHue(h, c);
};

/* -------------------------------------------------------------------------- */
/* Shipped presets                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Presets that ship with the library. Order is part of the preset-code format (a code for an
 * unmodified shipped brand ramp stores its index), so only ever append to this list.
 */
export const THEME_PRESETS: readonly ThemePreset[] = [
    {
        name: "brand",
        label: "Brand (default)",
        brand: {
            50: "rgb(249 245 255)",
            100: "rgb(244 235 255)",
            200: "rgb(233 215 254)",
            300: "rgb(214 187 251)",
            400: "rgb(182 146 246)",
            500: "rgb(158 119 237)",
            600: "rgb(127 86 217)",
            700: "rgb(105 65 198)",
            800: "rgb(83 56 158)",
            900: "rgb(66 48 125)",
            950: "rgb(44 28 95)",
        },
        gray: "neutral",
        radius: "md",
    },
    {
        name: "blue",
        label: "Blue",
        brand: hexScale(["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"]),
        gray: "gray",
        radius: "md",
    },
    {
        name: "indigo",
        label: "Indigo",
        brand: hexScale(["#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81", "#1e1b4b"]),
        gray: "slate",
        radius: "lg",
    },
    {
        name: "teal",
        label: "Teal",
        brand: hexScale(["#f0fdfa", "#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a", "#042f2e"]),
        gray: "zinc",
        radius: "sm",
    },
    {
        name: "green",
        label: "Green",
        brand: hexScale(["#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"]),
        gray: "stone",
        radius: "md",
    },
    {
        name: "orange",
        label: "Orange",
        brand: hexScale(["#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12", "#431407"]),
        gray: "stone",
        radius: "lg",
    },
    {
        name: "rose",
        label: "Rose",
        brand: hexScale(["#fff1f2", "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337", "#4c0519"]),
        gray: "zinc",
        radius: "xl",
    },
    {
        name: "slate-mono",
        label: "Slate mono",
        brand: hexScale(["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"]),
        gray: "slate",
        radius: "none",
    },
];

/** The shipped default: purple brand ramp, neutral grays, stock radius. */
export const DEFAULT_PRESET = THEME_PRESETS[0] as ThemePreset;

/** Looks up a shipped preset by name (case-insensitive). */
export const getPreset = (name: string): ThemePreset | undefined => {
    const wanted = name.trim().toLowerCase();
    return THEME_PRESETS.find((preset) => preset.name === wanted);
};

/* -------------------------------------------------------------------------- */
/* CSS generation                                                             */
/* -------------------------------------------------------------------------- */

/** Opening marker of the block `properui theme apply` owns inside a stylesheet. */
export const PRESET_BLOCK_START = "/* properui:theme-preset */";
/** Closing marker of the block `properui theme apply` owns inside a stylesheet. */
export const PRESET_BLOCK_END = "/* /properui:theme-preset */";

/** Font stacks are free text; drop anything that could close the declaration or the block. */
const sanitizeFontStack = (value: string) => value.replace(/[;{}\\<>]|\/\*|\*\//g, "").trim();

const assertColorValue = (value: string, label: string) => {
    if (!/^(rgb|oklch)\([\d\s.,%a-z-]+\)$/i.test(value.trim())) throw new Error(`Invalid colour for ${label}: ${value}`);
};

/**
 * Every custom property a preset sets, in declaration order: the brand ramp, the neutral ramp
 * (holding the chosen base gray), the radius scale, and fonts when the preset sets them. Also
 * what the docs generator spreads into an inline `style` for its live preview.
 */
export const themePresetVariables = (preset: ThemePreset): Record<string, string> => {
    const variables: Record<string, string> = {};
    for (const step of SCALE_STEPS) {
        const value = preset.brand[step];
        assertColorValue(value, `--color-brand-${step}`);
        variables[`--color-brand-${step}`] = value;
    }
    const gray = GRAY_SCALES[preset.gray];
    if (!gray) throw new Error(`Unknown base gray: ${String(preset.gray)}`);
    for (const step of SCALE_STEPS) variables[`--color-neutral-${step}`] = gray[step];
    const radius = RADIUS_SCALES[preset.radius];
    if (!radius) throw new Error(`Unknown radius: ${String(preset.radius)}`);
    for (const token of RADIUS_TOKENS) variables[`--radius-${token}`] = radius[token];
    const fontBody = preset.fontBody ? sanitizeFontStack(preset.fontBody) : "";
    const fontDisplay = preset.fontDisplay ? sanitizeFontStack(preset.fontDisplay) : "";
    if (fontBody) variables["--font-body"] = fontBody;
    if (fontDisplay) variables["--font-display"] = fontDisplay;
    return variables;
};

export interface GenerateThemeCssOptions {
    /** Wrap the block in `properui:theme-preset` markers (default `true`). */
    markers?: boolean;
}

/**
 * The CSS a consumer appends after `@import "@properui/ui/styles/globals.css"` to apply a
 * preset: one `@theme` block redeclaring the brand ramp, the neutral ramp, the radius scale and
 * (if set) fonts. Tailwind merges `@theme` blocks in source order, so this one wins.
 */
export const generateThemeCss = (preset: ThemePreset, options: GenerateThemeCssOptions = {}): string => {
    const variables = themePresetVariables(preset);
    const code = encodePreset(preset);
    const line = (name: string) => `    ${name}: ${variables[name]};`;

    const body = [
        `    /* Brand ramp */`,
        ...SCALE_STEPS.map((step) => line(`--color-brand-${step}`)),
        "",
        `    /* Base gray: ${preset.gray}. Every gray semantic token reads the neutral ramp, in both modes. */`,
        ...SCALE_STEPS.map((step) => line(`--color-neutral-${step}`)),
        "",
        `    /* Radius: ${preset.radius} */`,
        ...RADIUS_TOKENS.map((token) => line(`--radius-${token}`)),
        ...("--font-body" in variables || "--font-display" in variables
            ? ["", "    /* Fonts */", ...["--font-body", "--font-display"].filter((name) => name in variables).map(line)]
            : []),
    ];

    const css = [
        "/*",
        ` * Proper UI theme preset "${preset.label.replace(/\*\//g, "")}" (code ${code}).`,
        ` * Re-apply with \`npx @properui/cli@latest theme apply ${code}\` rather than editing by hand.`,
        " */",
        "@theme {",
        ...body,
        "}",
    ].join("\n");

    return options.markers === false ? `${css}\n` : `${PRESET_BLOCK_START}\n${css}\n${PRESET_BLOCK_END}\n`;
};

/**
 * Inserts `block` (from `generateThemeCss`) into a stylesheet: replaces the existing marked block
 * when there is one, appends it otherwise. Running it twice with the same block is a no-op.
 */
export const applyThemeCssBlock = (stylesheet: string, block: string): string => {
    const normalized = block.endsWith("\n") ? block : `${block}\n`;
    const start = stylesheet.indexOf(PRESET_BLOCK_START);
    const end = start === -1 ? -1 : stylesheet.indexOf(PRESET_BLOCK_END, start);
    if (start !== -1 && end !== -1) {
        let after = end + PRESET_BLOCK_END.length;
        if (stylesheet[after] === "\n") after += 1;
        return `${stylesheet.slice(0, start)}${normalized}${stylesheet.slice(after)}`;
    }
    const trimmed = stylesheet.replace(/\s+$/, "");
    return trimmed.length === 0 ? normalized : `${trimmed}\n\n${normalized}`;
};

/** Reads the preset code recorded in a stylesheet's marked block, or `null` when there is none. */
export const readAppliedPresetCode = (stylesheet: string): string | null => {
    const start = stylesheet.indexOf(PRESET_BLOCK_START);
    if (start === -1) return null;
    const match = /\(code ([A-Za-z0-9_-]+)\)/.exec(stylesheet.slice(start));
    return match?.[1] ?? null;
};

/* -------------------------------------------------------------------------- */
/* Preset codes                                                               */
/* -------------------------------------------------------------------------- */

const CODE_VERSION = 1;
const BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const toBase64Url = (bytes: Uint8Array): string => {
    let out = "";
    for (let index = 0; index < bytes.length; index += 3) {
        const a = bytes[index] ?? 0;
        const b = bytes[index + 1] ?? 0;
        const c = bytes[index + 2] ?? 0;
        const triple = (a << 16) | (b << 8) | c;
        const chars = index + 1 >= bytes.length ? 2 : index + 2 >= bytes.length ? 3 : 4;
        for (let char = 0; char < chars; char += 1) out += BASE64URL[(triple >> (18 - char * 6)) & 63];
    }
    return out;
};

const fromBase64Url = (code: string): Uint8Array => {
    if (!/^[A-Za-z0-9_-]+$/.test(code) || code.length % 4 === 1) throw new Error("Not a preset code.");
    const bytes: number[] = [];
    for (let index = 0; index < code.length; index += 4) {
        const chunk = code.slice(index, index + 4);
        let triple = 0;
        for (let char = 0; char < 4; char += 1) triple = (triple << 6) | (char < chunk.length ? BASE64URL.indexOf(chunk[char] as string) : 0);
        bytes.push((triple >> 16) & 255);
        if (chunk.length > 2) bytes.push((triple >> 8) & 255);
        if (chunk.length > 3) bytes.push(triple & 255);
    }
    return Uint8Array.from(bytes);
};

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

const titleCase = (name: string) =>
    name
        .split("-")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(" ");

const sameScale = (a: ColorScale, b: ColorScale) => SCALE_STEPS.every((step) => parseRgb(a[step])?.join() === parseRgb(b[step])?.join());

/**
 * Encodes a preset as a short url-safe base64 code (no padding). Layout, version 1:
 * `[version][gray | radius << 3 | hasFonts << 6 | shippedBrand << 7]`, then either one byte
 * (index of an unmodified shipped brand ramp) or 33 bytes of RGB, then the name (length byte +
 * ASCII), then, when fonts are set, two length-prefixed (2 bytes) UTF-8 strings.
 */
export const encodePreset = (preset: ThemePreset): string => {
    const name = preset.name.trim().toLowerCase();
    if (!NAME_PATTERN.test(name)) throw new Error(`Preset name must be kebab-case (a-z, 0-9, -), 1–40 characters: ${preset.name}`);
    const grayIndex = GRAY_NAMES.indexOf(preset.gray);
    const radiusIndex = RADIUS_NAMES.indexOf(preset.radius);
    if (grayIndex === -1) throw new Error(`Unknown base gray: ${String(preset.gray)}`);
    if (radiusIndex === -1) throw new Error(`Unknown radius: ${String(preset.radius)}`);

    const shippedIndex = THEME_PRESETS.findIndex((shipped) => sameScale(shipped.brand, preset.brand));
    const fontBody = preset.fontBody ? sanitizeFontStack(preset.fontBody) : "";
    const fontDisplay = preset.fontDisplay ? sanitizeFontStack(preset.fontDisplay) : "";
    const hasFonts = Boolean(fontBody || fontDisplay);

    const bytes: number[] = [CODE_VERSION, grayIndex | (radiusIndex << 3) | (hasFonts ? 64 : 0) | (shippedIndex !== -1 ? 128 : 0)];
    if (shippedIndex !== -1) {
        bytes.push(shippedIndex);
    } else {
        for (const step of SCALE_STEPS) {
            const rgb = parseRgb(preset.brand[step]);
            if (!rgb) throw new Error(`Brand step ${step} must be an rgb(r g b) string to be encoded: ${preset.brand[step]}`);
            bytes.push(...rgb);
        }
    }
    bytes.push(name.length, ...[...name].map((char) => char.charCodeAt(0)));
    if (hasFonts) {
        const encoder = new TextEncoder();
        for (const font of [fontBody, fontDisplay]) {
            const encoded = encoder.encode(font);
            if (encoded.length > 1024) throw new Error("Font stacks are limited to 1024 bytes each.");
            bytes.push(encoded.length >> 8, encoded.length & 255, ...encoded);
        }
    }
    return toBase64Url(Uint8Array.from(bytes));
};

/** Decodes a code from `encodePreset`. Throws a readable error for anything malformed. */
export const decodePreset = (code: string): ThemePreset => {
    const invalid = (reason: string) => new Error(`Invalid preset code "${code}": ${reason}.`);
    let bytes: Uint8Array;
    try {
        bytes = fromBase64Url(code.trim());
    } catch {
        throw invalid("not url-safe base64");
    }
    let offset = 0;
    const read = (): number => {
        if (offset >= bytes.length) throw invalid("truncated");
        return bytes[offset++] as number;
    };

    const version = read();
    if (version !== CODE_VERSION) throw invalid(`unsupported version ${version}`);
    const flags = read();
    const gray = GRAY_NAMES[flags & 7];
    const radius = RADIUS_NAMES[(flags >> 3) & 7];
    if (!gray || !radius) throw invalid("unknown gray or radius");

    let brand: ColorScale;
    if (flags & 128) {
        const shipped = THEME_PRESETS[read()];
        if (!shipped) throw invalid("unknown shipped brand ramp");
        brand = { ...shipped.brand };
    } else {
        brand = Object.fromEntries(SCALE_STEPS.map((step) => [step, toRgbString([read(), read(), read()])])) as ColorScale;
    }

    const nameLength = read();
    let name = "";
    for (let index = 0; index < nameLength; index += 1) name += String.fromCharCode(read());
    if (!NAME_PATTERN.test(name)) throw invalid("bad name");

    const preset: ThemePreset = { name, label: getPreset(name)?.label ?? titleCase(name), brand, gray, radius };
    if (flags & 64) {
        const decoder = new TextDecoder();
        const fonts = [0, 1].map(() => {
            const length = (read() << 8) | read();
            if (offset + length > bytes.length) throw invalid("truncated");
            const value = decoder.decode(bytes.slice(offset, offset + length));
            offset += length;
            return sanitizeFontStack(value);
        });
        if (fonts[0]) preset.fontBody = fonts[0];
        if (fonts[1]) preset.fontDisplay = fonts[1];
    }
    if (offset !== bytes.length) throw invalid("trailing bytes");
    return preset;
};

/**
 * Resolves what a user typed: a shipped preset name first, then a preset code. Throws with the
 * list of shipped names when it is neither.
 */
export const resolvePreset = (input: string): ThemePreset => {
    const shipped = getPreset(input);
    if (shipped) return shipped;
    try {
        return decodePreset(input);
    } catch (error) {
        const names = THEME_PRESETS.map((preset) => preset.name).join(", ");
        throw new Error(`"${input}" is neither a preset name (${names}) nor a valid preset code. ${(error as Error).message}`);
    }
};
