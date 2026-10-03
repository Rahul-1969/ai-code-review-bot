export default function TaskStatusBadge({ status }) {
  const getStatusColor = (s) => {
    switch (s) {
      case "STARTED":
        return "var(--primary)";
      case "SUCCESS":
        return "var(--success)";
      case "FAILURE":
        return "var(--danger)";
      case "PENDING":
      default:
        return "var(--text-secondary)";
    }
  };

  const color = getStatusColor(status);

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.8rem",
    borderRadius: "999px",
    background: `${color}15`,
    color: color,
    border: `1px solid ${color}33`,
    boxShadow: `0 0 10px ${color}33`,
    fontWeight: 700,
    fontSize: "0.8rem",
    textTransform: "uppercase",
    lineHeight: 1,
  };

  return (
    <div style={badgeStyle}>
      <span>●</span>
      <span>{status || "UNKNOWN"}</span>
    </div>
  );
}
