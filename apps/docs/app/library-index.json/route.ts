import { getLibraryItems } from "~/lib/library-index";

/**
 * `/library-index.json`: the compact list the home page search box filters in the browser.
 * Only the fields the box shows or matches on; descriptions and composition stay on the docs pages
 * so the file stays small. Built from `packages/registry/dist` at build time and served as a static asset.
 */
export const dynamic = "force-static";

export function GET() {
    const rows = getLibraryItems().map((item) => ({
        name: item.name,
        title: item.title,
        kind: item.kind,
        group: item.group,
        thumb: item.thumb?.light ?? null,
        docs: item.docs,
    }));

    return new Response(JSON.stringify(rows), {
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=0, must-revalidate",
        },
    });
}
