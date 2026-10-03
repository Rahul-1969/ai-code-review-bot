export default function PatternCard({ pattern }) {
  const { pattern_type, pattern_name, score, confidence } = pattern;

  const pct = Math.round(confidence * 100);
  const barColor = pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="clay-card" style={{ padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#c0caf5", fontWeight: 600, fontSize: "0.88rem" }}>{pattern_name}</span>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>{pattern_type}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ flex: 1, background: "var(--surface-soft)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
          <div style={{ width: pct + "%", background: barColor, height: "100%", borderRadius: "4px", transition: "width 0.4s" }} />
        </div>
        <span style={{ color: barColor, fontSize: "0.78rem", fontWeight: 600, minWidth: "38px" }}>{pct}%</span>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>×{score}</span>
      </div>
    </div>
  );
}
