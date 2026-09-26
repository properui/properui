import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { TagInput } from "./tag-input";
import * as Demos from "./tag-input.demo";

describe("TagInput", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    it("adds a tag on Enter and clears the input", () => {
        const onChange = vi.fn();
        render(<TagInput label="Tags" isRequired={false} onChange={onChange} />);

        const input = screen.getByRole("textbox", { name: "Tags" });
        fireEvent.change(input, { target: { value: "react" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onChange).toHaveBeenCalledWith(["react"]);
        expect(input).toHaveValue("");
        expect(screen.getByText("react")).toBeInTheDocument();
    });

    it("adds a tag on comma without inserting the comma itself", () => {
        const onChange = vi.fn();
        render(<TagInput label="Tags" isRequired={false} onChange={onChange} />);

        const input = screen.getByRole("textbox", { name: "Tags" });
        fireEvent.change(input, { target: { value: "typescript" } });
        fireEvent.keyDown(input, { key: "," });

        expect(onChange).toHaveBeenCalledWith(["typescript"]);
    });

    it("removes the last tag on Backspace when the input is empty", () => {
        const onChange = vi.fn();
        render(<TagInput label="Tags" isRequired={false} defaultValue={["a", "b"]} onChange={onChange} />);

        const input = screen.getByRole("textbox", { name: "Tags" });
        fireEvent.keyDown(input, { key: "Backspace" });

        expect(onChange).toHaveBeenCalledWith(["a"]);
        expect(screen.queryByText("b")).toBeNull();
    });

    it("splits a comma-separated paste into multiple tags, keeping the trailing piece in the input", () => {
        const onChange = vi.fn();
        render(<TagInput label="Tags" isRequired={false} onChange={onChange} />);

        const input = screen.getByRole("textbox", { name: "Tags" });
        fireEvent.paste(input, { clipboardData: { getData: () => "foo, bar, baz" } });

        expect(onChange).toHaveBeenLastCalledWith(["foo", "bar"]);
        expect(input).toHaveValue("baz");
    });

    it("rejects a tag over maxTags and reports the reason", () => {
        const onInvalidTag = vi.fn();
        render(<TagInput label="Tags" isRequired={false} maxTags={1} defaultValue={["a"]} onInvalidTag={onInvalidTag} />);

        const input = screen.getByRole("textbox", { name: "Tags" });
        fireEvent.change(input, { target: { value: "b" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onInvalidTag).toHaveBeenCalledWith("b", "max-tags");
        expect(screen.queryByText("b")).toBeNull();
    });

    it("rejects a tag that fails validate", () => {
        const onInvalidTag = vi.fn();
        render(<TagInput label="Tags" isRequired={false} validate={(value) => /^[a-z]+$/.test(value)} onInvalidTag={onInvalidTag} />);

        const input = screen.getByRole("textbox", { name: "Tags" });
        fireEvent.change(input, { target: { value: "Not Valid" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onInvalidTag).toHaveBeenCalledWith("Not Valid", "invalid");
        expect(screen.queryByText("Not Valid")).toBeNull();
    });

    it("hides the input and remove buttons when isReadOnly", () => {
        render(<TagInput label="Tags" isRequired={false} isReadOnly defaultValue={["a", "b"]} />);

        expect(screen.queryByRole("textbox", { name: "Tags" })).toBeNull();
        expect(screen.getByText("a")).toBeInTheDocument();
        expect(screen.queryByRole("button")).toBeNull();
    });
});
