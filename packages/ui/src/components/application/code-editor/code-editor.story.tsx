import type { FC } from "react";
import * as Demos from "./code-editor.demo";

export default {
    title: "Application components/Code editor",
    decorators: [
        (Story: FC) => (
            <div className="bg-primary flex min-h-screen w-full items-start justify-center p-8">
                <div className="w-full max-w-3xl">
                    <Story />
                </div>
            </div>
        ),
    ],
};

export const CodeEditorExample = () => <Demos.CodeEditorExample />;
CodeEditorExample.storyName = "Code editor example";

export const JsonEditor = () => <Demos.JsonEditor />;
JsonEditor.storyName = "JSON editor";

export const ReadOnlyWithDiagnostics = () => <Demos.ReadOnlyWithDiagnostics />;
ReadOnlyWithDiagnostics.storyName = "Read-only with diagnostics";

export const Minimal = () => <Demos.Minimal />;
Minimal.storyName = "Minimal";
