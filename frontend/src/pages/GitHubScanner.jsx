import { useState, useEffect } from "react";
import { scanRepository, stopTask } from "../services/api";
import useTaskProgress from "../hooks/useTaskProgress";
import useTaskStatus from "../hooks/useTaskStatus";
import TaskStatusBadge from "../components/TaskStatusBadge";
import AnimatedCard from "../components/AnimatedCard";
import { toast } from "react-hot-toast";

export default function GitHubScanner() {
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem("activeRepoUrl") || "");
  const [taskId, setTaskId] = useState(() => localStorage.getItem("activeScannerTaskId") || null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem("activeScannerTaskId"));
  const [error, setError] = useState(null);
  const [scanResults, setScanResults] = useState(null);

  const { progress, status } = useTaskProgress(taskId);
  const { taskStatus, taskResult } = useTaskStatus(taskId);

  const [prevTaskStatus, setPrevTaskStatus] = useState("PENDING");
  const [prevTaskResult, setPrevTaskResult] = useState(null);

  if (taskStatus !== prevTaskStatus) {
    setPrevTaskStatus(taskStatus);
    if (taskStatus === "SUCCESS") {
      setLoading(false);
      localStorage.removeItem("activeScannerTaskId");
    } else if (taskStatus === "FAILURE" || taskStatus === "REVOKED") {
      setLoading(false);
      setTaskId(null);
      localStorage.removeItem("activeScannerTaskId");
    }
  }

  if (taskResult !== prevTaskResult) {
    setPrevTaskResult(taskResult);
    if (taskResult) {
      setScanResults(taskResult);
    }
  }

  useEffect(() => {
    if (!taskId) return;
    if (taskStatus === "SUCCESS") {
      toast.success("Repository scan completed", { id: `success-${taskId}` });
    } else if (taskStatus === "FAILURE") {
      toast.error("Repository scan failed", { id: `fail-${taskId}` });
    } else if (taskStatus === "REVOKED") {
      toast.error("Repository scan was stopped", { id: `revoked-${taskId}` });
    }
  }, [taskStatus, taskId]);

  const handleStopScan = async () => {
    if (!taskId) return;
    try {
      await stopTask(taskId);
      toast.success("Stop signal sent to scanner workers.");
      // The taskStatus hook will eventually catch the REVOKED status,
      // but we can proactively clear the UI right now.
      setLoading(false);
      setTaskId(null);
      localStorage.removeItem("activeScannerTaskId");
    } catch (err) {
      toast.error("Failed to stop scan: " + err.message);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);
    setScanResults(null);
    setTaskId(null);

    try {
      // Trigger the heavy lifting on the backend
      const data = await scanRepository(repoUrl.trim());
      if (data && data.task_id) {
        setTaskId(data.task_id);
        localStorage.setItem("activeScannerTaskId", data.task_id);
        localStorage.setItem("activeRepoUrl", repoUrl.trim());
        toast.success("Repository scan started", { id: `start-${data.task_id}` });
      } else if (data && !data.task_id) {
        // Fallback for synchronous results if they ever occur
        setScanResults(data);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Failed to scan repository. Please check the URL.");
      setLoading(false);
      localStorage.removeItem("activeScannerTaskId");
    }
  };

  // Helper logic to scrape specific metrics out of the deeply nested AI payload per file
  const getFileMetrics = (result) => {
    const issues = result?.ai_review?.issues || [];
    const bandit = result?.static_analysis?.bandit || [];

    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => String(i.severity).toLowerCase() === "critical").length;
    const securityIssues = bandit.length + issues.filter(i => String(i.category).toLowerCase() === "security").length;

    return { totalIssues, criticalIssues, securityIssues };
  };

  // ----- STYLES -----
  const pageStyle = { maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1rem" };

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 className="section-title" style={{ fontSize: "2.5rem" }}>GitHub Scanner</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Instantly clone and mass-analyze any public Git repository. Our AI pipeline detects structural flaws, security risks, and optimization opportunities.
        </p>
      </div>

      {/* Input Form Container */}
      <AnimatedCard className="clay-card" style={{ padding: "2rem", marginBottom: "3rem", maxWidth: "800px", margin: "0 auto 3rem auto" }}>
        <form onSubmit={handleScan} style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            type="url"
            placeholder="https://github.com/username/repo.git"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="clay-input"
            disabled={loading}
            required
          />
          <button type="submit" className="clay-btn clay-btn-primary" disabled={loading || !repoUrl.trim() || (taskId && progress < 100)}>
            {loading || (taskId && progress < 100) ? "Scanning..." : "Scan Repository"}
          </button>
        </form>
      </AnimatedCard>

      {/* Empty State / How it works */}
      {!loading && !scanResults && !taskId && !error && (
        <div className="responsive-grid-cards" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
            <h4 style={{ color: "var(--text)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>Lightning Fast</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Clones and scans repositories using background workers.</p>
          </div>
          <div className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
            <h4 style={{ color: "var(--text)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>Security First</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Identifies security vulnerabilities, hardcoded secrets, and unsafe dependencies.</p>
          </div>
          <div className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
            <h4 style={{ color: "var(--text)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>Actionable Insights</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Provides code recommendations and refactoring suggestions.</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      {taskId && (
        <AnimatedCard className="clay-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.95rem" }}>Current Task State</span>
            <TaskStatusBadge status={taskStatus} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.95rem" }}>{status}</span>
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "transparent", borderRadius: "4px", overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "var(--primary)", transition: "width 0.4s ease-out" }} />
          </div>

          {/* Stop Button */}
          {(taskStatus === "PENDING" || taskStatus === "STARTED" || taskStatus === "PROGRESS") && (
            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
              <button
                onClick={handleStopScan}
                style={{
                  background: "rgba(247, 118, 142, 0.1)",
                  color: "var(--danger)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.6rem 1.25rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(247, 118, 142, 0.2)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(247, 118, 142, 0.1)"}
              >
                ⏹ Stop Scan
              </button>
            </div>
          )}
        </AnimatedCard>
      )}

      {/* Loading Spinner State */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "4rem 0" }}>
          <div style={{
            width: "48px", height: "48px",
            border: "4px solid var(--border-soft)",
            borderTop: "4px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <p style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "1.05rem" }}>Cloning repository and executing AI pipelines. This may take a moment...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results State */}
      {scanResults && !loading && (
        <div>

          {/* Summary Dashboard Header */}
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
            <AnimatedCard className="clay-card" style={{ padding: "1.5rem" }}>
              <div style={{ color: "var(--primary-dark)", fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.25rem", wordBreak: "break-all" }}>
                {scanResults.repo_name}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Repository Target
              </div>
            </AnimatedCard>

            <AnimatedCard className="clay-card" style={{ padding: "1.5rem" }}>
              <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.25rem" }}>
                {scanResults.total_files}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Python Files Discovered
              </div>
            </AnimatedCard>
          </div>

          <h3 style={{ color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "1.25rem", fontSize: "0.85rem", letterSpacing: "0.07em" }}>
            Analyzed Files ({scanResults.analyzed_files.length})
          </h3>

          {/* List of successfully analyzed files */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {scanResults.analyzed_files.length === 0 ? (
              <p className="clay-card" style={{ padding: "1.5rem" }}>
                No valid Python files were successfully analyzed.
              </p>
            ) : (
              scanResults.analyzed_files.map((file, idx) => {
                const { totalIssues, criticalIssues, securityIssues } = getFileMetrics(file.result);

                return (
                  <AnimatedCard key={idx} className="clay-card" style={{ marginBottom: "1.5rem" }}>
                    {/* File Path Title */}
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", wordBreak: "break-all" }}>
                      {file.path}
                    </div>

                    {/* Badge Row */}
                    <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>

                      {/* Total Issues */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Total AI Issues:</span>
                        <span style={{ background: totalIssues > 0 ? "var(--warning)22" : "var(--success)22", color: totalIssues > 0 ? "var(--warning)" : "var(--success)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem" }}>
                          {totalIssues}
                        </span>
                      </div>

                      {/* Critical Issues */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Critical Issues:</span>
                        <span style={{ background: criticalIssues > 0 ? "var(--danger)22" : "transparent", color: criticalIssues > 0 ? "var(--danger)" : "var(--text-secondary)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem" }}>
                          {criticalIssues}
                        </span>
                      </div>

                      {/* Security Issues */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Security Issues:</span>
                        <span style={{ background: securityIssues > 0 ? "#ff9e6422" : "transparent", color: securityIssues > 0 ? "#ff9e64" : "var(--text-secondary)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem" }}>
                          {securityIssues}
                        </span>
                      </div>

                    </div>

                    {/* Detailed Issues List */}
                    {(totalIssues > 0 || securityIssues > 0) && (
                      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

                        {/* AI Issues */}
                        {file.result?.ai_review?.issues?.map((issue, iIdx) => (
                          <div key={iIdx} style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "6px", borderLeft: `4px solid ${issue.severity === 'critical' ? 'var(--danger)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--primary)'}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{issue.type || "Issue"}</strong>
                              <span style={{ textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "bold", color: issue.severity === 'critical' ? 'var(--danger)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--primary)' }}>{issue.severity}</span>
                            </div>
                            <p style={{ color: "var(--text-secondary)", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{issue.description}</p>
                            {issue.suggestion && (
                              <div style={{ marginTop: "0.5rem" }}>
                                <strong style={{ fontSize: "0.8rem", color: "var(--success)", display: "block", marginBottom: "0.25rem" }}>Suggestion:</strong>
                                <pre style={{ margin: 0, padding: "0.75rem", background: "#1e1e2e", borderRadius: "4px", fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{issue.suggestion}</pre>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Bandit Security Issues */}
                        {file.result?.static_analysis?.bandit?.map((sec, iIdx) => (
                          <div key={`sec-${iIdx}`} style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "6px", borderLeft: "4px solid #ff9e64" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>Security Scanner (Bandit)</strong>
                              <span style={{ textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "bold", color: "#ff9e64" }}>{sec.issue_severity || 'HIGH'}</span>
                            </div>
                            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>{sec.issue_text} <strong style={{color: "var(--text)"}}>(Line: {sec.line_number})</strong></p>
                          </div>
                        ))}

                      </div>
                    )}
                  </AnimatedCard>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
