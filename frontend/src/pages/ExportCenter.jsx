import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import AnimatedCard from "../components/AnimatedCard";
import ClayEmptyState from "../components/ClayEmptyState";
import {
  downloadRepositoriesCSV,
  downloadRepositoriesJSON,
  downloadRepositoriesExcel,
  getRepositories,
} from "../services/api";

export default function ExportCenter() {
  const [loading, setLoading] = useState(false);
  const [repoCount, setRepoCount] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getRepositories()
      .then((data) => setRepoCount(data.length))
      .catch(() => setRepoCount(0))
      .finally(() => setFetching(false));
  }, []);

  const handleDownload = async (type) => {
    setLoading(true);
    toast.success("Download started", { id: "export-toast" });
    try {
      let data;
      let filename;
      let mimeType;

      if (type === "csv") {
        data = await downloadRepositoriesCSV();
        filename = "repositories.csv";
        mimeType = "text/csv";
      } else if (type === "excel") {
        data = await downloadRepositoriesExcel();
        filename = "repositories.xlsx";
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (type === "json") {
        data = await downloadRepositoriesJSON();
        filename = "repositories.json";
        mimeType = "application/json";
      }

      const blob = new Blob([data], { type: mimeType });
      saveAs(blob, filename);
      toast.success("Download complete", { id: "export-toast" });
    } catch {
      toast.error("Export failed", { id: "export-toast" });
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = { maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1rem" };
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1.5rem",
    marginTop: "2rem",
  };
  const cardStyle = {
    borderRadius: "10px",
    padding: "2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "1rem",
  };
  const titleStyle = { color: "var(--primary-dark)", marginTop: 0, marginBottom: "0.25rem", fontSize: "1.2rem" };
  const descStyle = { color: "var(--text-secondary)", fontSize: "0.9rem", flex: 1 };
  const btnBase = {
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    border: "none",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "opacity 0.2s",
    background: "var(--primary)",
    color: "#1a1a2e",
    width: "100%",
  };

  return (
    <div style={pageStyle}>
      <h1 className="section-title">Export Center</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
        Export your repository scan history and analytics data into various formats.
      </p>

      {fetching && (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div style={{
            width: "40px", height: "40px",
            border: "3px solid var(--border-soft)",
            borderTop: "3px solid var(--primary-dark)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem auto"
          }} />
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Checking for export data...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!fetching && repoCount === 0 && (
        <ClayEmptyState
          icon={null}
          title="No Data to Export"
          description="You haven't scanned any repositories yet. Your exports will contain no data. Head over to the GitHub Scanner to analyze your first repository before exporting!"
        />
      )}

      {!fetching && repoCount > 0 && (
        <div style={gridStyle}>
          {/* CSV Export */}
          <AnimatedCard className="clay-card" style={cardStyle}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}></div>
            <h3 style={titleStyle}>CSV Export</h3>
            <p style={descStyle}>Download repository scan history as CSV.</p>
            <button
              style={{...btnBase, opacity: loading ? 0.7 : 1}}
              onClick={() => handleDownload("csv")}
              disabled={loading}
            >
              Download CSV
            </button>
          </AnimatedCard>

          {/* Excel Export */}
          <AnimatedCard className="clay-card" style={cardStyle}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}></div>
            <h3 style={titleStyle}>Excel Export</h3>
            <p style={descStyle}>Download repository scan history as XLSX.</p>
            <button
              style={{...btnBase, opacity: loading ? 0.7 : 1}}
              onClick={() => handleDownload("excel")}
              disabled={loading}
            >
              Download Excel
            </button>
          </AnimatedCard>

          {/* JSON Export */}
          <AnimatedCard className="clay-card" style={cardStyle}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{`{}`}</div>
            <h3 style={titleStyle}>JSON Export</h3>
            <p style={descStyle}>Download repository scan history as JSON.</p>
            <button
              style={{...btnBase, opacity: loading ? 0.7 : 1}}
              onClick={() => handleDownload("json")}
              disabled={loading}
            >
              Download JSON
            </button>
          </AnimatedCard>
        </div>
      )}
    </div>
  );
}
