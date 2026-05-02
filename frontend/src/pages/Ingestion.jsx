import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Ingestion() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiGet("/ingestion").then(setData);
  }, []);

  if (!data) return <div className="loading">Loading ingestion layer...</div>;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Read-only Department Adapters</p>
          <h1>Data Ingestion View</h1>
          <p>
            Simulates Shop Establishment, Factories, Labour, KSPCB, BESCOM, BWSSB and Food Safety
            data entering TrustID without modifying source systems.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Source System Health</h2>
          <p>Identifier availability differs by department, which is why UBID cannot rely only on PAN/GSTIN.</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Department System</th>
                <th>Records</th>
                <th>PAN Available</th>
                <th>GSTIN Available</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {data.systems.map((system) => (
                <tr key={system.source_system}>
                  <td>{system.source_system}</td>
                  <td>{system.records}</td>
                  <td>{system.pan_available || 0}</td>
                  <td>{system.gstin_available || 0}</td>
                  <td>
                    <span className="evidence-badge green">Read-only API / Batch</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Raw Department Records</h2>
          <p>Notice naming variation, missing identifiers, inconsistent sectors and address formatting.</p>
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
