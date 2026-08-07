# Hybrid Job-Recommendation Engine

Pure-JavaScript, dependency-light recommender that ranks jobs for students
and applicants for recruiters using **semantic + lexical** fusion.

```
┌──────────────────┐      ┌─────────────────────┐
│  Mongo (source)  │◀────▶│  indexer (in-mem +  │──▶ vector store (memory | Chroma)
│  User / Job /    │      │  BM25 + embeddings) │──▶ BM25 index
│  JobApplication  │      └─────────────────────┘
└──────────────────┘                │
                                    ▼
                         ┌──────────────────────┐
                         │  hybridSearch.js     │
                         │  fuse(sem, bm25)     │
                         │  dynamic weights     │
                         │  filters (soft/hard) │
                         └──────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Express routes      │
                         │  /api/recommender/*  │
                         └──────────────────────┘
```

## Design

| Layer        | Choice                                    | Notes                                                                 |
|--------------|-------------------------------------------|-----------------------------------------------------------------------|
| Embedding    | `Xenova/bge-small-en-v1.5` (ONNX q8)      | 384-d, L2-normalised, runs locally via `@huggingface/transformers`    |
| Lexical      | BM25 (Okapi) in memory                    | Rebuilds on upsert – corpora are small                                |
| Vector store | **In-memory** (default) or **Chroma**     | Flip with `RECO_VECTOR_STORE=chroma`; same cosine interface           |
| Fusion       | Weighted sum of min-max normalised scores | Weights **dynamic** per student profile (see below)                   |
| Filters      | Education + Experience level              | Soft (multiplicative penalty) by default; hard via env flag           |

## Dynamic weighting (per spec)

| Student `skills` count | Semantic weight | BM25 weight | Reason                                           |
|-----------------------:|:---------------:|:-----------:|--------------------------------------------------|
| `< 5`                  | **0.7**         | 0.3         | Sparse profile – about / headline / goal matter  |
| `>= 5`                 | 0.4             | **0.6**     | Skill-rich profile – keyword match dominates     |

Skill count = `skills ∪ mainSkills ∪ topSkill` (deduped, case-insensitive).

Recruiter-side applicant ranking uses a fixed balanced blend (0.5 / 0.5).

## API

| Method | Path                                      | Auth       | Response                                             |
|--------|-------------------------------------------|------------|------------------------------------------------------|
| GET    | `/api/recommender/jobs`                   | student    | `Job[]` + `matchPercent` + `matchBreakdown`          |
| GET    | `/api/recommender/applicants/:jobId`      | recruiter  | `JobApplication[]` in ranked order, **no percent**   |
| GET    | `/api/recommender/stats`                  | auth       | Indexer stats (ready, counts, backend, last build)   |
| POST   | `/api/recommender/reindex`                | recruiter / admin | Force full rebuild                            |

Recruiters intentionally do **not** see a percent – per spec this isn’t
useful at scale for large applicant pools; they see rank order only.

## Integration

In `server.js` (after models + auth middleware are defined):

```js
const recommender = require("./recommender");
recommender.mount(app, {
  authMiddleware,
  UserModel,
  Job,
  JobApplication,
});

// Keep the index fresh (call these where you already mutate documents):
await recommender.onJobUpsert(newOrUpdatedJob);
await recommender.onJobDelete(deletedJobId);
await recommender.onUserUpsert(updatedStudent);
```

The initial build runs in the background – the server accepts requests
immediately and semantic scores simply read 0 until indexing completes.

## Environment flags

| Variable                  | Default                         | Purpose                                              |
|---------------------------|---------------------------------|------------------------------------------------------|
| `RECO_EMBED_MODEL`        | `Xenova/bge-small-en-v1.5`      | Any transformers.js-compatible embedding model       |
| `RECO_VECTOR_STORE`       | `memory`                        | Set `chroma` to use a running Chroma server          |
| `CHROMA_URL`              | `http://localhost:8000`         | Chroma server endpoint                               |
| `CHROMA_JOBS_COLLECTION`  | `gronxtiy_jobs`                 | Chroma collection name for jobs                      |
| `CHROMA_USERS_COLLECTION` | `gronxtiy_users`                | Chroma collection name for users                     |
| `RECO_STRICT_FILTERS`     | `false`                         | Make education / experience filters **hard**         |
| `RECO_TOP_K`              | `50`                            | Upper bound for vector queries                       |
| `RECO_VERBOSE`            | `true`                          | Startup / build logs                                 |

## Running with ChromaDB (optional)

Chroma is optional – in-memory works out of the box. To use Chroma:

```bash
# 1. Install & run the Chroma server (one time)
pip install chromadb
chroma run --path ./chroma-data --host 0.0.0.0 --port 8000

# 2. Tell the app to use it
set RECO_VECTOR_STORE=chroma      # or export on *nix
npm run dev
```

## Modules

| File                 | Responsibility                                                        |
|----------------------|-----------------------------------------------------------------------|
| `config.js`          | All tunables + env-driven defaults                                    |
| `embedder.js`        | BGE-small pipeline (lazy singleton, batch-friendly)                   |
| `textBuilder.js`     | Mongo doc → labelled text + shared tokenizer                          |
| `bm25.js`            | Small, dependency-free Okapi BM25                                     |
| `vectorStore.js`     | In-memory cosine store                                                |
| `chromaStore.js`     | ChromaDB-backed store with identical surface                          |
| `store.js`           | Backend selector / wrapper                                            |
| `weights.js`         | Dynamic semantic/BM25 weights per profile                             |
| `hardFilters.js`     | Education + experience bucket matching (soft/hard)                    |
| `hybridSearch.js`    | Orchestration – normalise, fuse, rank                                 |
| `indexer.js`         | Lifecycle + persistence of both indices                               |
| `routes.js`          | Express endpoints                                                     |
| `index.js`           | Public API consumed by `server.js`                                    |
