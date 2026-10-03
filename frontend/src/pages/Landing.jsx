import { Link, useNavigate } from "react-router-dom";


export default function Landing() {
  const navigate = useNavigate();
  const section = { padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" };
  const altStrip = { backgroundColor: "rgba(255,255,255,0.35)" };
  const clayCard = {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };
  const handleCardClick = (path) => navigate(path);
  const workflowSteps = [
    "Source Code", "Code Ingestion", "Static Analysis",
    "AI Review", "Review Findings", "Feedback / Export",
  ];

  const heroBtnStyle = {
    width: "140px",
    height: "40px",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    lineHeight: "1",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
    borderRadius: "16px",
  };



  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh", color: "var(--text-primary)" }}>
      <style>{`
        /* Feature grid responsive breakpoints */
        .landing-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.25rem;
        }
        @media (max-width: 1023px) {
          .landing-feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 1023px) and (min-width: 768px) {
          .landing-feature-grid > div:last-child {
            grid-column: 1 / -1;
            justify-self: center;
            width: calc(50% - 0.625rem);
          }
        }
        @media (max-width: 767px) {
          .landing-feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>


      {/* HERO */}
      <section style={{ ...section, textAlign: "center", paddingTop: "3rem", paddingBottom: "3rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1rem", lineHeight: 1.15 }}>
          AI Code Review
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "640px", margin: "0 auto 2rem auto", lineHeight: 1.6 }}>
          Analyze source code, review GitHub repositories and pull requests, track review history, and inspect code-quality patterns from one workspace.
        </p>
        <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", marginBottom: "2.5rem", flexWrap: "wrap" }}>
          <Link to="/register" className="clay-btn clay-btn-primary" style={heroBtnStyle}>Get Started</Link>
          <Link to="/login" className="clay-btn" style={{ ...heroBtnStyle, borderColor: "rgba(53, 169, 232, 0.4)", color: "var(--primary-dark)" }}>Login</Link>
        </div>
        <div style={{ ...clayCard, maxWidth: "860px", margin: "0 auto", padding: "1.25rem", background: "#f4f6f8" }}>
          <div style={{ display: "flex", gap: "0.4rem", paddingBottom: "0.5rem", marginBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f" }} />
          </div>
          <div style={{ display: "flex", gap: "0.875rem", textAlign: "left" }}>
            <div style={{ flex: 1, padding: "1.25rem", background: "#ffffff", borderRadius: "8px", boxShadow: "inset 2px 2px 4px #e2e8f0, inset -2px -2px 4px #ffffff", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Source Code</div>
              <div style={{ height: "9px", width: "40%", background: "#e2e8f0", borderRadius: "4px", marginBottom: "0.75rem" }} />
              <div style={{ height: "9px", width: "80%", background: "#e2e8f0", borderRadius: "4px", marginBottom: "0.4rem" }} />
              <div style={{ height: "9px", width: "60%", background: "#e2e8f0", borderRadius: "4px", marginBottom: "0.4rem" }} />
              <div style={{ height: "9px", width: "70%", background: "#e2e8f0", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: 1, padding: "1.25rem", background: "#ffffff", borderRadius: "8px", boxShadow: "inset 2px 2px 4px #e2e8f0, inset -2px -2px 4px #ffffff" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--danger)" }}>Security Finding</div>
              <div style={{ height: "7px", width: "100%", background: "#e2e8f0", borderRadius: "3px", marginBottom: "0.35rem" }} />
              <div style={{ height: "7px", width: "88%", background: "#e2e8f0", borderRadius: "3px", marginBottom: "0.75rem" }} />
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--success)" }}>Suggested Fix</div>
              <div style={{ height: "7px", width: "100%", background: "#e2e8f0", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT OVERVIEW */}
      <div style={altStrip}>
        <section style={{ ...section, paddingTop: "3.5rem", paddingBottom: "3.5rem" }}>
          <h2 style={{ textAlign: "center", fontSize: "1.9rem", fontWeight: 800, marginBottom: "2rem" }}>From code to actionable review</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.25rem" }}>
            {[
              { step: "01 — Submit",  text: "Provide source code or use a supported GitHub review workflow." },
              { step: "02 — Analyze", text: "The application processes the submitted code through its review pipeline." },
              { step: "03 — Inspect", text: "Review detected issues, explanations, and suggested improvements." },
              { step: "04 — Learn",   text: "Use feedback and available pattern information to improve review workflows." },
            ].map((item, i) => (
              <div key={i} style={{ ...clayCard, padding: "1.25rem" }}>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)", marginBottom: "0.6rem" }}>{item.step}</div>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.5, fontSize: "0.9rem", margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ ...section, paddingTop: "3.5rem", paddingBottom: "3.5rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.9rem", fontWeight: 800, marginBottom: "2rem" }}>Everything in one review workspace</h2>
        <div className="landing-feature-grid">
          {[
            { name: "Dashboard",      path: "/dashboard",     desc: "Submit source code for analysis and review the resulting findings." },
            { name: "History",        path: "/history",       desc: "Browse previous code reviews and inspect their results." },
            { name: "GitHub Scanner", path: "/github",        desc: "Scan a GitHub repository and analyze its supported source files." },
            { name: "PR Review",      path: "/pr-review",     desc: "Review changes from a GitHub pull request." },
            { name: "Repositories",   path: "/repositories",  desc: "Track repository scans and their analysis results." },
            { name: "Analytics",      path: "/analytics",     desc: "View review and analysis information through charts and summaries." },
            { name: "Export Center",  path: "/export-center", desc: "Export available review results into supported report formats." },
            { name: "Feedback",       path: "/feedback",      desc: "Accept or reject review findings and provide rejection reasons." },
            { name: "Patterns",       path: "/patterns",      desc: "Explore learned review patterns and their available analysis data." },
          ].map((feat, i) => (
            <div
              key={i}
              style={{ ...clayCard, cursor: "pointer" }}
              onClick={() => handleCardClick(feat.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "8px 8px 18px #c8d0dd, -8px -8px 18px #ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff";
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.45rem", color: "var(--text-primary)" }}>{feat.name}</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.5, fontSize: "0.88rem", margin: 0 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div style={altStrip}>
        <section id="how-it-works" style={{ ...section, paddingTop: "3rem", paddingBottom: "3rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: "1.75rem" }}>How the review workflow works</h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
            {workflowSteps.map((step, i, arr) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  ...clayCard,
                  padding: "0.75rem 2rem",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  color: "var(--primary-dark)",
                  minWidth: "220px",
                  textAlign: "center",
                }}>
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1, padding: "0.3rem 0" }}>&#x2193;</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* REVIEW CAPABILITIES — reduced padding: 3.5rem → 2.5rem */}
      <section style={{ ...section, paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.25rem" }}>
          {[
            { title: "Code Quality",   desc: "Review findings related to code quality and supported static-analysis checks." },
            { title: "Security",       desc: "Identify security-oriented findings from the supported analysis pipeline." },
            { title: "AI Review",      desc: "Generate explanations and suggestions for detected code issues." },
            { title: "Review History", desc: "Keep track of completed reviews and inspect their results later." },
          ].map((cap, i) => (
            <div key={i} style={{ ...clayCard, padding: "1.25rem" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--text-primary)" }}>{cap.title}</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5, margin: 0 }}>{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <div style={altStrip}>
        <section style={{ ...section, paddingTop: "3.5rem", paddingBottom: "4rem", textAlign: "center" }}>
          <div style={{ ...clayCard, maxWidth: "720px", margin: "0 auto", padding: "2.5rem 2rem" }}>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: "0.75rem" }}>Ready to review your code?</h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "1.75rem" }}>
              Create an account to access the AI Code Review workspace.
            </p>
            <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" className="clay-btn clay-btn-primary" style={{ padding: "0.7rem 1.75rem", fontSize: "1rem", textDecoration: "none" }}>Create Account</Link>
              <Link to="/login" className="clay-btn" style={{ padding: "0.7rem 1.75rem", fontSize: "1rem", textDecoration: "none" }}>Login</Link>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
