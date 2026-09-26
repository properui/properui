/**
 * React typings for `@properui/elements`: the `<pui-*>` tags in `JSX.IntrinsicElements`, for a
 * Next.js app that wants the same markup the other frameworks use (in a Server Component, say,
 * with no React Aria on the client). Add once, in any `.d.ts` in the project:
 *
 *     /// <reference types="@properui/elements/react" />
 *
 * The elements still need defining on the client: import `@properui/elements/register` from a
 * `"use client"` module, or load the script build. For a React app, the React components in
 * `@properui/ui` remain the fuller, React Aria based layer.
 *
 * React 19 passes `on<event-name>` props on custom elements to `addEventListener`, so custom
 * events are typed as `onpui-close`, `onpui-select`, ... . `class` works as well as `className`.
 */
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { ElementAttributes, ElementEvents } from "../dist/index.js";

type EventProps<Tag> = Tag extends keyof ElementEvents
    ? { [E in keyof ElementEvents[Tag] & string as `on${E}`]?: (event: CustomEvent<ElementEvents[Tag][E]>) => void }
    : unknown;

type Pui<Tag extends keyof ElementAttributes> = Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>, keyof ElementAttributes[Tag]> &
    ElementAttributes[Tag] &
    EventProps<Tag> & { class?: string };

declare module "react" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            "pui-button": Pui<"pui-button">;
            "pui-badge": Pui<"pui-badge">;
            "pui-avatar": Pui<"pui-avatar">;
            "pui-input": Pui<"pui-input">;
            "pui-textarea": Pui<"pui-textarea">;
            "pui-checkbox": Pui<"pui-checkbox">;
            "pui-toggle": Pui<"pui-toggle">;
            "pui-select": Pui<"pui-select">;
            "pui-alert": Pui<"pui-alert">;
            "pui-tabs": Pui<"pui-tabs">;
            "pui-tab": Pui<"pui-tab">;
            "pui-tab-panel": Pui<"pui-tab-panel">;
            "pui-dropdown": Pui<"pui-dropdown">;
            "pui-menu-item": Pui<"pui-menu-item">;
            "pui-modal": Pui<"pui-modal">;
            "pui-tooltip": Pui<"pui-tooltip">;
            "pui-progress": Pui<"pui-progress">;
            "pui-skeleton": Pui<"pui-skeleton">;
            "pui-breadcrumbs": Pui<"pui-breadcrumbs">;
            "pui-pagination": Pui<"pui-pagination">;
            "pui-theme-toggle": Pui<"pui-theme-toggle">;
        }
    }
}

export {};
