const express = require("express");
const cors = require("cors");
const CryptoJS = require("crypto-js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const SALT = "TRUSTID_KARNATAKA_SANDBOX_SALT";

function blindHash(value) {
  if (!value) return null;
  return CryptoJS.SHA256(`${SALT}:${String(value).trim().toUpperCase()}`).toString();
}

function normalizeText(value) {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(
      /\b(pvt|private|limited|ltd|llp|m\/s|ms|industries|industry|enterprise|enterprises|products|co|company)\b/g,
      ""
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;

      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;

  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  transpositions /= 2;

  const jaro =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions) / matches) /
    3;

  let prefix = 0;

  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

function tokenSimilarity(a, b) {
  const tokensA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeText(b).split(" ").filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;

  return intersection / union;
}

function scorePair(a, b) {
  const samePan = a.pan_hash && b.pan_hash && a.pan_hash === b.pan_hash;
  const sameGstin = a.gstin_hash && b.gstin_hash && a.gstin_hash === b.gstin_hash;
  const samePhone = a.phone_hash && b.phone_hash && a.phone_hash === b.phone_hash;
  const sameProprietor =
    a.proprietor_hash && b.proprietor_hash && a.proprietor_hash === b.proprietor_hash;

  const nameScore = jaroWinkler(
    normalizeText(a.business_name),
    normalizeText(b.business_name)
  );

  const addressScore = tokenSimilarity(a.address, b.address);
  const pinScore = a.pin_code === b.pin_code ? 1 : 0;
  const sectorScore = a.sector === b.sector ? 1 : 0;

  let score = 0;

  if (samePan) score += 0.35;
  if (sameGstin) score += 0.35;

  score += nameScore * 0.18;
  score += addressScore * 0.16;
  score += pinScore * 0.08;
  score += sectorScore * 0.04;

  if (samePhone) score += 0.08;
  if (sameProprietor) score += 0.08;

  score = Math.min(score, 1);

  let decision = "reject";
  if (score >= 0.9 || samePan || sameGstin) decision = "auto_link";
  else if (score >= 0.6) decision = "review";

  const reasons = [];

  if (samePan) reasons.push("PAN blind-hash matched");
  if (sameGstin) reasons.push("GSTIN blind-hash matched");
  if (samePhone) reasons.push("Phone blind-hash matched");
  if (sameProprietor) reasons.push("Proprietor blind-hash matched");
  if (nameScore > 0.8) reasons.push(`High name similarity ${Math.round(nameScore * 100)}%`);
  if (addressScore > 0.5) {
    reasons.push(`Address token overlap ${Math.round(addressScore * 100)}%`);
  }
  if (pinScore) reasons.push("Same PIN code");
  if (sectorScore) reasons.push("Same sector");

  return {
    score: Number(score.toFixed(3)),
    decision,
    features: {
      nameScore: Number(nameScore.toFixed(3)),
      addressScore: Number(addressScore.toFixed(3)),
      samePan: Boolean(samePan),
      sameGstin: Boolean(sameGstin),
      samePhone: Boolean(samePhone),
      sameProprietor: Boolean(sameProprietor),
      pinScore,
      sectorScore
    },
    explanation: reasons.join("; ") || "Insufficient matching evidence"
  };
}

const rawRecords = [
  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560058-1001",
    business_name: "Sri Lakshmi Precision Tools Pvt Ltd",
    address: "Plot 14, 3rd Cross, Peenya Industrial Area Phase 1, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "AABCL1234F",
    gstin: "29AABCL1234F1Z8",
    proprietor: "Ramesh Kumar",
    phone: "9876543210"
  },
  {
    source_system: "Factories",
    source_record_id: "FAC-PEE-8832",
    business_name: "S L Precision Tools Private Limited",
    address: "No 14, 3 Cross, Peenya Industrial Estate, Phase I, Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "AABCL1234F",
    gstin: "29AABCL1234F1Z8",
    proprietor: "Ramesh Kumar",
    phone: "9876543210"
  },
  {
    source_system: "KSPCB",
    source_record_id: "KSPCB-2020-991",
    business_name: "Lakshmi Precision Tools",
    address: "Plot No.14, Peenya Industrial Area, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "",
    gstin: "29AABCL1234F1Z8",
    proprietor: "R Kumar",
    phone: "9876543210"
  },
  {
    source_system: "Labour",
    source_record_id: "LAB-44821",
    business_name: "Sri Lakshmi Precision Tooling",
    address: "14, Peenya Industrial Area Phase 1, Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "",
    gstin: "",
    proprietor: "Ramesh K",
    phone: "9876543210"
  },
  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560022-1102",
    business_name: "Raju Steels Pvt Ltd",
    address: "88, Tumkur Road, Yeshwanthpur Industrial Suburb, Bengaluru",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Steel Trading",
    pan: "AAECR8842P",
    gstin: "29AAECR8842P1Z2",
    proprietor: "Raju Menon",
    phone: "9845011111"
  },
  {
    source_system: "Factories",
    source_record_id: "FAC-YES-2033",
    business_name: "Raju Steel Private Limited",
    address: "No 88, Tumkur Rd, Yeshwanthpur Industrial Area, Bangalore",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Steel Trading",
    pan: "AAECR8842P",
    gstin: "",
    proprietor: "Raju Menon",
    phone: "9845011111"
  },
  {
    source_system: "BESCOM",
    source_record_id: "BES-998812",
    business_name: "M/s Raju Steels",
    address: "88 Tumkur Road Yeshwanthpur Bengaluru",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Electricity Consumer - HT",
    pan: "",
    gstin: "",
    proprietor: "R Menon",
    phone: "9845011111"
  },
  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560058-1300",
    business_name: "GreenChem Coatings LLP",
    address: "Shed 21, Peenya 2nd Stage, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Chemical",
    pan: "AAGFG7777L",
    gstin: "29AAGFG7777L1Z5",
    proprietor: "Farhan Ali",
    phone: "9900012300"
  },
  {
    source_system: "KSPCB",
    source_record_id: "KSPCB-GC-551",
    business_name: "Green Chem Coating",
    address: "Shed No 21, Peenya Second Stage, Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Chemical",
    pan: "",
    gstin: "",
    proprietor: "F Ali",
    phone: "9900012300"
  },
  {
    source_system: "Food Safety",
    source_record_id: "FSSAI-560022-77",
    business_name: "Annapurna Foods",
    address: "12 Market Road, Yeshwanthpur, Bengaluru",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Food Processing",
    pan: "AAHFA1235M",
    gstin: "29AAHFA1235M1Z9",
    proprietor: "Meena Rao",
    phone: "9988776655"
  },
  {
    source_system: "BWSSB",
    source_record_id: "BWSSB-21901",
    business_name: "Annapoorna Food Products",
    address: "No 12, Market Rd, Yeshwanthpur, Bangalore",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Water Consumer",
    pan: "",
    gstin: "",
    proprietor: "M Rao",
    phone: "9988776655"
  },
  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560058-2001",
    business_name: "BluePeak Traders",
    address: "Plot 14, 3rd Cross, Peenya Industrial Area Phase 1, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Trading",
    pan: "AABPB9999K",
    gstin: "29AABPB9999K1Z1",
    proprietor: "Ramesh Kumar",
    phone: "9876543210"
  },
  {
    source_system: "Labour",
    source_record_id: "LAB-560058-2099",
    business_name: "Blue Peak Industrial Suppliers",
    address: "Plot 14, 3 Cross, Peenya Industrial Estate, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Trading",
    pan: "",
    gstin: "",
    proprietor: "R Kumar",
    phone: "9876543210"
  },
  {
    source_system: "Factories",
    source_record_id: "FAC-560058-4040",
    business_name: "Metro Alloy Works",
    address: "99, 8th Main, Peenya Industrial Area, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "AAFCM4040D",
    gstin: "29AAFCM4040D1ZE",
    proprietor: "Devika Nair",
    phone: "9000004040"
  },
  {
    source_system: "BESCOM",
    source_record_id: "BES-4040",
    business_name: "Metro Aloy Works",
    address: "99 8 Main Peenya Industrial Area Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Electricity Consumer - LT",
    pan: "",
    gstin: "",
    proprietor: "D Nair",
    phone: "9000004040"
  }
];

const departmentRecords = rawRecords.map((record, index) => ({
  id: index + 1,
  ...record,
  normalized_name: normalizeText(record.business_name),
  pan_hash: blindHash(record.pan),
  gstin_hash: blindHash(record.gstin),
  proprietor_hash: blindHash(record.proprietor),
  phone_hash: blindHash(record.phone),
  raw_pan_present: record.pan ? 1 : 0,
  raw_gstin_present: record.gstin ? 1 : 0
}));

const activityEvents = [
  {
    id: 1,
    source_system: "Factories",
    source_record_id: "FAC-PEE-8832",
    event_type: "Inspection",
    event_date: "2024-06-12",
    signal_strength: 5,
    description: "Factory safety inspection completed"
  },
  {
    id: 2,
    source_system: "KSPCB",
    source_record_id: "KSPCB-2020-991",
    event_type: "Consent Renewal",
    event_date: "2025-03-10",
    signal_strength: 5,
    description: "Pollution consent renewed"
  },
  {
    id: 3,
    source_system: "BESCOM",
    source_record_id: "BES-998812",
    event_type: "Electricity Consumption",
    event_date: "2026-04-02",
    signal_strength: 4,
    description: "High-tension monthly power consumption detected"
  },
  {
    id: 4,
    source_system: "Factories",
    source_record_id: "FAC-YES-2033",
    event_type: "Inspection",
    event_date: "2023-08-01",
    signal_strength: 3,
    description: "Last recorded factory inspection"
  },
  {
    id: 5,
    source_system: "KSPCB",
    source_record_id: "KSPCB-GC-551",
    event_type: "Compliance Filing",
    event_date: "2022-11-20",
    signal_strength: 2,
    description: "Last compliance filing"
  },
  {
    id: 6,
    source_system: "Food Safety",
    source_record_id: "FSSAI-560022-77",
    event_type: "License Renewal",
    event_date: "2026-02-11",
    signal_strength: 5,
    description: "Food safety license renewed"
  },
  {
    id: 7,
    source_system: "BWSSB",
    source_record_id: "BWSSB-21901",
    event_type: "Water Usage",
    event_date: "2026-04-12",
    signal_strength: 4,
    description: "Commercial water usage recorded"
  },
  {
    id: 8,
    source_system: "Labour",
    source_record_id: "LAB-560058-2099",
    event_type: "Labour Filing",
    event_date: "2026-01-14",
    signal_strength: 4,
    description: "Labour compliance filing submitted"
  },
  {
    id: 9,
    source_system: "BESCOM",
    source_record_id: "BES-4040",
    event_type: "Electricity Consumption",
    event_date: "2023-01-20",
    signal_strength: 1,
    description: "Low power usage before possible closure"
  },
  {
    id: 10,
    source_system: "Fire Department",
    source_record_id: "FIRE-UNKNOWN-7761",
    event_type: "Fire Safety Inspection",
    event_date: "2026-03-18",
    signal_strength: 3,
    description:
      "Fire safety inspection event received, but source record could not be confidently joined to an existing UBID"
  }
];

let ubids = [];
let ubidLinks = [];
let reviewQueue = [];
let integrityFlags = [];
let auditLedger = [];
let fieldVerificationTasks = [];

function addAuditEvent(eventType, actor, payload) {
  const previousHash =
    auditLedger.length === 0 ? "GENESIS" : auditLedger[auditLedger.length - 1].current_hash;

  const currentHash = CryptoJS.SHA256(
    JSON.stringify({
      eventType,
      actor,
      payload,
      previousHash,
      timestamp: new Date().toISOString()
    })
  ).toString();

  const entry = {
    id: auditLedger.length + 1,
    event_type: eventType,
    actor,
    payload: JSON.stringify(payload),
    previous_hash: previousHash,
    current_hash: currentHash,
    created_at: new Date().toISOString()
  };

  auditLedger.push(entry);
  return currentHash;
}

function generateUbid(index) {
  return `KA-UBID-${String(index).padStart(5, "0")}`;
}

function monthsBetween(dateString, currentDate = new Date("2026-05-01")) {
  const d = new Date(dateString);

  return (
    (currentDate.getFullYear() - d.getFullYear()) * 12 +
    (currentDate.getMonth() - d.getMonth())
  );
}

function classifyBusiness(ubid) {
  const events = activityEvents.filter((event) => event.joined_ubid === ubid);

  if (events.length === 0) {
    return {
      status: "Low Evidence",
      score: 0,
      explanation: "No confidently joined activity events found",
      evidence: []
    };
  }

  let score = 0;
  const evidence = [];

  for (const event of events) {
    const ageMonths = monthsBetween(event.event_date);
    const recencyWeight = Math.max(0, 1 - ageMonths / 36);
    const contribution = event.signal_strength * recencyWeight;

    score += contribution;

    evidence.push({
      type: event.event_type,
      date: event.event_date,
      source: event.source_system,
      contribution: Number(contribution.toFixed(2)),
      description: event.description
    });
  }

  const latestAge = Math.min(...events.map((event) => monthsBetween(event.event_date)));
  const hasClosure = events.some((event) =>
    event.event_type.toLowerCase().includes("closure")
  );

  let status = "Dormant";

  if (hasClosure) status = "Closed";
  else if (latestAge <= 12 && score >= 3) status = "Active";
  else if (latestAge > 30 && score < 2) status = "Closed";
  else status = "Dormant";

  return {
    status,
    score: Number(score.toFixed(2)),
    explanation: `Status derived from ${events.length} activity event(s), latest event ${latestAge} month(s) old, weighted activity score ${score.toFixed(2)}.`,
    evidence
  };
}

function runResolution() {
  const used = new Set();
  let ubidCounter = 1;

  for (const record of departmentRecords) {
    if (used.has(record.id)) continue;

    const cluster = [record];
    used.add(record.id);

    for (const candidate of departmentRecords) {
      if (record.id === candidate.id || used.has(candidate.id)) continue;
      if (record.pin_code !== candidate.pin_code) continue;

      const result = scorePair(record, candidate);

      if (result.decision === "auto_link") {
        cluster.push(candidate);
        used.add(candidate.id);
      } else if (result.decision === "review") {
        reviewQueue.push({
          id: reviewQueue.length + 1,
          record_a: record.id,
          record_b: candidate.id,
          confidence: result.score,
          explanation: result.explanation,
          status: "pending",
          reviewer_decision: null,
          created_at: new Date().toISOString()
        });

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
        : cluster.reduce((sum, current, index) => {
            if (index === 0) return sum;
            return sum + scorePair(cluster[0], current).score;
          }, 0) /
          (cluster.length - 1);

    ubids.push({
      id: ubids.length + 1,
      ubid,
      canonical_name: cluster[0].business_name,
      canonical_address: cluster[0].address,
      pin_code: cluster[0].pin_code,
      district: cluster[0].district,
      sector: cluster[0].sector,
      status: "Unknown",
      confidence: Number(avgConfidence.toFixed(3)),
      trust_score: 0,
      risk_level: "Unscored",
      integrity_score: 0,
      created_at: new Date().toISOString()
    });

    for (const item of cluster) {
      const linkScore = item.id === cluster[0].id ? 1 : scorePair(cluster[0], item).score;

      ubidLinks.push({
        id: ubidLinks.length + 1,
        ubid,
        record_id: item.id,
        confidence: linkScore,
        decision: "auto_link",
        explanation:
          item.id === cluster[0].id
            ? "Seed record selected as canonical representative"
            : scorePair(cluster[0], item).explanation,
        reviewer_status: "auto",
        created_at: new Date().toISOString()
      });
    }

    addAuditEvent("UBID_CREATED", "matcher-engine", {
      ubid,
      clusterSize: cluster.length,
      canonicalName: cluster[0].business_name
    });
  }

  addManualReviewSamples();
}

function addManualReviewSamples() {
  const samples = [
    {
      record_a: 4,
      record_b: 12,
      confidence: 0.67,
      explanation:
        "Same PIN, similar address pattern and shared blind-hashed phone/proprietor signals, but different PAN/GSTIN and business sector. Requires officer verification."
    },
    {
      record_a: 8,
      record_b: 9,
      confidence: 0.74,
      explanation:
        "Name and address are similar, but legal identifiers are missing on one side. Pollution record should not be silently merged without officer review."
    },
    {
      record_a: 14,
      record_b: 15,
      confidence: 0.82,
      explanation:
        "High name similarity and same PIN, but sector differs between Manufacturing and Electricity Consumer. Review needed before consolidation."
    }
  ];

  for (const sample of samples) {
    const exists = reviewQueue.some(
      (item) =>
        (item.record_a === sample.record_a && item.record_b === sample.record_b) ||
        (item.record_a === sample.record_b && item.record_b === sample.record_a)
    );

    if (!exists) {
      reviewQueue.push({
        id: reviewQueue.length + 1,
        ...sample,
        status: "pending",
        reviewer_decision: null,
        created_at: new Date().toISOString()
      });

      addAuditEvent("REVIEW_CREATED", "matcher-engine", sample);
    }
  }
}

function joinEventsToUbids() {
  for (const event of activityEvents) {
    const record = departmentRecords.find(
      (item) => item.source_record_id === event.source_record_id
    );

    const link = record ? ubidLinks.find((item) => item.record_id === record.id) : null;

    event.joined_ubid = link ? link.ubid : null;
    event.join_confidence = link ? link.confidence : 0;
  }

  addAuditEvent("ACTIVITY_EVENTS_INGESTED", "seed-script", {
    events: activityEvents.length
  });
}

function runActivityClassification() {
  for (const business of ubids) {
    const result = classifyBusiness(business.ubid);
    business.status = result.status;

    addAuditEvent("ACTIVITY_CLASSIFICATION", "activity-engine", {
      ubid: business.ubid,
      status: result.status,
      score: result.score
    });
  }
}

function createFlag(ubid, flagType, severity, explanation, evidence) {
  integrityFlags.push({
    id: integrityFlags.length + 1,
    ubid,
    flag_type: flagType,
    severity,
    explanation,
    evidence: JSON.stringify(evidence),
    created_at: new Date().toISOString()
  });
}

function runIntegrityScan() {
  integrityFlags = [];

  for (const business of ubids) {
    const linkedRecords = ubidLinks
      .filter((link) => link.ubid === business.ubid)
      .map((link) => departmentRecords.find((record) => record.id === link.record_id));

    const sectors = new Set(linkedRecords.map((record) => record.sector));
    const sourceSystems = new Set(linkedRecords.map((record) => record.source_system));
    const proprietors = new Set(
      linkedRecords.map((record) => record.proprietor_hash).filter(Boolean)
    );
    const phones = new Set(linkedRecords.map((record) => record.phone_hash).filter(Boolean));

    if (sourceSystems.size >= 3 && business.confidence < 0.9) {
      createFlag(
        business.ubid,
        "Cross-Department Ambiguity",
        "Medium",
        "Business appears across three or more departments but confidence is below 90%.",
        { linkedRecords: linkedRecords.map((record) => record.source_record_id) }
      );
    }

    if (sectors.size >= 3) {
      createFlag(
        business.ubid,
        "Sector Inconsistency",
        "Medium",
        "Linked records span multiple sector categories, requiring officer verification.",
        { sectors: [...sectors] }
      );
    }

    if (proprietors.size === 1 && phones.size === 1 && linkedRecords.length >= 2) {
      const differentNames = new Set(linkedRecords.map((record) => record.business_name));

      if (differentNames.size >= 2) {
        createFlag(
          business.ubid,
          "Possible Shell / Front Entity",
          "High",
          "Multiple differently named records share proprietor or phone hashes and similar location signals.",
          {
            names: [...differentNames],
            pin: business.pin_code
          }
        );
      }
    }
  }

  const groupMap = new Map();

  for (const record of departmentRecords) {
    if (!record.proprietor_hash || !record.phone_hash) continue;

    const key = `${record.proprietor_hash}-${record.phone_hash}-${record.pin_code}`;

    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(record);
  }

  for (const records of groupMap.values()) {
    if (records.length >= 3) {
      createFlag(
        null,
        "Network-Level Fragmentation",
        "High",
        "Same blind-hashed proprietor and phone appear across three or more records in the same PIN code.",
        {
          records: records.map((record) => record.source_record_id),
          pin: records[0].pin_code
        }
      );
    }
  }

  addAuditEvent("INTEGRITY_SCAN", "integrity-engine", {
    flagsCreated: integrityFlags.length
  });
}

function calculateTrustScores() {
  for (const business of ubids) {
    const linkedCount = ubidLinks.filter((link) => link.ubid === business.ubid).length;
    const events = activityEvents.filter((event) => event.joined_ubid === business.ubid);
    const flags = integrityFlags.filter((flag) => flag.ubid === business.ubid || flag.ubid === null);

    let score = 50;

    score += Math.round(business.confidence * 25);

    if (linkedCount >= 2) score += 8;
    if (linkedCount >= 3) score += 5;

    if (business.status === "Active") score += 15;
    if (business.status === "Dormant") score -= 5;
    if (business.status === "Closed") score -= 20;
    if (business.status === "Low Evidence") score -= 12;

    if (events.length >= 2) score += 7;
    if (events.length === 0) score -= 10;

    const highFlags = flags.filter((flag) => flag.severity === "High").length;
    const mediumFlags = flags.filter((flag) => flag.severity === "Medium").length;

    score -= highFlags * 12;
    score -= mediumFlags * 6;

    score = Math.max(0, Math.min(100, score));

    let riskLevel = "Trusted";
    if (score < 40) riskLevel = "High Risk";
    else if (score < 60) riskLevel = "Risky";
    else if (score < 80) riskLevel = "Needs Monitoring";

    business.trust_score = score;
    business.risk_level = riskLevel;

    addAuditEvent("TRUST_SCORE_COMPUTED", "trust-score-engine", {
      ubid: business.ubid,
      score,
      riskLevel
    });
  }
}

function buildOfficerBrief(ubid) {
  const business = ubids.find((item) => item.ubid === ubid);
  const links = ubidLinks.filter((item) => item.ubid === ubid);
  const linkedRecords = links.map((link) =>
    departmentRecords.find((record) => record.id === link.record_id)
  );
  const events = activityEvents.filter((event) => event.joined_ubid === ubid);
  const flags = integrityFlags.filter((flag) => flag.ubid === ubid || flag.ubid === null);

  const identityEvidence = links.map((link) => ({
    title: `Record linked with ${Math.round(link.confidence * 100)}% confidence`,
    detail: link.explanation
  }));

  const activityEvidence =
    events.length > 0
      ? events.map((event) => ({
          title: `${event.event_type} from ${event.source_system}`,
          detail: `${event.description} on ${event.event_date}`
        }))
      : [
          {
            title: "Low activity evidence",
            detail: "No confidently joined activity events were found for this UBID."
          }
        ];

  const riskEvidence =
    flags.length > 0
      ? flags.map((flag) => ({
          title: flag.flag_type,
          detail: flag.explanation
        }))
      : [
          {
            title: "No integrity anomaly detected",
            detail: "No shell/front entity, sector inconsistency or fragmentation signal detected."
          }
        ];

  return {
    ubid,
    canonicalName: business.canonical_name,
    trustScore: business.trust_score,
    riskLevel: business.risk_level,
    recommendedAction:
      business.risk_level === "High Risk"
        ? "Generate field verification task before relying on this identity."
        : business.risk_level === "Needs Monitoring"
        ? "Monitor future events and review integrity flags."
        : "Identity can be used for policy queries with current evidence.",
    identityEvidence,
    activityEvidence,
    riskEvidence,
    linkedDepartments: [...new Set(linkedRecords.map((record) => record.source_system))]
  };
}

function generateFieldVerificationTask(ubid) {
  const business = ubids.find((item) => item.ubid === ubid);

  if (!business) return null;

  const existing = fieldVerificationTasks.find((task) => task.ubid === ubid);
  if (existing) return existing;

  const flags = integrityFlags.filter((flag) => flag.ubid === ubid || flag.ubid === null);

  const task = {
    id: fieldVerificationTasks.length + 1,
    task_id: `FV-${business.pin_code}-${String(fieldVerificationTasks.length + 1).padStart(3, "0")}`,
    ubid,
    business_name: business.canonical_name,
    address: business.canonical_address,
    pin_code: business.pin_code,
    priority: flags.some((flag) => flag.severity === "High") ? "High" : "Medium",
    status: "Open",
    officer_action: `Verify physical existence and operating status at ${business.canonical_address}`,
    reason:
      flags.length > 0
        ? flags[0].explanation
        : "Manual verification requested by officer.",
    created_at: new Date().toISOString()
  };

  fieldVerificationTasks.push(task);

  addAuditEvent("FIELD_VERIFICATION_CREATED", "admin-officer", {
    taskId: task.task_id,
    ubid,
    priority: task.priority
  });

  return task;
}

function verifyLedger() {
  for (let i = 0; i < auditLedger.length; i++) {
    const expectedPrevious = i === 0 ? "GENESIS" : auditLedger[i - 1].current_hash;

    if (auditLedger[i].previous_hash !== expectedPrevious) {
      return {
        valid: false,
        brokenAt: auditLedger[i].id,
        reason: "Previous hash mismatch"
      };
    }
  }

  return {
    valid: true,
    entries: auditLedger.length,
    rootHash:
      auditLedger.length > 0 ? auditLedger[auditLedger.length - 1].current_hash : "GENESIS"
  };
}

function bootTrustIdSandbox() {
  addAuditEvent("DATA_INGESTED", "seed-script", {
    records: departmentRecords.length,
    systems: [...new Set(departmentRecords.map((record) => record.source_system))]
  });

  runResolution();
  joinEventsToUbids();
  runActivityClassification();
  runIntegrityScan();
  calculateTrustScores();
}

function resetSandboxData() {
  ubids = [];
  ubidLinks = [];
  reviewQueue = [];
  integrityFlags = [];
  auditLedger = [];
  fieldVerificationTasks = [];

  for (const event of activityEvents) {
    delete event.joined_ubid;
    delete event.join_confidence;
  }

  bootTrustIdSandbox();
}

resetSandboxData();

app.post("/api/admin/reset", (req, res) => {
  resetSandboxData();

  res.json({
    success: true,
    message: "TrustID sandbox data has been reset.",
    totals: {
      records: departmentRecords.length,
      ubids: ubids.length,
      reviews: reviewQueue.length,
      flags: integrityFlags.length,
      ledgerEntries: auditLedger.length
    }
  });
});

app.get("/api/lookup", (req, res) => {
  const { q, name, address, pin } = req.query;

  const hasUniversalQuery = q && q.trim();
  const hasCompositeQuery = name || address || pin;

  if (!hasUniversalQuery && !hasCompositeQuery) {
    return res.status(400).json({
      message:
        "Provide q for universal lookup, or use name/address/pin for composite lookup."
    });
  }

  let matchedRecord = null;
  let matchType = null;
  let confidence = 0;

  if (hasUniversalQuery) {
    const query = q.trim();
    const queryLower = query.toLowerCase();
    const inputHash = blindHash(query.toUpperCase());

    const byRecordId = departmentRecords.find(
      (record) => record.source_record_id.toLowerCase() === queryLower
    );

    const byIdentifier = departmentRecords.find(
      (record) => record.pan_hash === inputHash || record.gstin_hash === inputHash
    );

    const byName = departmentRecords.find((record) =>
      record.business_name.toLowerCase().includes(queryLower)
    );

    matchedRecord = byRecordId || byIdentifier || byName;

    matchType = byRecordId
      ? "Department Record ID"
      : byIdentifier
      ? "PAN / GSTIN blind-hash"
      : byName
      ? "Business Name"
      : null;

    confidence = byRecordId || byIdentifier ? 1 : byName ? 0.72 : 0;
  }

  if (!matchedRecord && hasCompositeQuery) {
    const candidates = departmentRecords
      .filter((record) => {
        if (pin && record.pin_code !== pin.trim()) return false;
        return true;
      })
      .map((record) => {
        const nameScore = name
          ? jaroWinkler(normalizeText(name), normalizeText(record.business_name))
          : 0;

        const addressScore = address ? tokenSimilarity(address, record.address) : 0;
        const pinScore = pin && record.pin_code === pin.trim() ? 1 : 0;

        const score = nameScore * 0.55 + addressScore * 0.35 + pinScore * 0.1;

        return {
          record,
          score,
          nameScore,
          addressScore,
          pinScore
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];

    if (best && best.score >= 0.45) {
      matchedRecord = best.record;
      matchType = "Name + Address + PIN composite lookup";
      confidence = Number(best.score.toFixed(3));
    }
  }

  if (!matchedRecord) {
    return res.json({
      found: false,
      query: q || { name, address, pin },
      message: "No matching department record or UBID found."
    });
  }

  const link = ubidLinks.find((item) => item.record_id === matchedRecord.id);

  if (!link) {
    return res.json({
      found: false,
      matchedRecord,
      message: "A department record matched, but it is not linked to a UBID yet."
    });
  }

  const business = ubids.find((item) => item.ubid === link.ubid);

  const linkedRecords = ubidLinks
    .filter((item) => item.ubid === link.ubid)
    .map((item) => ({
      ...departmentRecords.find((record) => record.id === item.record_id),
      confidence: item.confidence,
      explanation: item.explanation
    }));

  const events = activityEvents.filter((event) => event.joined_ubid === link.ubid);

  const flags = integrityFlags.filter(
    (flag) => flag.ubid === link.ubid || flag.ubid === null
  );

  res.json({
    found: true,
    ubid: link.ubid,
    matchType,
    confidence,
    matchedRecord,
    business,
    linkedRecords,
    events,
    flags,
    officerBrief: buildOfficerBrief(link.ubid)
  });
});

app.get("/api/activity/unmatched", (req, res) => {
  const unmatched = activityEvents.filter(
    (event) => !event.joined_ubid || event.join_confidence < 0.5
  );

  res.json({
    total: unmatched.length,
    items: unmatched
  });
});
app.get("/api/lookup", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Provide query parameter q" });

  const query = q.trim();
  const queryLower = query.toLowerCase();

  // Search by source record ID (exact)
  const byRecordId = departmentRecords.find(
    (r) => r.source_record_id.toLowerCase() === queryLower
  );

  // Search by business name (partial)
  const byName = departmentRecords.find((r) =>
    r.business_name.toLowerCase().includes(queryLower)
  );

  // Search by blind-hashed PAN or GSTIN
  const inputHash = blindHash(query.toUpperCase());
  const byIdentifier = departmentRecords.find(
    (r) => r.pan_hash === inputHash || r.gstin_hash === inputHash
  );

  const matchedRecord = byRecordId || byIdentifier || byName;
  const matchType = byRecordId
    ? "Department Record ID"
    : byIdentifier
    ? "PAN / GSTIN (blind-hashed)"
    : byName
    ? "Business Name (partial match)"
    : null;

  if (!matchedRecord) {
    return res.json({ found: false, query });
  }

  const link = ubidLinks.find((l) => l.record_id === matchedRecord.id);
  if (!link) return res.json({ found: false, query });

  const business = ubids.find((u) => u.ubid === link.ubid);
  const linkedRecords = ubidLinks
    .filter((l) => l.ubid === link.ubid)
    .map((l) => ({
      ...departmentRecords.find((r) => r.id === l.record_id),
      confidence: l.confidence,
      explanation: l.explanation
    }));

  const events = activityEvents.filter((e) => e.joined_ubid === link.ubid);

  res.json({
    found: true,
    ubid: link.ubid,
    matchType,
    query,
    business,
    linkedRecords,
    events
  });
});

app.get("/api/activity/unmatched", (req, res) => {
  const unmatched = activityEvents.filter(
    (e) => !e.joined_ubid || e.join_confidence < 0.5
  );

  res.json({ items: unmatched, total: unmatched.length });
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TrustID AI Backend",
    mode: "Windows-safe in-memory prototype",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/dashboard", (req, res) => {
  const statusMap = {};

  for (const business of ubids) {
    statusMap[business.status] = (statusMap[business.status] || 0) + 1;
  }

  const systemMap = {};

  for (const record of departmentRecords) {
    systemMap[record.source_system] = (systemMap[record.source_system] || 0) + 1;
  }

  res.json({
    totalRecords: departmentRecords.length,
    totalUbids: ubids.length,
    pendingReviews: reviewQueue.filter((item) => item.status === "pending").length,
    integrityFlags: integrityFlags.length,
    fieldTasks: fieldVerificationTasks.length,
    statuses: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    systems: Object.entries(systemMap).map(([source_system, count]) => ({
      source_system,
      count
    }))
  });
});

app.get("/api/ingestion", (req, res) => {
  const systemMap = {};

  for (const record of departmentRecords) {
    if (!systemMap[record.source_system]) {
      systemMap[record.source_system] = {
        source_system: record.source_system,
        records: 0,
        pan_available: 0,
        gstin_available: 0
      };
    }

    systemMap[record.source_system].records++;
    systemMap[record.source_system].pan_available += record.raw_pan_present;
    systemMap[record.source_system].gstin_available += record.raw_gstin_present;
  }

  res.json({
    systems: Object.values(systemMap),
    records: departmentRecords
  });
});

app.get("/api/ubids", (req, res) => {
  const rows = ubids.map((business) => ({
    ...business,
    linked_records: ubidLinks.filter((link) => link.ubid === business.ubid).length
  }));

  res.json(rows);
});

app.get("/api/ubids/:ubid", (req, res) => {
  const business = ubids.find((item) => item.ubid === req.params.ubid);

  if (!business) {
    return res.status(404).json({ message: "UBID not found" });
  }

  const linkedRecords = ubidLinks
    .filter((link) => link.ubid === business.ubid)
    .map((link) => {
      const record = departmentRecords.find((item) => item.id === link.record_id);

      return {
        ...record,
        confidence: link.confidence,
        explanation: link.explanation
      };
    });

  const events = activityEvents.filter((event) => event.joined_ubid === business.ubid);

  const flags = integrityFlags.filter(
    (flag) => flag.ubid === business.ubid || flag.ubid === null
  );

  res.json({
    business,
    linkedRecords,
    events,
    flags,
    officerBrief: buildOfficerBrief(business.ubid)
  });
});

app.post("/api/ubids/:ubid/field-verification", (req, res) => {
  const task = generateFieldVerificationTask(req.params.ubid);

  if (!task) {
    return res.status(404).json({ message: "UBID not found" });
  }

  res.json(task);
});

app.get("/api/reviewer", (req, res) => {
  const rows = reviewQueue.map((item) => {
    const a = departmentRecords.find((record) => record.id === item.record_a);
    const b = departmentRecords.find((record) => record.id === item.record_b);

    return {
      ...item,
      a_name: a.business_name,
      a_address: a.address,
      a_source: a.source_system,
      a_source_id: a.source_record_id,
      a_pin: a.pin_code,
      b_name: b.business_name,
      b_address: b.address,
      b_source: b.source_system,
      b_source_id: b.source_record_id,
      b_pin: b.pin_code
    };
  });

  res.json(rows);
});

app.post("/api/reviewer/:id/decision", (req, res) => {
  const item = reviewQueue.find((row) => row.id === Number(req.params.id));
  const { decision } = req.body;

  if (!item) {
    return res.status(404).json({ message: "Review task not found" });
  }

  if (!["merge", "reject", "escalate"].includes(decision)) {
    return res.status(400).json({ message: "Invalid decision" });
  }

  item.status = "completed";
  item.reviewer_decision = decision;

  addAuditEvent("REVIEWER_DECISION", "admin-officer", {
    reviewId: item.id,
    decision
  });

  if (decision === "escalate") {
    const recordA = departmentRecords.find((record) => record.id === item.record_a);
    const recordLink = ubidLinks.find((link) => link.record_id === recordA.id);

    if (recordLink) {
      generateFieldVerificationTask(recordLink.ubid);
    }
  }

  res.json({
    success: true,
    message: "Admin review decision recorded"
  });
});

app.post("/api/reviewer/:id/reopen", (req, res) => {
  const item = reviewQueue.find((row) => row.id === Number(req.params.id));

  if (!item) {
    return res.status(404).json({ message: "Review task not found" });
  }

  const previousDecision = item.reviewer_decision;

  item.status = "pending";
  item.reviewer_decision = null;

  addAuditEvent("REVIEW_REOPENED_BY_ADMIN", "admin-officer", {
    reviewId: item.id,
    previousDecision
  });

  res.json({
    success: true,
    message: "Review task reopened by admin officer"
  });
});

app.get("/api/activity", (req, res) => {
  const rows = ubids.map((business) => ({
    ubid: business.ubid,
    canonical_name: business.canonical_name,
    pin_code: business.pin_code,
    sector: business.sector,
    status: business.status,
    trust_score: business.trust_score,
    risk_level: business.risk_level,
    events: activityEvents.filter((event) => event.joined_ubid === business.ubid).length
  }));

  res.json(rows);
});

app.post("/api/activity/classify", (req, res) => {
  runActivityClassification();
  runIntegrityScan();
  calculateTrustScores();

  res.json(
    ubids.map((business) => ({
      ubid: business.ubid,
      status: business.status,
      trust_score: business.trust_score,
      risk_level: business.risk_level
    }))
  );
});

app.get("/api/query/flagship", (req, res) => {
  const pin = req.query.pin || "560058";
  const months = Number(req.query.months || 18);

  const cutoff = new Date("2026-05-01");
  cutoff.setMonth(cutoff.getMonth() - months);

  const activeBusinesses = ubids.filter(
    (business) => business.pin_code === pin && business.status === "Active"
  );

  const result = activeBusinesses.filter((business) => {
    const inspections = activityEvents
      .filter(
        (event) =>
          event.joined_ubid === business.ubid && event.event_type === "Inspection"
      )
      .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

    if (inspections.length === 0) return true;

    return new Date(inspections[0].event_date) < cutoff;
  });

  res.json({
    query: `Active businesses in PIN ${pin} with no inspection in ${months} months`,
    count: result.length,
    results: result.map((business) => {
      const events = activityEvents.filter((event) => event.joined_ubid === business.ubid);
      const latestEvent = events.sort(
        (a, b) => new Date(b.event_date) - new Date(a.event_date)
      )[0];

      return {
        ...business,
        latest_event_date: latestEvent ? latestEvent.event_date : null
      };
    })
  });
});

app.get("/api/query/integrity-flags", (req, res) => {
  res.json(integrityFlags);
});

app.get("/api/field-verification", (req, res) => {
  res.json(fieldVerificationTasks);
});

app.get("/api/impact", (req, res) => {
  const highRisk = ubids.filter((item) => item.risk_level === "High Risk").length;
  const needsMonitoring = ubids.filter((item) => item.risk_level === "Needs Monitoring").length;
  const active = ubids.filter((item) => item.status === "Active").length;

  res.json({
    before: [
      {
        label: "Fragmented department records",
        value: departmentRecords.length
      },
      {
        label: "Separate department systems",
        value: new Set(departmentRecords.map((record) => record.source_system)).size
      },
      {
        label: "Unified business identities",
        value: 0
      },
      {
        label: "Tamper-evident decisions",
        value: 0
      },
      {
        label: "Inspection-risk query capability",
        value: "No"
      }
    ],
    after: [
      {
        label: "Resolved UBIDs",
        value: ubids.length
      },
      {
        label: "Active businesses identified",
        value: active
      },
      {
        label: "Integrity flags generated",
        value: integrityFlags.length
      },
      {
        label: "Open reviewer cases",
        value: reviewQueue.filter((review) => review.status === "pending").length
      },
      {
        label: "Audit ledger entries",
        value: auditLedger.length
      }
    ],
    policyInsights: [
      {
        title: "Peenya Industrial Area needs inspection focus",
        detail: "PIN 560058 has active businesses with no recent inspection evidence."
      },
      {
        title: "Identity fragmentation detected",
        detail:
          "Same blind-hashed proprietor and phone signals appear across multiple business names."
      },
      {
        title: "Officer workflow is evidence-backed",
        detail:
          "Every merge, rejection, review decision and verification task is auditable."
      }
    ],
    pinIntelligence: [
      {
        pin: "560058",
        area: "Peenya Industrial Area",
        active: ubids.filter(
          (business) => business.pin_code === "560058" && business.status === "Active"
        ).length,
        dormant: ubids.filter(
          (business) => business.pin_code === "560058" && business.status === "Dormant"
        ).length,
        closed: ubids.filter(
          (business) => business.pin_code === "560058" && business.status === "Closed"
        ).length,
        flags: integrityFlags.filter((flag) => {
          if (!flag.ubid) return true;
          const business = ubids.find((item) => item.ubid === flag.ubid);
          return business?.pin_code === "560058";
        }).length,
        inspectionGap: "High"
      },
      {
        pin: "560022",
        area: "Yeshwanthpur Industrial Suburb",
        active: ubids.filter(
          (business) => business.pin_code === "560022" && business.status === "Active"
        ).length,
        dormant: ubids.filter(
          (business) => business.pin_code === "560022" && business.status === "Dormant"
        ).length,
        closed: ubids.filter(
          (business) => business.pin_code === "560022" && business.status === "Closed"
        ).length,
        flags: integrityFlags.filter((flag) => {
          if (!flag.ubid) return false;
          const business = ubids.find((item) => item.ubid === flag.ubid);
          return business?.pin_code === "560022";
        }).length,
        inspectionGap: "Medium"
      }
    ],
    riskSummary: {
      highRisk,
      needsMonitoring,
      trusted: ubids.filter((item) => item.risk_level === "Trusted").length
    }
  });
});

app.get("/api/audit", (req, res) => {
  res.json({
    verification: verifyLedger(),
    ledger: [...auditLedger].reverse()
  });
});

app.listen(PORT, () => {
  console.log(`TrustID backend running on http://localhost:${PORT}`);
});