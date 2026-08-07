// ====================================================================
// Vector Store – file-backed persistent backend
// --------------------------------------------------------------------
// Survives server restarts by persisting vectors to a compact binary
// file (<dataDir>/<name>.vdb).  Shares the same async surface as
// chromaStore.js so store.js can swap it in with one line.
//
// Binary file layout  (little-endian):
//   [8 bytes]  magic  "GRNXVDB1"
//   [4 bytes]  uint32 entry count
//   Per entry:
//     [2 bytes]  uint16 id length
//     [N bytes]  id  (utf-8)
//     [dim*4 bytes]  float32 embedding
//     [4 bytes]  uint32 metadata-JSON length
//     [M bytes]  metadata JSON (utf-8)
//
// Writes are debounced (500 ms) so rapid upsert bursts don't thrash
// the disk.  On startup the file is read once and the full index is
// kept in memory for fast queries; the file is the source of truth
// for the next restart.
// ====================================================================

const fs = require("fs");
const path = require("path");
const config = require("./config");

const MAGIC = Buffer.from("GRNXVDB1");
const SAVE_DEBOUNCE_MS = 500;

class FileVectorStore {
  constructor({ collectionName, dim = config.embedDim, dataDir = config.dataDir } = {}) {
    if (!collectionName) throw new Error("FileVectorStore: collectionName required");
    this.collectionName = collectionName;
    this.dim = dim;
    this.dataDir = dataDir;
    this.filePath = path.join(dataDir, `${collectionName}.vdb`);

    /** id -> Float32Array */
    this.vectors = new Map();
    /** id -> object */
    this.metadata = new Map();

    this._loaded = false;
    this._saveTimer = null;
  }

  // ----------------------------------------------------------------
  // Startup: load existing data from disk
  // ----------------------------------------------------------------
  _ensureLoaded() {
    if (this._loaded) return;
    this._loaded = true;
    this._loadSync();
  }

  _loadSync() {
    if (!fs.existsSync(this.filePath)) {
      if (config.verbose) {
        console.log(
          `[recommender] FileVectorStore(${this.collectionName}): no existing file – starting empty`
        );
      }
      return;
    }

    try {
      const buf = fs.readFileSync(this.filePath);
      if (buf.length < 12) return; // too short to be valid

      // Validate magic header
      if (!buf.slice(0, 8).equals(MAGIC)) {
        console.warn(
          `[recommender] FileVectorStore(${this.collectionName}): bad magic – ignoring corrupt file`
        );
        return;
      }

      const count = buf.readUInt32LE(8);
      const floatBytes = this.dim * 4;
      let offset = 12;

      for (let i = 0; i < count; i++) {
        if (offset + 2 > buf.length) break;

        const idLen = buf.readUInt16LE(offset);
        offset += 2;

        if (offset + idLen > buf.length) break;
        const id = buf.toString("utf8", offset, offset + idLen);
        offset += idLen;

        if (offset + floatBytes > buf.length) break;
        // Read floats via readFloatLE to avoid alignment requirement
        // (Float32Array view needs a 4-byte-aligned offset which isn't
        // guaranteed when buf was read from fs.readFileSync).
        const embedding = new Float32Array(this.dim);
        for (let d = 0; d < this.dim; d++) {
          embedding[d] = buf.readFloatLE(offset + d * 4);
        }
        offset += floatBytes;

        if (offset + 4 > buf.length) break;
        const metaLen = buf.readUInt32LE(offset);
        offset += 4;

        if (offset + metaLen > buf.length) break;
        let metadata = {};
        try {
          metadata = JSON.parse(buf.toString("utf8", offset, offset + metaLen));
        } catch (_) { /* keep empty metadata on parse error */ }
        offset += metaLen;

        this.vectors.set(id, embedding);
        this.metadata.set(id, metadata);
      }

      if (config.verbose) {
        console.log(
          `[recommender] FileVectorStore(${this.collectionName}): loaded ${this.vectors.size} vectors from disk`
        );
      }
    } catch (err) {
      console.warn(
        `[recommender] FileVectorStore(${this.collectionName}): failed to load – ${err.message}; starting empty`
      );
      this.vectors.clear();
      this.metadata.clear();
    }
  }

  // ----------------------------------------------------------------
  // Persistence: write current state to disk (debounced)
  // ----------------------------------------------------------------
  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this._saveSync();
    }, SAVE_DEBOUNCE_MS);
  }

  _saveSync() {
    try {
      // Ensure directory exists
      fs.mkdirSync(this.dataDir, { recursive: true });

      const entries = [...this.vectors.entries()];
      const count = entries.length;
      const floatBytes = this.dim * 4;

      // Calculate total buffer size
      let totalSize = 12; // magic(8) + count(4)
      const metaJsons = [];
      for (const [id, _emb] of entries) {
        const meta = this.metadata.get(id) || {};
        const metaJson = Buffer.from(JSON.stringify(meta), "utf8");
        metaJsons.push(metaJson);
        const idBytes = Buffer.byteLength(id, "utf8");
        totalSize += 2 + idBytes + floatBytes + 4 + metaJson.length;
      }

      const buf = Buffer.allocUnsafe(totalSize);
      MAGIC.copy(buf, 0);
      buf.writeUInt32LE(count, 8);
      let offset = 12;

      for (let i = 0; i < entries.length; i++) {
        const [id, embedding] = entries[i];
        const idBuf = Buffer.from(id, "utf8");

        buf.writeUInt16LE(idBuf.length, offset);
        offset += 2;

        idBuf.copy(buf, offset);
        offset += idBuf.length;

        const floatBuf = Buffer.from(embedding.buffer, embedding.byteOffset, floatBytes);
        floatBuf.copy(buf, offset);
        offset += floatBytes;

        const metaJson = metaJsons[i];
        buf.writeUInt32LE(metaJson.length, offset);
        offset += 4;
        metaJson.copy(buf, offset);
        offset += metaJson.length;
      }

      // Atomic write: write to a temp file then rename
      const tmpPath = this.filePath + ".tmp";
      fs.writeFileSync(tmpPath, buf);
      fs.renameSync(tmpPath, this.filePath);

      if (config.verbose) {
        console.log(
          `[recommender] FileVectorStore(${this.collectionName}): saved ${count} vectors → ${path.basename(this.filePath)}`
        );
      }
    } catch (err) {
      console.error(
        `[recommender] FileVectorStore(${this.collectionName}): save failed – ${err.message}`
      );
    }
  }

  // ----------------------------------------------------------------
  // Public store interface  (matches InMemoryVectorStore + ChromaVectorStore)
  // ----------------------------------------------------------------
  async upsert(id, embedding, metadata = {}) {
    this._ensureLoaded();
    const sid = String(id);
    if (!embedding || embedding.length !== this.dim) {
      this.vectors.set(sid, new Float32Array(this.dim));
    } else {
      const v = new Float32Array(this.dim);
      for (let i = 0; i < this.dim; i++) v[i] = embedding[i];
      this.vectors.set(sid, v);
    }
    this.metadata.set(sid, metadata || {});
    this._scheduleSave();
  }

  async upsertBatch(items) {
    this._ensureLoaded();
    if (!items?.length) return;
    for (const { id, embedding, metadata } of items) {
      const sid = String(id);
      if (!embedding || embedding.length !== this.dim) {
        this.vectors.set(sid, new Float32Array(this.dim));
      } else {
        const v = new Float32Array(this.dim);
        for (let i = 0; i < this.dim; i++) v[i] = embedding[i];
        this.vectors.set(sid, v);
      }
      this.metadata.set(sid, metadata || {});
    }
    this._scheduleSave();
  }

  async delete(id) {
    this._ensureLoaded();
    const sid = String(id);
    this.vectors.delete(sid);
    this.metadata.delete(sid);
    this._scheduleSave();
  }

  has(id) {
    this._ensureLoaded();
    return this.vectors.has(String(id));
  }

  get(id) {
    this._ensureLoaded();
    const sid = String(id);
    if (!this.vectors.has(sid)) return null;
    return {
      id: sid,
      embedding: this.vectors.get(sid),
      metadata: this.metadata.get(sid) || {},
    };
  }

  async query(q, opts = {}) {
    this._ensureLoaded();
    if (!q || q.length !== this.dim) return [];
    const topK = opts.topK ?? config.topK;

    const restrict = opts.ids
      ? opts.ids instanceof Set ? opts.ids : new Set(opts.ids)
      : null;

    const scores = [];
    for (const [id, v] of this.vectors) {
      if (restrict && !restrict.has(id)) continue;
      let s = 0;
      for (let i = 0; i < this.dim; i++) s += q[i] * v[i];
      if (s > 1) s = 1;
      if (s < -1) s = -1;
      scores.push([id, s]);
    }
    scores.sort((a, b) => b[1] - a[1]);
    return scores.slice(0, topK).map(([id, score]) => ({
      id,
      score,
      metadata: this.metadata.get(id) || {},
    }));
  }

  async scoreMap(q, ids) {
    this._ensureLoaded();
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

  async clear() {
    this._ensureLoaded();
    this.vectors.clear();
    this.metadata.clear();
    this._scheduleSave();
  }

  async size() {
    this._ensureLoaded();
    return this.vectors.size;
  }

  /** Flush any pending save immediately (useful on graceful shutdown). */
  flushSync() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      this._saveSync();
    }
  }
}

module.exports = { FileVectorStore };
