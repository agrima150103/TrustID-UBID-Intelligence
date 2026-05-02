import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api";
import ConfidenceBar from "../components/ConfidenceBar";

export default function Reviewer() {
  const [queue, setQueue] = useState([]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("pending");

  async function loadQueue(preferredFilter = filter) {
    const data = await apiGet("/reviewer");
    setQueue(data);

    const pending = data.filter((item) => item.status === "pending").length;
    const completed = data.filter((item) => item.status === "completed").length;

    if (preferredFilter === "pending" && pending === 0 && completed > 0) {
      setFilter("completed");
    }
  }

  useEffect(() => {
    loadQueue("pending");
  }, []);

  async function decide(id, decision) {
    const label =
      decision === "merge"
        ? "approved for merge"
        : decision === "reject"
        ? "rejected as separate identities"
        : "escalated for field verification";

    await apiPost(`/reviewer/${id}/decision`, { decision });

    setMessage(
      `Admin decision recorded: ${label}. The case moved to Decision Taken and the Trust Ledger was updated.`
    );

    await loadQueue("pending");
  }

  async function reopen(id) {
    await apiPost(`/reviewer/${id}/reopen`);

    setMessage(
      "Admin override recorded: the review case has been reopened. You can now select a new decision."
    );

    setFilter("pending");
    await loadQueue("pending");
  }

  const pendingCount = queue.filter((item) => item.status === "pending").length;
  const completedCount = queue.filter((item) => item.status === "completed").length;

  const filteredQueue = useMemo(() => {
    if (filter === "pending") {
      return queue.filter((item) => item.status === "pending");
    }

    if (filter === "completed") {
      return queue.filter((item) => item.status === "completed");
    }

    return queue;
  }, [queue, filter]);

  function decisionLabel(decision) {
    if (decision === "merge") return "Approved for Merge";
    if (decision === "reject") return "Rejected as Separate Identities";
    if (decision === "escalate") return "Escalated to Field Verification";
    return "No Decision";
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin-Controlled Human Review</p>
          <h1>Admin Review Console</h1>
          <p>
            Ambiguous record pairs are never silently merged. The admin officer can approve,
            reject, escalate, reopen, and change a decision. Every action is stored in the
            tamper-evident Trust Ledger.
          </p>
        </div>

        <div className="status-pill">Role: Admin Officer</div>
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="review-control-bar">
        <button
          className={`btn ${filter === "pending" ? "primary" : "ghost"}`}
          onClick={() => setFilter("pending")}
        >
          Pending Review ({pendingCount})
        </button>

        <button
          className={`btn ${filter === "completed" ? "primary" : "ghost"}`}
          onClick={() => setFilter("completed")}
        >
          Decision Taken ({completedCount})
        </button>

        <button
          className={`btn ${filter === "all" ? "primary" : "ghost"}`}
          onClick={() => setFilter("all")}
        >
          All Cases ({queue.length})
        </button>
      </div>

      <div className="admin-explainer">
        <strong>How this works</strong>
        <p>
          A rejected case is not deleted. It becomes an auditable admin decision. If new
          evidence arrives, the admin can reopen it, review the pair again, and choose a
          different decision. This makes the workflow reversible and government-safe.
        </p>
      </div>

      {filteredQueue.length === 0 ? (
        <div className="panel empty-state">
          No cases in this view. Check “Decision Taken” or “All Cases” to view completed
          decisions.
        </div>
      ) : (
        <div className="review-stack">
          {filteredQueue.map((item) => (
            <div className="review-card" key={item.id}>
              <div className="review-top">
                <div>
                  <h2>Review Candidate #{item.id}</h2>
                  <p>{item.explanation}</p>
                </div>

                <div className="review-status-box">
                  <ConfidenceBar value={item.confidence} />
                  <span
                    className={`review-state ${
                      item.status === "pending" ? "pending" : "completed"
                    }`}
                  >
                    {item.status === "pending"
                      ? "Pending Admin Decision"
                      : decisionLabel(item.reviewer_decision)}
                  </span>
                </div>
              </div>

              <div className="compare-grid">
                <div className="compare-card">
                  <span>{item.a_source}</span>
                  <h3>{item.a_name}</h3>
                  <p>{item.a_address}</p>
                  <small>{item.a_source_id} · PIN {item.a_pin}</small>
                </div>

                <div className="compare-card">
                  <span>{item.b_source}</span>
                  <h3>{item.b_name}</h3>
                  <p>{item.b_address}</p>
                  <small>{item.b_source_id} · PIN {item.b_pin}</small>
                </div>
              </div>

              <div className="admin-note">
                <strong>Admin Interpretation</strong>
                <p>
                  This pair is ambiguous because identity evidence is partial. TrustID does
                  not force a blind merge. The admin decision controls whether this
                  relationship becomes a confirmed link, a rejected link, or a field
                  verification case.
                </p>
              </div>

              <div className="review-actions">
                {item.status === "pending" ? (
                  <>
                    <button className="btn primary" onClick={() => decide(item.id, "merge")}>
                      Approve Merge
                    </button>

                    <button className="btn danger" onClick={() => decide(item.id, "reject")}>
                      Reject Link
                    </button>

                    <button className="btn ghost" onClick={() => decide(item.id, "escalate")}>
                      Escalate to Field Verification
                    </button>
                  </>
                ) : (
                  <>
                    <span className="status-pill">
                      Current Decision: {decisionLabel(item.reviewer_decision)}
                    </span>

                    <button className="btn primary" onClick={() => reopen(item.id)}>
                      Undo / Change Decision
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}