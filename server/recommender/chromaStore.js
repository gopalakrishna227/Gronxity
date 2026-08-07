// ====================================================================
// Vector Store – ChromaDB backend (optional)
// --------------------------------------------------------------------
// Same surface as InMemoryVectorStore but backed by a running Chroma
// server (https://docs.trychroma.com).  Enabled by:
//
//   RECO_VECTOR_STORE=chroma
//   CHROMA_URL=http://localhost:8000            (default)
//
// The user is responsible for running the server; this adapter is a
// thin bridge so swapping backends is a one-line env change.
// ====================================================================

const config = require("./config");

class ChromaVectorStore {
  constructor({ collectionName, dim = config.embedDim } = {}) {
    if (!collectionName) throw new Error("ChromaVectorStore: collectionName required");
    this.collectionName = collectionName;
    this.dim = dim;
    this._client = null;
    this._coll = null;
    this._ready = null;
  }

  async _init() {
    if (this._ready) return this._ready;

    this._ready = (async () => {
      const { ChromaClient } = require("chromadb");
      this._client = new ChromaClient({ path: config.chromaUrl });

      // We supply our own embeddings, so use a no-op embedding function.
      const noopEmbeddingFn = {
        generate: async () => [],
      };

      this._coll = await this._client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: noopEmbeddingFn,
        metadata: { "hnsw:space": "cosine" },
      });

      if (config.verbose) {
        console.log(
          `[recommender] Chroma collection ready: ${this.collectionName} @ ${config.chromaUrl}`
        );
      }
    })();

    return this._ready;
  }

  async upsert(id, embedding, metadata = {}) {
    await this._init();
    const vec = Array.from(embedding || []);
    await this._coll.upsert({
      ids: [String(id)],
      embeddings: [vec],
      metadatas: [metadata || {}],
    });
  }

  async upsertBatch(items) {
    await this._init();
    if (!items?.length) return;
    await this._coll.upsert({
      ids: items.map((i) => String(i.id)),
      embeddings: items.map((i) => Array.from(i.embedding || [])),
      metadatas: items.map((i) => i.metadata || {}),
    });
  }

  async delete(id) {
    await this._init();
    try {
      await this._coll.delete({ ids: [String(id)] });
    } catch (_) {
      /* swallow – delete is idempotent */
    }
  }

  async query(q, opts = {}) {
    await this._init();
    const topK = opts.topK ?? config.topK;
    const where = undefined;

    const result = await this._coll.query({
      queryEmbeddings: [Array.from(q)],
      nResults: topK,
      where,
    });

    const ids = (result.ids && result.ids[0]) || [];
    const dist = (result.distances && result.distances[0]) || [];
    const meta = (result.metadatas && result.metadatas[0]) || [];

    // Chroma returns cosine *distance* (1 - similarity) when using
    // hnsw:cosine.  Convert back to similarity.
    return ids.map((id, idx) => {
      const d = dist[idx];
      const score = d == null ? 0 : 1 - d;
      return { id, score, metadata: meta[idx] || {} };
    });
  }

  /**
   * Fetch embeddings for a specific id set & score vs query.
   * Falls back to a simple query-by-ids implementation.
   */
  async scoreMap(q, ids) {
    await this._init();
    const out = new Map();
    if (!ids?.length) return out;

    const list = Array.isArray(ids) ? ids : Array.from(ids);

    const result = await this._coll.get({
      ids: list.map(String),
      include: ["embeddings"],
    });

    const resIds = result.ids || [];
    const resEmb = result.embeddings || [];
    const dim = this.dim;

    for (let i = 0; i < resIds.length; i++) {
      const emb = resEmb[i];
      if (!emb) continue;
      let s = 0;
      for (let d = 0; d < dim; d++) s += q[d] * emb[d];
      if (s > 1) s = 1;
      if (s < -1) s = -1;
      out.set(resIds[i], s);
    }
    return out;
  }

  async clear() {
    await this._init();
    try {
      await this._client.deleteCollection({ name: this.collectionName });
    } finally {
      this._ready = null;
      await this._init();
    }
  }

  async size() {
    await this._init();
    return this._coll.count();
  }
}

module.exports = { ChromaVectorStore };
