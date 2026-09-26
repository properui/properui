"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy01, FileSearch02, Globe01, Lightbulb02, RefreshCcw01, Stars02, ThumbsDown, ThumbsUp, Zap } from "@properui/icons";
import { useClipboard } from "../../../hooks/use-clipboard";
import { IMAGES, avatar } from "../../../utils/demo-assets";
import { Avatar } from "../../base/avatar/avatar";
import { Button } from "../../base/buttons/button";
import { AIBranch } from "./ai-branch";
import { AIConversation } from "./ai-conversation";
import { AIMessage } from "./ai-message";
import type { AIModel } from "./ai-model-selector";
import { AIModelSelector } from "./ai-model-selector";
import type { AIAttachment, AIPromptInputStatus, AIPromptSubmission } from "./ai-prompt-input";
import { AIPromptInput } from "./ai-prompt-input";
import { AIReasoning } from "./ai-reasoning";
import { AIResponse } from "./ai-response";
import { AISources } from "./ai-sources";
import { AISuggestions } from "./ai-suggestions";
import { AIToolCall } from "./ai-tool-call";

const you = avatar(0);

const models: AIModel[] = [
    {
        id: "atlas-large",
        name: "Atlas Large",
        provider: "Proper Labs",
        description: "Most capable, for complex work.",
        icon: Stars02,
        badges: [{ label: "New", color: "brand" }],
    },
    {
        id: "atlas-mini",
        name: "Atlas Mini",
        provider: "Proper Labs",
        description: "Quick answers for everyday tasks.",
        icon: Zap,
        badges: [{ label: "Fast", color: "success" }],
    },
    {
        id: "atlas-reason",
        name: "Atlas Reason",
        provider: "Proper Labs",
        description: "Thinks step by step before answering.",
        icon: Lightbulb02,
        badges: ["Reasoning"],
    },
    { id: "atlas-legacy", name: "Atlas Legacy", provider: "Proper Labs", description: "Retired. Kept for older threads.", icon: Stars02, isDisabled: true },
];

const assistantAvatar = <Avatar size="sm" placeholderIcon={Stars02} />;
const userAvatar = <Avatar size="sm" src={you.src} alt="" />;

const REASONING = `The user wants to wire a streaming chat into a React app without a specific SDK. I should show the state they need (messages and status), a plain async loop that appends chunks, and point out where Stop fits in. A short code sample will be clearer than prose.`;

const ANSWER = `Here is the smallest setup that works with **any** streaming source:

1. Keep the conversation in state: a list of messages and a \`status\`.
2. Append each chunk to the last assistant message as it arrives.
3. Flip \`status\` back to \`ready\` when the stream ends.

\`\`\`tsx
for await (const chunk of stream) {
  setText((text) => text + chunk);
}
setStatus("ready");
\`\`\`

Pass \`status\` to the prompt input and it swaps *Send* for *Stop* on its own. See the [Proper UI docs](https://properui.dev) for more.`;

const FOLLOW_UP = `Good question. Stopping is just a matter of cancelling the stream you are reading:

- Create an \`AbortController\` per request.
- Pass its \`signal\` to \`fetch\`.
- Call \`abort()\` from the prompt input's \`onStop\`.

Whatever text already arrived stays in the message, so the reader keeps the partial answer.`;

/** Splits text into word-and-space tokens so the fake stream reveals it the way a model would. */
const tokenize = (text: string) => text.match(/\s+|[^\s]+/g) ?? [];

/**
 * A stand-in for a real model: reveals `text` a few tokens at a time with `setInterval`.
 * `start` returns nothing; the revealed text and streaming flag come back as state.
 */
const useFakeStream = (interval = 30) => {
    const [output, setOutput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    const stop = useCallback(() => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setIsStreaming(false);
    }, []);

    const start = useCallback(
        (text: string, onDone?: (text: string) => void) => {
            if (timer.current) clearInterval(timer.current);
            const tokens = tokenize(text);
            let index = 0;
            setOutput("");
            setIsStreaming(true);
            timer.current = setInterval(() => {
                index += 2;
                setOutput(tokens.slice(0, index).join(""));
                if (index >= tokens.length) {
                    if (timer.current) clearInterval(timer.current);
                    timer.current = null;
                    setIsStreaming(false);
                    onDone?.(text);
                }
            }, interval);
        },
        [interval],
    );

    useEffect(
        () => () => {
            if (timer.current) clearInterval(timer.current);
        },
        [],
    );

    return { output, isStreaming, start, stop };
};

const CopyAction = ({ text }: { text: string }) => {
    const { copied, copy } = useClipboard();
    return <AIMessage.Action label={copied ? "Copied" : "Copy"} icon={copied ? Check : Copy01} onPress={() => copy(text)} />;
};

const FeedbackActions = () => {
    const [vote, setVote] = useState<"up" | "down" | null>(null);
    return (
        <>
            <AIMessage.Action label="Good response" icon={ThumbsUp} isSelected={vote === "up"} onPress={() => setVote(vote === "up" ? null : "up")} />
            <AIMessage.Action label="Bad response" icon={ThumbsDown} isSelected={vote === "down"} onPress={() => setVote(vote === "down" ? null : "down")} />
        </>
    );
};

interface ChatTurn {
    id: string;
    role: "user" | "assistant";
    text: string;
    reasoning?: string;
    reasoningDuration?: number;
    withTool?: boolean;
    withSources?: boolean;
}

const initialTurns: ChatTurn[] = [
    { id: "u1", role: "user", text: "How do I stream a chat response into React without tying myself to one SDK?" },
    { id: "a1", role: "assistant", text: ANSWER, reasoning: REASONING, reasoningDuration: 4, withTool: true, withSources: true },
];

const sources = [
    { href: "https://properui.dev/docs/installation", title: "Installation" },
    { href: "https://developer.mozilla.org/docs/Web/API/Streams_API", title: "Streams API" },
    { href: "https://developer.mozilla.org/docs/Web/API/AbortController", title: "AbortController" },
];

/** A complete chat: conversation, reasoning, a tool call, sources, actions, suggestions and the prompt input. */
export const AIChatExample = () => {
    const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
    const [status, setStatus] = useState<AIPromptInputStatus>("ready");
    const [model, setModel] = useState("atlas-large");
    const stream = useFakeStream();
    const lastId = turns[turns.length - 1]?.id;

    /** Writes the streamed text into the last (assistant) turn, so it stays once streaming ends. */
    const commit = (text: string) => setTurns((current) => current.map((turn, index) => (index === current.length - 1 ? { ...turn, text } : turn)));

    const send = ({ text }: AIPromptSubmission) => {
        const id = `${Date.now()}`;
        setTurns((current) => [...current, { id: `u${id}`, role: "user", text }, { id: `a${id}`, role: "assistant", text: "" }]);
        setStatus("streaming");
        stream.start(FOLLOW_UP, (full) => {
            commit(full);
            setStatus("ready");
        });
    };

    const stop = () => {
        // Keep whatever already arrived, the way a real chat does when you press Stop.
        commit(stream.output);
        stream.stop();
        setStatus("ready");
    };

    const isStreaming = status === "streaming";

    return (
        <div className="bg-primary ring-secondary flex h-180 w-full max-w-3xl flex-col overflow-hidden rounded-2xl ring-1 ring-inset">
            <AIConversation aria-label="Chat with the assistant" isStreaming={isStreaming} className="flex-1">
                <AIConversation.Content className="px-4 py-6 md:px-6">
                    {turns.map((turn) => {
                        const isLive = turn.id === lastId && isStreaming;
                        const text = isLive ? stream.output : turn.text;

                        if (turn.role === "user") {
                            return (
                                <AIMessage key={turn.id} from="user" avatar={userAvatar}>
                                    {turn.text}
                                </AIMessage>
                            );
                        }

                        return (
                            <AIMessage
                                key={turn.id}
                                from="assistant"
                                avatar={assistantAvatar}
                                isStreaming={isLive}
                                actions={
                                    !isLive && (
                                        <AIMessage.Actions>
                                            <CopyAction text={text} />
                                            <AIMessage.Action label="Regenerate" icon={RefreshCcw01} />
                                            <FeedbackActions />
                                        </AIMessage.Actions>
                                    )
                                }
                            >
                                {(turn.reasoning || turn.withTool || text) && (
                                    <div className="flex flex-col gap-3">
                                        {turn.reasoning && <AIReasoning duration={turn.reasoningDuration}>{turn.reasoning}</AIReasoning>}
                                        {turn.withTool && (
                                            <AIToolCall
                                                name="search_docs"
                                                status="completed"
                                                input={{ query: "streaming chat react", limit: 3 }}
                                                output={{ results: sources.map((source) => source.title) }}
                                            />
                                        )}
                                        {text && <AIResponse>{text}</AIResponse>}
                                        {turn.withSources && (
                                            <AISources>
                                                <AISources.Trigger count={sources.length} />
                                                <AISources.Content>
                                                    {sources.map((source) => (
                                                        <AISources.Source key={source.href} {...source} />
                                                    ))}
                                                </AISources.Content>
                                            </AISources>
                                        )}
                                    </div>
                                )}
                            </AIMessage>
                        );
                    })}
                </AIConversation.Content>
                <AIConversation.ScrollButton />
            </AIConversation>

            <div className="flex flex-col gap-3 px-4 pt-2 pb-4 md:px-6">
                <AISuggestions onSelect={(suggestion) => send({ text: suggestion, attachments: [] })} isDisabled={status !== "ready"}>
                    <AISuggestions.Item suggestion="How do I stop a response?" />
                    <AISuggestions.Item suggestion="Show it with fetch" />
                    <AISuggestions.Item suggestion="Can I render markdown?" />
                    <AISuggestions.Item suggestion="What about tool calls?" />
                </AISuggestions>
                <AIPromptInput
                    status={status}
                    onSubmit={send}
                    onStop={stop}
                    modelSelector={<AIModelSelector models={models} value={model} onChange={setModel} />}
                />
            </div>
        </div>
    );
};

/** A response streamed in with `setInterval`: reasoning opens while it thinks, collapses when the answer starts. */
export const StreamingExample = () => {
    const { output: reasoning, isStreaming: isThinking, start: startReasoning } = useFakeStream(25);
    const { output: answer, isStreaming: isAnswering, start: startAnswer, stop: stopAnswer } = useFakeStream(30);
    const [duration, setDuration] = useState<number>();

    const run = useCallback(() => {
        const startedAt = Date.now();
        setDuration(undefined);
        stopAnswer();
        startReasoning(REASONING, () => {
            setDuration((Date.now() - startedAt) / 1000);
            startAnswer(ANSWER);
        });
    }, [startReasoning, startAnswer, stopAnswer]);

    // Start streaming as soon as the demo mounts, so the streaming state is what you see first.
    useEffect(() => {
        const id = setTimeout(run, 0);
        return () => clearTimeout(id);
    }, [run]);

    const isStreaming = isThinking || isAnswering;

    return (
        <div className="flex w-full max-w-2xl flex-col gap-4">
            <AIMessage from="assistant" avatar={assistantAvatar} isStreaming={isStreaming}>
                <div className="flex flex-col gap-3">
                    <AIReasoning isStreaming={isThinking} duration={duration}>
                        {reasoning}
                    </AIReasoning>
                    {!isThinking && <AIResponse>{answer}</AIResponse>}
                </div>
            </AIMessage>
            <div>
                <Button size="sm" color="secondary" iconLeading={RefreshCcw01} onPress={run} isDisabled={isStreaming}>
                    Replay
                </Button>
            </div>
        </div>
    );
};

const releaseThread: [string, string][] = [
    ["Summarise the release notes.", "Three changes: a new **date range picker**, RTL fixes across navigation, and semantic tokens for charts."],
    ["Which change affects theming?", "The chart tokens. Series colours now read from `--color-utility-*` so they follow `.dark-mode`."],
    ["Is that a breaking change?", "No. Old class names keep working; the tokens are additive."],
    ["Draft the changelog entry.", "**Added** semantic chart tokens so charts follow the active theme without extra props."],
];

/** A conversation that sticks to the bottom; scroll up and a button appears to jump back. */
export const ConversationExample = () => (
    <div className="bg-primary ring-secondary h-120 w-full max-w-2xl overflow-hidden rounded-2xl ring-1 ring-inset">
        <AIConversation aria-label="Conversation about release notes" className="h-full">
            <AIConversation.Content>
                {releaseThread.map(([question, answer], index) => (
                    <div key={question} className="flex flex-col gap-6">
                        <AIMessage from="user" avatar={userAvatar} time={`9:0${index * 2}am`}>
                            {question}
                        </AIMessage>
                        <AIMessage from="assistant" avatar={assistantAvatar} time={`9:0${index * 2 + 1}am`}>
                            <AIResponse>{answer}</AIResponse>
                        </AIMessage>
                    </div>
                ))}
            </AIConversation.Content>
            <AIConversation.ScrollButton />
        </AIConversation>
    </div>
);

/** User and assistant messages, with an avatar, timestamp, actions and a branch pager. */
export const MessageExample = () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
        <AIMessage from="user" name="Olivia Rhye" avatar={userAvatar} time="2:20pm" dateTime="2027-01-22T14:20">
            Can you rewrite this headline so it is shorter?
        </AIMessage>
        <AIMessage
            from="assistant"
            name="Assistant"
            avatar={assistantAvatar}
            time="2:20pm"
            dateTime="2027-01-22T14:20"
            actions={
                <AIMessage.Actions>
                    <AIBranch count={3} />
                    <CopyAction text="Ship faster with components you own." />
                    <AIMessage.Action label="Regenerate" icon={RefreshCcw01} />
                    <FeedbackActions />
                </AIMessage.Actions>
            }
        >
            <AIResponse>Ship faster with **components you own**.</AIResponse>
        </AIMessage>
        <AIMessage from="assistant" avatar={assistantAvatar} isStreaming />
    </div>
);

const MARKDOWN = `## Getting started

Install the entry, then import it from its **subpath** so bundlers keep only what you use. Inline \`code\`, *emphasis* and [links](https://properui.dev) all work.

### What you get

- Accessible primitives built on React Aria
- Semantic tokens that follow the active theme
- Logical properties, so \`dir="rtl"\` just works

1. Run the CLI
2. Import the component
3. Ship it

> Headings start at \`h3\` by default, so a response never outranks your page.

\`\`\`bash
npx @properui/cli@latest add ai-elements
\`\`\`

---

Tables, images and raw HTML are shown as plain text on purpose.`;

/** Every markdown construct `AIResponse` renders. */
export const ResponseExample = () => (
    <div className="w-full max-w-2xl">
        <AIResponse>{MARKDOWN}</AIResponse>
    </div>
);

/** A finished reasoning block, collapsed with its duration, and one still thinking. */
export const ReasoningExample = () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
        <AIReasoning duration={12}>{REASONING}</AIReasoning>
        <AIReasoning isStreaming>Comparing the three options against the constraints in the brief…</AIReasoning>
    </div>
);

/** A tool call in each of its four states. */
export const ToolCallExample = () => (
    <div className="flex w-full max-w-2xl flex-col gap-3">
        <AIToolCall name="get_weather" status="pending" input={{ city: "Lisbon" }} />
        <AIToolCall name="search_docs" status="running" input={{ query: "date picker", limit: 5 }} />
        <AIToolCall
            name="create_issue"
            status="completed"
            defaultExpanded
            input={{ title: "Tooltip clips in RTL", labels: ["bug", "rtl"] }}
            output={{ id: 482, url: "https://example.com/issues/482" }}
        />
        <AIToolCall name="send_email" status="error" input={{ to: "team@proper.example" }} errorText="The mail server refused the connection." />
    </div>
);

/** A collapsible list of citations. */
export const SourcesExample = () => (
    <div className="w-full max-w-2xl">
        <AISources defaultExpanded>
            <AISources.Trigger count={sources.length} />
            <AISources.Content>
                {sources.map((source) => (
                    <AISources.Source key={source.href} {...source} />
                ))}
            </AISources.Content>
        </AISources>
    </div>
);

/** Follow-up prompt chips that scroll sideways when they run out of room. */
export const SuggestionsExample = () => {
    const [picked, setPicked] = useState<string>();

    return (
        <div className="flex w-full max-w-2xl flex-col gap-3">
            <AISuggestions onSelect={setPicked}>
                <AISuggestions.Item suggestion="Summarise this thread" icon={Stars02} />
                <AISuggestions.Item suggestion="Find related docs" icon={FileSearch02} />
                <AISuggestions.Item suggestion="Search the web" icon={Globe01} />
                <AISuggestions.Item suggestion="Explain it like I'm new" />
                <AISuggestions.Item suggestion="Turn this into a checklist" />
            </AISuggestions>
            <p className="text-tertiary text-sm" aria-live="polite">
                {picked ? `Sent: ${picked}` : "Pick a suggestion."}
            </p>
        </div>
    );
};

const sampleAttachments: AIAttachment[] = [
    { id: "screenshot", name: "Dashboard screenshot.png", type: "image/png", url: IMAGES.square[0].src },
    { id: "brief", name: "Project brief.pdf", type: "application/pdf", size: 1_240_000 },
];

/** The prompt input with attachments, a model selector and a character counter. */
export const PromptInputExample = () => {
    const [model, setModel] = useState("atlas-mini");
    const [sent, setSent] = useState<string>();

    return (
        <div className="flex w-full max-w-2xl flex-col gap-3">
            <AIPromptInput
                defaultAttachments={sampleAttachments}
                acceptedFileTypes={["image/*", "application/pdf"]}
                modelSelector={<AIModelSelector models={models} value={model} onChange={setModel} />}
                counter={(text) => `${text.length} / 4,000`}
                onSubmit={({ text, attachments }) => setSent(`${text || "(no text)"} with ${attachments.length} attachment(s)`)}
            />
            <p className="text-tertiary text-sm" aria-live="polite">
                {sent ? `Sent: ${sent}` : "Enter sends, Shift+Enter adds a line."}
            </p>
        </div>
    );
};

/** While a response streams, Send becomes Stop. */
export const PromptInputStreamingExample = () => {
    const [status, setStatus] = useState<AIPromptInputStatus>("streaming");

    return (
        <div className="flex w-full max-w-2xl flex-col gap-3">
            <AIPromptInput status={status} onStop={() => setStatus("ready")} onSubmit={() => setStatus("streaming")} allowsAttachments={false} />
            <AIPromptInput isDisabled label="Message (disabled)" placeholder="Sign in to chat" />
        </div>
    );
};

/** A model picker with provider icons, descriptions and badges. */
export const ModelSelectorExample = () => {
    const [model, setModel] = useState("atlas-large");

    return (
        <div className="flex w-full max-w-md flex-col items-start gap-3">
            <AIModelSelector models={models} value={model} onChange={setModel} placement="bottom start" />
            <p className="text-tertiary text-sm">
                Selected: <span className="text-secondary font-medium">{models.find((item) => item.id === model)?.name}</span>
            </p>
        </div>
    );
};

/** A pager between regenerated alternatives. */
export const BranchExample = () => {
    const alternatives = ["Ship faster with components you own.", "Components you own. Shipped faster.", "Own your UI, and ship it sooner."];
    const [index, setIndex] = useState(alternatives.length - 1);

    return (
        <div className="w-full max-w-2xl">
            <AIMessage from="assistant" avatar={assistantAvatar} actions={<AIBranch count={alternatives.length} index={index} onIndexChange={setIndex} />}>
                {alternatives[index]}
            </AIMessage>
        </div>
    );
};
