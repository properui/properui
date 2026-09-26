import { act, fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";
import { AIBranch } from "./ai-branch";
import { AIConversation } from "./ai-conversation";
import * as Demos from "./ai-elements.demo";
import { AIMessage } from "./ai-message";
import { AIModelSelector } from "./ai-model-selector";
import { AIPromptInput } from "./ai-prompt-input";
import { AIReasoning } from "./ai-reasoning";
import { AIResponse, parseMarkdown } from "./ai-response";
import { AISources } from "./ai-sources";
import { AISuggestions } from "./ai-suggestions";
import { AIToolCall } from "./ai-tool-call";

describe("AI elements", () => {
    for (const [name, Demo] of Object.entries(Demos)) {
        it(`${name} has no a11y violations`, async () => {
            const { container } = render(<Demo />);
            expect(await axe(container)).toHaveNoViolations();
        });
    }

    describe("AIPromptInput", () => {
        const getField = (container: HTMLElement) => container.querySelector("textarea")!;

        it("submits on Enter and clears the field", () => {
            const onSubmit = vi.fn();
            const { container } = render(<AIPromptInput onSubmit={onSubmit} />);
            const field = getField(container);

            fireEvent.change(field, { target: { value: "Hello there" } });
            fireEvent.keyDown(field, { key: "Enter" });

            expect(onSubmit).toHaveBeenCalledWith({ text: "Hello there", attachments: [] });
            expect(field.value).toBe("");
        });

        it("does not submit on Shift+Enter", () => {
            const onSubmit = vi.fn();
            const { container } = render(<AIPromptInput onSubmit={onSubmit} />);
            const field = getField(container);

            fireEvent.change(field, { target: { value: "Line one" } });
            fireEvent.keyDown(field, { key: "Enter", shiftKey: true });

            expect(onSubmit).not.toHaveBeenCalled();
            expect(field.value).toBe("Line one");
        });

        it("never submits an empty prompt", () => {
            const onSubmit = vi.fn();
            const { container, getByRole } = render(<AIPromptInput onSubmit={onSubmit} />);

            fireEvent.change(getField(container), { target: { value: "   " } });
            fireEvent.keyDown(getField(container), { key: "Enter" });

            expect(onSubmit).not.toHaveBeenCalled();
            expect(getByRole("button", { name: "Send message" })).toBeDisabled();
        });

        it("submits from the send button", () => {
            const onSubmit = vi.fn();
            const { container, getByRole } = render(<AIPromptInput onSubmit={onSubmit} />);

            fireEvent.change(getField(container), { target: { value: "Via the button" } });
            fireEvent.click(getByRole("button", { name: "Send message" }));

            expect(onSubmit).toHaveBeenCalledWith({ text: "Via the button", attachments: [] });
        });

        it("shows Stop instead of Send while streaming, and does not submit", () => {
            const onStop = vi.fn();
            const onSubmit = vi.fn();
            const { container, getByRole, queryByRole } = render(
                <AIPromptInput status="streaming" onStop={onStop} onSubmit={onSubmit} defaultValue="Queued" />,
            );

            expect(queryByRole("button", { name: "Send message" })).toBeNull();
            fireEvent.click(getByRole("button", { name: "Stop generating" }));
            expect(onStop).toHaveBeenCalledTimes(1);

            fireEvent.keyDown(getField(container), { key: "Enter" });
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it("shows Send again once the stream is done", () => {
            const { rerender, getByRole, queryByRole } = render(<AIPromptInput status="streaming" />);
            expect(getByRole("button", { name: "Stop generating" })).toBeTruthy();

            rerender(<AIPromptInput status="ready" />);
            expect(queryByRole("button", { name: "Stop generating" })).toBeNull();
            expect(getByRole("button", { name: "Send message" })).toBeTruthy();
        });

        it("labels the field and removes attachments", () => {
            const onAttachmentsChange = vi.fn();
            const { getByRole, getAllByRole } = render(
                <AIPromptInput
                    label="Ask the assistant"
                    defaultAttachments={[
                        { id: "a", name: "notes.pdf", type: "application/pdf", size: 2048 },
                        { id: "b", name: "photo.png", type: "image/png", url: "/demo/square/square-01.svg" },
                    ]}
                    onAttachmentsChange={onAttachmentsChange}
                />,
            );

            expect(getByRole("textbox", { name: "Ask the assistant" })).toBeTruthy();
            expect(getByRole("img", { name: "photo.png" })).toBeTruthy();
            expect(within(getByRole("list", { name: "Attachments" })).getAllByRole("listitem")).toHaveLength(2);

            fireEvent.click(getByRole("button", { name: "Remove notes.pdf" }));

            expect(onAttachmentsChange).toHaveBeenCalledWith([expect.objectContaining({ id: "b" })]);
            expect(getAllByRole("listitem")).toHaveLength(1);
        });

        it("disables every control when isDisabled", () => {
            const { getByRole } = render(<AIPromptInput isDisabled defaultValue="Hi" />);

            expect(getByRole("textbox")).toBeDisabled();
            expect(getByRole("button", { name: "Send message" })).toBeDisabled();
            expect(getByRole("button", { name: "Add attachments" })).toBeDisabled();
        });

        it("opens the file picker from the attach button and previews what was picked", () => {
            const onAttachmentsChange = vi.fn();
            const { container, getByRole } = render(<AIPromptInput onAttachmentsChange={onAttachmentsChange} />);
            const input = container.querySelector<HTMLInputElement>("input[type=file]")!;
            const click = vi.spyOn(input, "click");

            fireEvent.click(getByRole("button", { name: "Add attachments" }));
            expect(click).toHaveBeenCalled();

            const file = new File(["hello"], "notes.txt", { type: "text/plain" });
            fireEvent.change(input, { target: { files: [file] } });

            expect(onAttachmentsChange).toHaveBeenCalledWith([expect.objectContaining({ name: "notes.txt", size: 5, file })]);
            expect(getByRole("button", { name: "Remove notes.txt" })).toBeTruthy();
        });

        it("renders a counter from the current text", () => {
            const { getByText } = render(<AIPromptInput defaultValue="abc" counter={(text) => `${text.length} / 100`} />);
            expect(getByText("3 / 100")).toBeTruthy();
        });
    });

    describe("AIReasoning", () => {
        it("opens while streaming and collapses when done", () => {
            const { getByRole, rerender } = render(<AIReasoning>Plan the answer.</AIReasoning>);
            const trigger = () => getByRole("button");

            expect(trigger()).toHaveAttribute("aria-expanded", "false");

            rerender(<AIReasoning isStreaming>Plan the answer.</AIReasoning>);
            expect(trigger()).toHaveAttribute("aria-expanded", "true");
            expect(trigger()).toHaveTextContent("Thinking…");

            rerender(<AIReasoning duration={3}>Plan the answer.</AIReasoning>);
            expect(trigger()).toHaveAttribute("aria-expanded", "false");
            expect(trigger()).toHaveTextContent("Thought for 3 seconds");
        });

        it("can still be toggled by the reader", () => {
            const { getByRole } = render(<AIReasoning duration={1}>Plan the answer.</AIReasoning>);

            fireEvent.click(getByRole("button"));
            expect(getByRole("button")).toHaveAttribute("aria-expanded", "true");
            expect(getByRole("button")).toHaveTextContent("Thought for 1 second");
        });
    });

    describe("AIResponse", () => {
        it("renders headings, lists, inline formatting and code blocks", () => {
            const { container, getByRole } = render(
                <AIResponse>{"# Title\n\nSome **bold**, *italic* and `code`.\n\n- one\n- two\n\n1. first\n\n```ts\nconst a = 1;\n```"}</AIResponse>,
            );

            expect(getByRole("heading", { level: 3, name: "Title" })).toBeTruthy();
            expect(container.querySelector("strong")).toHaveTextContent("bold");
            expect(container.querySelector("em")).toHaveTextContent("italic");
            expect(container.querySelector("p code")).toHaveTextContent("code");
            expect(container.querySelectorAll("ul li")).toHaveLength(2);
            expect(container.querySelectorAll("ol li")).toHaveLength(1);
            expect(getByRole("region", { name: "ts code block" })).toHaveTextContent("const a = 1;");
        });

        it("opens links in a new tab with rel=noopener and drops unsafe schemes", () => {
            const { getByRole, queryAllByRole } = render(<AIResponse>{"[Docs](https://properui.dev) and [bad](javascript:alert(1))"}</AIResponse>);

            const link = getByRole("link", { name: /Docs/ });
            expect(link).toHaveAttribute("href", "https://properui.dev");
            expect(link).toHaveAttribute("target", "_blank");
            expect(link.getAttribute("rel")).toContain("noopener");
            expect(queryAllByRole("link")).toHaveLength(1);
        });

        it("never interprets raw HTML", () => {
            const { container } = render(<AIResponse>{"<img src=x onerror=alert(1)> hi"}</AIResponse>);
            expect(container.querySelector("img")).toBeNull();
            expect(container.textContent).toContain("<img src=x onerror=alert(1)> hi");
        });

        it("shows a caret while the enclosing message streams", () => {
            const { container, rerender } = render(
                <AIMessage from="assistant" isStreaming>
                    <AIResponse>Partial answer</AIResponse>
                </AIMessage>,
            );
            expect(container.querySelector("[data-ai-caret]")).not.toBeNull();
            expect(container.querySelector("article")).toHaveAttribute("aria-busy", "true");

            rerender(
                <AIMessage from="assistant">
                    <AIResponse>Partial answer</AIResponse>
                </AIMessage>,
            );
            expect(container.querySelector("[data-ai-caret]")).toBeNull();
        });

        it("treats an unclosed fence as a code block that runs to the end", () => {
            const blocks = parseMarkdown("Intro\n\n```js\nconst x = 1;\nconst y");
            expect(blocks).toEqual([
                { type: "paragraph", children: [{ type: "text", value: "Intro" }] },
                { type: "code", language: "js", value: "const x = 1;\nconst y", isClosed: false },
            ]);
        });

        it("leaves snake_case and unclosed markers alone", () => {
            const [block] = parseMarkdown("use snake_case_names and **half");
            expect(block).toEqual({ type: "paragraph", children: [{ type: "text", value: "use snake_case_names and **half" }] });
        });
    });

    describe("AIMessage", () => {
        it("attributes every message and shows placeholder lines before the first token", () => {
            const { getByText, getByRole } = render(<AIMessage from="assistant" isStreaming />);

            expect(getByText("Assistant")).toBeTruthy();
            expect(getByRole("status")).toHaveTextContent("Generating response");
        });

        it("marks toggle actions as pressed", () => {
            const { getByRole } = render(
                <AIMessage from="assistant">
                    Hi
                    <AIMessage.Actions>
                        <AIMessage.Action label="Good response" icon={() => null} isSelected />
                    </AIMessage.Actions>
                </AIMessage>,
            );

            expect(getByRole("group", { name: "Message actions" })).toBeTruthy();
            expect(getByRole("button", { name: "Good response" })).toHaveAttribute("aria-pressed", "true");
        });
    });

    describe("AIToolCall", () => {
        it("shows the status and reveals input and output", () => {
            const { getByRole } = render(<AIToolCall name="search_docs" status="completed" input={{ q: "tabs" }} output={{ hits: 2 }} />);
            const trigger = getByRole("button", { name: /search_docs/ });

            expect(trigger).toHaveTextContent("Completed");
            fireEvent.click(trigger);
            expect(getByRole("region", { name: "Parameters of search_docs" })).toHaveTextContent('"q": "tabs"');
            expect(getByRole("region", { name: "Result of search_docs" })).toHaveTextContent('"hits": 2');
        });

        it("shows the error text instead of the output on error", () => {
            const { getByText, queryByRole } = render(<AIToolCall name="send_email" status="error" errorText="Refused" defaultExpanded />);
            expect(getByText("Refused")).toBeTruthy();
            expect(queryByRole("region", { name: /Result/ })).toBeNull();
        });
    });

    describe("AISources", () => {
        it("lists citations with their host names, opening in a new tab", () => {
            const { getByRole } = render(
                <AISources defaultExpanded>
                    <AISources.Trigger count={1} />
                    <AISources.Content>
                        <AISources.Source href="https://www.example.com/page" title="Example page" />
                    </AISources.Content>
                </AISources>,
            );

            expect(getByRole("button", { name: "Used 1 source" })).toHaveAttribute("aria-expanded", "true");
            const link = getByRole("link", { name: /Example page/ });
            expect(link).toHaveTextContent("example.com");
            expect(link).toHaveAttribute("rel", "noopener noreferrer");
        });
    });

    describe("AISuggestions", () => {
        it("passes the pressed suggestion to onSelect", () => {
            const onSelect = vi.fn();
            const { getByRole } = render(
                <AISuggestions onSelect={onSelect}>
                    <AISuggestions.Item suggestion="Tell me more" />
                </AISuggestions>,
            );

            fireEvent.click(getByRole("button", { name: "Tell me more" }));
            expect(onSelect).toHaveBeenCalledWith("Tell me more");
        });
    });

    describe("AIModelSelector", () => {
        it("shows the selected model and reports a new choice", () => {
            const onChange = vi.fn();
            const { getByRole, getAllByRole } = render(
                <AIModelSelector
                    models={[
                        { id: "a", name: "Model A", badges: ["Fast"] },
                        { id: "b", name: "Model B", description: "Slower, smarter" },
                    ]}
                    value="a"
                    onChange={onChange}
                />,
            );

            const trigger = getByRole("button");
            expect(trigger).toHaveTextContent("Model A");

            fireEvent.click(trigger);
            const options = getAllByRole("option");
            expect(options).toHaveLength(2);
            fireEvent.click(options[1]!);
            expect(onChange).toHaveBeenCalledWith("b");
        });
    });

    describe("AIBranch", () => {
        it("pages between alternatives", () => {
            const onIndexChange = vi.fn();
            const { getByRole, getByText } = render(<AIBranch count={3} defaultIndex={0} onIndexChange={onIndexChange} />);

            expect(getByRole("button", { name: "Previous response" })).toBeDisabled();
            fireEvent.click(getByRole("button", { name: "Next response" }));
            expect(onIndexChange).toHaveBeenCalledWith(1);
            expect(getByText(/2 \/ 3/)).toBeTruthy();
        });
    });

    describe("AIConversation", () => {
        it("is a labelled, focusable log that shows the scroll button only after scrolling up", () => {
            const { getByRole, queryByRole } = render(
                <AIConversation aria-label="Support chat" isStreaming>
                    <AIConversation.Content>
                        <AIMessage from="user">Hello</AIMessage>
                    </AIConversation.Content>
                    <AIConversation.ScrollButton />
                </AIConversation>,
            );

            const log = getByRole("log", { name: "Support chat" });
            expect(log).toHaveAttribute("tabindex", "0");
            expect(log).toHaveAttribute("aria-live", "polite");
            expect(log).toHaveAttribute("aria-busy", "true");
            expect(queryByRole("button", { name: "Scroll to latest message" })).toBeNull();

            Object.defineProperty(log, "scrollHeight", { configurable: true, value: 1000 });
            Object.defineProperty(log, "clientHeight", { configurable: true, value: 200 });

            act(() => {
                log.scrollTop = 800;
                fireEvent.scroll(log);
            });
            expect(queryByRole("button", { name: "Scroll to latest message" })).toBeNull();

            act(() => {
                log.scrollTop = 300;
                fireEvent.scroll(log);
            });
            const button = getByRole("button", { name: "Scroll to latest message" });

            fireEvent.click(button);
            expect(queryByRole("button", { name: "Scroll to latest message" })).toBeNull();
        });
    });
});
