const express = require("express");
const { db } = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const ubids = db
    .prepare(
      `
      SELECT 
        u.*,
        COUNT(ul.id) AS linked_records
      FROM ubids u
      LEFT JOIN ubid_links ul ON ul.ubid = u.ubid
      GROUP BY u.ubid
      ORDER BY u.id ASC
    `
    )
    .all();

  res.json(ubids);
});

router.get("/:ubid", (req, res) => {
  const { ubid } = req.params;

  const business = db.prepare("SELECT * FROM ubids WHERE ubid = ?").get(ubid);

  if (!business) {
    return res.status(404).json({ message: "UBID not found" });
  }

  const linkedRecords = db
    .prepare(
      `
      SELECT dr.*, ul.confidence, ul.explanation
      FROM ubid_links ul
      JOIN department_records dr ON dr.id = ul.record_id
      WHERE ul.ubid = ?
      ORDER BY dr.source_system
    `
    )
    .all(ubid);

  const events = db
    .prepare(
      `
      SELECT *
      FROM activity_events
      WHERE joined_ubid = ?
      ORDER BY event_date DESC
    `
    )
    .all(ubid);

  const flags = db
    .prepare(
      `
      SELECT *
      FROM integrity_flags
      WHERE ubid = ? OR ubid IS NULL
      ORDER BY id DESC
    `
    )
    .all(ubid);

  res.json({
    business,
    linkedRecords,
    events,
    flags
  });
});

module.exports = router;
