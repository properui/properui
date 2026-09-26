/**
 * Embedded project templates for `properui create`.
 *
 * Every string here is written verbatim (after substituting `__PROJECT_NAME__`) into the new
 * project directory; `commands/create.ts` then runs the same `init`/`add` logic `properui`
 * already uses against an existing project. Keep dependency versions in sync with
 * `packages/ui/package.json`'s `peerDependencies` (`next`, `react`, `react-dom`, `tailwindcss`) —
 * that's the contract a copy-in Proper UI project actually needs to satisfy.
 *
 * Spec: docs/cli.md ("create").
 */

const GITIGNORE = `node_modules
dist
dist-ssr
.next
*.local

.DS_Store
`;

// ---------------------------------------------------------------------------
// Next.js 15 App Router + Tailwind v4 + TypeScript
// ---------------------------------------------------------------------------

const NEXT_PACKAGE_JSON = `{
    "name": "__PROJECT_NAME__",
    "private": true,
    "version": "0.1.0",
    "type": "module",
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
    },
    "dependencies": {
        "next": "^15.1.0",
        "react": "^19",
        "react-dom": "^19"
    },
    "devDependencies": {
        "@tailwindcss/postcss": "^4.3.0",
        "@types/node": "^20",
        "@types/react": "^19.2.17",
        "@types/react-dom": "^19",
        "tailwindcss": "^4.3.0",
        "typescript": "^5.9.3"
    }
}
`;

const NEXT_TSCONFIG_JSON = `{
    "compilerOptions": {
        "target": "ES2020",
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [{ "name": "next" }],
        "baseUrl": ".",
        "paths": { "@/*": ["./*"] }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
`;

const NEXT_ENV_D_TS = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

const NEXT_CONFIG_TS = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`;

const NEXT_POSTCSS_CONFIG = `const config = {
    plugins: {
        "@tailwindcss/postcss": {},
    },
};

export default config;
`;

const NEXT_GLOBALS_CSS = `@import "tailwindcss";
`;

const NEXT_LAYOUT_TSX = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "__PROJECT_NAME__",
    description: "Built with Proper UI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-primary text-primary antialiased">{children}</body>
        </html>
    );
}
`;

const NEXT_PAGE_TSX = `import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary p-8 text-primary">
            <Badge color="brand" size="md">
                Proper UI
            </Badge>
            <Button size="md" color="primary">
                Get started
            </Button>
        </main>
    );
}
`;

/** Written by `properui create --template next`, relative to the new project's root. */
export const NEXT_TEMPLATE_FILES: Record<string, string> = {
    "package.json": NEXT_PACKAGE_JSON,
    "tsconfig.json": NEXT_TSCONFIG_JSON,
    "next-env.d.ts": NEXT_ENV_D_TS,
    "next.config.ts": NEXT_CONFIG_TS,
    "postcss.config.mjs": NEXT_POSTCSS_CONFIG,
    ".gitignore": GITIGNORE,
    "app/globals.css": NEXT_GLOBALS_CSS,
    "app/layout.tsx": NEXT_LAYOUT_TSX,
    "app/page.tsx": NEXT_PAGE_TSX,
};

// ---------------------------------------------------------------------------
// Vite + React 19 + Tailwind v4 + TypeScript
// ---------------------------------------------------------------------------

const VITE_PACKAGE_JSON = `{
    "name": "__PROJECT_NAME__",
    "private": true,
    "version": "0.1.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "react": "^19",
        "react-dom": "^19"
    },
    "devDependencies": {
        "@tailwindcss/vite": "^4.3.0",
        "@types/react": "^19.2.17",
        "@types/react-dom": "^19",
        "@vitejs/plugin-react": "^4.3.4",
        "tailwindcss": "^4.3.0",
        "typescript": "^5.9.3",
        "vite": "^6.0.0"
    }
}
`;

const VITE_TSCONFIG_JSON = `{
    "compilerOptions": {
        "target": "ES2022",
        "useDefineForClassFields": true,
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "Bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "baseUrl": ".",
        "paths": { "@/*": ["./src/*"] }
    },
    "include": ["src"]
}
`;

const VITE_ENV_D_TS = `/// <reference types="vite/client" />
`;

const VITE_CONFIG_TS = `import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
});
`;

const VITE_INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>__PROJECT_NAME__</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
    </body>
</html>
`;

const VITE_INDEX_CSS = `@import "tailwindcss";
`;

const VITE_APP_TSX = `import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

export const App = () => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary p-8 text-primary">
        <Badge color="brand" size="md">
            Proper UI
        </Badge>
        <Button size="md" color="primary">
            Get started
        </Button>
    </main>
);
`;

const VITE_MAIN_TSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
`;

/** Written by `properui create --template vite`, relative to the new project's root. */
export const VITE_TEMPLATE_FILES: Record<string, string> = {
    "package.json": VITE_PACKAGE_JSON,
    "tsconfig.json": VITE_TSCONFIG_JSON,
    "vite.config.ts": VITE_CONFIG_TS,
    "index.html": VITE_INDEX_HTML,
    ".gitignore": GITIGNORE,
    "src/vite-env.d.ts": VITE_ENV_D_TS,
    "src/index.css": VITE_INDEX_CSS,
    "src/App.tsx": VITE_APP_TSX,
    "src/main.tsx": VITE_MAIN_TSX,
};

export type CreateTemplate = "next" | "vite";

export const TEMPLATE_FILES: Record<CreateTemplate, Record<string, string>> = {
    next: NEXT_TEMPLATE_FILES,
    vite: VITE_TEMPLATE_FILES,
};

/** Turns an arbitrary directory name into a valid, lowercase npm package name. */
export function packageNameFor(dir: string): string {
    const slug = dir
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug.length > 0 ? slug : "properui-app";
}
