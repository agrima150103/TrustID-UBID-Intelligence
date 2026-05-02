import { useEffect, useState } from "react";
import { apiGet } from "../api";
import ConfidenceBar from "../components/ConfidenceBar";

export default function Registry() {
  const [ubids, setUbids] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiGet("/ubids").then(setUbids);
  }, []);

  async function openDetails(ubid) {
    const details = await apiGet(`/ubids/${ubid}`);
    setSelected(details);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Single Source of Truth</p>
          <h1>UBID Registry</h1>
          <p>
            Canonical business identities generated from fragmented department records.
          </p>
        </div>
      </div>

      <div className="two-col wide-left">
        <div className="panel">
          <div className="panel-header">
            <h2>Resolved Businesses</h2>
            <p>Each UBID represents one real-world business cluster.</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>UBID</th>
                  <th>Name</th>
                  <th>PIN</th>
                  <th>Status</th>
                  <th>Links</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {ubids.map((item) => (
                  <tr key={item.ubid} onClick={() => openDetails(item.ubid)} className="clickable-row">
                    <td>{item.ubid}</td>
                    <td>{item.canonical_name}</td>
                    <td>{item.pin_code}</td>
                    <td>
                      <span className={`status-chip ${item.status.toLowerCase().replace(" ", "-")}`}>
                        {item.status}
                      </span>
                    </td>
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
            <h2>Evidence Trail</h2>
            <p>Click a UBID to inspect linked records, events and integrity flags.</p>
          </div>

          {!selected ? (
            <div className="empty-state">Select a UBID from the registry.</div>
          ) : (
            <div>
              <h3>{selected.business.ubid}</h3>
              <p className="muted">{selected.business.canonical_name}</p>

              <h4>Linked Records</h4>
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

              <h4>Activity Events</h4>
              <div className="stack">
                {selected.events.map((event) => (
                  <div className="timeline-card" key={event.id}>
                    <span>{event.event_date}</span>
                    <strong>{event.event_type}</strong>
                    <p>{event.description}</p>
                  </div>
                ))}
              </div>

              <h4>Integrity Flags</h4>
              <div className="stack">
                {selected.flags.map((flag) => (
                  <div className={`flag-card ${flag.severity.toLowerCase()}`} key={flag.id}>
                    <strong>{flag.flag_type}</strong>
                    <p>{flag.explanation}</p>
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
