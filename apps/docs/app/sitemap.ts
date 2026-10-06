import type { MetadataRoute } from "next";
import { getAllContentPages } from "~/lib/content";
import { absoluteUrl } from "~/lib/site";

const STATIC_ROUTES = ["/", "/mcp", "/docs", "/components", "/application-ui", "/marketing"];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    return [
        ...STATIC_ROUTES.map((route) => ({ url: absoluteUrl(route), lastModified })),
        ...getAllContentPages().map((page) => ({ url: absoluteUrl(page.href), lastModified })),
    ];
}
