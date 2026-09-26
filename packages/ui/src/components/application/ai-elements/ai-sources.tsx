"use client";

import type { ReactNode } from "react";
import { Button as AriaButton, Disclosure as AriaDisclosure, DisclosurePanel as AriaDisclosurePanel } from "react-aria-components";
import { BookOpen01, ChevronDown, Globe01 } from "@properui/icons";
import { cx, sortCx } from "../../../utils/cx";

export const styles = sortCx({
    root: "group/ai-sources flex w-full flex-col",
    trigger:
        "text-tertiary hover:text-secondary outline-focus-ring flex w-max cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
    icon: "text-fg-quaternary size-4 shrink-0",
    // The root `Disclosure` carries `data-expanded` while open.
    chevron:
        "text-fg-quaternary size-4 shrink-0 transition-transform duration-150 ease-out group-data-expanded/ai-sources:rotate-180 motion-reduce:transition-none",
    list: "mt-2 flex flex-col gap-1",
    source: "hover:bg-primary_hover outline-focus-ring ring-secondary flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 ring-1 transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
    sourceIcon: "bg-secondary text-fg-quaternary flex size-6 shrink-0 items-center justify-center rounded-md",
    sourceTitle: "text-secondary truncate text-sm font-medium",
    sourceHost: "text-tertiary truncate text-xs",
});

/** The host name of a URL without a leading `www.`, or the URL itself when it cannot be parsed. */
export const getHostname = (href: string): string => {
    try {
        return new URL(href).hostname.replace(/^www\./, "");
    } catch {
        return href;
    }
};

export interface AISourcesProps {
    /** Whether the list starts open. @default false */
    defaultExpanded?: boolean;
    /** Controlled open state. */
    isExpanded?: boolean;
    /** Called when the list opens or closes. */
    onExpandedChange?: (isExpanded: boolean) => void;
    /** `AISources.Trigger` and `AISources.Content`. */
    children: ReactNode;
    /** Additional classes merged onto the root. */
    className?: string;
}

const AISourcesRoot = ({ defaultExpanded, isExpanded, onExpandedChange, children, className }: AISourcesProps) => (
    <AriaDisclosure defaultExpanded={defaultExpanded} isExpanded={isExpanded} onExpandedChange={onExpandedChange} className={cx(styles.root, className)}>
        {children}
    </AriaDisclosure>
);

export interface AISourcesTriggerProps {
    /** Number of sources, used in the default label. */
    count?: number;
    /** Replaces the default `Used N sources` label. */
    children?: ReactNode;
    /** Additional classes merged onto the button. */
    className?: string;
}

/** The toggle that reveals the list of citations. */
const AISourcesTrigger = ({ count, children, className }: AISourcesTriggerProps) => (
    <AriaButton slot="trigger" className={cx(styles.trigger, className)}>
        <BookOpen01 aria-hidden="true" className={styles.icon} />
        <span>{children ?? (count === undefined ? "Sources" : `Used ${count} ${count === 1 ? "source" : "sources"}`)}</span>
        <ChevronDown aria-hidden="true" className={styles.chevron} />
    </AriaButton>
);

export interface AISourcesContentProps {
    /** Accessible name of the list. @default "Sources" */
    "aria-label"?: string;
    /** `AISources.Source` entries. */
    children: ReactNode;
    /** Additional classes merged onto the list. */
    className?: string;
}

/** The collapsible list of citations. */
const AISourcesContent = ({ "aria-label": ariaLabel = "Sources", children, className }: AISourcesContentProps) => (
    <AriaDisclosurePanel>
        <ul aria-label={ariaLabel} className={cx(styles.list, className)}>
            {children}
        </ul>
    </AriaDisclosurePanel>
);

export interface AISourcesSourceProps {
    /** URL of the cited page. Opens in a new tab with `rel="noopener noreferrer"`. */
    href: string;
    /** Title of the cited page. Falls back to its host name. */
    title?: string;
    /** Host name shown under the title. Derived from `href` when omitted. */
    hostname?: string;
    /** Icon or favicon slot. Defaults to a globe. */
    icon?: ReactNode;
    /** Additional classes merged onto the link. */
    className?: string;
}

/** One citation: a link with the page title and its host name. */
const AISourcesSource = ({ href, title, hostname, icon, className }: AISourcesSourceProps) => {
    const host = hostname ?? getHostname(href);

    return (
        <li className="flex">
            <a href={href} target="_blank" rel="noopener noreferrer" className={cx(styles.source, "flex-1", className)}>
                <span aria-hidden="true" className={styles.sourceIcon}>
                    {icon ?? <Globe01 className="size-3.5" />}
                </span>
                <span className="flex min-w-0 flex-col">
                    <span className={styles.sourceTitle}>{title ?? host}</span>
                    {title && <span className={styles.sourceHost}>{host}</span>}
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
            </a>
        </li>
    );
};

export const AISources = Object.assign(AISourcesRoot, {
    Trigger: AISourcesTrigger,
    Content: AISourcesContent,
    Source: AISourcesSource,
});
