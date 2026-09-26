import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "~/lib/content";

/**
 * The prebuilt stylesheets of `@properui/tokens`, served from the docs domain:
 * `https://properui.dev/css/properui.min.css` (and `properui.css`, `tokens.css`, `theme.css`).
 * The same files are on npm, so jsDelivr and unpkg serve them too; this is the first-party copy
 * the plain-HTML and framework guides link to.
 *
 * The payloads are the files `pnpm -F @properui/tokens build` writes to `packages/tokens/dist`,
 * read at build time and served verbatim, exactly like the registry under `app/r/[name]`. Every
 * file is prerendered, so on Cloudflare Workers these are plain static assets: no filesystem
 * access happens at request time.
 */

export const dynamic = "force-static";
export const dynamicParams = false;

/** Top-level stylesheet names from `packages/tokens/dist`; anything else is rejected. */
const FILE_NAME = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.css$/;

const tokensDir = () => path.join(repoRoot(), "packages", "tokens", "dist");

export function generateStaticParams() {
    const dir = tokensDir();
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter((file) => FILE_NAME.test(file))
        .map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
    const { file } = await params;
    if (!FILE_NAME.test(file)) return new Response("Not found", { status: 404 });

    const filePath = path.join(tokensDir(), file);
    if (!existsSync(filePath)) return new Response("Not found", { status: 404 });

    return new Response(readFileSync(filePath, "utf8"), {
        headers: {
            "content-type": "text/css; charset=utf-8",
            "cache-control": "public, max-age=0, must-revalidate",
            // Stylesheets are meant to be linked from other origins.
            "access-control-allow-origin": "*",
        },
    });
}
