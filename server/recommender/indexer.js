// ====================================================================
// Indexer
// --------------------------------------------------------------------
// Owns the two vector stores and two BM25 indices (jobs, users),
// keeps them in sync with MongoDB, and exposes upsert / delete hooks
// that the rest of the backend can call after mutations.
//
// Bootstrapping:  buildAll() streams every published job + every
// student from Mongo, embeds in batches, and populates both indices.
// The build runs once at server start and never blocks request
// handling – requests arriving during bootstrap degrade to the
// BM25-only path gracefully (semantic similarity just returns 0).
// ====================================================================

const config = require("./config");
const embedder = require("./embedder");
const textBuilder = require("./textBuilder");
const { BM25Index } = require("./bm25");
const { createStore } = require("./store");

class RecommenderIndexer {
  constructor() {
    this.models = null;
    this.jobStore = null;
    this.userStore = null;
    this.jobBM25 = new BM25Index();
    this.userBM25 = new BM25Index();

    this.jobTexts = new Map(); // id -> raw text (useful for debug)
    this.userTexts = new Map();

    this.ready = false;
    this.semanticReady = false; // true only after embeddings are stored
    this.building = false;
    this.lastBuildAt = null;
    this.lastEmbedError = null;
    this.lastError = null;
  }

  init({ UserModel, Job, JobApplication }) {
    if (!UserModel || !Job) {
      throw new Error("RecommenderIndexer.init: UserModel & Job are required");
    }
    this.models = { UserModel, Job, JobApplication };
    this.jobStore = createStore("jobs");
    this.userStore = createStore("users");
  }

  // ----------------------------------------------------------------
  // Bootstrap
  // ----------------------------------------------------------------
  async buildAll({ force = false } = {}) {
    if (this.building) return { status: "building" };
    if (this.ready && !force) return { status: "already-ready" };
    if (!this.models) throw new Error("Indexer not initialised – call init()");

    this.building = true;
    this.lastError = null;
    const t0 = Date.now();

    try {
      if (config.verbose) console.log("[recommender] building indices…");

      // --- JOBS: BM25 first (no model needed, always succeeds) ------
      const jobs = await this.models.Job.find({ status: "published" }).lean();
      const jobTexts = jobs.map((j) => textBuilder.buildJobText(j));

      this.jobBM25.clear();
      for (let i = 0; i < jobs.length; i++) {
        const id = String(jobs[i]._id);
        this.jobTexts.set(id, jobTexts[i]);
        this.jobBM25.add(id, textBuilder.tokenize(jobTexts[i]));
      }
      this.jobBM25.build();

      // --- USERS: BM25 first ----------------------------------------
      const users = await this.models.UserModel.find({ role: "student" })
        .select(
          "name headline about careerGoal topSkill bestArea skills mainSkills " +
            "experience projects education yearsOfExperience preferredLocations openTo noticePeriod"
        )
        .lean();

/*const users = await this.models.UserModel.find({})
  .select(
    "name role headline about careerGoal topSkill bestArea skills mainSkills experience projects education yearsOfExperience preferredLocations openTo noticePeriod"
  )
  .lean();

console.log*/


(
  users.map((u) => ({
    name: u.name,
    role: u.role,
  }))
);


        
      const userTexts = users.map((u) => textBuilder.buildStudentText(u));

      this.userBM25.clear();
      for (let i = 0; i < users.length; i++) {
        const id = String(users[i]._id);
        this.userTexts.set(id, userTexts[i]);
        this.userBM25.add(id, textBuilder.tokenize(userTexts[i]));
      }
      this.userBM25.build();

      // Mark ready now so BM25 + skill-overlap scoring is live even if
      // the embedding model is still downloading or unavailable.
      this.ready = true;
      this.semanticReady = false;
      this.lastBuildAt = new Date();

      if (config.verbose) {
        console.log(
          `[recommender] BM25 index ready in ${Date.now() - t0}ms  ` +
            `(jobs=${jobs.length}, users=${users.length}) — loading embedding model…`
        );
      }

      // --- SEMANTIC EMBEDDINGS (may fail if model unavailable) ------
      // Wrapped separately so a download failure doesn't wipe out BM25.
      try {
        const jobEmbeds = await _batchedEmbed(jobTexts);
        for (let i = 0; i < jobs.length; i++) {
          await this.jobStore.upsert(
            String(jobs[i]._id),
            jobEmbeds[i],
            { title: jobs[i].title }
          );
        }

        const userEmbeds = await _batchedEmbed(userTexts);
        for (let i = 0; i < users.length; i++) {
          await this.userStore.upsert(
            String(users[i]._id),
            userEmbeds[i],
            { name: users[i].name }
          );
        }

        this.semanticReady = true;
        this.lastEmbedError = null;

        console.log(
          `[recommender] ✅ full hybrid ready in ${Date.now() - t0}ms  ` +
            `(jobs=${jobs.length}, users=${users.length}, backend=${this.jobStore.backend})`
        );
      } catch (embErr) {
        this.lastEmbedError = embErr.message;
        console.warn(
          `[recommender] ⚠️  embedding model unavailable (${embErr.message}) – ` +
            "running BM25 + skill-overlap mode only; semantic scores will be 0"
        );
      }

      return {
        status: "ok",
        jobs: jobs.length,
        users: users.length,
        backend: this.jobStore.backend,
        ms: Date.now() - t0,
      };
    } catch (err) {
      this.lastError = err;a
      console.error("[recommender] build failed:", err);
      return { status: "error", error: err.message };
    } finally {
      this.building = false;
    }
  }

  // ----------------------------------------------------------------
  // Incremental updates
  // ----------------------------------------------------------------
  async upsertJob(job) {
    if (!job || !this.jobStore) return;
    const id = String(job._id);

    // If job has been unpublished or deleted treat as removal
    if (job.status && job.status !== "published") {
      return this.removeJob(id);
    }

    const text = textBuilder.buildJobText(job);
    const emb = await embedder.embedText(text);

    this.jobTexts.set(id, text);
    this.jobBM25.add(id, textBuilder.tokenize(text));
    this.jobBM25.build();
    await this.jobStore.upsert(id, emb, { title: job.title });
  }

  async removeJob(jobId) {
    if (!jobId || !this.jobStore) return;
    const id = String(jobId);
    this.jobTexts.delete(id);
    this.jobBM25.remove(id);
    this.jobBM25.build();
    await this.jobStore.delete(id);
  }

  async upsertUser(user) {
    if (!user || !this.userStore) return;
    const id = String(user._id);

    // Only student profiles feed the users collection (we rank
    // applicants, which are students).
    if (user.role && user.role !== "student") {
      return this.removeUser(id);
    }

    const text = textBuilder.buildStudentText(user);
    const emb = await embedder.embedText(text);

    this.userTexts.set(id, text);
    this.userBM25.add(id, textBuilder.tokenize(text));
    this.userBM25.build();
    await this.userStore.upsert(id, emb, { name: user.name });
  }

  async removeUser(userId) {
    if (!userId || !this.userStore) return;
    const id = String(userId);
    this.userTexts.delete(id);
    this.userBM25.remove(id);
    this.userBM25.build();
    await this.userStore.delete(id);
  }

  stats() {
    return {
      ready: this.ready,
      semanticReady: this.semanticReady,
      building: this.building,
      lastBuildAt: this.lastBuildAt,
      lastError: this.lastError ? this.lastError.message : null,
      lastEmbedError: this.lastEmbedError || null,
      // bm25 counts (always populated when ready=true)
      jobsBM25: this.jobBM25.size(),
      usersBM25: this.userBM25.size(),
      // vector store counts (only populated when semanticReady=true)
      jobVectors: this.jobStore ? this._storeSize(this.jobStore) : 0,
      userVectors: this.userStore ? this._storeSize(this.userStore) : 0,
      backend: this.jobStore?.backend || null,
      vectorStore: config.vectorStore,
      embedModel: config.embedModel,
      mode: this.semanticReady ? "full-hybrid" : (this.ready ? "bm25+skill-overlap" : "not-ready"),
    };
  }

  /** Synchronously read vector count – works for both in-memory and chroma wrappers. */
  _storeSize(store) {
    try {
      // In-memory wrapper: size() is async but underlying vectors.size is sync.
      // Access via the inner store if possible, fall back to 0.
      if (store._inner) return store._inner.vectors.size;
      // Try synchronous call first (in-memory); ignore if it returns a Promise.
      const s = store.size?.();
      if (typeof s === "number") return s;
      return "?";
    } catch {
      return "?";
    }
  }
}

// --------------------------------------------------------------------
// Embedding in batches (bounded memory + model-friendly)
// --------------------------------------------------------------------
async function _batchedEmbed(texts, batchSize = 16) {
  const out = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const embs = await embedder.embedBatch(slice);
    out.push(...embs);
  }
  return out;
}

// Singleton – one indexer per process.
const indexer = new RecommenderIndexer();

module.exports = indexer;
