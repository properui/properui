import { CLI_PACKAGE } from "./site";

/**
 * Turns an MDX body into the plain-markdown twin served at `/<route>.md`.
 * The four MDX blocks (AGENT-BRIEF §5) have no meaning outside the site, so each is
 * rewritten into something a reader — or an LLM — can actually use.
 */

const attribute = (tag: string, name: string) => tag.match(new RegExp(`${name}=["']([^"']+)["']`))?.[1];

const renderFaqs = (tag: string) => {
    const pairs = [...tag.matchAll(/question:\s*["'`]([\s\S]*?)["'`]\s*,\s*answer:\s*["'`]([\s\S]*?)["'`]\s*\}/g)];
    if (!pairs.length) return "";
    return pairs.map((pair) => `### ${pair[1]}\n\n${pair[2]}`).join("\n\n");
};

export const mdxToMarkdown = (body: string): string =>
    body
        .replace(/<Preview\b[^>]*\/>/g, (tag) => {
            const title = attribute(tag, "title");
            const demo = attribute(tag, "demo");
            return [title ? `### ${title}` : "", demo ? `Demo: \`${demo}\`` : ""].filter(Boolean).join("\n\n");
        })
        .replace(/<Install\b[^>]*\/>/g, (tag) => `\`\`\`bash\nnpx ${CLI_PACKAGE}@latest add ${attribute(tag, "slug") ?? ""}\n\`\`\``)
        .replace(/<VariantGrid\b[^>]*\/>/g, "")
        .replace(/<ThemeGenerator\b[^>]*\/>/g, "")
        .replace(/<Playground\b[\s\S]*?\/>/g, "")
        .replace(/<FAQs\b[\s\S]*?\/>/g, renderFaqs)
        .replace(/\n{3,}/g, "\n\n")
        .trim();
