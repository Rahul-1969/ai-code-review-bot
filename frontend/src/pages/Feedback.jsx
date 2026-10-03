import { useState } from "react";
import { acceptReview, rejectReview } from "../services/api";

export default function Feedback() {
  const [reviewId, setReviewId] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const pageStyle = { maxWidth: "600px", margin: "0 auto", padding: "2rem 1rem" };

  async function handleAccept() {
    setError(null); setStatus(null);
    try {
      await acceptReview(parseInt(reviewId));
      setStatus("accepted");
    } catch (e) { setError(e.message); }
  }

  async function handleReject() {
    setError(null); setStatus(null);
    try {
      await rejectReview(parseInt(reviewId), reason);
      setStatus("rejected");
    } catch (e) { setError(e.message); }
  }

  return (
    <div style={pageStyle}>
      <h1 className="section-title">Submit Feedback</h1>
      <p className="section-subtitle">Accept or reject a review by ID.</p>

      <div className="clay-card" style={{ padding: "1.5rem" }}>
        <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Review ID</label>
        <input id="review-id-input" type="number" className="clay-input" value={reviewId} onChange={(e) => setReviewId(e.target.value)} placeholder="e.g. 3" />

        <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rejection Reason (optional)</label>
        <input id="rejection-reason-input" className="clay-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. False positive on line 12" />

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button id="submit-accept-btn" className="clay-btn clay-btn-success" onClick={handleAccept} disabled={!reviewId}>Accept</button>
          <button id="submit-reject-btn" className="clay-btn clay-btn-danger" onClick={handleReject} disabled={!reviewId}>Reject</button>
        </div>

        {error && <p style={{ color: "var(--danger)", marginTop: "0.5rem", fontSize: "0.85rem" }}>{error}</p>}
        {status && (
          <p style={{ color: status === "accepted" ? "var(--success)" : "var(--danger)", marginTop: "0.5rem", fontWeight: 600 }}>
            {status === "accepted" ? "Review accepted." : "Review rejected."}
          </p>
        )}
      </div>
    </div>
  );
}
