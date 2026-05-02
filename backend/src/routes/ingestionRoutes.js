const express = require("express");
const { db } = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const systems = db
    .prepare(
      `
      SELECT 
        source_system,
        COUNT(*) AS records,
        SUM(raw_pan_present) AS pan_available,
        SUM(raw_gstin_present) AS gstin_available
      FROM department_records
      GROUP BY source_system
      ORDER BY source_system
    `
    )
    .all();

  const records = db
    .prepare("SELECT * FROM department_records ORDER BY id ASC")
    .all();

  res.json({ systems, records });
});

module.exports = router;
