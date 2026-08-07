// ====================================================================
// Vector Store – in-memory backend
// --------------------------------------------------------------------
// Lightweight cosine-similarity store with a Chroma-ish surface:
//   upsert(id, embedding, metadata)
//   delete(id)
//   query(queryEmbedding, { topK, ids })   -> [{ id, score, metadata }]
//   get(id) / size() / clear()
//
// Because BGE vectors are L2-normalised, cosine == dot product.
// Adequate for corpora up to a few tens of thousands; swap to the
// Chroma adapter (chromaStore.js) for larger scale.
// ====================================================================

const config = require("./config");

class InMemoryVectorStore {
  constructor({ dim = config.embedDim, name = "default" } = {}) {
    this.dim = dim;
    this.name = name;
    /** id -> Float32Array */
    this.vectors = new Map();
    /** id -> any */
    this.metadata = new Map();
  }

  upsert(id, embedding, metadata = {}) {
    if (!embedding || embedding.length !== this.dim) {
      // Store zeros rather than throwing – keeps indexing resilient.
      this.vectors.set(id, new Float32Array(this.dim));
    } else {
      // Defensive copy so caller mutations don't leak in.
      const v = new Float32Array(this.dim);
      for (let i = 0; i < this.dim; i++) v[i] = embedding[i];
      this.vectors.set(id, v);
    }
    this.metadata.set(id, metadata || {});
  }

  delete(id) {
    this.vectors.delete(id);
    this.metadata.delete(id);
  }

  has(id) {
    return this.vectors.has(id);
  }

  get(id) {
    if (!this.vectors.has(id)) return null;
    return {
      id,
      embedding: this.vectors.get(id),
      metadata: this.metadata.get(id) || {},
    };
  }

  clear() {
    this.vectors.clear();
    this.metadata.clear();
  }

  size() {
    return this.vectors.size;
  }

  /**
   * Brute-force cosine search.
   * @param {Float32Array} q normalised query vector
   * @param {{ topK?: number, ids?: string[]|Set<string> }} [opts]
   * @returns {{id: string, score: number, metadata: any}[]}
   */
  query(q, opts = {}) {
    if (!q || q.length !== this.dim) return [];
    const topK = opts.topK ?? config.topK;

    const restrict = opts.ids
      ? opts.ids instanceof Set
        ? opts.ids
        : new Set(opts.ids)
      : null;

    const scores = [];
    for (const [id, v] of this.vectors) {
      if (restrict && !restrict.has(id)) continue;
      // dot product (cosine for unit vectors)
      let s = 0;
      for (let i = 0; i < this.dim; i++) s += q[i] * v[i];
      if (s > 1) s = 1;
      if (s < -1) s = -1;
      scores.push([id, s]);
    }
    scores.sort((a, b) => b[1] - a[1]);
    const sliced = scores.slice(0, topK);
    return sliced.map(([id, score]) => ({
      id,
      score,
      metadata: this.metadata.get(id) || {},
    }));
  }

  /** Return score map for a specific id set – useful when fusing. */
  scoreMap(q, ids) {
    const out = new Map();
    if (!q || q.length !== this.dim) return out;
    const target = ids instanceof Set ? ids : new Set(ids || this.vectors.keys());
    for (const id of target) {
      const v = this.vectors.get(id);
      if (!v) continue;
      let s = 0;
      for (let i = 0; i < this.dim; i++) s += q[i] * v[i];
      if (s > 1) s = 1;
      if (s < -1) s = -1;
      out.set(id, s);
    }
    return out;
  }
}

module.exports = { InMemoryVectorStore };
