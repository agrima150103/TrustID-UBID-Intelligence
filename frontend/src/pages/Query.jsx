import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Query() {
  const [queryResult, setQueryResult] = useState(null);
  const [flags, setFlags] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    apiGet("/query/flagship?pin=560058&months=18").then(setQueryResult);
    apiGet("/query/integrity-flags").then(setFlags);
    apiGet("/field-verification").then(setTasks);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operational Query Layer</p>
          <h1>Risk & Inspection Query</h1>
          <p>
            Demonstrates the exact governance query Karnataka Commerce & Industry needs,
            enriched with identity trust score, inspection gaps and adversarial integrity flags.
          </p>
        </div>
      </div>

      <div className="hero-panel">
        <h2>Flagship Government Query</h2>
        <p>
          “Show active businesses in PIN 560058 with no inspection in the last 18 months,
          including identity risk and integrity flags.”
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Query Result</h2>
          <p>
            {queryResult
              ? `${queryResult.count} result(s) found for inspection prioritisation.`
              : "Running query..."}
          </p>
        </div>

        {queryResult && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>UBID</th>
                  <th>Business</th>
                  <th>PIN</th>
                  <th>Sector</th>
                  <th>Status</th>
                  <th>Trust Score</th>
                  <th>Risk</th>
                  <th>Latest Event</th>
                </tr>
              </thead>

              <tbody>
                {queryResult.results.map((row) => (
                  <tr key={row.ubid}>
                    <td>{row.ubid}</td>
                    <td>{row.canonical_name}</td>
                    <td>{row.pin_code}</td>
                    <td>{row.sector}</td>
                    <td>
                      <span className={`status-chip ${row.status.toLowerCase().replace(" ", "-")}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <span className="trust-score monitoring">{row.trust_score}/100</span>
                    </td>
                    <td>{row.risk_level}</td>
                    <td>{row.latest_event_date || "No event"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <h2>Integrity Flags</h2>
            <p>
              TrustID detects suspicious fragmentation, sector mismatch and shell/front-entity
              patterns that basic UBID systems miss.
            </p>
          </div>

          <div className="flag-grid">
            {flags.map((flag) => (
              <div className={`flag-card ${flag.severity.toLowerCase()}`} key={flag.id}>
                <span>{flag.severity}</span>
                <h3>{flag.flag_type}</h3>
                <p>{flag.explanation}</p>
                <small>{flag.ubid || "Network-level signal"}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Field Verification Tasks</h2>
            <p>
              Officer-generated tasks convert suspicious identity intelligence into action.
            </p>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              No field verification tasks yet. Generate one from Business Registry.
            </div>
          ) : (
            <div className="stack">
              {tasks.map((task) => (
                <div className="verification-task" key={task.id}>
                  <strong>{task.task_id}</strong>
                  <p>{task.officer_action}</p>
                  <small>
                    {task.business_name} · Priority: {task.priority} · Status: {task.status}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}