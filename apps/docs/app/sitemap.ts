import type { MetadataRoute } from "next";
import { getAllContentPages } from "~/lib/content";
import { getFlows } from "~/lib/library-index";
import { absoluteUrl } from "~/lib/site";

const STATIC_ROUTES = ["/", "/mcp", "/docs", "/components", "/application-ui", "/marketing", "/flows"];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    return [
        ...STATIC_ROUTES.map((route) => ({ url: absoluteUrl(route), lastModified })),
        ...getFlows().map((flow) => ({ url: absoluteUrl(flow.docs), lastModified })),
        ...getAllContentPages().map((page) => ({ url: absoluteUrl(page.href), lastModified })),
    ];
}
