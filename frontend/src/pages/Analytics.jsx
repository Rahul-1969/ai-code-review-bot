import { useState, useEffect, useMemo } from "react";
import { getAnalytics } from "../services/api";
import AnimatedCard from "../components/AnimatedCard";
import ClayEmptyState from "../components/ClayEmptyState";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalytics()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to load analytics data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const chartData = useMemo(() => {
    // Sort by date ascending for timeline charts
    const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let formatted = sorted.map((repo) => {
      const dateObj = new Date(repo.created_at);
      return {
        ...repo,
        name: repo.repo_name,
        value: repo.total_issues,
        critical: repo.critical_issues,
        security: repo.security_issues,
        dateFormatted: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
      };
    });

    return formatted;
  }, [data]);

  const COLORS = ["var(--primary)", "var(--success)", "var(--danger)", "var(--warning)", "#bb9af7"];

  const pageStyle = { maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1rem" };
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "1.5rem",
  };
  const cardStyle = {
    borderRadius: "10px",
    padding: "1.5rem",
    minHeight: "350px",
    display: "flex",
    flexDirection: "column",
  };
  const titleStyle = { color: "var(--text)", marginTop: 0, marginBottom: "1.5rem", fontSize: "1.1rem" };

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 className="section-title" style={{ fontSize: "2.5rem" }}>Analytics Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Gain high-level insights into your organization&apos;s code quality and security posture across all scanned repositories.
        </p>
      </div>

      {/* Analytics Summary Cards */}
      {!loading && !error && chartData.length > 0 && (
         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
             <AnimatedCard className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                 <div style={{ fontSize: "2.5rem", color: "var(--primary)", fontWeight: "bold", marginBottom: "0.5rem" }}>{chartData.length}</div>
                 <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>Total Repos</div>
             </AnimatedCard>
             <AnimatedCard className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                 <div style={{ fontSize: "2.5rem", color: "var(--warning)", fontWeight: "bold", marginBottom: "0.5rem" }}>{chartData.reduce((acc, curr) => acc + curr.value, 0)}</div>
                 <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>Total Issues</div>
             </AnimatedCard>
             <AnimatedCard className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                 <div style={{ fontSize: "2.5rem", color: "var(--danger)", fontWeight: "bold", marginBottom: "0.5rem" }}>{chartData.reduce((acc, curr) => acc + curr.critical, 0)}</div>
                 <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>Critical Findings</div>
             </AnimatedCard>
             <AnimatedCard className="clay-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                 <div style={{ fontSize: "2.5rem", color: "#ff9e64", fontWeight: "bold", marginBottom: "0.5rem" }}>{chartData.reduce((acc, curr) => acc + curr.security, 0)}</div>
                 <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>Security Risks</div>
             </AnimatedCard>
         </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 0" }}>
          <div style={{
            width: "40px", height: "40px",
            border: "3px solid var(--border-soft)",
            borderTop: "3px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Loading analytics...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && !loading && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      {!loading && !error && chartData.length === 0 && (
        <ClayEmptyState
          icon={null}
          title="No Analytics Data Yet"
          description="Analytics will populate automatically once you scan your first repository. You'll be able to track issue distribution, critical security risks, and repository health over time."
        />
      )}

      {!loading && !error && chartData.length > 0 && (
        <div style={gridStyle}>

          {/* Pie Chart: Issue distribution by repository */}
          <AnimatedCard className="clay-card" style={cardStyle}>
            <h3 style={titleStyle}>Issue Distribution by Repository</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--surface-soft)", borderRadius: "8px", color: "var(--text)", }} itemStyle={{ color: "var(--text-secondary)", }} />
                <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: "0.85rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedCard>

          {/* Bar Chart: Critical issues by repository */}
          <AnimatedCard className="clay-card" style={cardStyle}>
            <h3 style={titleStyle}>Critical Issues by Repository</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "var(--surface-soft)" }} contentStyle={{ background: "var(--surface-soft)", borderRadius: "8px", color: "var(--text)", }} itemStyle={{ color: "var(--danger)" }} />
                <Bar dataKey="critical" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Critical Issues" />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCard>

          {/* Line Chart: Repository scan history over time */}
          <AnimatedCard className="clay-card" style={cardStyle}>
            <h3 style={titleStyle}>Scan History Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="dateFormatted" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface-soft)", borderRadius: "8px", color: "var(--text)", }} itemStyle={{ color: "var(--primary)" }} />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "#1e1e2e", strokeWidth: 2 }} activeDot={{ r: 6 }} name="Total Issues" />
              </LineChart>
            </ResponsiveContainer>
          </AnimatedCard>

          {/* Area Chart: Security issue trends */}
          <AnimatedCard className="clay-card" style={cardStyle}>
            <h3 style={titleStyle}>Security Issue Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSecurity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="dateFormatted" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface-soft)", borderRadius: "8px", color: "var(--text)", }} itemStyle={{ color: "var(--warning)" }} />
                <Area type="monotone" dataKey="security" stroke="var(--warning)" strokeWidth={3} fillOpacity={1} fill="url(#colorSecurity)" name="Security Issues" />
              </AreaChart>
            </ResponsiveContainer>
          </AnimatedCard>

        </div>
      )}
    </div>
  );
}
