import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Query() {
  const [pin, setPin] = useState("560058");
  const [months, setMonths] = useState("18");

  const [lookupQ, setLookupQ] = useState("SE-560058-1001");
  const [lookupName, setLookupName] = useState("");
  const [lookupAddress, setLookupAddress] = useState("");
  const [lookupPin, setLookupPin] = useState("");

  const [queryResult, setQueryResult] = useState(null);
  const [lookupResult, setLookupResult] = useState(null);
  const [flags, setFlags] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [unmatched, setUnmatched] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadStaticData();
    runInspectionQuery();
    runUniversalLookup();
  }, []);

  async function loadStaticData() {
    try {
      const flagsData = await apiGet("/query/integrity-flags");
      const tasksData = await apiGet("/field-verification");
      const unmatchedData = await apiGet("/activity/unmatched");

      setFlags(flagsData);
      setTasks(tasksData);
      setUnmatched(unmatchedData);
    } catch (error) {
      setMessage("Could not load query intelligence. Check backend.");
      console.error(error);
    }
  }

  async function runInspectionQuery() {
    try {
      const data = await apiGet(
        `/query/flagship?pin=${encodeURIComponent(pin)}&months=${encodeURIComponent(months)}`
      );
      setQueryResult(data);
    } catch (error) {
      setMessage("Inspection query failed. Check backend.");
      console.error(error);
    }
  }

  async function runUniversalLookup() {
    try {
      setMessage("");

      let path = "";

      if (lookupQ.trim()) {
        path = `/lookup?q=${encodeURIComponent(lookupQ.trim())}`;
      } else {
        const params = new URLSearchParams();

        if (lookupName.trim()) params.set("name", lookupName.trim());
        if (lookupAddress.trim()) params.set("address", lookupAddress.trim());
        if (lookupPin.trim()) params.set("pin", lookupPin.trim());

        path = `/lookup?${params.toString()}`;
      }

      const data = await apiGet(path);
      setLookupResult(data);
    } catch (error) {
      setMessage("Universal lookup failed. Enter a record ID, PAN/GSTIN, name, or composite fields.");
      console.error(error);
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
          <p className="eyebrow">Operational Query Layer</p>
          <h1>Risk & Inspection Query</h1>
          <p>
            Demonstrates universal UBID lookup, editable inspection queries, unmatched event
            review and integrity intelligence for government officers.
          </p>
        </div>
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="panel">
        <div className="panel-header">
          <h2>Universal UBID Lookup</h2>
          <p>
            Lookup by department record ID, PAN/GSTIN, business name, or a combination of
            name, address and PIN code.
          </p>
        </div>

        <div className="lookup-grid">
          <div>
            <label className="form-label">Record ID / PAN / GSTIN / Business Name</label>
            <input
              className="search-input"
              value={lookupQ}
              onChange={(event) => setLookupQ(event.target.value)}
              placeholder="Example: SE-560058-1001 or AABCL1234F"
            />
          </div>

          <div className="lookup-divider">OR</div>

          <div>
            <label className="form-label">Name</label>
            <input
              className="search-input"
              value={lookupName}
              onChange={(event) => {
                setLookupName(event.target.value);
                setLookupQ("");
              }}
              placeholder="Example: Lakshmi Precision"
            />
          </div>

          <div>
            <label className="form-label">Address</label>
            <input
              className="search-input"
              value={lookupAddress}
              onChange={(event) => {
                setLookupAddress(event.target.value);
                setLookupQ("");
              }}
              placeholder="Example: Plot 14 Peenya"
            />
          </div>

          <div>
            <label className="form-label">PIN</label>
            <input
              className="search-input"
              value={lookupPin}
              onChange={(event) => {
                setLookupPin(event.target.value);
                setLookupQ("");
              }}
              placeholder="Example: 560058"
            />
          </div>
        </div>

        <button className="btn primary" onClick={runUniversalLookup}>
          Run Universal Lookup
        </button>

        {lookupResult && (
          <div className="lookup-result">
            {!lookupResult.found ? (
              <div className="empty-state">
                No UBID found for this lookup.
              </div>
            ) : (
              <>
                <div className="brief-header">
                  <div>
                    <h3>{lookupResult.ubid}</h3>
                    <p className="muted">
                      Match Type: {lookupResult.matchType} · Confidence:{" "}
                      {Math.round((lookupResult.confidence || 0) * 100)}%
                    </p>
                  </div>

                  <span className={`trust-score ${trustClass(lookupResult.business.trust_score)}`}>
                    {lookupResult.business.trust_score}/100
                  </span>
                </div>

                <div className="recommendation-box">
                  <strong>{lookupResult.business.canonical_name}</strong>
                  <p>{lookupResult.officerBrief?.recommendedAction}</p>
                </div>

                <div className="three-col-mini">
                  <div className="mini-metric">
                    <span>Status</span>
                    <strong>{lookupResult.business.status}</strong>
                  </div>

                  <div className="mini-metric">
                    <span>Risk</span>
                    <strong>{lookupResult.business.risk_level}</strong>
                  </div>

                  <div className="mini-metric">
                    <span>Linked Records</span>
                    <strong>{lookupResult.linkedRecords.length}</strong>
                  </div>
                </div>

                <h4>Linked Department Records</h4>
                <div className="stack">
                  {lookupResult.linkedRecords.map((record) => (
                    <div className="evidence-card" key={record.id}>
                      <strong>{record.source_system}</strong>
                      <span>{record.source_record_id}</span>
                      <p>{record.business_name}</p>
                      <small>{record.explanation}</small>
                    </div>
                  ))}
                </div>

                <h4>Activity Evidence Timeline</h4>
                <div className="stack">
                  {lookupResult.events.length === 0 ? (
                    <div className="empty-state">No activity evidence joined to this UBID.</div>
                  ) : (
                    lookupResult.events.map((event) => (
                      <div className="timeline-card" key={event.id}>
                        <strong>{event.event_type}</strong>
                        <span>
                          {event.source_system} · {event.event_date}
                        </span>
                        <p>{event.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="hero-panel">
        <h2>Editable Inspection Query</h2>
        <p>
          “Show active businesses in a selected PIN code with no inspection in the selected
          number of months.”
        </p>

        <div className="query-controls">
          <div>
            <label className="form-label">PIN Code</label>
            <input
              className="search-input"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Inspection gap in months</label>
            <input
              className="search-input"
              value={months}
              onChange={(event) => setMonths(event.target.value)}
            />
          </div>

          <button className="btn primary" onClick={runInspectionQuery}>
            Run Inspection Query
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Inspection Query Result</h2>
          <p>
            {queryResult
              ? `${queryResult.count} result(s) found for inspection prioritisation.`
              : "Run a query to view results."}
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
            <h2>Unmatched Activity Events</h2>
            <p>
              Events that cannot be confidently joined to a UBID are surfaced for review,
              not silently dropped.
            </p>
          </div>

          {!unmatched ? (
            <div className="empty-state">Loading unmatched events...</div>
          ) : unmatched.total === 0 ? (
            <div className="empty-state">No unmatched activity events found.</div>
          ) : (
            <div className="stack">
              {unmatched.items.map((event) => (
                <div className="verification-task" key={event.id}>
                  <strong>{event.event_type}</strong>
                  <p>{event.description}</p>
                  <small>
                    {event.source_system} · {event.source_record_id} · {event.event_date}
                  </small>
                </div>
              ))}
            </div>
          )}
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
    </section>
  );
}