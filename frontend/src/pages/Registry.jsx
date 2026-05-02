import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api";
import ConfidenceBar from "../components/ConfidenceBar";

export default function Registry() {
  const [ubids, setUbids] = useState([]);
  const [selected, setSelected] = useState(null);
  const [task, setTask] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiGet("/ubids").then(setUbids);
  }, []);

  async function openDetails(ubid) {
    const details = await apiGet(`/ubids/${ubid}`);
    setSelected(details);
    setTask(null);
  }

  async function createVerificationTask() {
    if (!selected?.business?.ubid) return;

    const result = await apiPost(`/ubids/${selected.business.ubid}/field-verification`);
    setTask(result);
  }

  function exportOfficerBrief() {
    if (!selected) return;

    const brief = selected.officerBrief;

    const lines = [
      "TRUSTID OFFICER DECISION BRIEF",
      "================================",
      "",
      `UBID: ${selected.business.ubid}`,
      `Business: ${selected.business.canonical_name}`,
      `Status: ${selected.business.status}`,
      `Trust Score: ${selected.business.trust_score}/100`,
      `Risk Level: ${selected.business.risk_level}`,
      "",
      "Recommended Officer Action:",
      brief?.recommendedAction || "No recommendation available.",
      "",
      "Identity Evidence:",
      ...(brief?.identityEvidence || []).map(
        (item, index) => `${index + 1}. ${item.title} - ${item.detail}`
      ),
      "",
      "Activity Evidence:",
      ...(brief?.activityEvidence || []).map(
        (item, index) => `${index + 1}. ${item.title} - ${item.detail}`
      ),
      "",
      "Risk Evidence:",
      ...(brief?.riskEvidence || []).map(
        (item, index) => `${index + 1}. ${item.title} - ${item.detail}`
      ),
      "",
      "Linked Department Records:",
      ...(selected.linkedRecords || []).map(
        (record, index) =>
          `${index + 1}. ${record.source_system} | ${record.source_record_id} | ${record.business_name}`
      )
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${selected.business.ubid}-officer-brief.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const filteredUbids = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return ubids;

    return ubids.filter((item) => {
      return (
        item.ubid.toLowerCase().includes(term) ||
        item.canonical_name.toLowerCase().includes(term) ||
        item.pin_code.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term) ||
        item.risk_level.toLowerCase().includes(term)
      );
    });
  }, [ubids, search]);

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
          <p className="eyebrow">Single Source of Truth</p>
          <h1>Business Registry</h1>
          <p>
            Canonical business identities generated from fragmented department records,
            enriched with trust score, risk level, and officer-ready evidence.
          </p>
        </div>
      </div>

      <div className="two-col wide-left">
        <div className="panel">
          <div className="panel-header">
            <h2>Resolved Businesses</h2>
            <p>Search by business name, UBID, PIN, status or risk level.</p>
          </div>

          <input
            className="search-input"
            placeholder="Search business, UBID, PIN, status, risk..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="registry-count">
            Showing {filteredUbids.length} of {ubids.length} UBIDs
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>UBID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Trust Score</th>
                  <th>Risk</th>
                  <th>Links</th>
                  <th>Confidence</th>
                </tr>
              </thead>

              <tbody>
                {filteredUbids.map((item) => (
                  <tr
                    key={item.ubid}
                    onClick={() => openDetails(item.ubid)}
                    className="clickable-row"
                  >
                    <td>{item.ubid}</td>
                    <td>{item.canonical_name}</td>
                    <td>
                      <span
                        className={`status-chip ${item.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className={`trust-score ${trustClass(item.trust_score)}`}>
                        {item.trust_score}/100
                      </span>
                    </td>
                    <td>{item.risk_level}</td>
                    <td>{item.linked_records}</td>
                    <td>
                      <ConfidenceBar value={item.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel detail-panel">
          <div className="panel-header">
            <h2>Officer Decision Brief</h2>
            <p>Click a UBID to inspect evidence, risk, and recommended action.</p>
          </div>

          {!selected ? (
            <div className="empty-state">Select a UBID from the registry.</div>
          ) : (
            <div>
              <div className="brief-header">
                <div>
                  <h3>{selected.business.ubid}</h3>
                  <p className="muted">{selected.business.canonical_name}</p>
                </div>

                <span className={`trust-score ${trustClass(selected.business.trust_score)}`}>
                  {selected.business.trust_score}/100
                </span>
              </div>

              <div className="recommendation-box">
                <strong>Recommended Officer Action</strong>
                <p>{selected.officerBrief?.recommendedAction}</p>
              </div>

              <div className="brief-actions">
                <button className="btn primary" onClick={createVerificationTask}>
                  Generate Field Verification Task
                </button>

                <button className="btn ghost" onClick={exportOfficerBrief}>
                  Download Officer Brief
                </button>
              </div>

              {task && (
                <div className="verification-task">
                  <strong>{task.task_id}</strong>
                  <p>{task.officer_action}</p>
                  <small>Priority: {task.priority} · Status: {task.status}</small>
                </div>
              )}

              <h4>Why these records were linked</h4>
              <div className="stack">
                {selected.officerBrief?.identityEvidence?.map((item, index) => (
                  <div className="evidence-card" key={index}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>

              <h4>Why this activity status was assigned</h4>
              <div className="stack">
                {selected.officerBrief?.activityEvidence?.map((item, index) => (
                  <div className="timeline-card" key={index}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>

              <h4>Integrity & Risk Signals</h4>
              <div className="stack">
                {selected.officerBrief?.riskEvidence?.map((item, index) => (
                  <div className="flag-card medium" key={index}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>

              <h4>Linked Department Records</h4>
              <div className="stack">
                {selected.linkedRecords.map((record) => (
                  <div className="evidence-card" key={record.id}>
                    <strong>{record.source_system}</strong>
                    <span>{record.source_record_id}</span>
                    <p>{record.business_name}</p>
                    <small>{record.explanation}</small>
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