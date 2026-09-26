/**
 * The shared base for every Proper UI custom element.
 *
 * Elements render into their own light DOM (no shadow root), so the global `properui.css` styles
 * them and native form controls inside them take part in forms. The children an author writes are
 * the element's content: they are moved, never cloned, into the rendered markup, so a framework that
 * owns those nodes (a Vue text binding, a Svelte `{#if}` block) keeps updating the same nodes.
 *
 * Rendering happens once, on the first `connectedCallback`. Moving an element (disconnect +
 * connect) never renders it again. Attribute changes call `changed()`, which re-renders by default.
 */

/** A stand-in for `HTMLElement` during server rendering (Astro, Nuxt, Next) where the DOM is absent. */
const ElementBase = (typeof HTMLElement === "undefined" ? class {} : HTMLElement) as typeof HTMLElement;

export type PropType = "string" | "boolean" | "number";

/** camelCase property name to kebab-case attribute name: `isDisabled` -> `is-disabled`. */
export const toAttr = (prop: string): string => prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Reads a boolean attribute. Present means true, except the literal string `"false"`, which Vue 3
 * and Angular's `[attr.x]` bindings write for a `false` value.
 */
export const readBool = (el: Element, name: string): boolean => {
    const value = el.getAttribute(name);
    return value !== null && value !== "false";
};

let uid = 0;
/** A document-unique id with the given prefix. */
export const nextId = (prefix: string): string => `pui-${prefix}-${++uid}`;

type Attrs = Record<string, string | number | boolean | null | undefined>;

/**
 * Creates an element. `attrs` values of `false`, `null` and `undefined` are skipped, `true` becomes
 * an empty attribute. `class` accepts a space-separated list (empty entries are dropped).
 */
export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: Attrs = {},
    children: (Node | string | null | undefined | false)[] = [],
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) {
        if (value === false || value === null || value === undefined) continue;
        if (name === "class") {
            const classes = String(value).split(/\s+/).filter(Boolean);
            if (classes.length) el.className = classes.join(" ");
            continue;
        }
        el.setAttribute(name, value === true ? "" : String(value));
    }
    for (const child of children) {
        if (child === null || child === undefined || child === false) continue;
        el.append(child);
    }
    return el;
}

/**
 * Puts `nodes` into `parent` as its only children, touching the DOM only when they differ.
 * Re-inserting a node that already sits in place would blur it if it (or a descendant) has focus.
 */
export function place(parent: ParentNode & Node, nodes: Node[]): void {
    const current = parent.childNodes;
    if (current.length === nodes.length && nodes.every((node, i) => current[i] === node)) return;
    parent.replaceChildren(...nodes);
}

/** Joins class names, dropping empty ones. */
export const cls = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(" ");

/** True when a node carries visible content (not whitespace-only text, not a comment). */
export const isMeaningful = (node: Node): boolean =>
    node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "");

/** Dispatches a bubbling, composed `CustomEvent`; returns false when a listener called `preventDefault()`. */
export const emit = <T>(el: Element, type: string, detail?: T, cancelable = false): boolean =>
    el.dispatchEvent(new CustomEvent<T>(type, { detail, bubbles: true, composed: true, cancelable }));

/** Rendered output: the nodes to put under the host, and where default-slot content now lives. */
export interface Rendered {
    nodes: Node[];
    /** The element holding default content, or `null` when content sits directly under the host. */
    target: ParentNode | null;
}

export abstract class PuiElement extends ElementBase {
    /** Property-to-type map. Subclasses list their own; accessors and `observedAttributes` derive from it. */
    static props: Record<string, PropType> = {};

    static get observedAttributes(): string[] {
        return Object.keys(this.props).map(toAttr);
    }

    #ready = false;
    #rendering = 0;
    #observer: MutationObserver | null = null;
    #hostClasses: string[] = [];
    /** Structural nodes rendered directly under the host (never author content). */
    #own = new Set<Node>();
    /** Where default-slot content lives after a render; `null` means directly under the host. */
    #target: ParentNode | null = null;
    #initial: Node[] | null = null;
    #named = new Map<string, Node[]>();
    #title: string | null = null;
    #takingTitle = false;

    connectedCallback(): void {
        if (this.#ready) return;
        if (document.readyState === "loading") {
            // A synchronous <script> in <head> defines elements before their children are parsed.
            document.addEventListener("DOMContentLoaded", () => this.connectedCallback(), { once: true });
            return;
        }
        this.#upgradeProperties();
        this.#ready = true;
        this.#distribute(Array.from(this.childNodes), true);
        this.#render();
        if (typeof MutationObserver !== "undefined") {
            this.#observer = new MutationObserver(() => this.#adoptStrays());
            this.#observer.observe(this, { childList: true });
        }
        this.connected();
    }

    /** Renders now if connected but not rendered yet: a parent element that needs its children's markup calls this. */
    renderNow(): void {
        if (!this.#ready && this.isConnected && document.readyState !== "loading") this.connectedCallback();
    }

    attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
        if (name === "title" && this.#takingTitle) return;
        if (!this.#ready || previous === next) return;
        this.changed(name);
    }

    /** Called once, after the first render. */
    protected connected(): void {}

    /** Called when an observed attribute changes after the first render. Re-renders by default. */
    protected changed(_name: string): void {
        this.rerender();
    }

    /** Builds the element's markup around `content` (default slot) and `this.slotted(name)`. */
    protected abstract render(content: Node[]): Rendered;

    /** Re-runs `render()` with the element's current content. */
    protected rerender(): void {
        if (this.#ready) this.#render();
    }

    /** Nodes an author placed with `slot="name"` that are still inside this element. */
    protected slotted(name: string): Node[] {
        const nodes = (this.#named.get(name) ?? []).filter((node) => this.contains(node));
        this.#named.set(name, nodes);
        return nodes;
    }

    /** Replaces the classes this element put on its own host; author classes are left alone. */
    protected setHostClasses(...names: (string | false | null | undefined)[]): void {
        const next = names.filter((n): n is string => Boolean(n)).flatMap((n) => n.split(/\s+/));
        this.classList.remove(...this.#hostClasses.filter((c) => !next.includes(c)));
        if (next.length) this.classList.add(...next);
        this.#hostClasses = next;
    }

    /** Sets or removes an unobserved attribute on the host (a role, an ARIA attribute). */
    protected setHostAttr(name: string, value: string | null): void {
        if (value === null) this.removeAttribute(name);
        else if (this.getAttribute(name) !== value) this.setAttribute(name, value);
    }

    /**
     * For elements that render a visible heading from `title`: moves the attribute's value into the
     * element and removes it from the host, so the browser does not also show it as a hover tooltip
     * over the whole element. Returns the latest title.
     */
    protected takeTitle(): string | null {
        const attr = this.getAttribute("title");
        if (attr !== null) {
            this.#title = attr;
            this.#takingTitle = true;
            try {
                this.removeAttribute("title");
            } finally {
                this.#takingTitle = false;
            }
        }
        return this.#title;
    }

    #render(): void {
        const content = this.#initial ?? this.#currentContent();
        this.#initial = null;
        const { nodes, target } = this.render(content);
        this.#rendering++;
        try {
            place(this, nodes);
        } finally {
            this.#rendering--;
        }
        this.#target = target;
        const contentSet = new Set(content);
        this.#own = new Set(nodes.filter((n) => !contentSet.has(n)));
        this.#observer?.takeRecords();
    }

    #currentContent(): Node[] {
        if (this.#target && this.#target !== this) return Array.from(this.#target.childNodes);
        return Array.from(this.childNodes).filter((n) => !this.#own.has(n) && !this.#isNamed(n));
    }

    #isNamed(node: Node): boolean {
        for (const list of this.#named.values()) if (list.includes(node)) return true;
        return false;
    }

    /** Sorts nodes into the default slot and named slots. Returns the default-slot nodes. */
    #distribute(nodes: Node[], initial = false): Node[] {
        const rest: Node[] = [];
        for (const node of nodes) {
            const slot = node instanceof Element ? node.getAttribute("slot") : null;
            if (slot) {
                const list = this.#named.get(slot) ?? [];
                if (!list.includes(node)) list.push(node);
                this.#named.set(slot, list);
            } else rest.push(node);
        }
        if (initial) this.#initial = rest;
        return rest;
    }

    /** Direct children that appeared without going through the patched DOM methods (`append`, `prepend`). */
    #adoptStrays(): void {
        if (this.#rendering) return;
        const strays = Array.from(this.childNodes).filter((n) => !this.#own.has(n) && !this.#isNamed(n));
        const target = this.#target;
        if (!target || target === this) {
            // Content lives directly under the host, so strays are already in place, unless a slotted one arrived.
            if (strays.some((n) => n instanceof Element && n.hasAttribute("slot"))) {
                this.#distribute(strays);
                this.#render();
            }
            return;
        }
        if (!strays.length) return;
        const rest = this.#distribute(strays);
        for (const node of rest) target.appendChild(node);
        this.#render();
    }

    // The DOM methods frameworks use to patch children. Once rendered, author content no longer sits
    // directly under the host, so insertions and removals are forwarded to wherever that content lives.

    override appendChild<T extends Node>(node: T): T {
        if (!this.#ready || this.#rendering) return super.appendChild(node);
        return this.insertBefore(node, null);
    }

    override insertBefore<T extends Node>(node: T, ref: Node | null): T {
        if (!this.#ready || this.#rendering) return super.insertBefore(node, ref);
        if (ref && ref.parentNode && ref.parentNode !== this && this.contains(ref)) {
            ref.parentNode.insertBefore(node, ref);
            // A slotted node inserted next to default content (a Vue `v-if`) moves to its slot.
            if (node instanceof Element && node.hasAttribute("slot")) {
                this.#track(node);
                this.#render();
            }
            return node;
        }
        const incoming = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? Array.from(node.childNodes) : [node];
        const named = incoming.some((n) => n instanceof Element && n.hasAttribute("slot"));
        const target = this.#target;
        if (!named && (!target || target === this)) return super.insertBefore(node, ref);
        const rest = this.#distribute(incoming);
        if (target && target !== this) for (const n of rest) target.appendChild(n);
        else for (const n of rest) super.insertBefore(n, ref);
        if (named) this.#render();
        return node;
    }

    override removeChild<T extends Node>(node: T): T {
        if (this.#ready && !this.#rendering && node.parentNode && node.parentNode !== this && this.contains(node)) {
            node.parentNode.removeChild(node);
            return node;
        }
        return super.removeChild(node);
    }

    override replaceChild<T extends Node>(node: Node, old: T): T {
        if (this.#ready && !this.#rendering && old.parentNode && old.parentNode !== this && this.contains(old)) {
            old.parentNode.replaceChild(node, old);
            return old;
        }
        return super.replaceChild(node, old);
    }

    /**
     * Replaces the default content with a text node. Backs the `textContent` setter below, which is
     * how Vue patches a single text child and how vanilla code most often sets a label. Returns false
     * before the first render, when the native setter should run instead.
     * @internal
     */
    _replaceText(value: string | null): boolean {
        if (!this.#ready || this.#rendering) return false;
        this.#named.clear();
        this.#initial = value ? [document.createTextNode(value)] : [];
        this.#render();
        return true;
    }

    #track(node: Element): void {
        const name = node.getAttribute("slot") ?? "";
        const list = this.#named.get(name) ?? [];
        if (!list.includes(node)) list.push(node);
        this.#named.set(name, list);
    }

    /** A property set before the element was upgraded shadows the accessor; re-apply it through the setter. */
    #upgradeProperties(): void {
        const props = (this.constructor as typeof PuiElement).props;
        for (const prop of Object.keys(props)) {
            if (Object.prototype.hasOwnProperty.call(this, prop)) {
                const value = (this as unknown as Record<string, unknown>)[prop];
                delete (this as unknown as Record<string, unknown>)[prop];
                (this as unknown as Record<string, unknown>)[prop] = value;
            }
        }
    }
}

// `textContent` is an accessor on `Node.prototype`; TypeScript types it as a field, so it is
// overridden here rather than in the class body.
if (typeof Node !== "undefined") {
    const native = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
    if (native?.get && native.set) {
        const { get, set } = native;
        Object.defineProperty(PuiElement.prototype, "textContent", {
            configurable: true,
            get(this: Node) {
                return get.call(this);
            },
            set(this: PuiElement, value: string | null) {
                if (!this._replaceText(value)) set.call(this, value);
            },
        });
    }
}

/**
 * Installs a reflecting accessor on `cls.prototype` for every entry in `cls.props`: strings read the
 * attribute (setting `null` removes it), booleans toggle it, numbers parse it.
 */
export function defineProps(cls: typeof PuiElement): void {
    if (typeof HTMLElement === "undefined") return;
    for (const [prop, type] of Object.entries(cls.props)) {
        // Hand-written accessors (`value`, `checked`, inherited ones included) and native ones (`title`) are kept.
        if (prop in cls.prototype) continue;
        const attr = toAttr(prop);
        Object.defineProperty(cls.prototype, prop, {
            configurable: true,
            enumerable: true,
            get(this: HTMLElement) {
                if (type === "boolean") return readBool(this, attr);
                const raw = this.getAttribute(attr);
                if (type === "number") return raw === null || raw === "" || Number.isNaN(Number(raw)) ? undefined : Number(raw);
                return raw ?? undefined;
            },
            set(this: HTMLElement, value: unknown) {
                if (type === "boolean") this.toggleAttribute(attr, Boolean(value) && value !== "false");
                else if (value === null || value === undefined || value === false) this.removeAttribute(attr);
                else this.setAttribute(attr, String(value));
            },
        });
    }
}
