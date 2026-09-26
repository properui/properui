/**
 * Detection regexes shared by the plugin's rules.
 *
 * The palette/dark-variant/arbitrary-colour patterns are copied from
 * `packages/cli/src/commands/check.ts` (the `properui check` command) rather than imported across
 * packages, per the repository's package-boundary convention. Keep them in sync by hand if
 * `check.ts` changes its detection heuristics.
 *
 * `no-raw-palette` additionally covers gradient-stop utilities (`from-`, `via-`, `to-`) and a few
 * other colour-bearing prefixes that `check.ts` does not scan for, because this plugin runs on
 * individual class-bearing strings (JSX `className`, `cx()`/`cn()`/`clsx()`/`sortCx()` arguments)
 * rather than whole files, so the extra prefixes cost nothing in false positives.
 */

export const PALETTE_COLORS = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
];

/** Utility prefixes that take a Tailwind colour value (`bg-red-500`, `from-blue-50`, ...). */
export const PALETTE_PREFIXES = [
    "bg",
    "text",
    "border",
    "ring",
    "ring-offset",
    "outline",
    "fill",
    "stroke",
    "from",
    "via",
    "to",
    "divide",
    "accent",
    "caret",
    "decoration",
    "shadow",
    "placeholder",
];

/** Matches a single raw Tailwind palette utility, e.g. `bg-red-500` or `from-blue-50`. */
export const PALETTE_REGEX = new RegExp(`\\b(?:${PALETTE_PREFIXES.join("|")})-(?:${PALETTE_COLORS.join("|")})-\\d{2,3}\\b`);

/** Matches a `dark:` variant anywhere in a class token (`dark:bg-black`, `group-hover:dark:...`). */
export const DARK_VARIANT_REGEX = /(?:^|:)dark:/;

/** Matches an arbitrary colour value attached to a utility (`bg-[#7f56d9]`, `text-[rgba(0,0,0,.5)]`). */
export const ARBITRARY_COLOR_REGEX = /-\[(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/;

/**
 * Matches any arbitrary value attached to a utility with a hyphen (`bg-[#fff]`, `p-[13px]`,
 * `w-[calc(100%_-_1rem)]`). Deliberately requires the leading hyphen, so a bare arbitrary
 * *property* (`[mask-image:url(...)]`, or `sm:[mask-image:...]` once variants are stripped) never
 * matches: those aren't attached to a utility name and are allowed by default.
 */
export const ARBITRARY_VALUE_REGEX = /-\[[^\]\s]+\]/;

/** True when the class token also contains `-utility-` — the kit's own semantic-colour utilities
 * (e.g. `outline-utility-blue-500`) are not raw palette usage, mirroring `check.ts`. */
export function isUtilityToken(token: string): boolean {
    return token.includes("-utility-");
}

/** Physical-property utility prefixes and their logical replacements, in the order they're tried.
 * Each entry's `test` matches the *base* utility (variants and `!` already stripped). `fix` takes
 * the matched base and returns its logical equivalent; the caller re-attaches variants/`!`. */
export interface PhysicalMapping {
    name: string;
    test: RegExp;
    fix: (base: string) => string;
}

export const PHYSICAL_MAPPINGS: PhysicalMapping[] = [
    { name: "ml-", test: /^ml-/, fix: (base) => `ms-${base.slice(3)}` },
    { name: "mr-", test: /^mr-/, fix: (base) => `me-${base.slice(3)}` },
    { name: "pl-", test: /^pl-/, fix: (base) => `ps-${base.slice(3)}` },
    { name: "pr-", test: /^pr-/, fix: (base) => `pe-${base.slice(3)}` },
    { name: "left-", test: /^left-/, fix: (base) => `start-${base.slice(5)}` },
    { name: "right-", test: /^right-/, fix: (base) => `end-${base.slice(6)}` },
    { name: "text-left", test: /^text-left$/, fix: () => "text-start" },
    { name: "text-right", test: /^text-right$/, fix: () => "text-end" },
    { name: "rounded-l-", test: /^rounded-l($|-)/, fix: (base) => `rounded-s${base.slice(9)}` },
    { name: "rounded-r-", test: /^rounded-r($|-)/, fix: (base) => `rounded-e${base.slice(9)}` },
    { name: "border-l-", test: /^border-l($|-)/, fix: (base) => `border-s${base.slice(8)}` },
    { name: "border-r-", test: /^border-r($|-)/, fix: (base) => `border-e${base.slice(8)}` },
];

/** Splits a class token into its variant prefix (`hover:md:`), `!important` marker and base
 * utility (`bg-red-500`). Colons are assumed to belong to variants: none of the utilities this
 * plugin's rules match ever contain one themselves. */
export function splitToken(token: string): { prefix: string; important: boolean; base: string } {
    const parts = token.split(":");
    const last = parts.pop() ?? "";
    const prefix = parts.length > 0 ? `${parts.join(":")}:` : "";
    const important = last.startsWith("!");
    const base = important ? last.slice(1) : last;
    return { prefix, important, base };
}
