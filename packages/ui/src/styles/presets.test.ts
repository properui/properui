import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    DEFAULT_PRESET,
    GRAY_NAMES,
    GRAY_SCALES,
    PRESET_BLOCK_END,
    PRESET_BLOCK_START,
    RADIUS_NAMES,
    RADIUS_SCALES,
    SCALE_STEPS,
    THEME_PRESETS,
    type ThemePreset,
    applyThemeCssBlock,
    decodePreset,
    encodePreset,
    generateThemeCss,
    getPreset,
    hexToOklch,
    parseRgb,
    readAppliedPresetCode,
    resolvePreset,
    rgbToHex,
    scaleFromHex,
    scaleFromHue,
    themePresetVariables,
} from "./presets";

const themeCss = readFileSync(path.join(__dirname, "theme.css"), "utf8");

/** WCAG relative luminance of an `rgb(r g b)` string. */
const luminance = (value: string) => {
    const rgb = parseRgb(value);
    if (!rgb) throw new Error(value);
    const [r, g, b] = rgb.map((channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrastWithWhite = (value: string) => 1.05 / (luminance(value) + 0.05);

describe("shipped presets", () => {
    it("ships at least the eight required presets with unique kebab-case names", () => {
        const names = THEME_PRESETS.map((preset) => preset.name);
        expect(names).toEqual(expect.arrayContaining(["brand", "blue", "indigo", "teal", "green", "orange", "rose", "slate-mono"]));
        expect(new Set(names).size).toBe(names.length);
        for (const name of names) expect(name).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    });

    it("every preset has a complete rgb() brand ramp and a known gray and radius", () => {
        for (const preset of THEME_PRESETS) {
            for (const step of SCALE_STEPS) expect(parseRgb(preset.brand[step]), `${preset.name} ${step}`).not.toBeNull();
            expect(GRAY_NAMES).toContain(preset.gray);
            expect(RADIUS_NAMES).toContain(preset.radius);
        }
    });

    it("every brand ramp gets darker step by step", () => {
        for (const preset of THEME_PRESETS) {
            const lums = SCALE_STEPS.map((step) => luminance(preset.brand[step]));
            for (let index = 1; index < lums.length; index += 1)
                expect(lums[index], `${preset.name} step ${SCALE_STEPS[index]}`).toBeLessThan(lums[index - 1] as number);
        }
    });

    it("the default preset matches the brand ramp and neutral ramp declared in theme.css", () => {
        expect(DEFAULT_PRESET.name).toBe("brand");
        for (const step of SCALE_STEPS) {
            expect(themeCss).toContain(`--color-brand-${step}: ${DEFAULT_PRESET.brand[step]};`);
            expect(themeCss).toContain(`--color-neutral-${step}: ${GRAY_SCALES.neutral[step]};`);
        }
    });

    it("the md radius scale matches the radius tokens pinned in theme.css", () => {
        for (const [token, value] of Object.entries(RADIUS_SCALES.md)) expect(themeCss).toContain(`--radius-${token}: ${value};`);
    });

    it("getPreset is case-insensitive and returns undefined for unknown names", () => {
        expect(getPreset("TEAL")?.name).toBe("teal");
        expect(getPreset("nope")).toBeUndefined();
    });
});

describe("radius scales", () => {
    it("none is all zero and each larger option is at least as round", () => {
        expect(Object.values(RADIUS_SCALES.none).every((value) => value === "0px")).toBe(true);
        const rem = (value: string) => (value === "0px" ? 0 : parseFloat(value));
        for (let index = 1; index < RADIUS_NAMES.length; index += 1) {
            const previous = RADIUS_SCALES[RADIUS_NAMES[index - 1] as (typeof RADIUS_NAMES)[number]];
            const current = RADIUS_SCALES[RADIUS_NAMES[index] as (typeof RADIUS_NAMES)[number]];
            expect(rem(current.lg)).toBeGreaterThan(rem(previous.lg));
        }
    });
});

describe("scaleFromHue / scaleFromHex", () => {
    it("returns eleven in-gamut rgb() steps, lightest first", () => {
        for (const hue of [0, 45, 90, 145, 200, 250, 290, 330]) {
            const scale = scaleFromHue(hue);
            const lums = SCALE_STEPS.map((step) => luminance(scale[step]));
            for (let index = 1; index < lums.length; index += 1) expect(lums[index]).toBeLessThan(lums[index - 1] as number);
        }
    });

    it("keeps white text readable on step 600 (≥ 4.5:1) for every hue", () => {
        for (let hue = 0; hue < 360; hue += 15) expect(contrastWithWhite(scaleFromHue(hue)[600]), `hue ${hue}`).toBeGreaterThanOrEqual(4.5);
    });

    it("keeps the input hue", () => {
        const base = hexToOklch("#0ea5e9");
        const derived = hexToOklch(rgbToHex(scaleFromHex("#0ea5e9")[600]) as string);
        expect(Math.abs(derived.h - base.h)).toBeLessThan(4);
    });

    it("derives something close to the shipped purple from its own 600 step", () => {
        const derived = scaleFromHex("#7f56d9")[600];
        const [r, g, b] = parseRgb(derived) as [number, number, number];
        expect(Math.abs(r - 127) + Math.abs(g - 86) + Math.abs(b - 217)).toBeLessThan(30);
    });

    it("a gray input yields a gray ramp", () => {
        const [r, g, b] = parseRgb(scaleFromHex("#808080")[500]) as [number, number, number];
        expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2);
    });

    it("hexToOklch rejects garbage and accepts shorthand", () => {
        expect(() => hexToOklch("not-a-colour")).toThrow();
        expect(hexToOklch("#fff").l).toBeCloseTo(1, 3);
        expect(hexToOklch("000000").l).toBeCloseTo(0, 3);
    });
});

describe("generateThemeCss", () => {
    it("emits one marked @theme block with the brand, neutral and radius tokens", () => {
        const teal = getPreset("teal") as ThemePreset;
        const css = generateThemeCss(teal);
        expect(css.startsWith(PRESET_BLOCK_START)).toBe(true);
        expect(css.trimEnd().endsWith(PRESET_BLOCK_END)).toBe(true);
        expect(css.match(/@theme \{/g)).toHaveLength(1);
        expect(css).toContain("--color-brand-600: rgb(13 148 136);");
        expect(css).toContain(`--color-neutral-500: ${GRAY_SCALES.zinc[500]};`);
        expect(css).toContain(`--radius-lg: ${RADIUS_SCALES.sm.lg};`);
        expect(css).toContain(`theme apply ${encodePreset(teal)}`);
        expect(css).not.toContain("--font-body");
    });

    it("only redeclares token names theme.css already declares", () => {
        for (const preset of THEME_PRESETS) {
            for (const name of Object.keys(themePresetVariables(preset))) expect(themeCss, name).toContain(`${name}:`);
        }
    });

    it("can omit the markers", () => {
        const css = generateThemeCss(DEFAULT_PRESET, { markers: false });
        expect(css).not.toContain(PRESET_BLOCK_START);
        expect(css).toContain("@theme {");
    });

    it("writes fonts when set and strips characters that could escape the declaration", () => {
        const css = generateThemeCss({ ...DEFAULT_PRESET, fontBody: '"Geist", sans-serif; } body { color: red', fontDisplay: '"Cal Sans", serif' });
        expect(css).toContain('--font-body: "Geist", sans-serif  body  color: red;');
        expect(css).toContain('--font-display: "Cal Sans", serif;');
        expect(css.match(/\{/g)).toHaveLength(1);
    });

    it("rejects a brand value that is not a colour function", () => {
        const broken = { ...DEFAULT_PRESET, brand: { ...DEFAULT_PRESET.brand, 600: "red; } *" } };
        expect(() => generateThemeCss(broken)).toThrow(/Invalid colour/);
    });
});

describe("applyThemeCssBlock", () => {
    const base = '@import "tailwindcss";\n@import "./styles/theme.css";\n';

    it("appends when there is no block and replaces in place when there is", () => {
        const teal = generateThemeCss(getPreset("teal") as ThemePreset);
        const rose = generateThemeCss(getPreset("rose") as ThemePreset);
        const once = applyThemeCssBlock(base, teal);
        expect(once.startsWith(base)).toBe(true);
        expect(once).toContain(teal);

        const replaced = applyThemeCssBlock(`${once}\n.after { color: inherit; }\n`, rose);
        expect(replaced).toContain(rose);
        expect(replaced).not.toContain("rgb(13 148 136)");
        expect(replaced).toContain(".after { color: inherit; }");
        expect(replaced.split(PRESET_BLOCK_START)).toHaveLength(2);
    });

    it("is idempotent", () => {
        const block = generateThemeCss(getPreset("blue") as ThemePreset);
        const once = applyThemeCssBlock(base, block);
        expect(applyThemeCssBlock(once, block)).toBe(once);
    });

    it("works on an empty stylesheet", () => {
        const block = generateThemeCss(DEFAULT_PRESET);
        expect(applyThemeCssBlock("", block)).toBe(block);
    });

    it("reads back the applied code", () => {
        const preset = getPreset("green") as ThemePreset;
        const css = applyThemeCssBlock(base, generateThemeCss(preset));
        expect(readAppliedPresetCode(css)).toBe(encodePreset(preset));
        expect(readAppliedPresetCode(base)).toBeNull();
    });
});

describe("encodePreset / decodePreset", () => {
    it("round-trips every shipped preset with a short url-safe code", () => {
        for (const preset of THEME_PRESETS) {
            const code = encodePreset(preset);
            expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
            expect(code.length).toBeLessThanOrEqual(24);
            expect(decodePreset(code)).toEqual({ name: preset.name, label: preset.label, brand: preset.brand, gray: preset.gray, radius: preset.radius });
        }
    });

    it("round-trips a custom ramp, gray, radius and fonts", () => {
        const custom: ThemePreset = {
            name: "acme-2",
            label: "Acme 2",
            brand: scaleFromHex("#0ea5e9"),
            gray: "stone",
            radius: "xl",
            fontBody: '"Geist", system-ui, sans-serif',
            fontDisplay: '"Instrument Serif", serif',
        };
        const code = encodePreset(custom);
        expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(decodePreset(code)).toEqual(custom);
    });

    it("re-uses a shipped ramp's index even under a different name", () => {
        const renamed = { ...(getPreset("teal") as ThemePreset), name: "my-teal", radius: "xl" as const };
        const decoded = decodePreset(encodePreset(renamed));
        expect(decoded.brand).toEqual(renamed.brand);
        expect(decoded.radius).toBe("xl");
        expect(decoded.label).toBe("My Teal");
    });

    it("rejects malformed codes with a readable error", () => {
        expect(() => decodePreset("!!!")).toThrow(/Invalid preset code/);
        expect(() => decodePreset("AQ")).toThrow(/truncated/);
        expect(() => decodePreset(encodePreset(DEFAULT_PRESET).replace(/^A/, "B"))).toThrow(/version/);
        expect(() => decodePreset(`${encodePreset(DEFAULT_PRESET)}AAAA`)).toThrow(/trailing/);
    });

    it("rejects names that are not kebab-case", () => {
        expect(() => encodePreset({ ...DEFAULT_PRESET, name: "Not OK" })).toThrow(/kebab-case/);
    });
});

describe("resolvePreset", () => {
    it("accepts a shipped name or a code", () => {
        expect(resolvePreset("indigo").name).toBe("indigo");
        expect(resolvePreset(encodePreset(getPreset("orange") as ThemePreset)).name).toBe("orange");
    });

    it("lists the shipped names when the input is neither", () => {
        expect(() => resolvePreset("nope")).toThrow(/brand, blue, indigo/);
    });
});
