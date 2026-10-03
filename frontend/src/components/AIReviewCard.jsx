const SEVERITY_COLOR = {
  critical: "var(--danger)",
  high: "#ff9e64",
  medium: "var(--warning)",
  low: "var(--success)",
  info: "#89ddff",
};

const CATEGORY_ICON = {
  security: "",
  logic: "",
  architecture: "",
  performance: "",
  syntax: "",
};

export default function AIReviewCard({ aiReview }) {
  if (!aiReview) return null;
  const { issues = [] } = aiReview;

  const issueStyle = (severity) => ({
    background: "var(--surface)",
    border: `1px solid ${SEVERITY_COLOR[severity] || "var(--border-soft)"}44`,
    borderLeft: `4px solid ${SEVERITY_COLOR[severity] || "var(--text-secondary)"}`,
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "0.75rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  });

  return (
    <div className="clay-card" style={{ padding: "1.25rem" }}>
      <h3 style={{ color: "var(--primary-dark)", marginTop: 0 }}>AI Review ({issues.length} issues)</h3>
      {issues.length === 0 && <p style={{ color: "#555" }}>No issues found.</p>}
      {issues.map((issue, idx) => (
        <div key={idx} style={issueStyle(issue.severity)}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "1rem" }}>{CATEGORY_ICON[issue.category] || ""}</span>
            <span style={{ color: SEVERITY_COLOR[issue.severity] || "var(--text-secondary)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
              {issue.severity}
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>•</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{issue.category}</span>
            <span style={{ marginLeft: "auto", color: "var(--text-secondary)", fontSize: "0.72rem" }}>Line {issue.line_number}</span>
          </div>
          <p style={{ color: "#c0caf5", margin: "0 0 0.3rem", fontWeight: 600, fontSize: "0.88rem" }}>{issue.issue}</p>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 0.3rem", fontSize: "0.82rem" }}>{issue.explanation}</p>
          <p style={{ color: "var(--success)", margin: 0, fontSize: "0.8rem" }}>Suggestion: {issue.suggestion}</p>
        </div>
      ))}
    </div>
  );
}
