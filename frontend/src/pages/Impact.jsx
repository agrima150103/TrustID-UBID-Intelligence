import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Impact() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiGet("/impact").then(setData);
  }, []);

  if (!data) return <div className="loading">Loading impact view...</div>;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Policy Impact View</p>
          <h1>Before vs After TrustID</h1>
          <p>
            Shows how fragmented department records become a usable governance intelligence
            layer for Karnataka Commerce & Industry.
          </p>
        </div>
      </div>

      <div className="impact-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Before TrustID</h2>
            <p>Disconnected systems with no reliable cross-department business identity.</p>
          </div>

          <div className="impact-list">
            {data.before.map((item, index) => (
              <div className="impact-row before" key={index}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>After TrustID</h2>
            <p>Evidence-backed UBIDs, activity intelligence and integrity monitoring.</p>
          </div>

          <div className="impact-list">
            {data.after.map((item, index) => (
              <div className="impact-row after" key={index}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>PIN-Level Governance Intelligence</h2>
          <p>Inspection and integrity focus areas for industrial clusters.</p>
        </div>

        <div className="pin-grid">
          {data.pinIntelligence.map((pin) => (
            <div className="pin-card" key={pin.pin}>
              <span>{pin.pin}</span>
              <h3>{pin.area}</h3>
              <div className="pin-metrics">
                <p>Active: <strong>{pin.active}</strong></p>
                <p>Dormant: <strong>{pin.dormant}</strong></p>
                <p>Closed: <strong>{pin.closed}</strong></p>
                <p>Flags: <strong>{pin.flags}</strong></p>
              </div>
              <div className={`inspection-gap ${pin.inspectionGap.toLowerCase()}`}>
                Inspection Gap: {pin.inspectionGap}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Policy Insights Generated</h2>
          <p>TrustID converts raw fragmented records into officer-ready intelligence.</p>
        </div>

        <div className="insight-grid">
          {data.policyInsights.map((insight, index) => (
            <div className="insight-card" key={index}>
              <h3>{insight.title}</h3>
              <p>{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}