import { useState, useEffect, useMemo } from "react";
import { getRepositories, deleteRepository, getRepositoryDetail } from "../services/api";
import AnimatedCard from "../components/AnimatedCard";
import ClayEmptyState from "../components/ClayEmptyState";

export default function Repositories() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Modal State
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm("Are you sure you want to delete this repository scan?")) return;
    try {
      await deleteRepository(id);
      setRepositories(prev => prev.filter(repo => repo.id !== id));
      if (selectedRepo && selectedRepo.id === id) {
        setSelectedRepo(null);
      }
    } catch (err) {
      alert("Failed to delete repository scan: " + err.message);
    }
  };

  useEffect(() => {
    getRepositories()
      .then((data) => {
        setRepositories(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to load repositories.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredAndSortedRepos = useMemo(() => {
    let result = [...repositories];

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(repo =>
        repo.repo_name.toLowerCase().includes(lowerQuery)
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "most_issues":
          return b.total_issues - a.total_issues;
        case "most_critical":
          return b.critical_issues - a.critical_issues;
        default:
          return 0;
      }
    });

    return result;
  }, [repositories, searchQuery, sortOption]);

  const handleCardClick = async (id) => {
    setModalLoading(true);
    setModalError(null);
    setSelectedRepo({ id }); // Open modal in loading state

    try {
      const detail = await getRepositoryDetail(id);
      if (detail.summary) {
        detail.parsedSummary = JSON.parse(detail.summary);
      }
      setSelectedRepo(detail);
    } catch (err) {
      setModalError(err.message || "Failed to load repository details.");
    } finally {
      setModalLoading(false);
    }
  };

  const getFileMetrics = (result) => {
    const issues = result?.ai_review?.issues || [];
    const bandit = result?.static_analysis?.bandit || [];

    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => String(i.severity).toLowerCase() === "critical").length;
    const securityIssues = bandit.length + issues.filter(i => String(i.category).toLowerCase() === "security").length;

    return { totalIssues, criticalIssues, securityIssues };
  };

  const handleCopyIssues = () => {
    if (!selectedRepo?.parsedSummary?.analyzed_files) return;

    let copyText = `# Scan Results for ${selectedRepo.repo_name}\n\n`;
    let foundIssues = false;

    selectedRepo.parsedSummary.analyzed_files.forEach(file => {
      const { totalIssues, securityIssues } = getFileMetrics(file.result);
      if (totalIssues === 0 && securityIssues === 0) return;

      foundIssues = true;
      copyText += `## File: ${file.path}\n\n`;

      const aiIssues = file.result?.ai_review?.issues || [];
      if (aiIssues.length > 0) {
        copyText += `### AI Issues:\n`;
        aiIssues.forEach(i => {
          copyText += `- **[${i.severity.toUpperCase()}] ${i.type || 'Issue'}**: ${i.description}\n`;
          if (i.suggestion) {
            copyText += `  *Suggestion*: ${i.suggestion}\n`;
          }
        });
        copyText += `\n`;
      }

      const banditIssues = file.result?.static_analysis?.bandit || [];
      if (banditIssues.length > 0) {
        copyText += `### Security Scanner (Bandit):\n`;
        banditIssues.forEach(sec => {
          copyText += `- **[${sec.issue_severity || 'HIGH'}]**: ${sec.issue_text} (Line: ${sec.line_number})\n`;
        });
        copyText += `\n`;
      }
      copyText += `\n`;
    });

    if (!foundIssues) {
      copyText += `No issues found in this repository.`;
    }

    navigator.clipboard.writeText(copyText)
      .then(() => alert("Copied issues to clipboard!"))
      .catch((err) => alert("Failed to copy: " + err));
  };


  // Styles
  const pageStyle = { maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1rem" };
  const selectStyle = {
    flex: "0 1 auto",
    width: "auto"
  };
  const cardStyle = {
    borderRadius: "10px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s"
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 15, 30, 0.8)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "2rem",
  };

  const modalContentStyle = {
    background: "#1e1e2e",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "1000px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "2rem",
    boxShadow: "0 12px 30px rgba(53, 169, 232, 0.1)",
    border: "1px solid var(--border-soft)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  };

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 className="section-title" style={{ fontSize: "2.5rem" }}>Repository Scans</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Track and review the historical security posture and AI analysis results of all previously scanned codebases.
        </p>
      </div>

      {/* Controls */}
      <AnimatedCard className="clay-card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>

          <input
            type="text"
            placeholder="Search repositories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input" style={{paddingLeft: "2.5rem", width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="clay-input"
          style={selectStyle}
        >
          <option value="newest">Sort by: Newest First</option>
          <option value="oldest">Sort by: Oldest First</option>
          <option value="most_issues">Sort by: Most Issues</option>
          <option value="most_critical">Sort by: Most Critical</option>
        </select>
      </AnimatedCard>

      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 0" }}>
          <div style={{
            width: "40px", height: "40px",
            border: "3px solid var(--border-soft)",
            borderTop: "3px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Loading repositories...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && filteredAndSortedRepos.length === 0 && (
        <ClayEmptyState
          icon={null}
          title="No Repositories Found"
          description={searchQuery ? "We couldn't find any repositories matching your search criteria." : "You haven't scanned any repositories yet. Head over to the GitHub Scanner to run your first AI code review and track your results here!"}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {filteredAndSortedRepos.map((repo) => (
          <div
            key={repo.id}
            onClick={() => handleCardClick(repo.id)}
            style={{...cardStyle, background: "var(--surface)", border: "1px solid var(--border-soft)"}}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; e.currentTarget.style.borderColor = "var(--primary)" }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--border-soft)" }}
          >
            {/* Header Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.25rem", wordBreak: "break-all" }}>
                  {repo.repo_name}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Branch: <span style={{ color: "var(--primary)", fontWeight: 600 }}>{repo.branch}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    display: "inline-block",
                    padding: "0.3rem 0.8rem",
                    background: repo.status === "SUCCESS" ? "var(--success)22" : repo.status === "FAILURE" ? "var(--danger)22" : "var(--text-secondary)22",
                    color: repo.status === "SUCCESS" ? "var(--success)" : repo.status === "FAILURE" ? "var(--danger)" : "var(--text-secondary)",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textTransform: "uppercase"
                  }}>
                    {repo.status}
                  </div>
                  <button
                    onClick={(e) => handleDelete(repo.id, e)}
                    style={{
                      background: "rgba(247, 118, 142, 0.1)",
                      color: "var(--danger)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.3rem 0.5rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(247, 118, 142, 0.2)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(247, 118, 142, 0.1)"}
                    title="Delete Scan"
                  >
                    Delete
                  </button>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  {new Date(repo.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", paddingTop: "1rem", borderTop: "1px solid var(--border-soft)" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Files Analyzed</span>
                <span style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.1rem" }}>{repo.total_files}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Total Issues</span>
                <span style={{ color: repo.total_issues > 0 ? "var(--warning)" : "var(--success)", fontWeight: 700, fontSize: "1.1rem" }}>{repo.total_issues}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Critical Issues</span>
                <span style={{ color: repo.critical_issues > 0 ? "var(--danger)" : "var(--text-secondary)", fontWeight: 700, fontSize: "1.1rem" }}>{repo.critical_issues}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Security Issues</span>
                <span style={{ color: repo.security_issues > 0 ? "#ff9e64" : "var(--text-secondary)", fontWeight: 700, fontSize: "1.1rem" }}>{repo.security_issues}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedRepo && (
        <div style={modalOverlayStyle} onClick={() => setSelectedRepo(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-soft)", paddingBottom: "1rem" }}>
              <div>
                <h2 style={{ color: "var(--text)", margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>
                  {selectedRepo.repo_name || "Loading..."}
                </h2>
                {selectedRepo.created_at && (
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Scanned on {new Date(selectedRepo.created_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={handleCopyIssues}
                  disabled={modalLoading || modalError || !selectedRepo.parsedSummary}
                  style={{
                    background: "var(--primary)",
                    color: "#1a1a2e",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    cursor: (modalLoading || !selectedRepo.parsedSummary) ? "not-allowed" : "pointer",
                    opacity: (modalLoading || !selectedRepo.parsedSummary) ? 0.6 : 1,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  Copy Issues
                </button>
                <button
                  onClick={() => setSelectedRepo(null)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "var(--text)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Content */}
            {modalLoading ? (
               <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  <div style={{ width: "30px", height: "30px", border: "3px solid var(--border-soft)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }} />
                  Loading detailed analysis...
               </div>
            ) : modalError ? (
               <div className="badge badge-danger">{modalError}</div>
            ) : selectedRepo.parsedSummary ? (
               <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {(() => {
                    // Filter files to only show those with issues
                    const filesWithIssues = (selectedRepo.parsedSummary.analyzed_files || []).filter(file => {
                      const { totalIssues, securityIssues } = getFileMetrics(file.result);
                      return totalIssues > 0 || securityIssues > 0;
                    });

                    if (filesWithIssues.length === 0) {
                      return (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                          No issues found in any analyzed files!
                        </div>
                      );
                    }

                    return filesWithIssues.map((file, idx) => {
                      const { totalIssues, criticalIssues, securityIssues } = getFileMetrics(file.result);

                      return (
                        <div key={idx} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-soft)", borderRadius: "8px", padding: "1.5rem" }}>
                          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.75rem", wordBreak: "break-all" }}>
                            {file.path}
                          </div>

                          {/* Badge Row */}
                          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Total AI Issues:</span>
                              <span style={{ background: totalIssues > 0 ? "var(--warning)22" : "var(--success)22", color: totalIssues > 0 ? "var(--warning)" : "var(--success)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem" }}>
                                {totalIssues}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Critical Issues:</span>
                              <span style={{ background: criticalIssues > 0 ? "var(--danger)22" : "transparent", color: criticalIssues > 0 ? "var(--danger)" : "var(--text-secondary)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem" }}>
                                {criticalIssues}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Security Issues:</span>
                              <span style={{ background: securityIssues > 0 ? "#ff9e6422" : "transparent", color: securityIssues > 0 ? "#ff9e64" : "var(--text-secondary)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem" }}>
                                {securityIssues}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {file.result?.ai_review?.issues?.map((issue, iIdx) => (
                              <div key={iIdx} style={{ padding: "1rem", background: "rgba(30, 30, 46, 0.5)", borderRadius: "6px", borderLeft: `4px solid ${issue.severity === 'critical' ? 'var(--danger)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--primary)'}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                  <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{issue.type || "Issue"}</strong>
                                  <span style={{ textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "bold", color: issue.severity === 'critical' ? 'var(--danger)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--primary)' }}>{issue.severity}</span>
                                </div>
                                <p style={{ color: "var(--text-secondary)", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{issue.description}</p>
                                {issue.suggestion && (
                                  <div style={{ marginTop: "0.5rem" }}>
                                    <strong style={{ fontSize: "0.8rem", color: "var(--success)", display: "block", marginBottom: "0.25rem" }}>Suggestion:</strong>
                                    <pre style={{ margin: 0, padding: "0.75rem", background: "#16161e", borderRadius: "4px", fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{issue.suggestion}</pre>
                                  </div>
                                )}
                              </div>
                            ))}

                            {file.result?.static_analysis?.bandit?.map((sec, iIdx) => (
                              <div key={`sec-${iIdx}`} style={{ padding: "1rem", background: "rgba(30, 30, 46, 0.5)", borderRadius: "6px", borderLeft: "4px solid #ff9e64" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                  <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>Security Scanner (Bandit)</strong>
                                  <span style={{ textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "bold", color: "#ff9e64" }}>{sec.issue_severity || 'HIGH'}</span>
                                </div>
                                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>{sec.issue_text} <strong style={{color: "var(--text)"}}>(Line: {sec.line_number})</strong></p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
               </div>
            ) : (
               <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  No detailed summary available for this scan. Note: Scans performed prior to this feature update will not have detailed logs stored.
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
