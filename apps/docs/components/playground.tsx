"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "~/lib/cx";
import { type PlaygroundKey, playgroundRegistry } from "~/lib/playground-registry";
import { Check, Copy01, Moon01, Sun } from "@properui/icons";
import { useClipboard } from "@properui/ui/hooks/use-clipboard";
import { utilityButtonClasses } from "./primitives";

/**
 * `<Playground component="buttons:Button" props={{ size: ["sm","md","lg","xl"], isDisabled: "boolean", children: "text" }} />`
 *
 * A live prop editor for one component from `~/lib/playground-registry.ts`: a select control
 * per enum prop (an array of option strings), a switch per boolean prop, a text input per
 * string prop, a themeable preview pane, and a generated, copyable JSX snippet reflecting the
 * current control values. `component` is `"<registry slug>:<ExportName>"`; a key with no
 * registry entry renders a placeholder instead of throwing, the same convention `<Preview>`
 * uses for an unresolved `demo`.
 */

export type PlaygroundControl = readonly string[] | "boolean" | "text";
export type PlaygroundProps = Record<string, PlaygroundControl>;

const isEnumControl = (control: PlaygroundControl): control is readonly string[] => Array.isArray(control);

/** Reasonable starting text for the common prop names a playground is likely to expose. */
const TEXT_DEFAULTS: Record<string, string> = {
    children: "Click me",
    label: "Label",
    placeholder: "Placeholder text",
    hint: "A supporting hint",
    title: "Tooltip title",
    description: "Supporting description",
    alt: "User avatar",
    initials: "AS",
};

const defaultControlValue = (key: string, control: PlaygroundControl): unknown => {
    if (control === "boolean") return false;
    if (control === "text") return TEXT_DEFAULTS[key] ?? "Text value";
    return control[0];
};

const initialValues = (props: PlaygroundProps): Record<string, unknown> =>
    Object.fromEntries(Object.entries(props).map(([key, control]) => [key, defaultControlValue(key, control)]));

/** A JSX attribute literal for the generated snippet: `size="md"`, `isDisabled`, no attribute at all for `isDisabled={false}`. */
const attrsFor = (values: Record<string, unknown>, props: PlaygroundProps): string =>
    Object.entries(values)
        .filter(([key]) => key !== "children")
        .map(([key, value]) => {
            if (props[key] === "boolean") return value ? ` ${key}` : "";
            return ` ${key}=${JSON.stringify(String(value))}`;
        })
        .join("");

const buildSnippet = (entry: { importPath: string; exportName: string }, values: Record<string, unknown>, props: PlaygroundProps): string => {
    const attrs = attrsFor(values, props);
    const children = typeof values.children === "string" ? values.children : undefined;
    const tag = children ? `<${entry.exportName}${attrs}>${children}</${entry.exportName}>` : `<${entry.exportName}${attrs} />`;

    return `import { ${entry.exportName} } from "${entry.importPath}";\n\n${tag}`;
};

const controlClasses =
    "bg-primary text-primary ring-primary w-full rounded-lg px-2.5 py-1.5 text-sm shadow-xs ring-1 outline-focus-ring ring-inset focus-visible:outline-2 focus-visible:outline-offset-2";

export const Playground = ({ component, props }: { component: PlaygroundKey; props: PlaygroundProps }) => {
    const entry = playgroundRegistry[component];
    const [mod, setMod] = useState<Record<string, unknown> | null>(null);
    const [isDark, setIsDark] = useState(false);
    const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(props));
    const { copied, copy } = useClipboard();

    useEffect(() => {
        let cancelled = false;
        if (entry) {
            void entry.load().then((loaded) => {
                if (!cancelled) setMod(loaded);
            });
        }
        return () => {
            cancelled = true;
        };
    }, [entry]);

    const snippet = useMemo(() => (entry ? buildSnippet(entry, values, props) : ""), [entry, values, props]);

    if (!entry) {
        return (
            <p className="border-secondary text-tertiary my-6 rounded-xl border border-dashed px-6 py-8 text-center text-sm">
                Unknown playground component: <code className="text-tertiary font-mono">{component}</code>
            </p>
        );
    }

    return (
        <div className="not-typography flex w-full flex-col gap-3 in-data-docs:my-8">
            <div className="ring-secondary flex flex-col rounded-[20px] ring-1 ring-inset md:flex-row">
                <div
                    className={cx(
                        "bg-primary relative flex min-h-60 flex-1 items-center justify-center rounded-t-[20px] p-8 md:rounded-tr-none md:rounded-bl-[20px]",
                        isDark && "dark-mode",
                    )}
                >
                    {mod ? entry.render(mod, values) : <span className="text-tertiary text-sm">Loading…</span>}
                </div>

                <div className="bg-secondary_alt flex w-full flex-col gap-4 rounded-b-[20px] p-4 md:w-72 md:rounded-tr-[20px] md:rounded-bl-none">
                    <div className="flex items-center justify-between">
                        <h4 className="text-secondary text-sm font-semibold">Props</h4>
                        <button
                            type="button"
                            aria-label="Toggle dark preview"
                            aria-pressed={isDark}
                            onClick={() => setIsDark((current) => !current)}
                            className={utilityButtonClasses("outline")}
                        >
                            {isDark ? <Sun className="size-4" data-icon="true" /> : <Moon01 className="size-4" data-icon="true" />}
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {Object.entries(props).map(([key, control]) => {
                            const inputId = `playground-${component}-${key}`;

                            return (
                                <label key={key} htmlFor={inputId} className="flex flex-col gap-1 text-sm">
                                    <span className="text-tertiary font-medium">{key}</span>

                                    {isEnumControl(control) && (
                                        <select
                                            id={inputId}
                                            value={String(values[key])}
                                            onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                                            className={controlClasses}
                                        >
                                            {control.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {control === "boolean" && (
                                        <span className="flex items-center pt-1">
                                            <input
                                                id={inputId}
                                                type="checkbox"
                                                role="switch"
                                                checked={Boolean(values[key])}
                                                onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.checked }))}
                                                className="accent-brand-solid size-4 cursor-pointer"
                                            />
                                        </span>
                                    )}

                                    {control === "text" && (
                                        <input
                                            id={inputId}
                                            type="text"
                                            value={String(values[key] ?? "")}
                                            onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                                            className={controlClasses}
                                        />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            <section className="group/pre bg-secondary_alt ring-secondary relative w-full rounded-[20px] p-2 ring-1 ring-inset">
                <pre className="docs-code bg-primary ring-secondary_alt text-tertiary relative w-full overflow-auto rounded-xl p-4 font-mono text-sm leading-6 shadow-lg ring-1">
                    <code>{snippet}</code>
                </pre>
                <button
                    type="button"
                    aria-label={copied ? "Copied" : "Copy"}
                    onClick={() => void copy(snippet)}
                    className={cx(utilityButtonClasses(), "absolute top-4 right-4 z-10 opacity-0 group-hover/pre:opacity-100 focus:opacity-100")}
                >
                    {copied ? <Check className="size-4" data-icon="true" /> : <Copy01 className="size-4" data-icon="true" />}
                </button>
            </section>
        </div>
    );
};
