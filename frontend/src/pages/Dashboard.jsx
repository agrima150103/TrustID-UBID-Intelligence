import { useEffect, useState } from "react";
import { apiGet } from "../api";
import StatCard from "../components/StatCard";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3e7d60", "#f7f7d5", "#c7e1d5", "#eef8fe", "#1c2d5c", "#4f7c82"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    apiGet("/dashboard").then(setData);
    apiGet("/impact").then(setImpact);
  }, []);

  if (!data) return <div className="loading">Loading command center...</div>;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Government Mission Control</p>
          <h1>TrustID Command Center</h1>
          <p>
            Unified Business Identifier resolution, activity intelligence, trust scoring,
            field verification and tamper-evident governance monitoring across fragmented
            Karnataka department systems.
          </p>
        </div>

        <div className="status-pill">Live Sandbox Prototype</div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Department Records"
          value={data.totalRecords}
          helper="Read-only ingested"
        />
        <StatCard
          label="Resolved UBIDs"
          value={data.totalUbids}
          helper="Canonical businesses"
          tone="green"
        />
        <StatCard
          label="Pending Reviews"
          value={data.pendingReviews}
          helper="Officer review queue"
          tone="yellow"
        />
        <StatCard
          label="Integrity Flags"
          value={data.integrityFlags}
          helper="Shell/entity risk signals"
          tone="red"
        />
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <h2>Activity Status Distribution</h2>
            <p>
              Active, Dormant, Closed and Low Evidence status derived from inspection,
              renewal, filing and utility activity signals.
            </p>
          </div>

          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.statuses}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {data.statuses.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid rgba(28,45,92,0.15)",
                    borderRadius: "12px",
                    color: "#172033"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Connected Department Systems</h2>
            <p>
              Each feed uses its own identifiers and schema. TrustID resolves across them
              without source modification.
            </p>
          </div>

          <div className="system-list">
            {data.systems.map((system) => (
              <div className="system-row" key={system.source_system}>
                <span>{system.source_system}</span>
                <strong>{system.count} records</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {impact && (
        <div className="panel">
          <div className="panel-header">
            <h2>Policy Intelligence Summary</h2>
            <p>
              TrustID converts fragmented records into actionable governance intelligence.
            </p>
          </div>

          <div className="insight-grid">
            {impact.policyInsights.map((insight, index) => (
              <div className="insight-card" key={index}>
                <h3>{insight.title}</h3>
                <p>{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hero-panel">
        <h2>Why TrustID is different</h2>
        <p>
          Most UBID systems stop at record matching. TrustID goes further: it tells officers
          whether the identity is trustworthy, whether the business is active, whether a field
          verification is needed, and whether every decision can be defended in audit through
          a tamper-evident decision ledger.
        </p>
      </div>
    </section>
  );
}