const { db, initDb } = require("./db");
const { records, events } = require("../data/seedData");
const { normalizeText, scorePair } = require("./engines/matcher");
const { addAuditEvent } = require("./engines/auditLedger");
const { classifyAllBusinesses } = require("./engines/activityEngine");
const { runIntegrityScan } = require("./engines/integrityEngine");

function resetDb() {
  db.exec(`
    DROP TABLE IF EXISTS department_records;
    DROP TABLE IF EXISTS ubids;
    DROP TABLE IF EXISTS ubid_links;
    DROP TABLE IF EXISTS review_queue;
    DROP TABLE IF EXISTS activity_events;
    DROP TABLE IF EXISTS integrity_flags;
    DROP TABLE IF EXISTS audit_ledger;
  `);

  initDb();
}

function insertRecords() {
  const stmt = db.prepare(`
    INSERT INTO department_records
    (
      source_system, source_record_id, business_name, normalized_name,
      address, pin_code, district, sector, pan_hash, gstin_hash,
      proprietor_hash, phone_hash, raw_pan_present, raw_gstin_present
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of records) {
    stmt.run(
      r.source_system,
      r.source_record_id,
      r.business_name,
      normalizeText(r.business_name),
      r.address,
      r.pin_code,
      r.district,
      r.sector,
      r.pan_hash,
      r.gstin_hash,
      r.proprietor_hash,
      r.phone_hash,
      r.raw_pan_present,
      r.raw_gstin_present
    );
  }

  addAuditEvent("DATA_INGESTED", "seed-script", {
    records: records.length,
    systems: [...new Set(records.map((r) => r.source_system))]
  });
}

function generateUbid(index) {
  return `KA-UBID-${String(index).padStart(5, "0")}`;
}

function runResolution() {
  const allRecords = db.prepare("SELECT * FROM department_records").all();
  const used = new Set();
  let ubidCounter = 1;

  for (const record of allRecords) {
    if (used.has(record.id)) continue;

    const cluster = [record];
    used.add(record.id);

    for (const candidate of allRecords) {
      if (record.id === candidate.id || used.has(candidate.id)) continue;
      if (record.pin_code !== candidate.pin_code) continue;

      const result = scorePair(record, candidate);

      if (result.decision === "auto_link") {
        cluster.push(candidate);
        used.add(candidate.id);
      } else if (result.decision === "review") {
        db.prepare(
          `
          INSERT INTO review_queue
          (record_a, record_b, confidence, explanation)
          VALUES (?, ?, ?, ?)
        `
        ).run(record.id, candidate.id, result.score, result.explanation);

        addAuditEvent("REVIEW_CREATED", "matcher-engine", {
          recordA: record.source_record_id,
          recordB: candidate.source_record_id,
          confidence: result.score,
          explanation: result.explanation
        });
      }
    }

    const ubid = generateUbid(ubidCounter++);
    const avgConfidence =
      cluster.length === 1
        ? 1
        : cluster.reduce((sum, current, idx) => {
            if (idx === 0) return sum;
            return sum + scorePair(cluster[0], current).score;
          }, 0) /
          (cluster.length - 1);

    db.prepare(
      `
      INSERT INTO ubids
      (ubid, canonical_name, canonical_address, pin_code, district, sector, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      ubid,
      cluster[0].business_name,
      cluster[0].address,
      cluster[0].pin_code,
      cluster[0].district,
      cluster[0].sector,
      Number(avgConfidence.toFixed(3))
    );

    for (const item of cluster) {
      const linkScore = item.id === cluster[0].id ? 1 : scorePair(cluster[0], item).score;

      db.prepare(
        `
        INSERT INTO ubid_links
        (ubid, record_id, confidence, decision, explanation)
        VALUES (?, ?, ?, ?, ?)
      `
      ).run(
        ubid,
        item.id,
        linkScore,
        "auto_link",
        item.id === cluster[0].id
          ? "Seed record selected as canonical representative"
          : scorePair(cluster[0], item).explanation
      );
    }

    addAuditEvent("UBID_CREATED", "matcher-engine", {
      ubid,
      clusterSize: cluster.length,
      canonicalName: cluster[0].business_name
    });
  }
}

function insertEvents() {
  const stmt = db.prepare(`
    INSERT INTO activity_events
    (source_system, source_record_id, event_type, event_date, signal_strength, description, joined_ubid, join_confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const event of events) {
    const link = db
      .prepare(
        `
        SELECT ul.ubid, ul.confidence
        FROM ubid_links ul
        JOIN department_records dr ON dr.id = ul.record_id
        WHERE dr.source_record_id = ?
        LIMIT 1
      `
      )
      .get(event.source_record_id);

    stmt.run(
      event.source_system,
      event.source_record_id,
      event.event_type,
      event.event_date,
      event.signal_strength,
      event.description,
      link ? link.ubid : null,
      link ? link.confidence : 0
    );
  }

  addAuditEvent("ACTIVITY_EVENTS_INGESTED", "seed-script", {
    events: events.length
  });
}

function main() {
  resetDb();
  insertRecords();
  runResolution();
  insertEvents();
  classifyAllBusinesses();
  runIntegrityScan();

  console.log("TrustID database seeded successfully.");
}

main();
