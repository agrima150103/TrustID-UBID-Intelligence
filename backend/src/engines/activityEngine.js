const { db } = require("../db");
const { addAuditEvent } = require("./auditLedger");

function monthsBetween(dateString, currentDate = new Date("2026-05-01")) {
  const d = new Date(dateString);
  return (
    (currentDate.getFullYear() - d.getFullYear()) * 12 +
    (currentDate.getMonth() - d.getMonth())
  );
}

function classifyBusiness(ubid) {
  const events = db
    .prepare(
      `
      SELECT * FROM activity_events
      WHERE joined_ubid = ?
      ORDER BY event_date DESC
    `
    )
    .all(ubid);

  if (!events.length) {
    return {
      status: "Low Evidence",
      score: 0,
      explanation: "No confidently joined activity events found"
    };
  }

  let score = 0;
  const evidence = [];

  for (const event of events) {
    const ageMonths = monthsBetween(event.event_date);
    const recencyWeight = Math.max(0, 1 - ageMonths / 36);
    const contribution = event.signal_strength * recencyWeight;
    score += contribution;

    evidence.push({
      type: event.event_type,
      date: event.event_date,
      source: event.source_system,
      contribution: Number(contribution.toFixed(2)),
      description: event.description
    });
  }

  let status = "Dormant";

  const hasClosure = events.some((event) =>
    event.event_type.toLowerCase().includes("closure")
  );

  const latestAge = Math.min(...events.map((event) => monthsBetween(event.event_date)));

  if (hasClosure) status = "Closed";
  else if (latestAge <= 12 && score >= 3) status = "Active";
  else if (latestAge > 30 && score < 2) status = "Closed";
  else status = "Dormant";

  const explanation = `Status derived from ${events.length} activity event(s), latest event ${latestAge} month(s) old, weighted activity score ${score.toFixed(
    2
  )}.`;

  db.prepare("UPDATE ubids SET status = ? WHERE ubid = ?").run(status, ubid);

  addAuditEvent("ACTIVITY_CLASSIFICATION", "activity-engine", {
    ubid,
    status,
    score: Number(score.toFixed(2)),
    evidence
  });

  return {
    status,
    score: Number(score.toFixed(2)),
    explanation,
    evidence
  };
}

function classifyAllBusinesses() {
  const ubids = db.prepare("SELECT ubid FROM ubids").all();
  return ubids.map((row) => ({
    ubid: row.ubid,
    ...classifyBusiness(row.ubid)
  }));
}

module.exports = {
  classifyBusiness,
  classifyAllBusinesses
};
