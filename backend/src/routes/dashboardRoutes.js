const express = require("express");
const { db } = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const totalRecords = db.prepare("SELECT COUNT(*) AS count FROM department_records").get().count;
  const totalUbids = db.prepare("SELECT COUNT(*) AS count FROM ubids").get().count;
  const pendingReviews = db
    .prepare("SELECT COUNT(*) AS count FROM review_queue WHERE status = 'pending'")
    .get().count;
  const integrityFlags = db.prepare("SELECT COUNT(*) AS count FROM integrity_flags").get().count;

  const statuses = db
    .prepare(
      `
      SELECT status, COUNT(*) AS count
      FROM ubids
      GROUP BY status
    `
    )
    .all();

  const systems = db
    .prepare(
      `
      SELECT source_system, COUNT(*) AS count
      FROM department_records
      GROUP BY source_system
      ORDER BY count DESC
    `
    )
    .all();

  res.json({
    totalRecords,
    totalUbids,
    pendingReviews,
    integrityFlags,
    statuses,
    systems
  });
});

module.exports = router;
