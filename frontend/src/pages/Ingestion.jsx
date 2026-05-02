import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Ingestion() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiGet("/ingestion").then(setData);
  }, []);

  if (!data) return <div className="loading">Loading department feeds...</div>;

  function qualityScore(system) {
    const totalPossible = system.records * 2;
    const available = (system.pan_available || 0) + (system.gstin_available || 0);

    if (!totalPossible) return 0;

    return Math.round((available / totalPossible) * 100);
  }

  function qualityLabel(score) {
    if (score >= 80) return "Strong";
    if (score >= 50) return "Moderate";
    if (score > 0) return "Weak";
    return "Low Identifier Evidence";
  }

  function qualityClass(score) {
    if (score >= 80) return "trusted";
    if (score >= 50) return "monitoring";
    if (score > 0) return "risky";
    return "high-risk";
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Read-only Department Adapters</p>
          <h1>Department Feeds</h1>
          <p>
            Simulates Shop Establishment, Factories, Labour, KSPCB, BESCOM, BWSSB and
            Food Safety records entering TrustID without modifying source systems.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Source System Data Quality</h2>
          <p>
            Identifier availability differs by department. TrustID therefore cannot rely only
            on PAN/GSTIN and must use explainable identity resolution.
          </p>
        </div>

        <div className="quality-grid">
          {data.systems.map((system) => {
            const score = qualityScore(system);

            return (
              <div className="quality-card" key={system.source_system}>
                <div className="quality-top">
                  <h3>{system.source_system}</h3>
                  <span className={`trust-score ${qualityClass(score)}`}>
                    {score}%
                  </span>
                </div>

                <p>{qualityLabel(score)}</p>

                <div className="quality-bar">
                  <div style={{ width: `${score}%` }} />
                </div>

                <small>
                  PAN: {system.pan_available || 0}/{system.records} · GSTIN:{" "}
                  {system.gstin_available || 0}/{system.records}
                </small>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Source System Health</h2>
          <p>
            Departments have different identifier completeness levels and schema quality.
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Department System</th>
                <th>Records</th>
                <th>PAN Available</th>
                <th>GSTIN Available</th>
                <th>Data Quality</th>
                <th>Mode</th>
              </tr>
            </thead>

            <tbody>
              {data.systems.map((system) => {
                const score = qualityScore(system);

                return (
                  <tr key={system.source_system}>
                    <td>{system.source_system}</td>
                    <td>{system.records}</td>
                    <td>{system.pan_available || 0}</td>
                    <td>{system.gstin_available || 0}</td>
                    <td>
                      <span className={`trust-score ${qualityClass(score)}`}>
                        {score}% · {qualityLabel(score)}
                      </span>
                    </td>
                    <td>
                      <span className="evidence-badge green">
                        Read-only API / Batch
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Raw Department Records</h2>
          <p>
            Notice naming variation, missing identifiers, inconsistent sectors and address
            formatting.
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Record ID</th>
                <th>Business Name</th>
                <th>PIN</th>
                <th>Sector</th>
                <th>PAN?</th>
                <th>GSTIN?</th>
              </tr>
            </thead>

            <tbody>
              {data.records.map((record) => (
                <tr key={record.id}>
                  <td>{record.source_system}</td>
                  <td>{record.source_record_id}</td>
                  <td>{record.business_name}</td>
                  <td>{record.pin_code}</td>
                  <td>{record.sector}</td>
                  <td>{record.raw_pan_present ? "Yes" : "No"}</td>
                  <td>{record.raw_gstin_present ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}