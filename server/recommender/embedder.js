// ====================================================================
// Embedder (semantic representation)
// --------------------------------------------------------------------
// Thin wrapper around @huggingface/transformers' feature-extraction
// pipeline.  Produces L2-normalised float32 vectors suitable for
// cosine similarity via dot product.
//
// * Lazy singleton loader  (model weights download once, reused forever)
// * Batched encoding       (much faster than looping per doc)
// * Safe defaults for empty / falsy inputs
// ====================================================================

const config = require("./config");

let _pipelinePromise = null;

async function getPipeline() {
  if (_pipelinePromise) return _pipelinePromise;

  _pipelinePromise = (async () => {
    if (config.verbose) {
      console.log(`[recommender] loading embedding model: ${config.embedModel}`);
    }

    // Dynamic import – the package ships ESM only.
    const { pipeline, env } = await import("@huggingface/transformers");

    // Allow remote model download but cache locally.
    env.allowLocalModels = true;
    env.allowRemoteModels = true;

    const extractor = await pipeline("feature-extraction", config.embedModel, {
      // Quantized ONNX is ~33MB & plenty accurate for BGE-small.
      dtype: "q8",
    });

    if (config.verbose) {
      console.log("[recommender] embedding model ready");
    }
    return extractor;
  })().catch((err) => {
    // Reset so the next caller may retry.
    _pipelinePromise = null;
    throw err;
  });

  return _pipelinePromise;
}

function _zeros() {
  return new Float32Array(config.embedDim);
}

function _sanitise(text) {
  if (text == null) return "";
  const s = String(text).replace(/\s+/g, " ").trim();
  // Keep prompts reasonable – BGE context is 512 tokens.
  return s.length > 2000 ? s.slice(0, 2000) : s;
}

/**
 * Embed a single piece of text.
 * @param {string} text
 * @param {{ asQuery?: boolean }} [opts]
 * @returns {Promise<Float32Array>}
 */
async function embedText(text, opts = {}) {
  const clean = _sanitise(text);
  if (!clean) return _zeros();

  const payload = opts.asQuery
    ? config.bgeQueryInstruction + clean
    : clean;

  const extractor = await getPipeline();
  const out = await extractor(payload, { pooling: "mean", normalize: true });
  return new Float32Array(out.data);
}

/**
 * Embed a batch of texts.  Vectors for empty strings are zeroed.
 * @param {string[]} texts
 * @param {{ asQuery?: boolean }} [opts]
 * @returns {Promise<Float32Array[]>}
 */
async function embedBatch(texts, opts = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const extractor = await getPipeline();
  const results = new Array(texts.length);
  const nonEmptyIdx = [];
  const nonEmpty = [];

  for (let i = 0; i < texts.length; i++) {
    const clean = _sanitise(texts[i]);
    if (!clean) {
      results[i] = _zeros();
      continue;
    }
    nonEmptyIdx.push(i);
    nonEmpty.push(opts.asQuery ? config.bgeQueryInstruction + clean : clean);
  }

  if (nonEmpty.length === 0) return results;

  const out = await extractor(nonEmpty, { pooling: "mean", normalize: true });
  // out is a 2D tensor [N, dim]
  const flat = out.data;
  const dim = config.embedDim;

  for (let k = 0; k < nonEmpty.length; k++) {
    const slice = new Float32Array(dim);
    const offset = k * dim;
    for (let d = 0; d < dim; d++) slice[d] = flat[offset + d];
    results[nonEmptyIdx[k]] = slice;
  }
  return results;
}

/** Cosine similarity for L2-normalised vectors == dot product. */
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  // BGE output is already unit length – clamp to avoid fp drift
  if (s > 1) s = 1;
  if (s < -1) s = -1;
  return s;
}

module.exports = {
  embedText,
  embedBatch,
  cosine,
  getPipeline,
};
