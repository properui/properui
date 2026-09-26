# Contributing a component

An end-to-end walkthrough of adding one component to the library. Read
[CONTRIBUTING.md](../CONTRIBUTING.md) first for setup and the general PR process; this page is the specifics.

Open an issue before you start on a new component, so we can agree on the API and where it belongs.

## 1. Pick the layer

| Layer                | What lives there                                                    |
| -------------------- | ------------------------------------------------------------------- |
| `base`               | Primitives: buttons, inputs, badges, avatars, toggles, tooltips     |
| `application`        | App UI: tables, modals, tabs, navigation, charts, date pickers      |
| `marketing`          | Marketing sections: heroes, pricing, FAQ, footers                   |
| `app-examples`       | Whole application pages assembled from the above                    |
| `marketing-examples` | Whole marketing pages                                               |
| `foundations`        | Logos, featured icons, rating stars, social and payment icons       |
| `shared-assets`      | Illustrations, mockups, background patterns, credit cards, QR codes |

Components live in a folder named for the group, not the single component:
`packages/ui/src/components/base/badges/badges.tsx`.

## 2. Write the component

```
packages/ui/src/components/base/switches/
├── switches.tsx        the component
├── switches.demo.tsx   one export per documented example
├── switches.story.tsx  Storybook
└── switches.test.tsx   axe + API assertions
```

The rules that matter (the full list is in [CONTRIBUTING.md](../CONTRIBUTING.md#component-conventions)):

- kebab-case file names, PascalCase exports;
- every `react-aria-components` import aliased with an `Aria` prefix;
- styles in a `styles = sortCx({})` object, applied with `cx()`;
- semantic tokens only, no raw palette classes;
- logical properties (`ms-*`, `ps-*`, `text-start`) so RTL works;
- no `dark:` utility for anything a token already handles.

A skeleton:

```tsx
"use client";

import type { ReactNode } from "react";
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";

export const styles = sortCx({
    common: {
        root: "group flex cursor-pointer items-center outline-focus-ring",
    },
    sizes: {
        sm: { root: "gap-2 text-sm", track: "h-5 w-9" },
        md: { root: "gap-3 text-md", track: "h-6 w-11" },
    },
});

export interface SwitchProps extends Omit<AriaSwitchProps, "children" | "className"> {
    /** The size variant of the switch */
    size?: keyof typeof styles.sizes;
    /** Label rendered beside the control */
    label?: ReactNode;
    className?: string;
}

export const Switch = ({ size = "sm", label, className, ...props }: SwitchProps) => (
    <AriaSwitch {...props} className={cx(styles.common.root, styles.sizes[size].root, className)}>
        <span className={cx("bg-secondary rounded-full transition", styles.sizes[size].track)} />
        {label}
    </AriaSwitch>
);
```

JSDoc every public prop: the docs site generates props tables from those comments.

Interactive components need `"use client"` at the top of the file, so consumers can import them into a Next.js server
component without drawing the boundary themselves.

## 3. Demos

Every documented example is a named export in `<component>.demo.tsx`, and it **must** use the
`export const Name = () => ...` form: the demo generator only detects that shape.

```tsx
"use client";

import { Switch } from "./switches";

export const SwitchExample = () => (
    <div className="flex flex-col items-start gap-4">
        <Switch label="Remember me" />
        <Switch label="Remember me" isDisabled />
    </div>
);
```

Images, videos and avatars come from `@/utils/demo-assets`; flags from `@/utils/countries`. External image URLs fail CI
(`pnpm check:assets`).

## 4. Stories

One story per demo export, with a human-readable `storyName`:

```tsx
import type { FC } from "react";
import * as Switches from "./switches.demo";

export default {
    title: "Base components/Switches",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex h-screen w-full p-4">
                <Story />
            </div>
        ),
    ],
};

export const SwitchExample = () => <Switches.SwitchExample />;
SwitchExample.storyName = "Switch example";
```

Check both themes with the Storybook toolbar before moving on.

## 5. Tests

Every demo goes through `axe`, plus a few assertions on the props that matter:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { Switch } from "./switches";
import * as Demos from "./switches.demo";

describe("Switches", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("applies the size class for the given size prop", () => {
        const { getByRole } = render(<Switch size="md" label="Label" />);
        expect(getByRole("switch").className.split(" ")).toEqual(expect.arrayContaining(["gap-3"]));
    });
});
```

Two axe failures come up repeatedly:

- **Heading order.** An `<h4>` may only follow an `<h3>`. Promote the heading rather than suppressing the rule; the
  class string stays the same, so nothing moves visually. Sections embedded in a page use `<h2>`, never `<h1>`.
- **Tab lists need panels.** React Aria points each tab's `aria-controls` at a panel. Even for a segmented control that
  switches nothing, render one `Tabs.Panel id={...}` per tab id, or `aria-valid-attr-value` fails.

Landmarks that can appear twice in one document (`<nav>`, `<aside>`, `<header>`) each need their own `aria-label`.

Run them:

```bash
pnpm --filter @properui/ui test
```

## 6. Docs page

Add an MDX file under `apps/docs/content/<section>/<slug>.mdx`:

```mdx
---
title: Switch components
section: base
description: Accessible React switch components built with React Aria and styled with Tailwind CSS.
metaTitle: React switch components | Proper UI
metaDescription: Accessible React switch components built with React Aria and styled with Tailwind CSS.
install: switches
source: packages/ui/src/components/base/switches
demoFile: switches
---

<Preview id="switch-example" title="Switch example" height={320} demo="switches:SwitchExample" />

## Installation

<Install slug="switches" />

## Switch examples

<Preview id="sizes" title="Sizes" demo="switches:Sizes" />
```

These MDX blocks are available and nothing else:

- `<Preview id title height demo />` — one live example. `demo` is `"<demoFile>:<ExportName>"`.
- `<Install slug />` — the CLI / manual installation tabs.
- `<FAQs items={[{ question, answer }]} />` — the FAQ accordion.
- `<VariantGrid slug showViewToggle />` — the masonry gallery of a page's variants.
- `<Playground component props />` — a live prop editor for one component from
  `apps/docs/lib/playground-registry.ts`, e.g.
  `<Playground component="buttons:Button" props={{ size: ["sm","md","lg","xl"], isDisabled: "boolean", children: "text" }} />`.
  `component` is `"<registry slug>:<ExportName>"` and must already be curated in
  `playground-registry.ts` (see that file for the current set — Button, Badge, Input, Select,
  Checkbox, Toggle, Avatar, Tooltip, Slider, Textarea today); `props` maps each controllable
  prop name to an array of option strings (enum → select), `"boolean"` (→ switch), or `"text"`
  (→ text input).
- `<ThemeGenerator />` — the interactive theme-preset generator (no props). It is used once, on
  `apps/docs/content/docs/theme-generator.mdx`; component pages have no reason to use it.

Check it renders:

```bash
pnpm dev    # http://localhost:3000
```

## 7. Regenerate

The barrel, the demo map, the sidebar nav and the registry are all generated. Do not hand-edit them:

```bash
pnpm gen:all
```

or the individual steps: `pnpm gen:barrels`, `pnpm gen:demos`, `pnpm gen:nav`, `pnpm registry:build`.

## 8. Check, changeset, PR

```bash
pnpm type-check
pnpm lint
pnpm prettier
pnpm test
pnpm changeset      # minor, for a new component
```

Then open the PR with screenshots in light and dark mode. See
[CONTRIBUTING.md § Pull requests](../CONTRIBUTING.md#pull-requests).

## Checklist

- [ ] Files kebab-case, exports PascalCase
- [ ] React Aria imports aliased `Aria*`
- [ ] Styles in `sortCx({})`, applied with `cx()`
- [ ] Semantic tokens only; no raw palette classes; no unnecessary `dark:`
- [ ] Logical properties for anything direction-dependent
- [ ] `"use client"` on interactive components
- [ ] Props JSDoc'd
- [ ] Demo + story + test + docs page all present
- [ ] `pnpm gen:all` run; generated files not hand-edited
- [ ] Correct in light and dark mode
- [ ] Type-check, lint, prettier and tests pass
- [ ] Changeset added
