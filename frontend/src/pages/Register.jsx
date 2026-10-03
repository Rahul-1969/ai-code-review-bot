import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser } from "../services/api";
import useAuthStore from "../stores/authStore";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerUser(username, email, password);
      // On success, automatically login and redirect to dashboard
      const data = await loginUser(email, password);
      login(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please check your inputs.");
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
        <h2 className="section-title">Create Account</h2>

      {error && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister}>
        <div style={{ textAlign: "left", marginBottom: "0.4rem", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>
          <label htmlFor="username">Username</label>
        </div>
        <input
          id="username"
          type="text"
          className="clay-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={50}
          required
        />
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
            minLength={8}
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
        <button type="submit" className="clay-btn clay-btn-success" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "1.5rem", marginBottom: 0 }}>
        Already have an account? <Link to="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>Login</Link>
      </p>
      </div>
    </div>
  );
}
