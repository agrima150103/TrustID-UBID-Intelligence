import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Audit() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiGet("/audit").then(setData);
  }, []);

  if (!data) return <div className="loading">Loading audit ledger...</div>;

  const eventCounts = data.ledger.reduce((acc, entry) => {
    acc[entry.event_type] = (acc[entry.event_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Tamper-Evident Governance Layer</p>
          <h1>Trust Ledger</h1>
          <p>
            Every UBID creation, review decision, classification, trust score and field
            verification task is chained using hashes so historical decisions cannot be
            silently altered.
          </p>
        </div>

        <div className={`status-pill ${data.verification.valid ? "valid" : "invalid"}`}>
          Ledger {data.verification.valid ? "Verified" : "Broken"}
        </div>
      </div>

      <div className="stat-grid">
        <div className="mini-metric">
          <span>Total Ledger Entries</span>
          <strong>{data.verification.entries}</strong>
        </div>
        <div className="mini-metric">
          <span>Current Integrity State</span>
          <strong>{data.verification.valid ? "Valid" : "Broken"}</strong>
        </div>
        <div className="mini-metric">
          <span>Review Events</span>
          <strong>{eventCounts.REVIEW_CREATED || 0}</strong>
        </div>
        <div className="mini-metric">
          <span>Trust Score Events</span>
          <strong>{eventCounts.TRUST_SCORE_COMPUTED || 0}</strong>
        </div>
      </div>

      <div className="hero-panel">
        <h2>Current Chain Root</h2>
        <p className="hash-text">{data.verification.rootHash}</p>
        <p>
          If any historical decision is modified, the chain root changes and the ledger fails
          verification. This is how TrustID makes identity decisions defensible in audit.
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Decision Timeline</h2>
          <p>{data.verification.entries} cryptographically linked governance events.</p>
        </div>

        <div className="ledger-list">
          {data.ledger.map((entry) => (
            <div className="ledger-card" key={entry.id}>
              <div>
                <span>{entry.event_type}</span>
                <h3>{entry.actor}</h3>
                <p>{entry.created_at}</p>
              </div>

              <div>
                <small>Previous Hash</small>
                <p className="hash-text small">{entry.previous_hash}</p>

                <small>Current Hash</small>
                <p className="hash-text small">{entry.current_hash}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}