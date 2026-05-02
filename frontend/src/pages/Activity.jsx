import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

export default function Activity() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
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

  async function openTimeline(ubid) {
    const details = await apiGet(`/ubids/${ubid}`);
    setSelected(details);
  }

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
            inspections, renewals, filings and consumption events. Click a UBID to inspect
            the evidence timeline behind the verdict.
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

      <div className="two-col wide-left">
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
                  <tr
                    key={row.ubid}
                    className="clickable-row"
                    onClick={() => openTimeline(row.ubid)}
                  >
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

        <div className="panel detail-panel">
          <div className="panel-header">
            <h2>Activity Evidence Timeline</h2>
            <p>
              Shows which signals drove the verdict and over what time window.
            </p>
          </div>

          {!selected ? (
            <div className="empty-state">Select a UBID to inspect activity evidence.</div>
          ) : (
            <div>
              <div className="brief-header">
                <div>
                  <h3>{selected.business.ubid}</h3>
                  <p className="muted">{selected.business.canonical_name}</p>
                </div>

                <span className={`status-chip ${selected.business.status.toLowerCase().replace(" ", "-")}`}>
                  {selected.business.status}
                </span>
              </div>

              <div className="recommendation-box">
                <strong>Activity Verdict Explanation</strong>
                <p>{selected.officerBrief?.recommendedAction}</p>
              </div>

              <h4>Signals Used</h4>

              <div className="stack">
                {selected.events.length === 0 ? (
                  <div className="empty-state">
                    No confidently joined activity events found for this UBID. This is why
                    Low Evidence is surfaced instead of assuming closure.
                  </div>
                ) : (
                  selected.events.map((event) => (
                    <div className="timeline-card" key={event.id}>
                      <strong>{event.event_type}</strong>
                      <span>
                        {event.source_system} · {event.event_date}
                      </span>
                      <p>{event.description}</p>
                      <small>
                        Signal strength: {event.signal_strength} · Join confidence:{" "}
                        {Math.round((event.join_confidence || 0) * 100)}%
                      </small>
                    </div>
                  ))
                )}
              </div>

              <h4>Activity Evidence Summary</h4>

              <div className="stack">
                {selected.officerBrief?.activityEvidence?.map((item, index) => (
                  <div className="evidence-card" key={index}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}