import { useEffect, useState, useMemo } from "react";
import { getAllPatterns, getPatternSummary, refreshLearning, getUserHistory } from "../services/api";
import PatternCard from "../components/PatternCard";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from "recharts";

export default function Patterns() {
  const [patterns, setPatterns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshMsg, setRefreshMsg] = useState(null);

  useEffect(() => {
    Promise.all([getAllPatterns(), getPatternSummary(), getUserHistory()])
      .then(([p, s, h]) => {
        setPatterns(p);
        setSummary(s);
        setHistory(h);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    setError(null);
    try {
      const res = await refreshLearning();
      setRefreshMsg(`Updated ${res.patterns_upserted} patterns. Preferred: ${res.preferred_category} / ${res.preferred_severity}`);
      setLoading(true);
      const [p, s, h] = await Promise.all([getAllPatterns(), getPatternSummary(), getUserHistory()]);
      setPatterns(p);
      setSummary(s);
      setHistory(h);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Aggregate Data for Recharts
  const { categoryData, severityData, timelineData } = useMemo(() => {
    // 1. Pie Chart: Category Scores
    const catData = patterns
      .filter((p) => p.pattern_type === "category")
      .map((p) => ({ name: p.pattern_name, value: p.score }));

    // 2. Bar Chart: Severity Scores
    const sevData = patterns
      .filter((p) => p.pattern_type === "severity")
      .map((p) => ({ name: p.pattern_name, count: p.score }));

    // 3. Line Chart: Review Activity over time
    const dateCounts = {};
    history.forEach((review) => {
      // Group by YYYY-MM-DD
      const dateStr = new Date(review.timestamp).toISOString().split('T')[0];
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const timeData = Object.keys(dateCounts)
      .sort() // chronological order
      .map((date) => ({ date, Reviews: dateCounts[date] }));

    return { categoryData: catData, severityData: sevData, timelineData: timeData };
  }, [patterns, history]);

  // Dark Theme Palette
  const PIE_COLORS = ["var(--danger)", "var(--warning)", "var(--success)", "var(--primary)", "#bb9af7", "#89ddff"];
  const SEVERITY_COLORS = {
    critical: "var(--danger)",
    high: "#ff9e64",
    medium: "var(--warning)",
    low: "var(--success)"
  };

  const pageStyle = { maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1rem" };
  const cardStyle = {
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 className="section-title">Analytics & Patterns</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>Visualise AI metrics and developer feedback.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: "0.75rem 1.5rem",
            background: "var(--primary)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.7 : 1,
            transition: "opacity 0.2s"
          }}>
          {refreshing ? "Crunching Data…" : "Refresh Learning"}
        </button>
      </div>

      {refreshMsg && <div className="badge badge-success">{refreshMsg}</div>}
      {error && <div className="badge badge-danger">{error}</div>}

      {/* Summary Stats */}
      {summary && (
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {[
            { label: "Preferred Category", value: summary.preferred_category, color: "var(--primary-dark)" },
            { label: "Preferred Severity", value: summary.preferred_severity, color: "var(--warning)" },
            { label: "Overall Confidence", value: Math.round(summary.overall_confidence * 100) + "%", color: "var(--success)" }
          ].map(({ label, value, color }) => (
            <div key={label} className="clay-card" style={{ padding: "1.5rem" }}>
              <div style={{ color, fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.25rem" }}>{value || "N/A"}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Loading charts...</p>
      ) : (
        <>
          {/* Charts Row */}
          <div className="responsive-grid-cards" style={{ marginBottom: "2rem" }}>

            {/* Category Pie Chart */}
            <div className="clay-card" style={cardStyle}>
              <h3 style={{ color: "var(--text-secondary)", marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>Issue Categories</h3>
              <div style={{ width: "100%", height: 350 }}>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--surface-soft)", borderRadius: "6px", color: "var(--text)", }} itemStyle={{ color: "var(--text)", }} />
                      <Legend wrapperStyle={{ color: "var(--text-secondary)", }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "4rem" }}>No data available</p>}
              </div>
            </div>

            {/* Severity Bar Chart */}
            <div className="clay-card" style={cardStyle}>
              <h3 style={{ color: "var(--text-secondary)", marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>Issue Severity</h3>
              <div style={{ width: "100%", height: 350 }}>
                {severityData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={severityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)" }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)" }} />
                      <Tooltip cursor={{ fill: "var(--surface-soft)" }} contentStyle={{ background: "var(--surface-soft)", borderRadius: "6px", color: "var(--text)", }} />
                      <Legend wrapperStyle={{ color: "var(--text-secondary)", }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name.toLowerCase()] || "var(--primary)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "4rem" }}>No data available</p>}
              </div>
            </div>

            {/* Timeline Line Chart */}
            <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
              <h3 style={{ color: "var(--text-secondary)", marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>Review Activity Over Time</h3>
              <div style={{ width: "100%", height: 300 }}>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)" }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "var(--surface-soft)", borderRadius: "6px", color: "var(--text)", }} />
                      <Legend wrapperStyle={{ color: "var(--text-secondary)", }} />
                      <Line type="monotone" dataKey="Reviews" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5, fill: "var(--primary)", stroke: "#1a1a2e" }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "4rem" }}>No data available</p>}
              </div>
            </div>
          </div>

          {/* Raw Patterns Grid (Optional Context) */}
          {patterns.length > 0 && (
            <div>
              <h3 style={{ color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "1rem", fontSize: "0.85rem", letterSpacing: "0.07em" }}>
                Raw Learned Patterns ({patterns.length})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {patterns.map((p) => <PatternCard key={p.id} pattern={p} />)}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && patterns.length === 0 && history.length === 0 && (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "3rem" }}>
          No data yet. Run some code reviews, submit feedback, and click Refresh Learning to populate analytics!
        </p>
      )}
    </div>
  );
}
