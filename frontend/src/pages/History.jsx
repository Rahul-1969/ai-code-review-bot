import { useEffect, useState, useMemo } from "react";
import { getUserHistory, getHistoryDetail, deleteUserHistory } from "../services/api";
import AnimatedCard from "../components/AnimatedCard";
import ClayEmptyState from "../components/ClayEmptyState";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting state (default: newest first)
  const [sortField, setSortField] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  // Detail Modal state
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening the detail modal
    if (!window.confirm("Are you sure you want to delete this review history?")) return;
    try {
      await deleteUserHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete review: " + err.message);
    }
  };

  const handleRowClick = async (id, display_id) => {
    setDetailLoading(true);
    setSelectedReview({ id, display_id }); // Set id immediately to open modal in loading state
    try {
      const data = await getHistoryDetail(id);
      setSelectedReview(data);
    } catch (err) {
      alert("Failed to load review details: " + err.message);
      setSelectedReview(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getUserHistory();
        setHistory(data);
      } catch (err) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // Filter and sort the history dynamically
  const filteredAndSortedHistory = useMemo(() => {
    // Filter
    let result = history.filter((item) => {
      if (!searchTerm) return true;
      const lowerTerm = searchTerm.toLowerCase();
      return (
        String(item.display_id).toLowerCase().includes(lowerTerm) ||
        (item.code_preview && item.code_preview.toLowerCase().includes(lowerTerm)) ||
        (item.accepted_status === true && "accepted".includes(lowerTerm)) ||
        (item.accepted_status === false && "rejected".includes(lowerTerm)) ||
        (item.accepted_status === null && "pending".includes(lowerTerm))
      );
    });

    // Sort
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Standardize nulls for sorting
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [history, searchTerm, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc"); // Always default to desc when switching fields
    }
  };

  const pageStyle = { maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1rem" };


  const getSortIcon = (field) => {
    if (sortField !== field) return " ↕";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div style={pageStyle}>
      <h1 className="section-title">Review History</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem" }}>
        Browse your past code submissions and AI analysis results.
      </p>

      {error && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search by ID, code snippet, or status (accepted/rejected)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "0.85rem 1rem",
            background: "transparent",
            color: "var(--text)",
            borderRadius: "8px",
            outline: "none",
            fontSize: "0.95rem",
            transition: "border-color 0.2s",
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>Loading your review history...</p>
      ) : (
        <div style={{ padding: "1.5rem", overflowX: "auto" }}>
          <table className="clay-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("display_id")} style={{ cursor: "pointer" }}>ID{getSortIcon("display_id")}</th>
                <th onClick={() => handleSort("timestamp")} style={{ cursor: "pointer" }}>Timestamp{getSortIcon("timestamp")}</th>
                <th onClick={() => handleSort("total_ai_issues")} style={{ cursor: "pointer" }}>Total Issues{getSortIcon("total_ai_issues")}</th>
                <th onClick={() => handleSort("critical_issues")} style={{ cursor: "pointer" }}>Critical{getSortIcon("critical_issues")}</th>
                <th onClick={() => handleSort("accepted_status")} style={{ cursor: "pointer" }}>Status{getSortIcon("accepted_status")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "0" }}>
                    <div style={{ padding: "2rem" }}>
                      <ClayEmptyState
                        icon={null}
                        title="No Reviews Found"
                        description="No reviews found matching your search criteria."
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedHistory.map((item) => (
                  <tr
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(item.id, item.display_id)}
                  >
                    <td style={{ fontWeight: "800", color: "var(--primary)" }}>#{item.display_id}</td>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={item.total_ai_issues > 0 ? "badge badge-warning" : "badge badge-success"}>
                        {item.total_ai_issues}
                      </span>
                    </td>
                    <td>
                      {item.critical_issues > 0 ? (
                        <span className="badge badge-danger">
                          {item.critical_issues}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>0</span>
                      )}
                    </td>
                    <td>
                      {item.accepted_status === true && <span className="badge badge-success">Accepted</span>}
                      {item.accepted_status === false && <span className="badge badge-danger">Rejected</span>}
                      {item.accepted_status === null && <span className="badge badge-warning">Pending</span>}
                    </td>
                    <td>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="clay-btn clay-btn-danger"
                        style={{ padding: "0.4rem 0.6rem" }}
                        title="Delete Review"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReview && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 15, 25, 0.8)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "2rem", backdropFilter: "blur(4px)"
        }} onClick={() => setSelectedReview(null)}>
          <AnimatedCard
            className="clay-card"
            style={{ width: "100%", maxWidth: "900px", maxHeight: "85vh", overflowY: "auto", padding: "2.5rem", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedReview(null)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </button>

            <h2 style={{ color: "var(--primary-dark)", marginTop: 0, marginBottom: "1.5rem" }}>Review #{selectedReview.display_id} Details</h2>

            {detailLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 0" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-soft)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Loading review details...</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div>
                  <h3 style={{ color: "var(--text)", fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span></span> Submitted Code
                  </h3>
                  <pre style={{ background: "var(--surface-soft)", padding: "1.25rem", borderRadius: "8px", overflowX: "auto", fontSize: "0.9rem", color: "var(--text-secondary)", border: "1px solid var(--border-soft)", margin: 0 }}>
                    {selectedReview.code}
                  </pre>
                </div>

                <div>
                  <h3 style={{ color: "var(--text)", fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span></span> AI Analysis Result
                  </h3>
                  <div style={{ background: "var(--surface-soft)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                    {selectedReview.response ? (() => {
                      try {
                        const parsed = JSON.parse(selectedReview.response);
                        const aiReview = parsed.ai_review || {};
                        const staticAnalysis = parsed.static_analysis || {};
                        const issues = aiReview.issues || [];

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {issues.length > 0 ? issues.map((issue, idx) => (
                              <div key={idx} style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "6px", borderLeft: `4px solid ${issue.severity === 'critical' ? 'var(--danger)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--primary)'}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                  <strong style={{ color: "var(--text)", fontSize: "1rem" }}>{issue.type || "Issue"}</strong>
                                  <span style={{ textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "bold", color: issue.severity === 'critical' ? 'var(--danger)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--primary)' }}>{issue.severity}</span>
                                </div>
                                <p style={{ color: "var(--text-secondary)", margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>{issue.description}</p>
                                {issue.suggestion && (
                                  <div style={{ marginTop: "0.75rem" }}>
                                    <strong style={{ fontSize: "0.85rem", color: "var(--success)", display: "block", marginBottom: "0.25rem" }}>Suggestion:</strong>
                                    <pre style={{ margin: 0, padding: "0.75rem", background: "#1e1e2e", borderRadius: "4px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{issue.suggestion}</pre>
                                  </div>
                                )}
                              </div>
                            )) : <p style={{ color: "var(--success)", margin: 0 }}>No issues found! Great job.</p>}

                            {staticAnalysis.bandit && staticAnalysis.bandit.length > 0 && (
                              <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-soft)", paddingTop: "1rem" }}>
                                <h4 style={{ color: "var(--warning)", marginBottom: "1rem" }}>Security Scanner (Bandit)</h4>
                                {staticAnalysis.bandit.map((sec, i) => (
                                  <div key={i} style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    • {sec.issue_text} (Line: {sec.line_number})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      } catch {
                        return <pre style={{ margin: 0, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{selectedReview.response}</pre>;
                      }
                    })() : <p style={{ color: "var(--text-secondary)", margin: 0 }}>No result data available.</p>}
                  </div>
                </div>
              </div>
            )}
          </AnimatedCard>
        </div>
      )}
    </div>
  );
}
