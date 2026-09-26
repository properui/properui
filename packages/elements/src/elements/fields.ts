import { PuiElement, type Rendered, cls, defineProps, h, nextId, place, readBool } from "../base";

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** `ElementInternals` when the browser can make a custom element a real form control. */
const internalsFor = (el: HTMLElement): ElementInternals | null => {
    if (typeof el.attachInternals !== "function") return null;
    try {
        const internals = el.attachInternals();
        return typeof internals.setFormValue === "function" ? internals : null;
    } catch {
        return null;
    }
};

/**
 * Shared behaviour of the form-control elements. Each one wraps a native control, and each is
 * form-associated through `ElementInternals` where the browser supports it: the host then submits
 * under its own `name`, validates, resets and follows `<fieldset disabled>`. Where it doesn't, the
 * inner native control carries the `name` and takes part in the form the ordinary way.
 *
 * `input` and `change` from the native control are re-dispatched from the host, so `event.target`
 * is the element and `event.target.value` (or `.checked`) is current, as with a native control.
 */
abstract class FormControlElement<C extends Control | HTMLInputElement> extends PuiElement {
    static formAssociated = true;

    protected readonly internals: ElementInternals | null = internalsFor(this);
    protected control: C | null = null;
    #fieldsetDisabled = false;

    /** Builds the native control once; `sync()` then keeps its attributes current. */
    protected abstract createControl(): C;

    /** The value submitted with the form, or `null` for none. */
    protected abstract formValue(): string | null;

    /** The form this element belongs to (form-associated browsers), or the inner control's form. */
    get form(): HTMLFormElement | null {
        return this.internals?.form ?? this.control?.form ?? null;
    }

    get validity(): ValidityState | undefined {
        return this.internals?.validity ?? this.control?.validity;
    }

    get validationMessage(): string {
        return this.internals?.validationMessage ?? this.control?.validationMessage ?? "";
    }

    checkValidity(): boolean {
        return this.internals?.checkValidity() ?? this.control?.checkValidity() ?? true;
    }

    reportValidity(): boolean {
        return this.internals?.reportValidity() ?? this.control?.reportValidity() ?? true;
    }

    override focus(options?: FocusOptions): void {
        if (this.control) this.control.focus(options);
        else super.focus(options);
    }

    /** Whether the control is disabled, by attribute or by a disabled ancestor `<fieldset>`. */
    protected get disabledState(): boolean {
        return readBool(this, "is-disabled") || readBool(this, "disabled") || this.#fieldsetDisabled;
    }

    protected get requiredState(): boolean {
        return readBool(this, "is-required") || readBool(this, "required");
    }

    /** With internals the host submits the value; without, the inner control needs the `name`. */
    protected syncName(control: Control): void {
        const name = this.getAttribute("name");
        if (this.internals || name === null) control.removeAttribute("name");
        else control.setAttribute("name", name);
    }

    /** Pushes the current value and validity to the form. */
    protected syncForm(): void {
        const internals = this.internals;
        const control = this.control;
        if (!internals || !control) return;
        internals.setFormValue(this.formValue());
        const error = this.getAttribute("error");
        if (error) internals.setValidity({ customError: true }, error, control);
        else if (!control.validity.valid) internals.setValidity(control.validity, control.validationMessage, control);
        else internals.setValidity({});
    }

    /** Wires the native control's events to the host. Call once, on the control from `createControl()`. */
    protected wire(control: C): void {
        for (const type of ["input", "change"] as const) {
            control.addEventListener(type, (event) => {
                event.stopPropagation();
                this.syncForm();
                this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
            });
        }
    }

    formDisabledCallback(disabled: boolean): void {
        this.#fieldsetDisabled = disabled;
        this.rerender();
    }

    formResetCallback(): void {
        this.reset();
        this.syncForm();
    }

    /** Restores the default value (the `value` / `checked` attribute). */
    protected abstract reset(): void;
}

const FIELD_PROPS = {
    label: "string",
    hint: "string",
    error: "string",
    size: "string",
    name: "string",
    value: "string",
    placeholder: "string",
    required: "boolean",
    isRequired: "boolean",
    isDisabled: "boolean",
    disabled: "boolean",
    isReadOnly: "boolean",
    autocomplete: "string",
} as const;

/** Label, hint and error around a text-like native control: the `.pui-field` layout. */
abstract class FieldElement<C extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> extends FormControlElement<C> {
    declare label: string | undefined;
    declare hint: string | undefined;
    declare error: string | undefined;
    declare size: string | undefined;
    declare name: string | undefined;
    declare placeholder: string | undefined;
    declare required: boolean;
    declare isRequired: boolean;
    declare isDisabled: boolean;
    declare disabled: boolean;
    declare isReadOnly: boolean;
    declare autocomplete: string | undefined;

    #field: HTMLDivElement | null = null;
    #label: HTMLLabelElement | null = null;
    #hint: HTMLParagraphElement | null = null;
    #value: string | null = null;
    #dirty = false;
    protected readonly baseId = nextId("field");

    /** The current value. Setting it does not change the `value` attribute, as with a native input. */
    get value(): string {
        return this.control ? this.control.value : (this.#value ?? this.getAttribute("value") ?? "");
    }

    set value(next: string) {
        const value = next === null || next === undefined ? "" : String(next);
        this.#value = value;
        this.#dirty = true;
        if (this.control) {
            this.control.value = value;
            this.syncForm();
        }
    }

    protected reset(): void {
        this.#dirty = false;
        this.#value = null;
        if (this.control) this.control.value = this.getAttribute("value") ?? "";
    }

    /** Sets control-specific attributes (type, rows) and the size classes. */
    protected abstract syncControl(control: C, size: string): void;

    /** Where the control sits inside the field; subclasses may wrap it. */
    protected controlSlot(control: C): Node {
        return control;
    }

    /** Subclasses decide what author content becomes (select: its options). */
    protected placeContent(_control: C, _content: Node[]): ParentNode | null {
        return null;
    }

    protected override changed(name: string): void {
        // A new `value` attribute is the new default; it only shows until the user has typed.
        if (name === "value" && this.#dirty) return;
        if (name === "value") this.#value = null;
        this.rerender();
    }

    protected render(content: Node[]): Rendered {
        const control = (this.control ??= this.createControl());
        const id = this.id ? `${this.id}-control` : `${this.baseId}-control`;
        const size = this.getAttribute("size") ?? "md";
        const label = this.getAttribute("label");
        const hint = this.getAttribute("hint");
        const error = this.getAttribute("error");
        const placeholder = this.getAttribute("placeholder");
        const required = this.requiredState;

        control.id = id;
        control.disabled = this.disabledState;
        control.required = required;
        if (!(control instanceof HTMLSelectElement)) control.readOnly = readBool(this, "is-read-only");
        this.syncName(control);
        const set = (name: string, value: string | null) => (value === null ? control.removeAttribute(name) : control.setAttribute(name, value));
        if (!(control instanceof HTMLSelectElement)) set("placeholder", placeholder);
        set("autocomplete", this.getAttribute("autocomplete"));
        set("aria-invalid", error ? "true" : null);
        set("aria-label", label ? null : placeholder);
        this.syncControl(control, ["sm", "md", "lg"].includes(size) ? size : "md");
        const target = this.placeContent(control, content);

        const labelEl = (this.#label ??= h("label", { class: "pui-label" }));
        labelEl.htmlFor = id;
        labelEl.replaceChildren(
            ...(label ? [label] : []),
            ...(label && required ? [h("span", { class: "pui-label__required", "aria-hidden": "true" }, ["*"])] : []),
        );
        labelEl.hidden = !label;

        const message = error || hint;
        const hintEl = (this.#hint ??= h("p", { id: `${id}-description` }));
        hintEl.className = error ? "pui-error" : "pui-hint";
        hintEl.textContent = message ?? "";
        hintEl.hidden = !message;
        set("aria-describedby", message ? hintEl.id : null);

        const field = (this.#field ??= h("div"));
        field.className = cls("pui-field", this.disabledState && "pui-field--disabled");
        place(field, [labelEl, this.controlSlot(control), hintEl]);

        if (!this.#dirty && this.#value === null && !(control instanceof HTMLSelectElement)) control.value = this.getAttribute("value") ?? "";
        else if (this.#value !== null) control.value = this.#value;
        this.syncForm();
        return { nodes: [field], target };
    }
}

/**
 * `<pui-input>`: a labelled text input. `label`, `hint`, `error` (sets `aria-invalid` and replaces
 * the hint), `size` (sm, md, lg), `type`, `name`, `value`, `placeholder`, `required`,
 * `is-disabled`, `is-read-only`. Emits `input` and `change`; `.value` reads and writes the value.
 */
export class PuiInput extends FieldElement<HTMLInputElement> {
    static props = {
        ...FIELD_PROPS,
        type: "string",
        min: "string",
        max: "string",
        step: "string",
        minlength: "string",
        maxlength: "string",
        pattern: "string",
        inputmode: "string",
    } as const;

    declare type: string | undefined;

    protected createControl(): HTMLInputElement {
        const input = h("input");
        this.wire(input);
        return input;
    }

    protected formValue(): string | null {
        return this.control?.value ?? null;
    }

    protected syncControl(input: HTMLInputElement, size: string): void {
        input.className = `pui-input pui-input--${size}`;
        input.type = this.getAttribute("type") ?? "text";
        for (const attr of ["min", "max", "step", "minlength", "maxlength", "pattern", "inputmode"]) {
            const value = this.getAttribute(attr);
            if (value === null) input.removeAttribute(attr);
            else input.setAttribute(attr, value);
        }
    }
}
defineProps(PuiInput);

/** `<pui-textarea>`: `<pui-input>`'s attributes and events, on a `<textarea>`, plus `rows`. */
export class PuiTextarea extends FieldElement<HTMLTextAreaElement> {
    static props = { ...FIELD_PROPS, rows: "number", maxlength: "string" } as const;

    declare rows: number | undefined;

    protected createControl(): HTMLTextAreaElement {
        const textarea = h("textarea");
        this.wire(textarea);
        return textarea;
    }

    protected formValue(): string | null {
        return this.control?.value ?? null;
    }

    protected syncControl(textarea: HTMLTextAreaElement, size: string): void {
        textarea.className = size === "sm" ? "pui-textarea pui-textarea--sm" : "pui-textarea";
        textarea.rows = Number(this.getAttribute("rows")) || 4;
        const max = this.getAttribute("maxlength");
        if (max === null) textarea.removeAttribute("maxlength");
        else textarea.setAttribute("maxlength", max);
    }
}
defineProps(PuiTextarea);

/**
 * `<pui-select>`: a labelled native `<select>`. Its `<option>` and `<optgroup>` children become the
 * select's options (moved, so a framework keeps rendering them). `value` selects one.
 */
export class PuiSelect extends FieldElement<HTMLSelectElement> {
    static props = { ...FIELD_PROPS } as const;

    #wrap: HTMLDivElement | null = null;

    protected createControl(): HTMLSelectElement {
        const select = h("select");
        this.wire(select);
        return select;
    }

    protected formValue(): string | null {
        return this.control?.value ?? null;
    }

    protected syncControl(select: HTMLSelectElement, size: string): void {
        // `.pui-select` goes on the wrapper, which draws the chevron.
        const wrap = (this.#wrap ??= h("div"));
        wrap.className = `pui-select pui-select--${size}`;
        select.removeAttribute("class");
    }

    protected override placeContent(select: HTMLSelectElement, content: Node[]): ParentNode {
        const current = select.value;
        place(select, content);
        const attr = this.getAttribute("value");
        if (current) select.value = current;
        else if (attr !== null) select.value = attr;
        return select;
    }

    protected override controlSlot(select: HTMLSelectElement): Node {
        // A wrapper for the chevron; the select itself stays the labelled, focusable control.
        const wrap = (this.#wrap ??= h("div", { class: "pui-select" }));
        if (select.parentNode !== wrap) wrap.append(select);
        return wrap;
    }

    protected override reset(): void {
        super.reset();
        const attr = this.getAttribute("value");
        if (this.control && attr !== null) this.control.value = attr;
    }
}
defineProps(PuiSelect);

const CHECK_PROPS = {
    label: "string",
    hint: "string",
    name: "string",
    value: "string",
    size: "string",
    checked: "boolean",
    isSelected: "boolean",
    isIndeterminate: "boolean",
    isDisabled: "boolean",
    disabled: "boolean",
    required: "boolean",
    isRequired: "boolean",
} as const;

/** A native checkbox inside a `<label>`: the `.pui-checkbox` / `.pui-toggle` layout. */
abstract class CheckElement extends FormControlElement<HTMLInputElement> {
    protected abstract readonly block: "pui-checkbox" | "pui-toggle";
    #text: HTMLSpanElement | null = null;
    #root: HTMLLabelElement | null = null;
    #decoration: Node | null = null;
    #textWrap: HTMLSpanElement | null = null;
    #checked: boolean | null = null;
    protected readonly baseId = nextId("check");

    declare label: string | undefined;
    declare hint: string | undefined;
    declare name: string | undefined;
    declare size: string | undefined;
    declare isSelected: boolean;
    declare isIndeterminate: boolean;
    declare isDisabled: boolean;
    declare disabled: boolean;
    declare required: boolean;
    declare isRequired: boolean;

    /** Whether the box is checked. Setting it does not change the `checked` attribute. */
    get checked(): boolean {
        return this.control ? this.control.checked : (this.#checked ?? this.#defaultChecked());
    }

    set checked(next: boolean) {
        this.#checked = Boolean(next);
        if (this.control) {
            this.control.checked = this.#checked;
            this.syncForm();
        }
    }

    /** The value submitted when checked (`"on"` by default, as with a native checkbox). */
    get value(): string {
        return this.getAttribute("value") ?? "on";
    }

    set value(next: string) {
        this.setAttribute("value", String(next));
    }

    #defaultChecked(): boolean {
        return readBool(this, "checked") || readBool(this, "is-selected");
    }

    protected createControl(): HTMLInputElement {
        const input = h("input", { type: "checkbox" });
        this.wire(input);
        input.addEventListener("change", () => {
            this.#checked = input.checked;
        });
        return input;
    }

    protected formValue(): string | null {
        return this.control?.checked ? this.value : null;
    }

    protected reset(): void {
        this.#checked = null;
        if (this.control) this.control.checked = this.#defaultChecked();
    }

    protected override changed(name: string): void {
        if (name === "checked" || name === "is-selected") this.#checked = null;
        this.rerender();
    }

    /** Extra markup after the input: the box or the track. */
    protected abstract decoration(): Node;

    protected render(content: Node[]): Rendered {
        const input = (this.control ??= this.createControl());
        const size = this.getAttribute("size") ?? "sm";
        const label = this.getAttribute("label");
        const hint = this.getAttribute("hint");
        input.id = this.id ? `${this.id}-control` : `${this.baseId}-control`;
        input.checked = this.#checked ?? this.#defaultChecked();
        input.indeterminate = readBool(this, "is-indeterminate");
        input.disabled = this.disabledState;
        input.required = this.requiredState;
        input.value = this.value;
        this.syncName(input);
        this.configure(input);

        const text = (this.#text ??= h("span", { class: `${this.block}__label` }));
        if (label !== null) text.replaceChildren(label);
        else place(text, content);
        const hintEl = hint ? h("span", { class: `${this.block}__hint`, id: `${input.id}-hint` }, [hint]) : null;
        if (hintEl) input.setAttribute("aria-describedby", hintEl.id);
        else input.removeAttribute("aria-describedby");

        const root = (this.#root ??= h("label"));
        root.className = cls(this.block, `${this.block}--${size === "md" ? "md" : "sm"}`);
        const decoration = (this.#decoration ??= this.decoration());
        const textWrap = (this.#textWrap ??= h("span", { class: `${this.block}__text` }));
        place(textWrap, hintEl ? [text, hintEl] : [text]);
        place(root, [input, decoration, textWrap]);
        this.syncForm();
        return { nodes: [root], target: label !== null ? null : text };
    }

    /** Subclass hook: `role="switch"` for the toggle. */
    protected configure(_input: HTMLInputElement): void {}
}

/**
 * `<pui-checkbox>`: a labelled checkbox. `label` (or the element's content), `hint`, `checked`
 * (`is-selected` also works), `is-indeterminate`, `name`, `value`, `size` (sm, md), `is-disabled`,
 * `required`. Emits `input` and `change`; `.checked` reads and writes the state.
 */
export class PuiCheckbox extends CheckElement {
    static props = CHECK_PROPS;
    protected readonly block = "pui-checkbox";

    protected decoration(): Node {
        return h("span", { class: "pui-checkbox__box", "aria-hidden": "true" });
    }
}
defineProps(PuiCheckbox);

/** `<pui-toggle>`: `<pui-checkbox>`'s attributes and events, drawn as a switch (`role="switch"`). */
export class PuiToggle extends CheckElement {
    static props = CHECK_PROPS;
    protected readonly block = "pui-toggle";

    protected decoration(): Node {
        return h("span", { class: "pui-toggle__track", "aria-hidden": "true" }, [h("span", { class: "pui-toggle__thumb" })]);
    }

    protected override configure(input: HTMLInputElement): void {
        input.setAttribute("role", "switch");
    }
}
defineProps(PuiToggle);
