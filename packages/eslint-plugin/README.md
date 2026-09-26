# @properui/eslint-plugin

An ESLint 9 (flat config) plugin for [Proper UI](https://github.com/properui/properui): keeps AI- and
human-written component code on the semantic token layer instead of raw Tailwind CSS, and on logical
properties instead of physical ones.

It flags the same things [`properui check`](https://properui.dev/docs/cli#check-command) does (raw
palette classes, arbitrary values, `dark:` variants), inline as you type, plus physical directional
utilities with an autofix to their logical equivalent — something a whole-file text scan can't offer.

## Install

```bash
npm install -D @properui/eslint-plugin
```

## Usage

```js
// eslint.config.mjs
import properui from "@properui/eslint-plugin";

export default [
    // ...your other config
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        ...properui.configs.recommended,
    },
];
```

`configs.recommended` is a complete flat config object (it carries its own `plugins` entry), so
spreading it is enough — you don't need to also register `@properui/eslint-plugin` under `plugins`
yourself. It turns on all four rules: `no-raw-palette`, `no-dark-variant` and
`no-physical-properties` as `"error"`, `no-arbitrary-values` as `"warn"`.

To pick rules individually instead:

```js
import properui from "@properui/eslint-plugin";

export default [
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        plugins: { "@properui": properui },
        rules: {
            "@properui/no-raw-palette": "error",
            "@properui/no-arbitrary-values": "warn",
            "@properui/no-dark-variant": "error",
            "@properui/no-physical-properties": "error",
        },
    },
];
```

Every rule scans JSX `className`/`class` attributes, template literals, and the arguments of
`cx()`/`cn()`/`clsx()`/`sortCx()` calls (including object keys and values, so both clsx's
conditional-object form and `sortCx`'s variant-map form are covered) — wherever those strings are
nested in ternaries, `&&`, arrays or further calls.

## Rules

### `no-raw-palette`

Flags a raw Tailwind palette utility — `bg-red-500`, `text-gray-900`, `border-purple-200`,
`from-blue-50`, with any variant/prefix (`hover:`, `md:`, `group-hover:`, `!`) — in favour of a
semantic token (`bg-primary`, `text-tertiary`, `border-secondary`, `bg-brand-solid`, ...). The kit's
own semantic-colour utilities (`outline-utility-blue-500`) are exempt.

```jsx
// ✗
<div className="bg-red-500 hover:bg-red-600" />;

// ✓
<div className="bg-error-solid hover:bg-error-solid_hover" />;
```

Option: `allow: string[]` — regex patterns (as strings) for tokens to exempt.

### `no-arbitrary-values`

Flags an arbitrary value attached to a utility — `bg-[#7f56d9]`, `p-[13px]`, `text-[13px]`,
`w-[calc(100%_-_1rem)]` — in favour of a token. A bare arbitrary **property** (no utility name
before the bracket, e.g. `[mask-image:linear-gradient(...)]`, or `sm:[mask-image:...]` once its
variant is stripped) is allowed by default, since it isn't standing in for a missing token.

```jsx
// ✗
<div className="bg-[#7f56d9] p-[13px]" />;

// ✓
<div className="bg-brand-solid p-3" />;
<div className="[mask-image:linear-gradient(to_bottom,black,transparent)]" />;
```

Option: `allow: string[]` — regex patterns (as strings) for tokens to exempt.

### `no-dark-variant`

Flags any `dark:` utility, anywhere in the variant chain. A `.dark-mode` class on an ancestor
repoints every semantic token; a component written against the token layer is already correct in
both themes, so a `dark:` utility is a bug, not a fix.

```jsx
// ✗
<div className="bg-white dark:bg-black" />;

// ✓
<div className="bg-primary" />;
```

### `no-physical-properties`

Flags a physical directional utility — `ml-`/`mr-`/`pl-`/`pr-`, `left-`/`right-`, `text-left`/
`text-right`, `rounded-l-`/`rounded-r-`, `border-l-`/`border-r-` — with **autofix** to its logical
equivalent, so `dir="rtl"` works without a second pass:

| Physical       | Logical        |
| -------------- | -------------- |
| `ml-4`         | `ms-4`         |
| `pr-2`         | `pe-2`         |
| `left-0`       | `start-0`      |
| `text-left`    | `text-start`   |
| `rounded-l-lg` | `rounded-s-lg` |
| `border-l`     | `border-s`     |

```jsx
// ✗
<div className="ml-4 rounded-l-lg text-left" />;

// ✓ (eslint --fix)
<div className="ms-4 rounded-s-lg text-start" />;
```

## Development

```bash
pnpm build         # tsup -> dist/ (ESM + CJS + .d.ts)
pnpm type-check
pnpm lint
pnpm test          # vitest + ESLint's own RuleTester
```

## License

MIT © Ayman Shabaro. See [LICENSE](./LICENSE).
