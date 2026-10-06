import type { ReactNode } from "react";

/** Matches a `code` span or a `[label](href)` link; data files stay plain strings. */
const TOKEN = /(`[^`]*`|\[[^\]]+\]\((?:\/|https?:\/\/)[^)\s]*\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]*)\)$/;

/** Renders backtick spans as `<code>` and `[label](href)` as links; everything else as text. */
export function Inline({ text }: { text: string }) {
    const nodes: ReactNode[] = [];
    text.split(TOKEN).forEach((part, index) => {
        if (!part) return;
        const key = `${index}-${part}`;
        if (part.startsWith("`") && part.endsWith("`")) {
            nodes.push(<code key={key}>{part.slice(1, -1)}</code>);
            return;
        }
        const link = LINK.exec(part);
        if (link) {
            const label = link[1] ?? part;
            const href = link[2] ?? "/";
            const external = href.startsWith("http");
            nodes.push(
                <a key={key} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
                    {label}
                </a>,
            );
            return;
        }
        nodes.push(<span key={key}>{part}</span>);
    });
    return <>{nodes}</>;
}

/** The same string with code marks and link syntax removed, for JSON-LD and other plain-text surfaces. */
export const plain = (text: string) => text.replaceAll("`", "").replace(/\[([^\]]+)\]\((?:\/|https?:\/\/)[^)\s]*\)/g, "$1");
