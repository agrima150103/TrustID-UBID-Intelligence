const CryptoJS = require("crypto-js");
const { db } = require("../db");

function hashEntry(eventType, actor, payload, previousHash) {
  return CryptoJS.SHA256(
    JSON.stringify({
      eventType,
      actor,
      payload,
      previousHash,
      timestamp: new Date().toISOString()
    })
  ).toString();
}

function addAuditEvent(eventType, actor, payloadObject) {
  const last = db
    .prepare("SELECT current_hash FROM audit_ledger ORDER BY id DESC LIMIT 1")
    .get();

  const previousHash = last ? last.current_hash : "GENESIS";
  const payload = JSON.stringify(payloadObject);
  const currentHash = hashEntry(eventType, actor, payload, previousHash);

  db.prepare(`
    INSERT INTO audit_ledger 
    (event_type, actor, payload, previous_hash, current_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(eventType, actor, payload, previousHash, currentHash);

  return currentHash;
}

function verifyLedger() {
  const rows = db.prepare("SELECT * FROM audit_ledger ORDER BY id ASC").all();

  for (let i = 0; i < rows.length; i++) {
    const expectedPrevious = i === 0 ? "GENESIS" : rows[i - 1].current_hash;

    if (rows[i].previous_hash !== expectedPrevious) {
      return {
        valid: false,
        brokenAt: rows[i].id,
        reason: "Previous hash mismatch"
      };
    }
  }

  return {
    valid: true,
    entries: rows.length,
    rootHash: rows.length ? rows[rows.length - 1].current_hash : "GENESIS"
  };
}

module.exports = {
  addAuditEvent,
  verifyLedger
};
