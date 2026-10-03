const SEVERITY_COLOR = {
  error: "var(--danger)",
  warning: "var(--warning)",
  convention: "#89ddff",
  refactor: "var(--primary-dark)",
  LOW: "var(--success)",
  MEDIUM: "var(--warning)",
  HIGH: "var(--danger)",
  default: "var(--text-secondary)",
};

function IssueRow({ type, message, line }) {
  const color = SEVERITY_COLOR[type] || SEVERITY_COLOR.default;
  return (
    <div style={{
      display: "flex",
      gap: "0.75rem",
      alignItems: "flex-start",
      padding: "0.5rem 0",
      borderBottom: "1px solid var(--border-soft)",
    }}>
      <span style={{
        minWidth: "80px",
        fontSize: "0.72rem",
        fontWeight: 700,
        color,
        textTransform: "uppercase",
        paddingTop: "2px",
      }}>{type}</span>
      <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem", flex: 1 }}>{message}</span>
      <span style={{ color: "#555", fontSize: "0.75rem", whiteSpace: "nowrap" }}>L{line}</span>
    </div>
  );
}

export default function StaticAnalysisCard({ staticAnalysis }) {
  if (!staticAnalysis) return null;
  const { pylint = [], bandit = [] } = staticAnalysis;

  return (
    <div className="clay-card" style={{ padding: "1.25rem" }}>
      <h3 style={{ color: "var(--warning)", marginTop: 0 }}>Static Analysis</h3>
      <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Pylint ({pylint.length})</h4>
      {pylint.length ? pylint.map((i, idx) => <IssueRow key={idx} {...i} />) : <p style={{ color: "#555" }}>No issues.</p>}
      <h4 style={{ color: "var(--text-secondary)", marginTop: "1rem", marginBottom: "0.5rem" }}>Bandit ({bandit.length})</h4>
      {bandit.length ? bandit.map((i, idx) => <IssueRow key={idx} {...i} />) : <p style={{ color: "#555" }}>No issues.</p>}
    </div>
  );
}
