# Gronxtiy Recommender — Complete Flow Documentation

> **Le Mans analogy used throughout:** every student is a race car, every job is a circuit.
> The recommender finds which car is best suited for which circuit — and gives a lap-time score (matchPercent).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Input — What the Web App Feeds In](#2-input--what-the-web-app-feeds-in)
3. [Server Startup — Building the Index](#3-server-startup--building-the-index)
4. [Request-Time Flow — Scoring a Student](#4-request-time-flow--scoring-a-student)
5. [Engine A — BM25 (Keyword Matching)](#5-engine-a--bm25-keyword-matching)
6. [Engine B — Semantic Embedding](#6-engine-b--semantic-embedding)
7. [Three-Tier Weight System](#7-three-tier-weight-system)
8. [Filters and Penalties](#8-filters-and-penalties)
9. [Final Score Calculation — Full Example](#9-final-score-calculation--full-example)
10. [Incremental Updates (Pit Stops)](#10-incremental-updates-pit-stops)
11. [Dedicated API Routes](#11-dedicated-api-routes)
12. [Module Map](#12-module-map)
13. [Environment Variables](#13-environment-variables)

---

## 1. Architecture Overview

```
┌──────────────────────┐      ┌──────────────────────────────────────┐
│   Web Application    │      │           Recommender Engine          │
│  (React frontend)    │      │                                        │
│                      │      │  ┌─────────────┐  ┌────────────────┐ │
│  Student edits       │─────▶│  │  BM25 Index │  │  Vector Store  │ │
│  profile / skills    │      │  │  (jobs)     │  │  (jobs)        │ │
│                      │      │  └─────────────┘  └────────────────┘ │
│  Student views       │◀─────│  ┌─────────────┐  ┌────────────────┐ │
│  ranked jobs         │      │  │  BM25 Index │  │  Vector Store  │ │
│                      │      │  │  (students) │  │  (students)    │ │
│  Recruiter views     │◀─────│  └─────────────┘  └────────────────┘ │
│  ranked applicants   │      │                                        │
└──────────────────────┘      │         hybridSearch.js               │
                               │  fuse → weight → filter → rank        │
                               └──────────────────────────────────────┘
                                                │
                               ┌────────────────▼─────────────────────┐
                               │           MongoDB                      │
                               │  users · jobs · jobapplications        │
                               └──────────────────────────────────────┘
```

**Two parallel indexes are maintained:**

| Index | Used for | Built from |
|---|---|---|
| Job BM25 + Job Vectors | Ranking jobs *for a student* | All published `Job` documents |
| Student BM25 + Student Vectors | Ranking applicants *for a recruiter* | All `User` documents with `role: "student"` |

---

## 2. Input — What the Web App Feeds In

### 2a. Student Profile Fields → Recommender

Every section the student fills in on the profile page contributes to scoring.

| UI Location | DB Field | Included in Score Text | Counts Toward Skill Tier |
|---|---|:---:|:---:|
| Headline below avatar | `headline` | ✅ | ❌ |
| About section | `about` | ✅ | ❌ |
| Career Goal section | `careerGoal` | ✅ | ❌ |
| Highlights → **Top Skill** (blue card) | `topSkill` | ✅ | ✅ |
| Highlights → **Best Area** (purple card) | `bestArea` | ✅ | ❌ |
| Colored chips below name (max 6) | `mainSkills` | ✅ | ✅ |
| **Skills & Interests** section | `skills` | ✅ | ✅ |
| Experience cards (role, company, description, tags) | `experience[]` | ✅ | ❌ |
| Projects cards (title, techStack, description) | `projects[]` | ✅ | ❌ |
| Education cards (degree, school) | `education[]` | filter check only | ❌ |
| Availability → Preferred Locations | `preferredLocations` | filter check only | ❌ |
| Availability → Years of Experience | `yearsOfExperience` | filter check only | ❌ |
| Availability → Notice Period | `noticePeriod` | ✅ | ❌ |

### 2b. Full Student Text Document (Example)

Built by `textBuilder.buildStudentText()` at scoring time — always from the **live DB record**, never cached:

```
Headline: Frontend Developer | React & Next.js
About: Passionate UI engineer who loves building fast, accessible web experiences with React and TypeScript.
Career goal: To become a senior frontend architect and lead the UI platform at a product-first company.
Top skill: React
Best area: Engineering
Main skills: React, TypeScript, Next.js, Redux, JavaScript, HTML
Skills: React, JavaScript, TypeScript, HTML, CSS, Next.js, Redux, GraphQL
Experience: Frontend Developer at TechNova. Worked building production systems using React. Tags: React, JavaScript, TypeScript
Projects: Portfolio Website. React, TypeScript, Tailwind CSS. Personal portfolio with dark-mode support. | Task Manager App. Next.js, Redux Toolkit, Firebase.
Education: B.Tech
Years of experience: 1-3 Years
Preferred locations: Bangalore, Hyderabad
Open to: Open to Work
Notice period: Immediate
```

### 2c. Job Text Document (Example)

Built by `textBuilder.buildJobText()` at index build time:

```
Title: Frontend Developer
Department: Engineering
Description: Build cutting-edge web interfaces for our product suite.
Responsibilities: Build responsive, accessible UI components with React. Optimise page load performance and Core Web Vitals. Write unit and integration tests using Jest and React Testing Library.
Qualifications: Strong proficiency in React and modern JavaScript (ES6+). Experience with TypeScript and CSS-in-JS / Tailwind. Familiarity with REST APIs and browser developer tools.
Required skills: React, JavaScript, TypeScript, HTML, CSS, Next.js, Redux
Experience level: 1-3 Years
Education: B.Tech, B.Sc
Job type: Contract
Location: Mumbai
```

---

## 3. Server Startup — Building the Index

When the server starts, `indexer.buildAll()` runs **once in the background**. The server does not wait — requests are handled immediately and degrade gracefully until indexing is complete.

```
Server boots
     │
     ├─► Phase 1 (BM25 — fast, ~1–2 s)
     │    ├── Load all published jobs from MongoDB
     │    ├── Build job BM25 index  (tokenize all job texts)
     │    ├── Load all student profiles from MongoDB
     │    └── Build student BM25 index
     │    ✅ "ready = true"  →  BM25-only recommendations are live
     │
     └─► Phase 2 (Semantic — slow, ~30–60 s first run)
          ├── Download + cache BGE-small-en-v1.5 ONNX model (~33 MB, once only)
          ├── Embed all job texts in batches of 16  →  store 384-dim vectors
          └── Embed all student texts in batches of 16  →  store 384-dim vectors
          ✅ "semanticReady = true"  →  full hybrid recommendations are live
```

> **Note:** `matchPercent` is only returned to the frontend after `semanticReady = true`.
> Before that, the jobs list is returned without percentages.

### Incremental index updates (on every profile/job save):

```js
// Called automatically after user.save() in server.js
recommender.onUserUpsert(user);   // re-embeds just that one student

// Called after job create/update/delete
recommender.onJobUpsert(job);
recommender.onJobDelete(jobId);
```

---

## 4. Request-Time Flow — Scoring a Student

Triggered by `GET /api/recommender/jobs`.

```
Request arrives (authenticated student)
          │
          ▼
1. Fetch student's LIVE profile from MongoDB  ← always fresh, no cache
          │
          ▼
2. Fetch all published jobs from MongoDB
          │
          ├──── 3a. BM25 path ────────────────────────────────────────►
          │          Tokenize student text
          │          Score every job in the BM25 job index
          │          Min-max normalize across all jobs → bm ∈ [0, 1]
          │
          └──── 3b. Semantic path ─────────────────────────────────────►
                     Prepend BGE query instruction to student text
                     Embed → 384-dim query vector (fresh each request)
                     Cosine-similarity vs every pre-stored job vector
                     Clamp to [0, 1] → sem ∈ [0, 1]
          │
          ▼
4. Count student's distinct skills → pick weight tier
          │
          ▼
5. Fuse:  raw = (w_semantic × sem) + (w_bm25 × bm)
          │
          ▼
6. Apply filters → multiply penalty for each mismatch
          │
          ▼
7. matchPercent = round( clamp01(raw × penalty) × 100 )
          │
          ▼
8. Sort all jobs descending → return payload to frontend
```

---

## 5. Engine A — BM25 (Keyword Matching)

> **Le Mans analogy:** The stopwatch — measures exact lap time.
> A student mentioning "GraphQL" matching a job that requires "GraphQL" is a precise, measurable fit.

**Algorithm:** Okapi BM25 (industry-standard term-frequency / inverse-document-frequency ranking).

**Parameters (tunable in `config.js`):**

| Parameter | Value | Effect |
|---|---|---|
| `k1` | 1.5 | Term frequency saturation — how much repeated mentions of a word help |
| `b` | 0.75 | Length normalisation — penalises very long documents slightly |

**How it scores:**

1. Student text is tokenized (lowercased, punctuation stripped, stop-words removed)
2. Each token is scored against the job's BM25 document
3. Rare tokens (low document frequency across all jobs) contribute more than common ones
4. Raw scores are **min-max normalized** across all jobs in the pool → final `bm ∈ [0, 1]`

**Tokenizer example:**
```
Input:  "Frontend Developer | React & Next.js, TypeScript"
Output: ["frontend", "developer", "react", "next.js", "typescript"]
        (stop-words like "and", "&" are removed; case-folded)
```

> **Key insight:** BM25 is normalized across the *entire job pool*. The job with the highest raw BM25 score for this student gets `bm = 1.0`. All others are proportional.
> This means adding a skill only helps if that skill appears in the *target job* — and not in every other job.

---

## 6. Engine B — Semantic Embedding

> **Le Mans analogy:** The GPS — captures the overall feel of the circuit and how well the car handles it, even without exact metrics.

**Model:** `Xenova/bge-small-en-v1.5` (ONNX quantized, 33 MB, runs locally on Node.js via `@huggingface/transformers`)

**Output:** 384-dimensional L2-normalized float vector per document.

**How it works:**

```
At index build time (once):
  Job text  →  BGE model  →  384-dim job vector  (stored in memory)

At request time (per student, per request):
  Student text  →  BGE query instruction prepended  →  BGE model  →  384-dim query vector
  Cosine similarity = dot product (since vectors are L2-normalized)
  sem = cosine(student_vector, job_vector)  clamped to [0, 1]
```

**Why a query instruction?**

BGE recommends prefixing *queries* (but not *documents*) with:
```
"Represent this sentence for searching relevant passages: "
```
This improves retrieval quality — the student text is treated as a *query* searching for *relevant job passages*.

**What semantic captures that BM25 misses:**

| Student writes | Job says | BM25 | Semantic |
|---|---|---|---|
| "browser interfaces" | "frontend development" | ❌ no overlap | ✅ similar meaning |
| "Redux Toolkit" | "state management" | ❌ no overlap | ✅ captures concept |
| "accessible UI" | "WCAG compliance" | ❌ no overlap | ✅ related domain |

---

## 7. Three-Tier Weight System

> **Le Mans analogy:** The fuel map — aggressive map for precise conditions, conservative map when conditions are uncertain.

Skill count = unique values across `skills ∪ mainSkills ∪ topSkill` (case-insensitive dedup).

| Tier | Skill Count | Semantic Weight | BM25 Weight | Rationale |
|---|---|:---:|:---:|---|
| **sparse** | < 5 | **0.70** | 0.30 | Profile is thin — trust the AI's broad understanding of the candidate |
| **rich** | 5 – 9 | 0.40 | **0.60** | Decent coverage — keyword precision starts to dominate |
| **hyperRich** | ≥ 10 | 0.20 | **0.80** | Precise tech stack — exact keyword match is the strongest signal |

**Example — seed_student1:**
```
skills    = ["React","JavaScript","TypeScript","HTML","CSS","Next.js","Redux","GraphQL"]  → 8
mainSkills = ["React","TypeScript","Next.js","Redux","JavaScript","HTML"]                 → 6 (4 new after dedup)
topSkill  = "React"                                                                       → 0 new after dedup

Total distinct skills = 12  →  hyperRich tier
Weights: semantic = 0.20,  bm25 = 0.80
```

---

## 8. Filters and Penalties

> **Le Mans analogy:** Mandatory safety checks — fail one and you get a time penalty applied to your lap time.

Filters are **soft** by default (multiplicative penalty). Set `RECO_STRICT_FILTERS=true` to make them hard-cut (job is dropped entirely).

| Filter | Check | Default Penalty |
|---|---|---|
| **Education** | Student's degree ∈ job's `educationLevels` | × `softFilterPenalty` = **1.0** (no penalty currently) |
| **Experience** | Student's `yearsOfExperience` overlaps job's `experienceLevel` bucket | × **1.0** (no penalty currently) |
| **Location** | Job's city ∈ student's `preferredLocations` (substring match) | × **0.85** on mismatch |

**Location match rules:**
- Student has no preferred locations → always passes (no preference = willing to go anywhere)
- Job has no location → always passes
- Job is "Remote" / "Work from home" / "WFH" / "Anywhere" → always passes
- Otherwise: substring check in both directions ("Bangalore" matches "Bengaluru / Bangalore")

**Penalty stacking:**
```
All three fail:  penalty = 1.0 × 1.0 × 0.85 = 0.85
```
*(Currently only location carries a non-trivial penalty.)*

---

## 9. Final Score Calculation — Full Example

**Student:** seed_student1 (Frontend/React archetype)
**Job:** Frontend Developer at TechNova, Mumbai
**Assumed preferred locations:** Bangalore, Hyderabad (Mumbai not included)

```
─── BM25 ───────────────────────────────────────────────────────────────────
Student tokens include:
  "react", "next.js", "typescript", "html", "css", "redux", "graphql",
  "frontend", "developer", "accessible", "tailwind", "firebase", ...

Job tokens include:
  "frontend", "developer", "react", "typescript", "html", "css", "next.js",
  "redux", "accessible", "ui", "jest", "tailwind", "core", "web", "vitals", ...

Overlapping high-value tokens: react, next.js, typescript, html, css, redux,
  frontend, developer, accessible, tailwind

Raw BM25 vs Frontend Developer job  = 4.72
Raw BM25 vs React Developer job     = 5.01  ← slightly higher (GraphQL bonus)

Normalized bm25 = 4.72 / 5.01 = 0.942

─── Semantic ────────────────────────────────────────────────────────────────
Student vector (384-dim) vs Frontend Developer job vector
Cosine similarity = 0.89  →  sem = 0.89

─── Weights (hyperRich tier: 12 skills) ────────────────────────────────────
w_semantic = 0.20,  w_bm25 = 0.80

raw = (0.20 × 0.89) + (0.80 × 0.942)
    = 0.178 + 0.754
    = 0.932

─── Filters ─────────────────────────────────────────────────────────────────
Education:   B.Tech ✅  matches job requirement  →  penalty × 1.0
Experience:  "1-3 Years" ✅  matches job range   →  penalty × 1.0
Location:    "Mumbai" ∉ ["Bangalore","Hyderabad"] ❌  →  penalty × 0.85

Total penalty = 0.85

─── Final ───────────────────────────────────────────────────────────────────
adjusted = clamp01(0.932 × 0.85) = 0.7922

matchPercent = round(0.7922 × 100) = 79% ✅
```

### How to push above 85%

| Change | Field to edit | Expected score |
|---|---|---|
| Add **Mumbai** to preferred locations | `preferredLocations` | 0.932 → **93%** |
| Add job-specific terms to experience/projects ("Jest", "Tailwind", "Core Web Vitals") | `experience[].description`, `projects[]` | +3–6 pts on BM25 |
| Add more exact job keywords to Skills & Interests | `skills` | +1–3 pts on BM25 |
| Add matching mainSkills chips | `mainSkills` | +1–2 pts on BM25 |

> The location penalty alone is responsible for the gap from ~93% to 79%.
> Fixing location is the single highest-impact change.

---

## 10. Incremental Updates (Pit Stops)

The index does **not require a full rebuild** when a single document changes.

### Student profile updated (via `PUT /api/student/profile/me`):
```
user.save()  →  recommender.onUserUpsert(user)
                    │
                    ├── Re-build student text
                    ├── Re-embed → new 384-dim vector
                    ├── Upsert into student vector store
                    └── Upsert into student BM25 index + rebuild BM25
```
> For student-side job recommendations, this hook doesn't change the score —
> because the student's text is **always rebuilt live from MongoDB at request time**.
> The hook matters for **recruiter-side applicant ranking** only.

### Job posted / updated / deleted:
```
recommender.onJobUpsert(job)   →  re-embeds job + updates both job indexes
recommender.onJobDelete(jobId) →  removes from both job indexes
```

### Force full rebuild (admin):
```
POST /api/recommender/reindex
```
Wipes both indexes and re-reads all documents from MongoDB. Use after bulk data changes.

---

## 11. Dedicated API Routes

All routes are under `/api/recommender/` and require authentication.

### `GET /api/recommender/jobs` — Student only

Returns all published jobs ranked by `matchPercent` for the logged-in student.

**Response shape:**
```json
[
  {
    "_id": "...",
    "title": "Frontend Developer",
    "company": "TechNova",
    "location": "Mumbai",
    "matchPercent": 79,
    "matchBreakdown": {
      "semantic": 0.89,
      "bm25": 0.942,
      "weights": { "semantic": 0.2, "bm25": 0.8 },
      "profile": "hyperRich",
      "skillCount": 12,
      "filterPenalty": 0.85,
      "filterReasons": ["location mismatch"]
    }
  }
]
```

> `matchPercent` and `matchBreakdown` are only present after `semanticReady = true`.

### `GET /api/recommender/applicants/:jobId` — Recruiter only

Returns applicants for one of the recruiter's jobs in ranked order. **No percentage is exposed** — just order.

### `GET /api/recommender/stats` — Any authenticated user

Returns index health for debugging:
```json
{
  "ready": true,
  "semanticReady": true,
  "building": false,
  "lastBuildAt": "2026-05-03T12:30:00.000Z",
  "jobsBM25": 50,
  "usersBM25": 50,
  "jobVectors": 50,
  "userVectors": 50,
  "backend": "memory",
  "mode": "full-hybrid"
}
```

### `POST /api/recommender/reindex` — Recruiter / Admin only

Forces a full index rebuild. Returns:
```json
{ "status": "ok", "jobs": 50, "users": 50, "ms": 4320 }
```

**Why are these separate from the normal jobs API?**

The regular `GET /api/jobs` returns raw job data from MongoDB — fast, simple. The recommender routes run ML inference (embedding + vector search + BM25 scoring) and return results in a computed order with a computed score. Mixing these concerns would make the regular jobs endpoint slow and complex for callers that don't need scoring (e.g., a recruiter managing their own posts).

---

## 12. Module Map

| File | Responsibility |
|---|---|
| `config.js` | All tunables — weights, thresholds, model name, penalties |
| `embedder.js` | BGE-small pipeline — lazy singleton, batch-friendly, L2-normalized output |
| `textBuilder.js` | MongoDB doc → labelled plain text + shared tokenizer |
| `bm25.js` | In-memory Okapi BM25 — add / remove / score / build |
| `vectorStore.js` | In-memory cosine similarity store |
| `chromaStore.js` | ChromaDB-backed store with identical interface |
| `store.js` | Backend selector — picks memory or Chroma based on env |
| `weights.js` | Three-tier dynamic semantic/BM25 weight calculator |
| `hardFilters.js` | Education + experience + location matching (soft/hard) |
| `hybridSearch.js` | Orchestration — normalise, fuse, apply filters, rank |
| `indexer.js` | Lifecycle — bootstrap, incremental upsert, stats |
| `routes.js` | Express endpoints — /jobs, /applicants, /stats, /reindex |
| `index.js` | Public API consumed by `server.js` — mount + hooks |

---

## 13. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `RECO_EMBED_MODEL` | `Xenova/bge-small-en-v1.5` | Any `@huggingface/transformers`-compatible model |
| `RECO_VECTOR_STORE` | `memory` | Set `chroma` to use a running ChromaDB server |
| `CHROMA_URL` | `http://localhost:8000` | ChromaDB server endpoint |
| `CHROMA_JOBS_COLLECTION` | `gronxtiy_jobs` | ChromaDB collection for job vectors |
| `CHROMA_USERS_COLLECTION` | `gronxtiy_users` | ChromaDB collection for student vectors |
| `RECO_STRICT_FILTERS` | `false` | `true` = hard-drop mismatches instead of penalty |
| `RECO_LOCATION_PENALTY` | `0.85` | Multiplier applied when student location ≠ job location |
| `RECO_TOP_K` | `50` | Max candidates for vector queries |
| `RECO_VERBOSE` | `true` | Startup and build log messages |

---

*Last updated: May 2026 — reflects three-tier weighting (sparse / rich / hyperRich).*
