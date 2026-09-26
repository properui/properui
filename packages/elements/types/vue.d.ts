/**
 * Vue typings for `@properui/elements`: every `<pui-*>` tag with its attributes and events, for
 * Volar / vue-tsc template checking. Add once, in `env.d.ts` or any `.d.ts` in the project:
 *
 *     /// <reference types="@properui/elements/vue" />
 *
 * Vue must also be told the tags are custom elements, not components
 * (`compilerOptions.isCustomElement: (tag) => tag.startsWith("pui-")` in the Vue plugin options).
 */
import type { DefineComponent } from "vue";
import type { ElementAttributes, ElementEvents } from "../dist/index.js";

type Camel<S extends string> = S extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<Camel<Tail>>}` : S;

/** Kebab-case attributes, plus their camelCase spelling (Volar normalises either way). */
type WithCamel<T> = T & { [K in keyof T as K extends string ? Camel<K> : never]?: T[K] };

type EventProps<Tag> = Tag extends keyof ElementEvents
    ? { [E in keyof ElementEvents[Tag] & string as `on${Capitalize<Camel<E>>}`]?: (event: CustomEvent<ElementEvents[Tag][E]>) => void }
    : unknown;

interface CommonProps {
    id?: string;
    class?: unknown;
    style?: unknown;
    slot?: string;
    hidden?: boolean;
    onInput?: (event: Event) => void;
    onChange?: (event: Event) => void;
    onClick?: (event: MouseEvent) => void;
}

type Pui<Tag extends keyof ElementAttributes> = DefineComponent<WithCamel<ElementAttributes[Tag]> & EventProps<Tag> & CommonProps>;

interface PuiGlobalComponents {
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

declare module "@vue/runtime-core" {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface GlobalComponents extends PuiGlobalComponents {}
}

declare module "vue" {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface GlobalComponents extends PuiGlobalComponents {}
}

export {};
