# TrustID — Karnataka UBID & Active Business Intelligence Platform

> An integrity first prototype for Karnataka Commerce & Industry that resolves fragmented government department records into trusted Unified Business Identifiers, classifies business activity, detects suspicious identity fragmentation and maintains a tamper-evident decision ledger.

**Built for:** AI for Bharat Hackathon — Theme 1: Unified Business Identifier (UBID) and Active Business Intelligence by Karnataka Commerce & Industry  
**Participant:** Agrima Saxena  
**Live Demo:** https://trust-id-ubid-intelligence.vercel.app/  
**GitHub Repository:** https://github.com/agrima150103/TrustID-UBID-Intelligence  

---

## Problem Statement

Karnataka's business-facing regulatory landscape spans 40+ department systems such as:

- Shop Establishment
- Factories
- Labour
- Karnataka State Pollution Control Board
- BESCOM / ESCOMs
- BWSSB
- Fire Department
- Food Safety
- Urban and rural local bodies
- Sector-specific regulators

Each department system was built independently with its own schema, record identifiers, validation rules and free-text name/address fields.

As a result, the same real-world business can appear as multiple disconnected records:

```text
Shop Establishment  → Sri Lakshmi Precision Tools Pvt Ltd
Factories Dept      → S L Precision Tools Private Limited
KSPCB               → Lakshmi Precision Tools
Labour Dept         → Sri Lakshmi Precision Tooling
```

There is no reliable join key across systems.

Because of this, Karnataka Commerce & Industries cannot easily answer basic governance questions such as:

```text
How many businesses are actually operating in Peenya today?
Which active businesses have not been inspected recently?
Which businesses are duplicated across departments?
Which entities may be deliberately fragmented?
Which activity events belong to which business?
Can an automated linkage decision be defended in audit?
```

The challenge is not just data integration. It is a problem of identity, trust, privacy, explainability, activity intelligence, and auditability.

---

## What TrustID Solves

TrustID is a non-intrusive middleware platform that sits alongside existing government systems.

It does **not** modify, migrate, or replace source department systems.

Instead, it creates a trusted identity intelligence layer on top of them.

TrustID performs two major functions:

---

### Part A — UBID Assignment

TrustID links fragmented business records across department systems and assigns each real-world business a single Unified Business Identifier.

It:

- Ingests department records in read-only mode
- Blind-hashes sensitive identifiers such as PAN, GSTIN, phone and proprietor
- Normalizes business names and addresses
- Uses deterministic entity resolution to compare records
- Anchors UBIDs to PAN/GSTIN wherever available
- Auto-links only high-confidence matches
- Sends ambiguous matches to Admin Review
- Keeps low-confidence records separate
- Logs every decision in a tamper-evident Trust Ledger

---

### Part B — Active Business Intelligence

After UBIDs are created, TrustID joins activity events to each UBID and classifies business vitality.

It:

- Ingests one-way activity streams such as inspections, renewals, filings, electricity usage, water usage and compliance events
- Classifies businesses as Active, Dormant, Closed or Low Evidence
- Uses recency-weighted signal scoring
- Shows which events drove the verdict
- Surfaces unmatched events instead of silently dropping them
- Helps officers run inspection-prioritization queries

---

## Core Features

### 1. Command Center

The Command Center gives a high-level overview of the entire TrustID system.

It shows:

- Department records ingested
- Resolved UBIDs
- Pending admin review cases
- Integrity flags
- Activity status distribution
- Connected department systems
- Identity compression ratio
- Policy intelligence summary
- Reset sandbox control

Example metric:

```text
15 department records → 12 resolved UBIDs
```

This shows how fragmented department records are compressed into canonical business identities.

---

### 2. Department Feeds

The Department Feeds page shows raw records from different department systems.

It highlights real-world data quality issues such as:

- Missing PAN
- Missing GSTIN
- Inconsistent business names
- Different address formats
- Department-specific identifiers
- Sector inconsistencies

It also calculates department-level data quality based on PAN/GSTIN availability.

---

### 3. Identity Resolution Engine

TrustID uses an explainable identity resolution pipeline:

```text
Privacy Gateway
→ Normalization
→ Blocking
→ Confidence Scoring
→ Decision Routing
→ Audit Commit
```

The engine uses:

- PAN blind-hash match
- GSTIN blind-hash match
- Phone blind-hash match
- Proprietor blind-hash match
- Jaro-Winkler business name similarity
- Address token overlap
- PIN code match
- Sector match

Decision routing:

```text
Score ≥ 0.90 or PAN/GSTIN anchor match → Auto-link
Score 0.60–0.89 → Admin Review
Score < 0.60 → Keep separate
```

The system is conservative by design because a wrong merge is more costly than a missed merge.

---

### 4. Live Matching Preview

The Identity Resolution page includes a live matching preview.

It shows actual candidate record pairs from the ingested dataset with:

- Record A
- Record B
- Name score
- Address score
- PAN match
- GSTIN match
- Phone match
- Final score
- Routing decision

This makes the matching engine transparent instead of black-box.

---

### 5. Business Registry

The Business Registry shows all resolved UBIDs.

Each UBID includes:

- Canonical business name
- PIN code
- Sector
- Activity status
- Trust score
- Risk level
- Linked department records
- Matching confidence

The page also includes search and filtering by:

- UBID
- Business name
- PIN
- Status
- Risk level

---

### 6. Officer Decision Brief

Clicking a UBID opens an officer-ready decision brief.

The brief explains:

- Why records were linked
- Which departments contributed evidence
- Which activity events were joined
- Which risk signals exist
- What officer action is recommended

Officers can:

- Generate a field verification task
- Download an officer brief as a text report

This makes each UBID explainable and operationally useful.

---

### 7. Admin Review Console

Ambiguous matches are never silently merged.

The Admin Review Console lets an officer:

- Approve merge
- Reject link
- Escalate to field verification
- Reopen / change a previous decision

Every decision is recorded in the Trust Ledger.

The system is reversible, but not erasable.

---

### 8. Activity Intelligence

TrustID classifies each UBID as:

- Active
- Dormant
- Closed
- Low Evidence

It uses activity signals such as:

- Factory inspection
- Pollution consent renewal
- Labour filing
- Food safety license renewal
- BESCOM electricity consumption
- BWSSB water usage

Important principle:

```text
Absence of signal is not blindly treated as closure.
```

If evidence is insufficient, TrustID surfaces **Low Evidence** instead of making unsafe assumptions.

---

### 9. Activity Evidence Timeline

Each UBID has an activity evidence timeline.

It shows:

- Event type
- Department source
- Event date
- Description
- Signal strength
- Join confidence

This helps reviewers understand exactly which signals drove the activity verdict and over what time window.

---

### 10. Universal UBID Lookup

TrustID supports universal lookup.

An officer can search by:

- Department record ID
- PAN
- GSTIN
- Business name
- Name + address + PIN combination

Example lookups:

```text
SE-560058-1001
AABCL1234F
Lakshmi Precision
Plot 14 Peenya 560058
```

The result returns:

- UBID
- Match type
- Match confidence
- Business profile
- Linked records
- Activity events
- Risk flags
- Officer brief

---

### 11. Editable Inspection Query

TrustID demonstrates the flagship government query:

```text
Show active businesses in PIN 560058 with no inspection in the last 18 months.
```

The query is parametric.

Officers can change:

- PIN code
- Inspection gap in months

This helps prioritize inspection and compliance work.

---

### 12. Unmatched Activity Events

Events that cannot be confidently joined to a UBID are surfaced for review.

They are not silently dropped.

Example:

```text
Fire Department
FIRE-UNKNOWN-7761
Fire Safety Inspection
```

This supports operational review of uncertain event data.

---

### 13. Integrity Flags and Shell Entity Detection

TrustID flags suspicious patterns such as:

- Cross-department ambiguity
- Sector inconsistency
- Network-level fragmentation
- Possible shell/front entity patterns

Example risk pattern:

```text
Same blind-hashed proprietor
Same blind-hashed phone
Same PIN code
Different business names
```

This helps detect deliberate fragmentation or shell/front entities.

---

### 14. Field Verification Tasks

Officers can generate field verification tasks from risky or ambiguous UBIDs.

Example:

```text
Task ID: FV-560058-001
Action: Verify physical existence and operating status
Priority: High
Status: Open
```

This turns digital intelligence into real-world government action.

---

### 15. Trust Ledger

TrustID records major automated and manual actions in a SHA-256 hash-chained ledger.

Logged events include:

- Data ingestion
- UBID creation
- Review creation
- Admin decision
- Review reopening
- Activity classification
- Trust score computation
- Integrity scan
- Field verification task creation

Each ledger entry stores:

- Event type
- Actor
- Payload
- Previous hash
- Current hash
- Timestamp

If any historical decision is modified, the hash chain breaks.

This makes the system tamper-evident and audit-defensible.

---

### 16. Impact View

The Impact View shows before-vs-after value.

Before TrustID:

```text
Fragmented department records
Disconnected systems
No unified business identity
No tamper-evident decision history
No inspection-risk query capability
Shell entities undetected
```

After TrustID:

```text
Resolved UBIDs
Active businesses identified
Integrity flags generated
Review cases surfaced
Audit ledger created
PIN-level governance intelligence available
```

---

### 17. Architecture Overview

```text
Legacy Department Systems
(Shop Establishment, Factories, Labour, KSPCB, BESCOM, BWSSB, Food Safety)
        │
        │ Read-only API / Batch Snapshot / Event Stream
        ▼
Privacy Gateway
(SHA-256 blind hashing of PAN, GSTIN, phone, proprietor)
        │
        ▼
Normalization Layer
(Name cleanup, suffix removal, address tokenization)
        │
        ▼
Matching Engine
(Jaro-Winkler + address token overlap + hashed identifier equality)
        │
        ├── High confidence → Auto-link
        ├── Ambiguous → Admin Review
        └── Low confidence → Keep separate
        │
        ▼
UBID Registry
(Canonical business identity + linked source records)
        │
        ▼
Activity Intelligence
(Inspection, renewal, filing, consumption signals)
        │
        ▼
Trust Score + Integrity Flags
(Activity evidence + confidence + risk patterns)
        │
        ▼
Trust Ledger
(SHA-256 hash-chained audit trail)
        │
        ▼
Officer Dashboard
(Query, review, registry, evidence, field verification, impact)
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast development, interactive dashboard, reusable components |
| Styling | Custom CSS variables | Government-grade visual design, full control over light/dark mode |
| Charts | Recharts | Lightweight React-based charts for dashboard analytics |
| Backend | Node.js + Express | Lightweight REST API layer for workflow-heavy prototype |
| Prototype Storage | In-memory sandbox data | Zero setup, deterministic judging, instant reset |
| Production Storage | PostgreSQL recommended | Persistent UBID registry, audit tables, indexing, transactions |
| Privacy | CryptoJS SHA-256 | Blind hashing of sensitive identifiers and audit hash chaining |
| Matching | Custom Jaro-Winkler + token similarity | Deterministic, explainable, audit-friendly entity resolution |
| Deployment | Vercel + Railway/Render-compatible backend | Simple live prototype deployment |

---

## Project Structure

```text
TrustID-UBID-Intelligence/
├── backend/
│   ├── src/
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api.js
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       │
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── StatCard.jsx
│       │   ├── ConfidenceBar.jsx
│       │   └── EvidenceBadge.jsx
│       │
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Ingestion.jsx
│           ├── Resolution.jsx
│           ├── Registry.jsx
│           ├── Reviewer.jsx
│           ├── Activity.jsx
│           ├── Query.jsx
│           ├── Audit.jsx
│           └── Impact.jsx
│
├── README.md
└── .gitignore
```

---

## Running Locally

### Prerequisites

```text
Node.js 18+
npm
```

---

### Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

The server automatically initializes synthetic Karnataka business data on startup.
No separate database or seed step is required.

---

### Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health check |
| POST | `/api/admin/reset` | Reset synthetic sandbox state |
| GET | `/api/dashboard` | KPI summary, status distribution, system counts |
| GET | `/api/ingestion` | Department system stats and raw records |
| GET | `/api/ubids` | All resolved UBIDs |
| GET | `/api/ubids/:ubid` | UBID details, linked records, events, flags, officer brief |
| POST | `/api/ubids/:ubid/field-verification` | Generate field verification task |
| GET | `/api/reviewer` | Ambiguous review queue |
| POST | `/api/reviewer/:id/decision` | Submit merge / reject / escalate decision |
| POST | `/api/reviewer/:id/reopen` | Reopen reviewer decision |
| GET | `/api/activity` | UBID activity status and trust score |
| POST | `/api/activity/classify` | Re-run activity classifier |
| GET | `/api/activity/unmatched` | Events that could not be confidently joined |
| GET | `/api/lookup` | Universal UBID lookup |
| GET | `/api/query/flagship?pin=560058&months=18` | Editable inspection-gap query |
| GET | `/api/query/integrity-flags` | All integrity flags |
| GET | `/api/field-verification` | All field verification tasks |
| GET | `/api/audit` | Audit ledger and hash-chain verification |
| GET | `/api/impact` | Before/after impact metrics and PIN intelligence |

---

## Universal Lookup Examples

```text
/api/lookup?q=SE-560058-1001
/api/lookup?q=AABCL1234F
/api/lookup?q=Lakshmi+Precision
```

---

## Synthetic Dataset

The prototype uses deterministic synthetic data representing Karnataka industrial zones.

Dataset includes:

- 7 department systems
- 15 department records
- 2 Bengaluru Urban PIN codes
  - 560058 — Peenya Industrial Area
  - 560022 — Yeshwanthpur Industrial Suburb
- Multiple business name variations
- Missing PAN/GSTIN cases
- Activity events from 2022–2026
- One unmatched Fire Department event
- Shell/front-entity style fragmentation patterns

No real business data is used.

---

## Key Design Decisions

### 1. Wrong Merge Is More Costly Than Missed Merge

TrustID is conservative.

Only very high-confidence or anchored matches are auto-linked.

Ambiguous records go to Admin Review.

Low-confidence records remain separate.

---

### 2. Low Evidence Is Not Closure

A business with no recent evidence is not automatically treated as closed.

TrustID uses **Low Evidence** when activity signals are insufficient or cannot be confidently joined.

---

### 3. Human Review Is Required for Ambiguity

Ambiguous record pairs are routed to an officer.

The officer can:

- Merge
- Reject
- Escalate
- Reopen

Every decision is logged.

---

### 4. Auditability Is Built In

Every major action is hash-chained.

A conventional log can be edited silently.

A hash chain makes modification detectable.

---

### 5. Privacy Is Architectural

Sensitive fields are blind-hashed before matching.

The matching engine does not need raw PAN/GSTIN/phone/proprietor values to compare equality.

---

## Non-Negotiables Satisfied

| Non-Negotiable | How TrustID Satisfies It |
|---|---|
| Source systems cannot be modified | TrustID uses read-only ingestion and sits beside existing systems |
| Real data not released | Prototype uses deterministic synthetic data |
| Every automated decision explainable | Field scores, evidence trails, officer briefs, and timelines are visible |
| Every decision reversible | Reviewer decisions can be reopened and changed |
| Wrong merge more costly than missed one | Conservative thresholds and human review workflow |
| No hosted LLM on raw PII | No hosted LLM is used for core matching; identifiers are blind-hashed |
| Unmatched events surfaced | Unmatched activity event queue is visible in the UI |

---

## Prototype vs Production

### Current Prototype

The current deployed prototype uses:

```text
In-memory synthetic data
Single Express backend
React dashboard
Deterministic matching
Hash-chained ledger
Instant reset
```

This was chosen for:

- Reliable judging
- Zero setup
- Fast deployment
- Deterministic results
- Easy live demo

---

### Production Architecture Path

For production deployment, TrustID can evolve into:

```text
PostgreSQL
Persistent UBID registry, review decisions, audit ledger, activity events

Kafka / Event Bus
Real-time one-way department event streams

OpenSearch
Fast universal lookup across names, records, and addresses

Python + Spark / Ray Workers
Distributed entity resolution for millions of records

KMS / HSM
Secure HMAC-SHA256 keys for privacy-preserving matching

Role-Based Access Control
Admin, reviewer, auditor, department officer roles

Indic-Aware Normalization
Kannada-English transliteration and phonetic matching

Graph Analytics
Shell company and subsidiary-chain detection
```

---

## Scalability Notes

Naive record comparison is:

```text
O(n²)
```

For 1 million records, that is not feasible.

TrustID avoids all-pairs comparison using blocking.

Prototype blocking:

```text
PIN code
```

Production blocking can use:

```text
PAN/GSTIN hash
PIN code
Normalized name prefix
Phone/proprietor hash
Address locality tokens
Sector
Phonetic/transliteration keys
```

With blocking, complexity becomes approximately:

```text
O(Σ bᵢ²)
```

where `bᵢ` is the size of each candidate block.

This is far smaller than comparing every record with every other record.

---

## Security Notes

The prototype demonstrates privacy-preserving architecture using salted SHA-256 blind hashes.

For production, stronger security should include:

- HMAC-SHA256 instead of plain SHA-256
- Secret pepper stored in KMS/HSM
- Per-department salts
- Role-based access control
- API rate limiting
- Audit logs for lookups
- Encryption at rest
- Network isolation
- Data retention policies
- No public hash exposure

---

## Kannada and Multilingual Support

The current prototype uses English synthetic records.

For production in Karnataka, TrustID should add Indic-aware normalization:

- Kannada Unicode normalization
- Kannada-English transliteration
- English-Kannada alias handling
- Phonetic matching
- Local business suffix dictionaries
- Locality and address standardization

This would allow records such as:

```text
ಶ್ರೀ ಲಕ್ಷ್ಮಿ ಪ್ರೆಸಿಷನ್ ಟೂಲ್ಸ್
Sri Lakshmi Precision Tools
```

to be compared through normalized phonetic representations.

---

## Demo Flow

Recommended demo order:

```text
1. Command Center
2. Department Feeds
3. Identity Resolution
4. Business Registry
5. Admin Review
6. Activity Intelligence
7. Risk & Inspection Query
8. Trust Ledger
9. Impact View
```

Best interactions to show:

```text
Universal Lookup: SE-560058-1001
Universal Lookup: AABCL1234F
Inspection Query: PIN 560022, 24 months
Click UBID in Business Registry
Download Officer Brief
Generate Field Verification Task
Reject / Reopen Review Decision
Show Trust Ledger update
Toggle Dark Mode
```

---

## Future Scope

Planned production enhancements:

- Persistent PostgreSQL database
- Department adapter framework for 40+ systems
- Role-based authentication
- Auditor-only view
- Maker-checker workflow for sensitive decisions
- Kannada and multilingual matching
- Graph-based shell entity detection
- Field officer mobile app
- Document upload and verification evidence
- Integration with inspection scheduling systems
- Natural language query layer on non-PII/scrambled data
- Real-time event ingestion through Kafka
- Model governance dashboard
- Threshold calibration from reviewer feedback

---

## Final Pitch

TrustID is not just a UBID matcher.

It is a privacy-preserving, explainable, human-reviewed, audit-defensible identity intelligence layer for Karnataka’s business ecosystem.

A normal UBID system tells whether two records match.

TrustID tells:

```text
Is this the same real-world business?
How confident is the match?
Which evidence supports the linkage?
Is the business active?
Is it risky?
Does it require field verification?
Can the decision survive audit?
```

Karnataka does not just need more data.

It needs a trusted join key.

TrustID creates that join key without modifying legacy systems, without exposing raw PII, and without making silent black-box decisions.

---

## Author

**Agrima Saxena**  
Solo Participant — AI for Bharat Hackathon  
Theme 1: Unified Business Identifier and Active Business Intelligence