const express = require("express");
const { db } = require("../db");
const { classifyAllBusinesses } = require("../engines/activityEngine");

const router = express.Router();

router.get("/", (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT 
        u.ubid,
        u.canonical_name,
        u.pin_code,
        u.sector,
        u.status,
        COUNT(ae.id) AS events
      FROM ubids u
      LEFT JOIN activity_events ae ON ae.joined_ubid = u.ubid
      GROUP BY u.ubid
      ORDER BY u.ubid
    `
    )
    .all();

  res.json(rows);
});

router.post("/classify", (req, res) => {
  const results = classifyAllBusinesses();
  res.json(results);
});

module.exports = router;
