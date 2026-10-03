function Tag({ label, color }) {
  return (
    <span style={{
      display: "inline-block",
      background: color + "22",
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "0.8rem",
      margin: "2px",
      fontFamily: "monospace",
    }}>{label}</span>
  );
}

export default function StructureCard({ structure }) {
  if (!structure) return null;
  const { functions = [], classes = [], imports = [] } = structure;

  const sectionTitleStyle = {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "0.4rem",
  };

  return (
    <div className="clay-card" style={{ padding: "1.25rem" }}>
      <h3 style={{ color: "var(--primary-dark)", marginTop: 0 }}>Code Structure</h3>
      <div style={{ marginBottom: "0.8rem" }}>
        <p style={sectionTitleStyle}>Functions ({functions.length})</p>
        {functions.length ? functions.map((f) => <Tag key={f} label={f} color="#89ddff" />) : <span style={{ color: "#555" }}>None</span>}
      </div>
      <div style={{ marginBottom: "0.8rem" }}>
        <p style={sectionTitleStyle}>Classes ({classes.length})</p>
        {classes.length ? classes.map((c) => <Tag key={c} label={c} color="var(--primary-dark)" />) : <span style={{ color: "#555" }}>None</span>}
      </div>
      <div>
        <p style={sectionTitleStyle}>Imports ({imports.length})</p>
        {imports.length ? imports.map((i) => <Tag key={i} label={i} color="var(--success)" />) : <span style={{ color: "#555" }}>None</span>}
      </div>
    </div>
  );
}
