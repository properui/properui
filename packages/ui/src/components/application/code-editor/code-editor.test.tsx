import { useState } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import type { CodeEditorProps } from "./code-editor";
import { CodeEditor } from "./code-editor";
import * as Demos from "./code-editor.demo";

const Controlled = (props: Partial<CodeEditorProps> & { initial: string }) => {
    const [value, setValue] = useState(props.initial);
    return <CodeEditor aria-label="Editor" {...props} value={value} onChange={setValue} />;
};

/** Renders an editor, focuses it and puts the caret at `caret` (default: the end). */
const setup = (initial: string, props: Partial<CodeEditorProps> = {}, caret = initial.length, caretEnd = caret) => {
    const utils = render(
        <>
            <Controlled initial={initial} {...props} />
            <button type="button">After</button>
        </>,
    );
    const textarea = utils.getByRole("textbox", { name: "Editor" }) as HTMLTextAreaElement;

    act(() => {
        textarea.focus();
        textarea.setSelectionRange(caret, caretEnd);
    });

    return { ...utils, textarea };
};

describe("CodeEditor", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("is labelled by its visible label", () => {
        const { getByRole } = render(<CodeEditor label="Source" defaultValue="const a = 1" />);
        expect(getByRole("textbox", { name: "Source" })).toBeInTheDocument();
    });

    it("inserts indentation on Tab instead of moving focus", () => {
        const { textarea } = setup("a");

        const notPrevented = fireEvent.keyDown(textarea, { key: "Tab" });

        expect(notPrevented).toBe(false);
        expect(textarea.value).toBe("a  ");
        expect(textarea.selectionStart).toBe(3);
        expect(document.activeElement).toBe(textarea);
    });

    it("indents and outdents every selected line", () => {
        const { textarea } = setup("one\ntwo", {}, 0, 7);

        fireEvent.keyDown(textarea, { key: "Tab" });
        expect(textarea.value).toBe("  one\n  two");

        fireEvent.keyDown(textarea, { key: "Tab", shiftKey: true });
        expect(textarea.value).toBe("one\ntwo");
    });

    it("lets Tab move focus out after Escape", () => {
        const { textarea } = setup("a");

        fireEvent.keyDown(textarea, { key: "Escape" });
        const notPrevented = fireEvent.keyDown(textarea, { key: "Tab" });

        // The browser's default Tab action (moving focus) is left untouched.
        expect(notPrevented).toBe(true);
        expect(textarea.value).toBe("a");

        // The hatch closes again: the next Tab indents.
        expect(fireEvent.keyDown(textarea, { key: "Tab" })).toBe(false);
    });

    it("keeps the indentation on Enter and opens a block between braces", () => {
        const { textarea } = setup("  if (a) {}", {}, 10);

        fireEvent.keyDown(textarea, { key: "Enter" });

        expect(textarea.value).toBe("  if (a) {\n    \n  }");
        expect(textarea.selectionStart).toBe("  if (a) {\n    ".length);
    });

    it("auto-closes brackets and steps over the closer", () => {
        const { textarea } = setup("call");

        fireEvent.keyDown(textarea, { key: "(" });
        expect(textarea.value).toBe("call()");
        expect(textarea.selectionStart).toBe(5);

        fireEvent.keyDown(textarea, { key: ")" });
        expect(textarea.value).toBe("call()");
        expect(textarea.selectionStart).toBe(6);
    });

    it("does not auto-close when autoCloseBrackets is false", () => {
        const { textarea } = setup("call", { autoCloseBrackets: false });

        expect(fireEvent.keyDown(textarea, { key: "(" })).toBe(true);
        expect(textarea.value).toBe("call");
    });

    it("never captures Tab when read-only", () => {
        const onChange = vi.fn();
        const { getByRole } = render(<CodeEditor aria-label="Editor" defaultValue="a" isReadOnly onChange={onChange} />);
        const textarea = getByRole("textbox", { name: "Editor" }) as HTMLTextAreaElement;

        expect(textarea.readOnly).toBe(true);
        expect(fireEvent.keyDown(textarea, { key: "Tab" })).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("lists diagnostics, links them to the textarea and marks errors invalid", () => {
        const { getByRole } = render(
            <CodeEditor
                aria-label="Editor"
                defaultValue={"a\nb"}
                diagnostics={[
                    { line: 2, message: "Unexpected b" },
                    { line: 1, severity: "warning", message: "Unused a" },
                ]}
            />,
        );
        const textarea = getByRole("textbox", { name: "Editor" });
        const problems = getByRole("list", { name: "Problems" });

        expect(textarea).toHaveAttribute("aria-invalid", "true");
        expect(textarea.getAttribute("aria-describedby")).toContain(problems.id);
        expect(problems.textContent).toMatch(/Warning, Line 1.*Unused a.*Error, Line 2.*Unexpected b/);
    });

    it("renders one gutter number per line, including a trailing empty line", () => {
        const { container } = render(<CodeEditor aria-label="Editor" defaultValue={"a\nb\n"} minRows={1} />);
        const gutter = container.querySelector("[data-gutter]");

        expect(gutter?.textContent).toBe("123");
    });
});
