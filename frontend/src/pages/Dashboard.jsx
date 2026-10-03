import { useState, useEffect } from "react";
import { analyzeCode, acceptReview, rejectReview } from "../services/api";
import MonacoCodeEditor from "../components/MonacoCodeEditor";
import StructureCard from "../components/StructureCard";
import StaticAnalysisCard from "../components/StaticAnalysisCard";
import AIReviewCard from "../components/AIReviewCard";
import AnimatedCard from "../components/AnimatedCard";

const DEFAULT_CODE = `def calculate_discount(price, discount_percent):
    # Potential division by zero if not careful, and floating point issues
    discount = price * (discount_percent / 100)
    final_price = price - discount
    return final_price

result = calculate_discount(100, 20)
print(f"The final price is {result}")
`;

const OLD_DEFAULT_CODE = `import subprocess
password = "secret123"

def execute(command):
    subprocess.call(command, shell=True)
`;

export default function Dashboard() {
  const [code, setCode] = useState(() => {
    const saved = sessionStorage.getItem("code_review_bot_dashboard_draft");
    if (!saved) return DEFAULT_CODE;
    if (saved.trim() === OLD_DEFAULT_CODE.trim()) return DEFAULT_CODE;
    return saved;
  });

  useEffect(() => {
    sessionStorage.setItem("code_review_bot_dashboard_draft", code);
  }, [code]);

  const [result, setResult] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const pageStyle = { width: "100%", maxWidth: "1000px", margin: "0 auto", padding: "3rem 1.5rem" };

  async function handleAnalyze() {
    if (!code.trim()) return;
    setLoading(true); setError(null); setResult(null); setReviewId(null); setFeedback(null); setShowRejectInput(false);
    try {
      const data = await analyzeCode(code);
      setResult(data.result);
      setReviewId(data.review_id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    try {
      await acceptReview(reviewId);
      setFeedback("accepted");
    } catch (e) { setError(e.message); }
  }

  async function handleReject() {
    try {
      await rejectReview(reviewId, rejectReason);
      setFeedback("rejected");
      setShowRejectInput(false);
    } catch (e) { setError(e.message); }
  }

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">Submit Python code for analysis.</p>
      </div>

      <div className="clay-card" style={{ padding: "0.5rem", marginBottom: "1.5rem" }}>
        <MonacoCodeEditor value={code} onChange={setCode} />
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          id="analyze-btn"
          className="clay-btn clay-btn-primary"
          onClick={handleAnalyze}
          disabled={loading || !code.trim()}
        >
          {loading ? "Analyzing…" : "Analyze Code"}
        </button>
        {error && <span style={{ color: "var(--danger)", fontSize: "0.9rem", fontWeight: 500 }}>{error}</span>}
      </div>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "2.5rem" }}>
          <AnimatedCard>
            <StructureCard structure={result.structure} />
          </AnimatedCard>
          <AnimatedCard>
            <StaticAnalysisCard staticAnalysis={result.static_analysis} />
          </AnimatedCard>
          <AnimatedCard>
            <AIReviewCard aiReview={result.ai_review} />
          </AnimatedCard>

          {!feedback && (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <button id="accept-btn" className="clay-btn clay-btn-success" onClick={handleAccept}>
                Accept Review
              </button>
              <button id="reject-btn" className="clay-btn clay-btn-danger" onClick={() => setShowRejectInput(true)}>
                Reject Review
              </button>
            </div>
          )}

          {showRejectInput && !feedback && (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <input
                id="reject-reason-input"
                className="clay-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection…"
                style={{ flex: 1 }}
              />
              <button id="confirm-reject-btn" className="clay-btn clay-btn-danger" onClick={handleReject}>
                Confirm Reject
              </button>
            </div>
          )}

          {feedback && (
            <div style={{ marginTop: "1rem" }}>
              <span className={`badge ${feedback === "accepted" ? "badge-success" : "badge-danger"}`} style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
                {feedback === "accepted" ? "Review Accepted" : "Review Rejected"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
