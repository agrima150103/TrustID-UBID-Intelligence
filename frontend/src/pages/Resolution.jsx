import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Resolution() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiGet("/dashboard").then(setData);
  }, []);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Blocking → Scoring → Verdict</p>
          <h1>Entity Resolution Pipeline</h1>
          <p>
            TrustID turns fragmented records into UBID clusters using deterministic anchors,
            explainable similarity scoring and human review for ambiguous pairs.
          </p>
        </div>
      </div>

      <div className="pipeline">
        <div className="pipeline-step">
          <span>01</span>
          <h2>Privacy Gateway</h2>
          <p>PAN, GSTIN, proprietor and phone are blind-hashed at ingestion before central matching.</p>
        </div>

        <div className="pipeline-step">
          <span>02</span>
          <h2>Normalization</h2>
          <p>Names and addresses are standardized to reduce spelling, suffix and formatting noise.</p>
        </div>

        <div className="pipeline-step">
          <span>03</span>
          <h2>Blocking</h2>
          <p>Records are compared only inside tractable candidate groups such as PIN code and name prefix.</p>
        </div>

        <div className="pipeline-step">
          <span>04</span>
          <h2>Confidence Scoring</h2>
          <p>Jaro-Winkler, address token overlap, hashed identifier equality and source evidence produce a score.</p>
        </div>

        <div className="pipeline-step">
          <span>05</span>
          <h2>Decision Routing</h2>
          <p>High confidence auto-links, ambiguous pairs go to human review, low confidence stays separate.</p>
        </div>

        <div className="pipeline-step">
          <span>06</span>
          <h2>Audit Commit</h2>
          <p>Every merge, review, classification and scan is stored in a tamper-evident ledger.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Current Pipeline Output</h2>
          <p>Summary generated from the working backend.</p>
        </div>

        {data && (
          <div className="stat-grid">
            <div className="mini-metric">
              <span>Records Processed</span>
              <strong>{data.totalRecords}</strong>
            </div>
            <div className="mini-metric">
              <span>UBIDs Created</span>
              <strong>{data.totalUbids}</strong>
            </div>
            <div className="mini-metric">
              <span>Review Tasks</span>
              <strong>{data.pendingReviews}</strong>
            </div>
            <div className="mini-metric">
              <span>Integrity Flags</span>
              <strong>{data.integrityFlags}</strong>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
