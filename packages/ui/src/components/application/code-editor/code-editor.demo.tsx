"use client";

import { useState } from "react";
import { CodeEditor } from "./code-editor";

const tsxSource = `import { Button } from "@properui/ui/components/base/buttons/button";

export function SaveBar({ onSave }: { onSave: () => void }) {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="flex justify-end gap-3">
      <Button color="secondary">Cancel</Button>
      <Button isLoading={isSaving} onPress={onSave}>
        Save changes
      </Button>
    </div>
  );
}
`;

const jsonSource = `{
  "$schema": "https://properui.dev/schema.json",
  "style": "default",
  "tsx": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/utils"
  }
}
`;

const configSource = `export default {
  entry: "src/index.ts",
  format: ["esm", "cjs"],
  dts: true,
  minify: flase,
  target: "es2019"
  sourcemap: true,
}
`;

const FileName = ({ children }: { children: string }) => <span className="text-secondary truncate font-mono text-xs font-medium">{children}</span>;

export const CodeEditorExample = () => {
    const [code, setCode] = useState(tsxSource);

    return (
        <CodeEditor
            label="Component source"
            language="tsx"
            value={code}
            onChange={setCode}
            toolbar={<FileName>save-bar.tsx</FileName>}
            maxHeight={360}
            hint="Tab indents. Press Escape, then Tab, to move focus out of the editor."
        />
    );
};

export const JsonEditor = () => {
    const [code, setCode] = useState(jsonSource);

    return (
        <CodeEditor aria-label="components.json" language="json" value={code} onChange={setCode} minRows={10} toolbar={<FileName>components.json</FileName>} />
    );
};

export const ReadOnlyWithDiagnostics = () => (
    <CodeEditor
        label="Build configuration"
        language="typescript"
        defaultValue={configSource}
        isReadOnly
        toolbar={<FileName>tsup.config.ts</FileName>}
        diagnostics={[
            { line: 5, column: 11, severity: "error", message: "Cannot find name 'flase'. Did you mean 'false'?" },
            { line: 6, column: 21, severity: "error", message: "',' expected." },
            { line: 7, column: 3, severity: "warning", message: "Source maps are published with the package." },
        ]}
    />
);

export const Minimal = () => (
    <CodeEditor
        aria-label="Shell script"
        language="bash"
        defaultValue={"pnpm install\npnpm build"}
        showLineNumbers={false}
        showCopyButton={false}
        autoCloseBrackets={false}
        minRows={2}
        placeholder="Type a command"
    />
);
