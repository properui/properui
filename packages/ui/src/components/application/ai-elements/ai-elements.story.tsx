import type { FC } from "react";
import * as AIElements from "./ai-elements.demo";

export default {
    title: "Application components/AI elements",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-center justify-center p-8">
                <Story />
            </div>
        ),
    ],
};

export const AIChatExample = () => <AIElements.AIChatExample />;
AIChatExample.storyName = "AI chat example";

export const StreamingExample = () => <AIElements.StreamingExample />;
StreamingExample.storyName = "Streaming example";

export const ConversationExample = () => <AIElements.ConversationExample />;
ConversationExample.storyName = "Conversation example";

export const MessageExample = () => <AIElements.MessageExample />;
MessageExample.storyName = "Message example";

export const ResponseExample = () => <AIElements.ResponseExample />;
ResponseExample.storyName = "Response example";

export const ReasoningExample = () => <AIElements.ReasoningExample />;
ReasoningExample.storyName = "Reasoning example";

export const ToolCallExample = () => <AIElements.ToolCallExample />;
ToolCallExample.storyName = "Tool call example";

export const SourcesExample = () => <AIElements.SourcesExample />;
SourcesExample.storyName = "Sources example";

export const SuggestionsExample = () => <AIElements.SuggestionsExample />;
SuggestionsExample.storyName = "Suggestions example";

export const PromptInputExample = () => <AIElements.PromptInputExample />;
PromptInputExample.storyName = "Prompt input example";

export const PromptInputStreamingExample = () => <AIElements.PromptInputStreamingExample />;
PromptInputStreamingExample.storyName = "Prompt input streaming example";

export const ModelSelectorExample = () => <AIElements.ModelSelectorExample />;
ModelSelectorExample.storyName = "Model selector example";

export const BranchExample = () => <AIElements.BranchExample />;
BranchExample.storyName = "Branch example";
