export default function CodeEditor({ value, onChange, disabled }) {
  const wrapStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const labelStyle = {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const textareaStyle = {
    width: "100%",
    minHeight: "220px",
    padding: "1rem",
    background: "#1a1a2e",
    color: "#c0caf5",
    border: "1px solid var(--border-soft)",
    borderRadius: "8px",
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    fontSize: "0.88rem",
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <div style={wrapStyle}>
      <label style={labelStyle}>Python Code</label>
      <textarea
        id="code-editor"
        style={textareaStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# Paste your Python code here..."
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
}
