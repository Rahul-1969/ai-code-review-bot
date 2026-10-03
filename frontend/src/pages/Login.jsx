import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { loginUser } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      // The backend returns { access_token: "...", token_type: "bearer" }
      login(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    maxWidth: "420px",
    width: "100%",
    margin: "4rem auto",
    padding: "3rem 2.5rem",
    borderRadius: "16px",
    textAlign: "center",
    background: "var(--surface)",
    boxShadow: "var(--shadow-light)",
    border: "1px solid var(--border-soft)",
  };

  return (
    <div style={{ padding: "0 1rem", width: "100%", boxSizing: "border-box" }}>
      <div style={pageStyle}>
        <h2 className="section-title">Welcome Back</h2>

      {error && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ textAlign: "left", marginBottom: "0.4rem", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>
          <label htmlFor="email">Email</label>
        </div>
        <input
          id="email"
          type="email"
          className="clay-input"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div style={{ textAlign: "left", marginBottom: "0.4rem", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>
          <label htmlFor="password">Password</label>
        </div>
        <div style={{ position: "relative", marginBottom: "1.2rem" }}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="clay-input" style={{marginBottom: 0, paddingRight: "3rem" }}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.2rem",
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
        <button type="submit" className="clay-btn clay-btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "1.5rem", marginBottom: 0 }}>
        Don't have an account? <Link to="/register" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>Register</Link>
      </p>
      </div>
    </div>
  );
}
