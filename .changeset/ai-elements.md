---
"@properui/ui": minor
---

Add the `ai-elements` group for AI chat interfaces: `AIConversation` (stick-to-bottom log with a scroll-to-latest button), `AIMessage` (user and assistant messages with avatar, timestamp, actions and a streaming shimmer and caret), `AIResponse` (a small built-in markdown renderer with highlighted code blocks), `AIReasoning`, `AIToolCall`, `AISources`, `AISuggestions`, `AIPromptInput` (auto-growing, Enter to send, attachments, model selector and counter slots, Stop while streaming), `AIModelSelector` and `AIBranch`. They take plain props and callbacks, so they work with any streaming source and need no AI SDK.
