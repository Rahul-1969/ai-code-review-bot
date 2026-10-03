import { useState, useEffect } from "react";
import { reviewPullRequest } from "../services/api";
import AnimatedCard from "../components/AnimatedCard";

export default function PRReview() {
  const [repoName, setRepoName] = useState(() => sessionStorage.getItem("code_review_bot_pr_repo_name") || "");
  const [prNumber, setPrNumber] = useState(() => sessionStorage.getItem("code_review_bot_pr_number") || "");

  useEffect(() => {
    sessionStorage.setItem("code_review_bot_pr_repo_name", repoName);
  }, [repoName]);

  useEffect(() => {
    sessionStorage.setItem("code_review_bot_pr_number", prNumber);
  }, [prNumber]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewResults, setReviewResults] = useState(null);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!repoName.trim() || !prNumber) return;

    setLoading(true);
    setError(null);
    setReviewResults(null);

    try {
      const parsedPrNumber = parseInt(prNumber, 10);
      if (isNaN(parsedPrNumber) || parsedPrNumber <= 0) {
        throw new Error("PR Number must be a valid positive integer.");
      }

      const data = await reviewPullRequest(repoName.trim(), parsedPrNumber);
      setReviewResults(data);
    } catch (err) {
      setError(err.message || "Failed to analyze Pull Request. Please verify the repository and PR number.");
    } finally {
      setLoading(false);
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
  const cardStyle = {
    borderRadius: "10px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  };

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 className="section-title" style={{ fontSize: "2.5rem" }}>Pull Request Review</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Automate your code review process. Enter any public repository and PR number to instantly analyze incoming code changes for bugs, security risks, and styling issues.
        </p>
      </div>

      {/* Input Form */}
      <AnimatedCard className="clay-card" style={{ padding: "2rem", marginBottom: "3rem", maxWidth: "800px", margin: "0 auto 3rem auto" }}>
        <form onSubmit={handleReview} style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Repository Name (e.g., tiangolo/fastapi)"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="clay-input"
            disabled={loading}
            required
          />
          <input
            type="number"
            placeholder="PR Number (e.g., 42)"
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            className="clay-input"
            disabled={loading}
            min="1"
            required
          />
          <button type="submit" className="clay-btn clay-btn-primary" disabled={loading || !repoName.trim() || !prNumber}>
            {loading ? "Reviewing..." : "Analyze Pull Request"}
          </button>
        </form>
      </AnimatedCard>

      {/* Empty State */}
      {!loading && !reviewResults && !error && (
        <div className="responsive-grid-cards" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
            <h4 style={{ color: "var(--text)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>Targeted Review</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Analyzes only the exact files modified in the PR to save time and focus on the diff.</p>
          </div>
          <div className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
            <h4 style={{ color: "var(--text)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>Code Quality</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Validates syntax, architectural patterns, and adherence to clean code principles.</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      {/* Loading Spinner State */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "4rem 0" }}>
          <div style={{
            width: "48px", height: "48px",
            border: "4px solid var(--border-soft)",
            borderTop: "4px solid var(--primary-dark)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <p style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "1.05rem" }}>Fetching PR files and streaming into the AI pipeline...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results State */}
      {reviewResults && !loading && (
        <div>

          {/* Summary Dashboard Header */}
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
            <div className="clay-card" style={{ padding: "1.5rem" }}>
              <div style={{ color: "var(--primary-dark)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem", wordBreak: "break-all" }}>
                {reviewResults.repo_name}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Repository
              </div>
            </div>

            <div className="clay-card" style={{ padding: "1.5rem" }}>
              <div style={{ color: "#ff9e64", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>
                #{reviewResults.pr_number}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Pull Request
              </div>
            </div>

            <div className="clay-card" style={{ padding: "1.5rem" }}>
              <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>
                {reviewResults.total_files}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Modified Python Files
              </div>
            </div>
          </div>

          <h3 style={{ color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "1.25rem", fontSize: "0.85rem", letterSpacing: "0.07em" }}>
            Analyzed Files ({reviewResults.analyzed_files.length})
          </h3>

          {/* List of successfully analyzed files */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reviewResults.analyzed_files.length === 0 ? (
              <p className="clay-card" style={{ padding: "1.5rem" }}>
                No active Python files were modified in this PR.
              </p>
            ) : (
              reviewResults.analyzed_files.map((file, idx) => {

                // If PyGithub hit an error decoding or retrieving this exact file
                if (file.status === "error") {
                   return (
                    <div key={idx} style={cardStyle}>
                       <div style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem", wordBreak: "break-all" }}>
                        {file.filename}
                      </div>
                      <div style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                        Failed: {file.result?.error_message || "Unknown error"}
                      </div>
                    </div>
                   );
                }

                // Normal successful scan payload extraction
                const { totalIssues, criticalIssues, securityIssues } = getFileMetrics(file.result);

                return (
                  <div key={idx} style={cardStyle}>
                    {/* File Path Title */}
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", wordBreak: "break-all" }}>
                      {file.filename}
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
