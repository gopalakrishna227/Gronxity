// ====================================================================
// Store factory – picks file, chroma, or in-memory based on config
// --------------------------------------------------------------------
// Both adapters expose an *async* surface for the subset we use:
//
//   upsert(id, embedding, metadata) -> Promise
//   delete(id)                      -> Promise
//   scoreMap(query, ids)            -> Promise<Map<id, cosine>>
//
// Backend selection (RECO_VECTOR_STORE env var):
//   "file"   (default) – persists to <dataDir>/<name>.vdb; survives restarts
//   "memory"           – in-RAM only; lost on restart
//   "chroma"           – external ChromaDB server
//
// The in-memory store's methods are sync, so we wrap them.
// ====================================================================

const config = require("./config");
const { InMemoryVectorStore } = require("./vectorStore");

function _wrapInMemory(store) {
  return {
    backend: "memory",
    name: store.name,
    _inner: store, // direct reference so stats can read size synchronously
    upsert: async (id, emb, meta) => store.upsert(id, emb, meta),
    delete: async (id) => store.delete(id),
    has: (id) => store.has(id),
    get: (id) => store.get(id),
    size: async () => store.size(),
    clear: async () => store.clear(),
    query: async (q, opts) => store.query(q, opts),
    scoreMap: async (q, ids) => store.scoreMap(q, ids),
  };
}

function _wrapChroma(store) {
  return {
    backend: "chroma",
    name: store.collectionName,
    upsert: (id, emb, meta) => store.upsert(id, emb, meta),
    delete: (id) => store.delete(id),
    has: () => false,
    get: () => null,
    size: () => store.size(),
    clear: () => store.clear(),
    query: (q, opts) => store.query(q, opts),
    scoreMap: (q, ids) => store.scoreMap(q, ids),
  };
}

function _wrapFile(store) {
  return {
    backend: "file",
    name: store.collectionName,
    _inner: store, // expose for _storeSize in indexer
    upsert: (id, emb, meta) => store.upsert(id, emb, meta),
    delete: (id) => store.delete(id),
    has: (id) => store.has(id),
    get: (id) => store.get(id),
    size: () => store.size(),
    clear: () => store.clear(),
    query: (q, opts) => store.query(q, opts),
    scoreMap: (q, ids) => store.scoreMap(q, ids),
    flushSync: () => store.flushSync(),
  };
}

function createStore(kind /* 'jobs' | 'users' */) {
  const want = config.vectorStore;

  if (want === "file") {
    try {
      const { FileVectorStore } = require("./fileStore");
      const name = kind === "jobs" ? "gronxtiy_jobs" : "gronxtiy_users";
      return _wrapFile(
        new FileVectorStore({ collectionName: name, dim: config.embedDim, dataDir: config.dataDir })
      );
    } catch (err) {
      console.warn(
        `[recommender] File backend error (${err.message}); falling back to in-memory.`
      );
    }
  }

  if (want === "chroma") {
    try {
      const { ChromaVectorStore } = require("./chromaStore");
      const name =
        kind === "jobs"
          ? config.chromaJobsCollection
          : config.chromaUsersCollection;
      return _wrapChroma(
        new ChromaVectorStore({ collectionName: name, dim: config.embedDim })
      );
    } catch (err) {
      console.warn(
        `[recommender] Chroma backend unavailable (${err.message}); falling back to in-memory.`
      );
    }
  }

  return _wrapInMemory(
    new InMemoryVectorStore({ dim: config.embedDim, name: kind })
  );
}

module.exports = { createStore };
