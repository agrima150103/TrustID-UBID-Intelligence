const express = require("express");
const { db } = require("../db");
const { addAuditEvent } = require("../engines/auditLedger");

const router = express.Router();

router.get("/", (req, res) => {
  const queue = db
    .prepare(
      `
      SELECT 
        rq.*,
        a.business_name AS a_name,
        a.address AS a_address,
        a.source_system AS a_source,
        a.source_record_id AS a_source_id,
        a.pin_code AS a_pin,
        b.business_name AS b_name,
        b.address AS b_address,
        b.source_system AS b_source,
        b.source_record_id AS b_source_id,
        b.pin_code AS b_pin
      FROM review_queue rq
      JOIN department_records a ON a.id = rq.record_a
      JOIN department_records b ON b.id = rq.record_b
      ORDER BY rq.confidence DESC
    `
    )
    .all();

  res.json(queue);
});

router.post("/:id/decision", (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;

  if (!["merge", "reject", "escalate"].includes(decision)) {
    return res.status(400).json({ message: "Invalid decision" });
  }

  db.prepare(
    `
    UPDATE review_queue
    SET status = 'completed', reviewer_decision = ?
    WHERE id = ?
  `
  ).run(decision, id);

  addAuditEvent("REVIEWER_DECISION", "government-reviewer", {
    reviewId: id,
    decision
  });

  res.json({ success: true });
});

module.exports = router;
