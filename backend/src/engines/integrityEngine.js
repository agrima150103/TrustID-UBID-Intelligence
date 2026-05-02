const { db } = require("../db");
const { addAuditEvent } = require("./auditLedger");

function runIntegrityScan() {
  db.prepare("DELETE FROM integrity_flags").run();

  const ubids = db.prepare("SELECT * FROM ubids").all();

  for (const ubid of ubids) {
    const linkedRecords = db
      .prepare(
        `
        SELECT dr.* 
        FROM ubid_links ul
        JOIN department_records dr ON dr.id = ul.record_id
        WHERE ul.ubid = ?
      `
      )
      .all(ubid.ubid);

    const sectors = new Set(linkedRecords.map((r) => r.sector));
    const sourceSystems = new Set(linkedRecords.map((r) => r.source_system));
    const proprietors = new Set(linkedRecords.map((r) => r.proprietor_hash).filter(Boolean));
    const phones = new Set(linkedRecords.map((r) => r.phone_hash).filter(Boolean));

    if (sourceSystems.size >= 3 && ubid.confidence < 0.9) {
      createFlag(
        ubid.ubid,
        "Cross-Department Ambiguity",
        "Medium",
        "Business appears across three or more departments but confidence is below 90%.",
        { linkedRecords: linkedRecords.map((r) => r.source_record_id) }
      );
    }

    if (sectors.size >= 3) {
      createFlag(
        ubid.ubid,
        "Sector Inconsistency",
        "Medium",
        "Linked records span multiple sector categories, requiring officer verification.",
        { sectors: [...sectors] }
      );
    }

    if (proprietors.size === 1 && phones.size === 1 && linkedRecords.length >= 2) {
      const sameAddressDifferentNames = linkedRecords.some((a) =>
        linkedRecords.some(
          (b) =>
            a.id !== b.id &&
            a.pin_code === b.pin_code &&
            a.business_name !== b.business_name &&
            a.address.split(" ")[0] === b.address.split(" ")[0]
        )
      );

      if (sameAddressDifferentNames) {
        createFlag(
          ubid.ubid,
          "Possible Shell / Front Entity",
          "High",
          "Multiple differently named records share proprietor/phone hash and similar address. This may indicate deliberate fragmentation.",
          {
            names: linkedRecords.map((r) => r.business_name),
            pin: ubid.pin_code
          }
        );
      }
    }
  }

  const suspiciousGroups = db
    .prepare(
      `
      SELECT proprietor_hash, phone_hash, pin_code, COUNT(*) as cnt
      FROM department_records
      WHERE proprietor_hash IS NOT NULL AND phone_hash IS NOT NULL
      GROUP BY proprietor_hash, phone_hash, pin_code
      HAVING cnt >= 3
    `
    )
    .all();

  for (const group of suspiciousGroups) {
    createFlag(
      null,
      "Network-Level Fragmentation",
      "High",
      "Same blind-hashed proprietor and phone appear across three or more records in the same PIN code.",
      group
    );
  }

  addAuditEvent("INTEGRITY_SCAN", "integrity-engine", {
    flagsCreated: db.prepare("SELECT COUNT(*) AS count FROM integrity_flags").get().count
  });

  return db.prepare("SELECT * FROM integrity_flags ORDER BY id DESC").all();
}

function createFlag(ubid, flagType, severity, explanation, evidence) {
  db.prepare(
    `
    INSERT INTO integrity_flags
    (ubid, flag_type, severity, explanation, evidence)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(ubid, flagType, severity, explanation, JSON.stringify(evidence));
}

module.exports = {
  runIntegrityScan
};
