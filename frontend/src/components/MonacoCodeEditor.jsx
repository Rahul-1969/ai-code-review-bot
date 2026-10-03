import { useState } from "react";
import Editor from "@monaco-editor/react";

export default function MonacoCodeEditor({ value, onChange }) {
  const [copied, setCopied] = useState(false);

  // Callback when code changes in the editor
  const handleEditorChange = (newValue) => {
    if (onChange) {
      // Passes the latest value up to the parent component
      onChange(newValue || "");
    }
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code to clipboard", err);
    }
  };

  return (
    <div className="editor-container" style={{ position: "relative" }}>
      <div className="monaco-wrapper">
        {/* Action Bar */}
        <div style={{
          background: "var(--surface)",
          padding: "0.5rem 1rem",
        display: "flex",
        justifyContent: "flex-end",
        borderBottom: "1px solid var(--border-soft)"
      }}>
        <button
          onClick={handleCopy}
          disabled={!value}
          className={copied ? "clay-btn clay-btn-success" : "clay-btn"}
          style={{
            padding: "0.35rem 0.8rem",
            fontSize: "0.8rem"
          }}
        >
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      <Editor
        height="400px"
          language="python"
          theme="vs"
          value={value}
          onChange={handleEditorChange}
          options={{
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
