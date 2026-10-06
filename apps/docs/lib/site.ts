/** Static facts about this documentation site. Kept in one place so links stay consistent. */

export const SITE_NAME = "Proper UI";

/** Absolute origin, used for canonical URLs, the sitemap and the "open in <LLM>" links. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://properui.dev";

export const GITHUB_ORG = "properui";
export const GITHUB_REPO = "properui";
export const GITHUB_URL = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;
export const GITHUB_BRANCH = "main";

/** The CLI package name used by every `npx … add <slug>` snippet. */
export const CLI_PACKAGE = "@properui/cli";

export const absoluteUrl = (pathname: string) => `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

/** Plain-markdown twin of a docs route (`/components/buttons` → `/components/buttons.md`). */
export const markdownUrl = (pathname: string) => `${pathname.replace(/\/$/, "")}.md`;

export const githubSourceUrl = (sourcePath: string) => `${GITHUB_URL}/tree/${GITHUB_BRANCH}/${sourcePath.replace(/^\//, "")}`;
