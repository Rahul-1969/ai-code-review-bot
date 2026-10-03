import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ marginTop: "auto", padding: "2rem", textAlign: "center", borderTop: "1px solid var(--border-soft)" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
        <Link to="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>Privacy Policy</Link>
        <Link to="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>Terms & Conditions</Link>
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "1rem" }}>© {new Date().getFullYear()} AI Code Review. All rights reserved.</p>
    </footer>
  );
}
