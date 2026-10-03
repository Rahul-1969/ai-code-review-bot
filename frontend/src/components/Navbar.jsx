import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuthStore from "../stores/authStore";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPublic = ["/", "/login", "/register"].includes(location.pathname);

  if (!isAuthenticated && !isPublic) return null;
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dashboardLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/history", label: "History" },
    { to: "/github", label: "GitHub Scanner" },
    { to: "/pr-review", label: "PR Review" },
    { to: "/repositories", label: "Repositories" },
    { to: "/analytics", label: "Analytics" },
    { to: "/export-center", label: "Export Center" },
    { to: "/feedback", label: "Feedback" },
    { to: "/patterns", label: "Patterns" },
  ];

  const landingLinks = [
    { id: "features", label: "Features" },
    { id: "how-it-works", label: "How It Works" },
  ];

  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
       navigate("/");
       setTimeout(() => {
         const el = document.getElementById(id);
         if (el) el.scrollIntoView({ behavior: "smooth" });
       }, 100);
       return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    if (isMobile) setMenuOpen(false);
  };

  const navStyle = {
    display: "flex",
    alignItems: "center",
    padding: "1rem 2rem",
    justifyContent: "space-between",
    position: "relative",
  };

  const brandStyle = {
    fontWeight: 800,
    fontSize: "1.3rem",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    whiteSpace: "nowrap",
  };

  const navLinksContainerStyle = {
    display: isMobile ? (menuOpen ? "flex" : "none") : "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: "center",
    gap: isMobile ? "0.5rem" : "0.25rem",
    flex: isMobile ? "none" : 1,
    justifyContent: "center",
    position: isMobile ? "absolute" : "static",
    top: isMobile ? "100%" : "auto",
    left: isMobile ? 0 : "auto",
    right: isMobile ? 0 : "auto",
    background: isMobile ? "var(--surface)" : "transparent",
    padding: isMobile ? "1rem" : 0,
    boxShadow: isMobile && menuOpen ? "0 10px 20px rgba(0,0,0,0.1)" : "none",
    zIndex: 100,
  };

  const linkStyle = ({ isActive } = { isActive: false }) => ({
    color: isActive ? "var(--primary-dark)" : "var(--text-secondary)",
    background: isActive ? "var(--accent-purple)" : "transparent",
    textDecoration: "none",
    fontSize: isMobile ? "1rem" : "0.85rem",
    fontWeight: 700,
    padding: isMobile ? "0.75rem 1rem" : "0.4rem 0.6rem",
    borderRadius: "20px",
    transition: "all 0.2s ease",
    boxShadow: isActive ? "0 4px 10px rgba(99, 102, 241, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.6)" : "none",
    width: isMobile ? "100%" : "auto",
    textAlign: isMobile ? "center" : "left",
    whiteSpace: "nowrap",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit"
  });

  const navAuthBtnStyle = {
    width: isMobile ? "100%" : "120px",
    height: "38px",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    lineHeight: "1",
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: 600,
    borderRadius: "16px",
    marginTop: isMobile ? "1rem" : "0",
  };

  const getLoginStyle = () => {
    return { ...navAuthBtnStyle, color: "var(--primary-dark)", borderColor: "rgba(53, 169, 232, 0.4)" };
  };

  const getGetStartedClass = () => {
    return "clay-btn clay-btn-primary";
  };

  const getGetStartedStyle = () => {
    return navAuthBtnStyle;
  };

  return (
    <nav className="clay-nav" style={navStyle}>
      <Link to={isPublic ? "/" : "/dashboard"} style={brandStyle}>
        <span style={{ color: "var(--primary-dark)" }}>AI Code Review</span>
      </Link>

      {isMobile && (
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="clay-btn"
          aria-label="Toggle mobile menu"
          aria-expanded={menuOpen}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      )}

      <div style={navLinksContainerStyle}>
        {isPublic ? (
          landingLinks.map(l => (
            <button key={l.id} onClick={() => scrollToSection(l.id)} style={linkStyle({ isActive: false })}>
              {l.label}
            </button>
          ))
        ) : (
          dashboardLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/dashboard"}
              style={linkStyle}
              onClick={() => isMobile && setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))
        )}

        {isMobile && isPublic && (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="clay-btn" style={getLoginStyle()}>Login</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className={getGetStartedClass()} style={getGetStartedStyle()}>Get Started</Link>
          </>
        )}
        {isMobile && !isPublic && (
          <button onClick={handleLogout} className="clay-btn clay-btn-danger" style={{ marginTop: "1rem", width: "100%" }}>
            Logout
          </button>
        )}
      </div>

      {!isMobile && (
        isPublic ? (
          <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
            <Link to="/login" className="clay-btn" style={getLoginStyle()}>Login</Link>
            <Link to="/register" className={getGetStartedClass()} style={getGetStartedStyle()}>Get Started</Link>
          </div>
        ) : (
          <button onClick={handleLogout} className="clay-btn clay-btn-danger" style={{ marginLeft: "1rem", whiteSpace: "nowrap" }}>
            Logout
          </button>
        )
      )}
    </nav>
  );
}
