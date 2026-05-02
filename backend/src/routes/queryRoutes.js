const express = require("express");
const { db } = require("../db");

const router = express.Router();

router.get("/flagship", (req, res) => {
  const pin = req.query.pin || "560058";
  const months = Number(req.query.months || 18);

  const rows = db
    .prepare(
      `
      SELECT 
        u.*,
        MAX(ae.event_date) AS latest_event_date,
        SUM(CASE WHEN ae.event_type = 'Inspection' THEN 1 ELSE 0 END) AS inspection_count
      FROM ubids u
      LEFT JOIN activity_events ae ON ae.joined_ubid = u.ubid
      WHERE u.pin_code = ?
      GROUP BY u.ubid
      HAVING u.status = 'Active'
    `
    )
    .all(pin);

  const cutoff = new Date("2026-05-01");
  cutoff.setMonth(cutoff.getMonth() - months);

  const result = rows.filter((row) => {
    const inspections = db
      .prepare(
        `
        SELECT *
        FROM activity_events
        WHERE joined_ubid = ?
        AND event_type = 'Inspection'
        ORDER BY event_date DESC
      `
      )
      .all(row.ubid);

    if (!inspections.length) return true;

    const latestInspection = new Date(inspections[0].event_date);
    return latestInspection < cutoff;
  });

  res.json({
    query: `Active businesses in PIN ${pin} with no inspection in ${months} months`,
    count: result.length,
    results: result
  });
});

router.get("/integrity-flags", (req, res) => {
  const rows = db.prepare("SELECT * FROM integrity_flags ORDER BY id DESC").all();
  res.json(rows);
});

module.exports = router;
