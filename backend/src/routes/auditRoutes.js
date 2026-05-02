const express = require("express");
const { db } = require("../db");
const { verifyLedger } = require("../engines/auditLedger");

const router = express.Router();

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM audit_ledger ORDER BY id DESC").all();
  res.json({
    verification: verifyLedger(),
    ledger: rows
  });
});

module.exports = router;
