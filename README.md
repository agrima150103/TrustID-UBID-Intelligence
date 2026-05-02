# TrustID — Karnataka UBID & Active Business Intelligence Platform

> An integrity-first prototype for Karnataka Commerce & Industry that resolves fragmented government department records into a single trusted business identity, classifies business activity, detects shell entities, and maintains a tamper-evident decision ledger.

**Built for:** AI for Bharat Hackathon — Theme 1: Unified Business Identifier (UBID) and Active Business Intelligence by Karnataka Commerce & Industry

---

## The Problem

Karnataka's regulatory landscape spans 40+ department systems — Shop Establishment, Factories, Labour, KSPCB, BESCOM, BWSSB, Food Safety, and others. Each was built in isolation, with its own schema, identifiers, and free-text name/address fields. The same business appears as multiple disconnected records:
Sri Lakshmi Precision Tools Pvt Ltd   ← Shop Establishment
S L Precision Tools Private Limited   ← Factories
Lakshmi Precision Tools               ← KSPCB
Sri Lakshmi Precision Tooling         ← Labour
There is no reliable join key. Karnataka Commerce & Industries cannot answer: *how many businesses are actually operating in Peenya today, which sectors, and which haven't been inspected in 18 months?*

---

## What TrustID Does

**Part A — UBID Assignment**

- Ingests master data from department systems in read-only mode (no source modification)
- Blind-hashes PAN, GSTIN, proprietor and phone at ingestion boundary (privacy gateway)
- Links records using Jaro-Winkler name similarity + address token overlap + hashed identifier equality
- Assigns a Unique Business Identifier (UBID) anchored to PAN/GSTIN where available
- Routes high-confidence matches to auto-link, ambiguous pairs to human review, low-confidence to keep-separate
- Records every decision in a hash-chained tamper-evident audit ledger

**Part B — Activity Intelligence**

- Ingests one-way activity event streams (inspections, renewals, filings, consumption)
- Classifies each UBID as Active / Dormant / Closed / Low Evidence
- Uses recency-weighted signal scoring — absence of signal is surfaced as "Low Evidence," not silently treated as closure
- Produces explainable verdicts with evidence timelines

**Differentiators**

- **Shell entity detection** — flags businesses that share blind-hashed proprietor/phone signals across differently-named entities (GST split scheme pattern)
- **Tamper-evident audit ledger** — every decision is SHA-256 hash-chained; retroactive modification is cryptographically detectable
- **Trust scoring** — composite risk/trust score per UBID based on confidence, activity, and integrity flags
- **Field verification tasks** — officers can generate investigation tasks from suspicious UBIDs
- **Reviewer reopen** — any reviewer decision can be reversed with a full audit trail

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Node.js + Express | Fast API development, good SQLite support |
| Database | better-sqlite3 (SQLite) | Zero-setup, ACID-compliant, audit-safe |
| Privacy | CryptoJS SHA-256 | PII blind-hashing at ingestion boundary |
| Matching | Custom Jaro-Winkler + Token Similarity | Deterministic, explainable, no external ML dependency |
| Frontend | React 18 + Vite | Fast dev, component model fits dashboard UI |
| Charts | Recharts | Lightweight, composable data visualization |
| Icons | Lucide React | Consistent icon system |

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

## Running Locally

### Prerequisites
- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
node src/server.js
```

Backend runs on `http://localhost:5000`

The server auto-initializes with synthetic Karnataka business data on startup (no separate seed step needed).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | KPI summary — records, UBIDs, flags, status breakdown |
| GET | `/api/ingestion` | Department system stats + all raw records |
| GET | `/api/ubids` | All resolved UBIDs with linked record count |
| GET | `/api/ubids/:ubid` | UBID detail — linked records, events, flags, officer brief |
| POST | `/api/ubids/:ubid/field-verification` | Generate field investigation task |
| GET | `/api/reviewer` | Ambiguous review queue |
| POST | `/api/reviewer/:id/decision` | Submit merge / reject / escalate decision |
| POST | `/api/reviewer/:id/reopen` | Reopen and reverse a reviewer decision |
| GET | `/api/activity` | All UBIDs with activity status and trust score |
| POST | `/api/activity/classify` | Re-run activity classifier |
| GET | `/api/query/flagship?pin=560058&months=18` | Flagship government query |
| GET | `/api/query/integrity-flags` | All integrity flags |
| GET | `/api/field-verification` | All open field tasks |
| GET | `/api/audit` | Full audit ledger + chain verification |
| GET | `/api/impact` | Before/after metrics + PIN intelligence |

---

## Synthetic Dataset

The prototype runs on synthetic data representing real Karnataka industrial zones:

- **7 department systems:** Shop Establishment, Factories, Labour, KSPCB, BESCOM, BWSSB, Food Safety
- **15 business records** across 2 Bengaluru PIN codes: 560058 (Peenya) and 560022 (Yeshwantpur)
- **5 business clusters** with name/address variation simulating real department data inconsistencies
- **Shell entity pair:** same blind-hashed proprietor + phone across differently-named entities
- **9 activity events** spanning 2022–2026 to produce Active, Dormant, and Low Evidence classifications

No real business data is used at any point. PAN, GSTIN, proprietor and phone values are blind-hashed at the data ingestion boundary.

---

## Key Design Decisions

**Why Jaro-Winkler over embeddings?**
Deterministic and explainable. Every score can be traced to specific field comparisons. Government audit requires this — a black-box similarity is not defensible.

**Why blind hashing before matching?**
Satisfies the non-negotiable: hosted LLMs and central matchers never see raw PII. Equality matching happens on SHA-256 hashes only.

**Why a hash-chained ledger instead of a simple audit log?**
A conventional audit log can be modified after the fact. A hash-chained ledger makes retroactive modification cryptographically detectable — which matters when the system is used for regulatory enforcement.

**Why "Low Evidence" instead of treating missing signals as Closed?**
A factory with no KSPCB inspection record is not necessarily dormant — it may simply be under the inspection threshold. Surfacing ambiguity honestly is more valuable to government officers than a confident wrong answer.

---

## Non-Negotiables Satisfied

| Constraint | How TrustID satisfies it |
|---|---|
| No source system modification | Read-only API/batch ingestion only |
| No hosted LLM on raw PII | Blind hashing at ingestion; no raw values cross the matching boundary |
| Every decision explainable | Jaro-Winkler scores, matched fields, and Shapley-style signal breakdowns on every verdict |
| Every decision reversible | Hash-chained ledger; reviewer decisions can be reopened and overridden |
| Wrong merge more costly than missed one | Conservative thresholds; ambiguous pairs always go to human review |


