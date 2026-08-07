// ====================================================================
// Recommender Config
// --------------------------------------------------------------------
// Central, read-only configuration for the hybrid job/applicant
// recommendation engine.  All tunables live here so other modules
// stay dumb-simple.
// ====================================================================

const path = require("path");

const config = {
  // ---------- Embedding (semantic) ----------
  // BGE-small-en-v1.5 -> 384-dim L2-normalized embeddings.
  // The model is downloaded + cached by @huggingface/transformers on
  // first use.  We use the ONNX/quantized build for speed on Node.
  embedModel: process.env.RECO_EMBED_MODEL || "Xenova/bge-small-en-v1.5",
  embedDim: 384,
  // BGE authors recommend prefixing *queries* (not passages) with:
  bgeQueryInstruction:
    "Represent this sentence for searching relevant passages: ",

  // ---------- Vector store backend ----------
  // "file"   – default; persists to disk, survives restarts (recommended)
  // "memory" – in-RAM only, lost on restart (use for testing)
  // "chroma" – external ChromaDB server (set CHROMA_URL)
  vectorStore: (process.env.RECO_VECTOR_STORE || "file").toLowerCase(),

  // Directory where .vdb files are written (file backend).
  // On EC2, point this to a persistent EBS volume path if desired.
  dataDir: process.env.RECO_DATA_DIR || path.join(__dirname, "..", "data"),

  chromaUrl: process.env.CHROMA_URL || "http://localhost:8000",
  chromaJobsCollection:
    process.env.CHROMA_JOBS_COLLECTION || "gronxtiy_jobs",
  chromaUsersCollection:
    process.env.CHROMA_USERS_COLLECTION || "gronxtiy_users",

  // ---------- BM25 tunables ----------
  bm25: {
    k1: 1.5,
    b: 0.75,
  },

  // ---------- Dynamic hybrid weights ----------
  // Three-tier weighting based on how many distinct skills the student has.
  // As a profile gets more skills it becomes more "keyword-precise", so BM25
  // should dominate over the broad semantic signal.
  // Weights must sum to 1.0 within each tier.
  //
  //   Tier         Skill count   Rationale
  //   ─────────────────────────────────────────────────────────────────
  //   sparse       < 5           profile is thin → trust embeddings
  //   rich         5 – 9         decent coverage → balanced, BM25 leads
  //   hyperRich    ≥ 10          precise stack → keyword matching wins
  skillThresholdRich:      5,   // sparse  → rich
  skillThresholdHyper:    10,   // rich    → hyperRich
  weights: {
    sparseProfile:    { semantic: 0.70, bm25: 0.30 }, // < 5  skills
    richProfile:      { semantic: 0.40, bm25: 0.60 }, // 5-9  skills
    hyperRichProfile: { semantic: 0.20, bm25: 0.80 }, // ≥ 10 skills
    recruiter:        { semantic: 0.50, bm25: 0.50 },
  },

  // ---------- Scoring / filter penalties ----------
  topK: parseInt(process.env.RECO_TOP_K || "50", 10),

  // Location mismatch: strong enough that a preferred-location job at 75 %
  // beats a non-preferred job at 90 % (90 × 0.80 = 72 < 75).
  locationFilterPenalty: parseFloat(process.env.RECO_LOCATION_PENALTY || "0.80"),

  // Experience mismatch: graduated by how far the gap is.
  // Gap  = years between the student's range and the job's required range.
  //   close    (≤ 1 yr gap) – minor mis-step, barely penalise
  //   moderate (2-3 yr gap) – noticeable mismatch, rank clearly lower
  //   far      (> 3 yr gap) – e.g. Fresher job shown to 5-yr senior → bury it
  experienceFilterPenalty: {
    close:    parseFloat(process.env.RECO_EXP_PENALTY_CLOSE    || "0.85"),
    moderate: parseFloat(process.env.RECO_EXP_PENALTY_MODERATE || "0.70"),
    far:      parseFloat(process.env.RECO_EXP_PENALTY_FAR      || "0.55"),
  },

  strictFilters: false,

  // ---------- Logging ----------
  verbose: (process.env.RECO_VERBOSE || "true") === "true",
};

module.exports = config;
