// ====================================================================
// BM25 Index (exact / keyword search)
// --------------------------------------------------------------------
// Minimal in-memory BM25 implementation (Okapi).  Built fresh when a
// document is added or removed – the corpora are small (jobs/users
// per request context) so rebuild cost is negligible.
//
// Formula:
//   score(D, Q) = Σ_{t in Q} IDF(t) *
//                 (f(t,D)*(k1+1)) / (f(t,D) + k1*(1 - b + b*|D|/avgdl))
// ====================================================================

const config = require("./config");

class BM25Index {
  constructor({ k1 = config.bm25.k1, b = config.bm25.b } = {}) {
    this.k1 = k1;
    this.b = b;
    /** id -> tokens[] */
    this.docs = new Map();
    /** id -> Map<term, tf> */
    this.tf = new Map();
    /** id -> |D| */
    this.docLen = new Map();

    /** term -> document-frequency */
    this.df = new Map();
    /** term -> IDF */
    this.idf = new Map();
    this.avgdl = 0;
    this.dirty = false;
  }

  add(id, tokens) {
    this.remove(id); // idempotent upsert
    if (!Array.isArray(tokens) || tokens.length === 0) {
      // still record empty doc so it appears in the universe
      this.docs.set(id, []);
      this.tf.set(id, new Map());
      this.docLen.set(id, 0);
      this.dirty = true;
      return;
    }

    const tfMap = new Map();
    for (const t of tokens) {
      tfMap.set(t, (tfMap.get(t) || 0) + 1);
    }

    this.docs.set(id, tokens);
    this.tf.set(id, tfMap);
    this.docLen.set(id, tokens.length);
    this.dirty = true;
  }

  remove(id) {
    if (!this.docs.has(id)) return;
    this.docs.delete(id);
    this.tf.delete(id);
    this.docLen.delete(id);
    this.dirty = true;
  }

  clear() {
    this.docs.clear();
    this.tf.clear();
    this.docLen.clear();
    this.df.clear();
    this.idf.clear();
    this.avgdl = 0;
    this.dirty = false;
  }

  build() {
    this.df.clear();
    this.idf.clear();

    let total = 0;
    for (const [, tfMap] of this.tf) {
      for (const term of tfMap.keys()) {
        this.df.set(term, (this.df.get(term) || 0) + 1);
      }
    }
    for (const len of this.docLen.values()) total += len;

    const N = this.docs.size || 1;
    this.avgdl = total / N || 1;

    // Okapi IDF with +0.5 smoothing -> guaranteed non-negative via max(eps, ..)
    for (const [term, df] of this.df) {
      const raw = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      this.idf.set(term, raw);
    }
    this.dirty = false;
  }

  _ensureBuilt() {
    if (this.dirty) this.build();
  }

  /** Score a single document by id against a query. */
  score(queryTokens, id) {
    this._ensureBuilt();
    const tfMap = this.tf.get(id);
    if (!tfMap) return 0;
    const dl = this.docLen.get(id) || 0;
    const { k1, b, avgdl } = this;

    let s = 0;
    for (const term of queryTokens) {
      const f = tfMap.get(term);
      if (!f) continue;
      const idf = this.idf.get(term) || 0;
      if (idf <= 0) continue;
      const denom = f + k1 * (1 - b + b * (dl / (avgdl || 1)));
      s += idf * ((f * (k1 + 1)) / (denom || 1));
    }
    return s;
  }

  /** Score every known document id, optionally restricted to a set. */
  scoreAll(queryTokens, { ids } = {}) {
    this._ensureBuilt();
    const result = new Map();
    const targets = ids ? ids : this.docs.keys();
    for (const id of targets) {
      if (!this.docs.has(id)) continue;
      result.set(id, this.score(queryTokens, id));
    }
    return result;
  }

  size() {
    return this.docs.size;
  }
}

module.exports = { BM25Index };
