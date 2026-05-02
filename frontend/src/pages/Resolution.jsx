import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api";

function normalizeText(value) {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(
      /\b(pvt|private|limited|ltd|llp|m\/s|ms|industries|industry|enterprise|enterprises|products|co|company)\b/g,
      ""
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;

      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;

  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  transpositions /= 2;

  const jaro =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions) / matches) /
    3;

  let prefix = 0;

  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

function tokenSimilarity(a, b) {
  const tokensA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeText(b).split(" ").filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;

  return intersection / union;
}

function scorePair(a, b) {
  const nameScore = jaroWinkler(
    normalizeText(a.business_name),
    normalizeText(b.business_name)
  );

  const addressScore = tokenSimilarity(a.address, b.address);
  const panMatch = a.pan_hash && b.pan_hash && a.pan_hash === b.pan_hash;
  const gstinMatch = a.gstin_hash && b.gstin_hash && a.gstin_hash === b.gstin_hash;
  const phoneMatch = a.phone_hash && b.phone_hash && a.phone_hash === b.phone_hash;
  const proprietorMatch =
    a.proprietor_hash && b.proprietor_hash && a.proprietor_hash === b.proprietor_hash;
  const pinMatch = a.pin_code === b.pin_code;
  const sectorMatch = a.sector === b.sector;

  let score = 0;

  if (panMatch) score += 0.35;
  if (gstinMatch) score += 0.35;

  score += nameScore * 0.18;
  score += addressScore * 0.16;

  if (pinMatch) score += 0.08;
  if (sectorMatch) score += 0.04;
  if (phoneMatch) score += 0.08;
  if (proprietorMatch) score += 0.08;

  score = Math.min(score, 1);

  let decision = "Reject";
  if (score >= 0.9 || panMatch || gstinMatch) decision = "Auto-Link";
  else if (score >= 0.6) decision = "Admin Review";

  return {
    nameScore,
    addressScore,
    panMatch,
    gstinMatch,
    phoneMatch,
    proprietorMatch,
    pinMatch,
    sectorMatch,
    score,
    decision
  };
}

export default function Resolution() {
  const [records, setRecords] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    apiGet("/ingestion").then((data) => setRecords(data.records || []));
    apiGet("/dashboard").then(setDashboard);
  }, []);

  const pairs = useMemo(() => {
    const generated = [];

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        if (records[i].pin_code !== records[j].pin_code) continue;

        const scored = scorePair(records[i], records[j]);

        generated.push({
          id: `${records[i].id}-${records[j].id}`,
          a: records[i],
          b: records[j],
          ...scored
        });
      }
    }

    return generated.sort((x, y) => y.score - x.score).slice(0, 5);
  }, [records]);

  function percent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function decisionClass(decision) {
    if (decision === "Auto-Link") return "trusted";
    if (decision === "Admin Review") return "monitoring";
    return "high-risk";
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Blocking → Scoring → Verdict</p>
          <h1>Identity Resolution</h1>
          <p>
            TrustID turns fragmented records into UBID clusters using privacy-preserving
            identifiers, explainable similarity scoring, and admin review for ambiguous cases.
          </p>
        </div>
      </div>

      <div className="pipeline">
        <div className="pipeline-step">
          <span>01</span>
          <h2>Privacy Gateway</h2>
          <p>PAN, GSTIN, proprietor and phone are blind-hashed before central matching.</p>
        </div>

        <div className="pipeline-step">
          <span>02</span>
          <h2>Normalization</h2>
          <p>Names and addresses are cleaned to reduce spelling, suffix and formatting noise.</p>
        </div>

        <div className="pipeline-step">
          <span>03</span>
          <h2>Blocking</h2>
          <p>Records are compared inside tractable candidate groups such as the same PIN code.</p>
        </div>

        <div className="pipeline-step">
          <span>04</span>
          <h2>Confidence Scoring</h2>
          <p>Jaro-Winkler, address overlap, identifier hashes and source evidence produce a score.</p>
        </div>

        <div className="pipeline-step">
          <span>05</span>
          <h2>Decision Routing</h2>
          <p>High confidence auto-links, ambiguous cases go to admin review, weak pairs stay separate.</p>
        </div>

        <div className="pipeline-step">
          <span>06</span>
          <h2>Audit Commit</h2>
          <p>Every merge, review, classification and field task is stored in the Trust Ledger.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Model Governance Rules</h2>
          <p>
            TrustID is designed for government use, so the matching engine follows conservative,
            explainable and auditable rules.
          </p>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <span>Rule 01</span>
            <h3>No silent low-confidence merge</h3>
            <p>
              Records below the review threshold are not merged automatically, even if they look
              similar.
            </p>
          </div>

          <div className="governance-card">
            <span>Rule 02</span>
            <h3>Admin review for ambiguity</h3>
            <p>
              Pairs with partial identity evidence are routed to Admin Review instead of being
              force-linked.
            </p>
          </div>

          <div className="governance-card">
            <span>Rule 03</span>
            <h3>Low evidence is not closure</h3>
            <p>
              Absence of recent signals is surfaced as Low Evidence or Dormant rather than blindly
              marking a business closed.
            </p>
          </div>

          <div className="governance-card">
            <span>Rule 04</span>
            <h3>Every decision is auditable</h3>
            <p>
              Merges, rejections, escalations, trust scores and field tasks are recorded in the
              Trust Ledger.
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Live Matching Preview</h2>
          <p>
            Top candidate pairs generated from the actual ingested department records. This makes
            the entity resolution engine explainable instead of black-box.
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Record A</th>
                <th>Record B</th>
                <th>Name Score</th>
                <th>Address Score</th>
                <th>PAN</th>
                <th>GSTIN</th>
                <th>Phone</th>
                <th>Final Score</th>
                <th>Decision</th>
              </tr>
            </thead>

            <tbody>
              {pairs.map((pair) => (
                <tr key={pair.id}>
                  <td>
                    <strong>{pair.a.business_name}</strong>
                    <br />
                    <small>
                      {pair.a.source_system} · {pair.a.source_record_id}
                    </small>
                  </td>
                  <td>
                    <strong>{pair.b.business_name}</strong>
                    <br />
                    <small>
                      {pair.b.source_system} · {pair.b.source_record_id}
                    </small>
                  </td>
                  <td>{percent(pair.nameScore)}</td>
                  <td>{percent(pair.addressScore)}</td>
                  <td>{pair.panMatch ? "Match" : "No"}</td>
                  <td>{pair.gstinMatch ? "Match" : "No"}</td>
                  <td>{pair.phoneMatch ? "Match" : "No"}</td>
                  <td>
                    <span className={`trust-score ${decisionClass(pair.decision)}`}>
                      {percent(pair.score)}
                    </span>
                  </td>
                  <td>
                    <span className={`trust-score ${decisionClass(pair.decision)}`}>
                      {pair.decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dashboard && (
        <div className="panel">
          <div className="panel-header">
            <h2>Current Pipeline Output</h2>
            <p>Summary generated from the working backend.</p>
          </div>

          <div className="stat-grid">
            <div className="mini-metric">
              <span>Records Processed</span>
              <strong>{dashboard.totalRecords}</strong>
            </div>

            <div className="mini-metric">
              <span>UBIDs Created</span>
              <strong>{dashboard.totalUbids}</strong>
            </div>

            <div className="mini-metric">
              <span>Admin Review Cases</span>
              <strong>{dashboard.pendingReviews}</strong>
            </div>

            <div className="mini-metric">
              <span>Integrity Flags</span>
              <strong>{dashboard.integrityFlags}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}