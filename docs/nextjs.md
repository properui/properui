# Next.js

Proper UI is developed against Next.js 15 with the App Router: the documentation site in this repo is exactly that
setup, so [`apps/docs`](../apps/docs) is a working reference for everything below.

## Install

```bash
pnpm add @properui/ui
```

Or let the CLI do the wiring:

```bash
npx @properui/cli@latest init --nextjs
```

## 1. Stylesheet

The package ships one entry point that already contains the Tailwind import, the tokens, typography and the plugins.
Import it from your global stylesheet and add the `@source` line so Tailwind v4 scans the package for class names
(it does not scan `node_modules` on its own):

```css
/* app/globals.css */
@import "@properui/ui/styles/globals.css";

@source "../node_modules/@properui/ui/src/**/*.{ts,tsx}";
```

The relative path is from the stylesheet to your project's `node_modules`: from `app/globals.css` in a standard
project that is `../node_modules`; from `src/app/globals.css` it is `../../node_modules`.

## 2. `transpilePackages`

`@properui/ui` publishes TypeScript source. Next.js only compiles your own code by default, so tell it to compile the
package too. `withProperUI` is the one-liner: it appends `@properui/ui` to `transpilePackages`, deduplicated, and
otherwise leaves your config untouched:

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withProperUI } from "@properui/ui/next";

const nextConfig: NextConfig = {};

export default withProperUI(nextConfig);
```

Equivalent by hand, if you'd rather not import the helper:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@properui/ui"],
};

export default nextConfig;
```

If you import icons heavily, `experimental.optimizePackageImports: ["@properui/icons"]` is worth adding as well.
That is what the docs site uses.

## 3. Providers (App Router)

Two providers wrap the tree:

- **`ThemeProvider`** wraps `next-themes` with `attribute="class"` and a value map of
  `{ light: "light-mode", dark: "dark-mode" }`: the two classes the token layer keys off. Defaults are already correct;
  it takes no required props.
- **`RouterProvider`** hands React Aria the Next router, so every component that accepts `href` (buttons, links, menu
  items, breadcrumbs, pagination) performs a client-side transition instead of a full page load.

Both files carry their own `"use client"` directive, so you can render them straight from the root layout without
creating a client boundary of your own:

```tsx
// app/layout.tsx
import { ThemeProvider } from "@properui/ui/providers";
import { RouterProvider } from "@properui/ui/providers/router-provider";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-primary text-primary antialiased">
                <ThemeProvider>
                    <RouterProvider>{children}</RouterProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
```

`suppressHydrationWarning` on `<html>` is required: `next-themes` writes the theme class before React hydrates, and
without it React reports a mismatch.

`ThemeProvider` forwards every `next-themes` prop, so `defaultTheme`, `enableSystem`, `storageKey` and friends all work:

```tsx
<ThemeProvider defaultTheme="dark" enableSystem={false}>
    {children}
</ThemeProvider>
```

## 4. Pages Router

The tokens, the stylesheet and `ThemeProvider` work identically. The bundled `RouterProvider` does not: it reads
`useRouter` from `next/navigation`, which is App Router only. In a Pages Router app, use React Aria's `RouterProvider`
directly with `next/router`:

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { RouterProvider } from "react-aria-components";
import { ThemeProvider } from "@properui/ui/providers";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    return (
        <ThemeProvider>
            <RouterProvider navigate={router.push}>
                <Component {...pageProps} />
            </RouterProvider>
        </ThemeProvider>
    );
}
```

## Fonts

`theme.css` defines `--font-body` and `--font-display` as `var(--font-inter, "Inter"), ...`, so loading Inter through
`next/font` with the variable name `--font-inter` is all it takes, with no CSS override needed:

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// ...then: <html lang="en" suppressHydrationWarning className={inter.variable}>
```

For a different typeface, point the two tokens at your own font variable:

```css
/* app/globals.css, after the imports */
@theme {
    --font-body: var(--font-geist), system-ui, sans-serif;
    --font-display: var(--font-geist), system-ui, sans-serif;
}
```

## Server and client components

Interactive components declare `"use client"` internally, so you can import and render them from a server component
without adding the directive to your own file. The boundary is drawn inside the library, not at your call site.

You only need `"use client"` on a file where **you** add interactivity (a state hook, an event handler you define, a
form controller):

```tsx
// app/page.tsx: a server component
import { Button } from "@properui/ui/components/base/buttons/button";

export default function Page() {
    return <Button href="/dashboard">Open dashboard</Button>;
}
```

```tsx
// components/counter.tsx: yours, so it needs the directive
"use client";

import { useState } from "react";
import { Button } from "@properui/ui/components/base/buttons/button";

export const Counter = () => {
    const [n, setN] = useState(0);
    return <Button onPress={() => setN(n + 1)}>Clicked {n} times</Button>;
};
```

Note `onPress`, not `onClick`. These are React Aria components.

## Images

Components that take an image accept a rendered node, so `next/image` nests inside them and keeps optimisation, lazy
loading and responsive sizing.

## Next steps

- [Theming](./theming.md): re-brand from one file
- [Dark mode](./dark-mode.md): the toggle and section-scoped dark sections
- [RTL](./rtl.md): `dir="rtl"` and `I18nProvider`
