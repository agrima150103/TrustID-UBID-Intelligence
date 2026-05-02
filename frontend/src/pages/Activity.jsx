import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

export default function Activity() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await apiGet("/activity");
      setRows(data);
    } catch (error) {
      setMessage("Could not load activity intelligence data. Check if backend is running.");
      console.error(error);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function reclassify() {
    try {
      setLoading(true);
      setMessage("Running activity classifier...");

      await apiPost("/activity/classify");

      const updatedRows = await apiGet("/activity");
      setRows(updatedRows);

      const active = updatedRows.filter((row) => row.status === "Active").length;
      const dormant = updatedRows.filter((row) => row.status === "Dormant").length;
      const closed = updatedRows.filter((row) => row.status === "Closed").length;
      const lowEvidence = updatedRows.filter((row) => row.status === "Low Evidence").length;

      setMessage(
        `Classifier completed. Active: ${active}, Dormant: ${dormant}, Closed: ${closed}, Low Evidence: ${lowEvidence}. Trust scores refreshed.`
      );
    } catch (error) {
      setMessage("Classifier failed. Check backend terminal and browser console.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function trustClass(score) {
    if (score >= 80) return "trusted";
    if (score >= 60) return "monitoring";
    if (score >= 40) return "risky";
    return "high-risk";
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Business Vitality Inference</p>
          <h1>Activity Intelligence</h1>
          <p>
            Classifies businesses as Active, Dormant, Closed or Low Evidence using
            inspections, renewals, filings and consumption events. The classifier also
            refreshes Trust Score and Risk Level.
          </p>
        </div>

        <button className="btn primary" onClick={reclassify} disabled={loading}>
          {loading ? "Running..." : "Run Classifier"}
        </button>
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="activity-summary-grid">
        <div className="mini-metric">
          <span>Active</span>
          <strong>{rows.filter((row) => row.status === "Active").length}</strong>
        </div>

        <div className="mini-metric">
          <span>Dormant</span>
          <strong>{rows.filter((row) => row.status === "Dormant").length}</strong>
        </div>

        <div className="mini-metric">
          <span>Closed</span>
          <strong>{rows.filter((row) => row.status === "Closed").length}</strong>
        </div>

        <div className="mini-metric">
          <span>Low Evidence</span>
          <strong>{rows.filter((row) => row.status === "Low Evidence").length}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>UBID Activity Status</h2>
          <p>
            Absence of signal is not blindly treated as closure. Low Evidence is surfaced
            transparently instead of making unsafe assumptions.
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>UBID</th>
                <th>Business</th>
                <th>PIN</th>
                <th>Sector</th>
                <th>Events</th>
                <th>Status</th>
                <th>Trust Score</th>
                <th>Risk</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.ubid}>
                  <td>{row.ubid}</td>
                  <td>{row.canonical_name}</td>
                  <td>{row.pin_code}</td>
                  <td>{row.sector}</td>
                  <td>{row.events}</td>
                  <td>
                    <span
                      className={`status-chip ${row.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <span className={`trust-score ${trustClass(row.trust_score)}`}>
                      {row.trust_score}/100
                    </span>
                  </td>
                  <td>{row.risk_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}