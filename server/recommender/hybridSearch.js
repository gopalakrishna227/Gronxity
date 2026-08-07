// ====================================================================
// Hybrid Search – orchestration
// --------------------------------------------------------------------
// Combines:
//   * Semantic  : BGE-small cosine similarity via vector store
//   * Lexical   : BM25 over the same text corpus
//   * Filters   : education / experience level (soft by default)
//   * Weighting : dynamic based on student skill count
//
// Normalisation:
//   - cosine  already in [-1, 1] -> clamp to [0, 1] with (s + 1) / 2
//     but in practice BGE + positive content stays in [0, 1]; we keep
//     it numerically safe with Math.max(0, ...).
//   - BM25 scores are unbounded; min-max normalise across the candidate
//     set.  If max==0 (no keyword matches anywhere) treat as zeros.
//
// Final score  = w_sem * sem_norm  +  w_bm25 * bm25_norm
// matchPercent = round(clamp01(score) * 100)
// ====================================================================

const config = require("./config");
const embedder = require("./embedder");
const textBuilder = require("./textBuilder");
const weights = require("./weights");
const filters = require("./hardFilters");

function _clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}


function _normaliseSemantic(map) {
  // BGE cosines on positive English text are ~0.2..0.9; clamp to [0,1]
  const out = new Map();
  for (const [id, s] of map) out.set(id, _clamp01(s));
  return out;
}

function _normaliseBM25(map) {
  const out = new Map();
  let max = 0;
  for (const v of map.values()) if (v > max) max = v;
  if (max <= 0) {
    for (const id of map.keys()) out.set(id, 0);
    return out;
  }
  for (const [id, v] of map) out.set(id, v / max);
  return out;
}

/**
 * Rank a pool of jobs for a single student.
 *
 * @param {object} args
 * @param {object} args.student                mongoose user doc / plain obj
 * @param {Array<object>} args.jobs            list of job docs (already filtered to published)
 * @param {object} args.jobStore               vector store for jobs (await-friendly)
 * @param {object} args.jobBM25                BM25Index instance for jobs
 * @returns {Promise<Array<{job: object, score: number, matchPercent: number, breakdown: object}>>}
 */
async function recommendJobsForStudent({ student, jobs, jobStore, jobBM25 }) {
  if (!Array.isArray(jobs) || jobs.length === 0) return [];

  const jobIds = jobs.map((j) => String(j._id));
  const jobMap = new Map(jobs.map((j) => [String(j._id), j]));

  // 1. Build student query text (BGE "query" side)
  const studentText = textBuilder.buildStudentText(student);
  const queryTokens = textBuilder.tokenize(studentText);

  // 2. Semantic scores (cosine) for candidate jobs
  const qEmbed = await embedder.embedText(studentText, { asQuery: true });
  const semMap = await jobStore.scoreMap(qEmbed, jobIds);

  // 3. BM25 scores for candidate jobs
  const bm25Map = jobBM25.scoreAll(queryTokens, { ids: jobIds });

  // 4. Normalise
  const semN = _normaliseSemantic(semMap);
  const bmN = _normaliseBM25(bm25Map);

  // 5. Dynamic weights based on student skill richness
  const w = weights.computeStudentWeights(student);

  // 6. Fuse + apply filters
  const ranked = [];
  for (const id of jobIds) {
    const job = jobMap.get(id);
    if (!job) continue;

    const sem = semN.get(id) || 0;
    const bm = bmN.get(id) || 0;
    const raw = w.semantic * sem + w.bm25 * bm;

    const f = filters.applyFilters(student, job);
    if (!f.pass) continue;

    const adjusted = _clamp01(raw * f.penalty);
    ranked.push({
      job,
      score: adjusted,
      matchPercent: Math.round(adjusted * 100),
      breakdown: {
        semantic: Number(sem.toFixed(4)),
        bm25: Number(bm.toFixed(4)),
        weights: { semantic: w.semantic, bm25: w.bm25 },
        profile: w.profile,
        skillCount: w.skillCount,
        filterPenalty: f.penalty,
        filterReasons: f.reasons,
      },
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

/**
 * Rank a set of applications (applicants) for a single job.
 * NOTE: Per product spec, we return rank-only (no percentages exposed)
 *       – the caller is free to inspect .score for internal sorting.
 *
 * @param {object} args
 * @param {object} args.job
 * @param {Array<object>} args.applications   docs with .studentSnapshot / .studentId
 * @param {object} args.userStore             vector store for users
 * @param {object} args.userBM25              BM25Index instance for users
 * @returns {Promise<Array<{application, score, breakdown}>>}
 */
async function rankApplicantsForJob({
  job,
  applications,
  userStore,
  userBM25,
}) {
  if (!Array.isArray(applications) || applications.length === 0) return [];

  const w = weights.recruiterWeights();
  const jobText = textBuilder.buildJobText(job);
  const queryTokens = textBuilder.tokenize(jobText);
  const qEmbed = await embedder.embedText(jobText, { asQuery: true });

  // Prefer live user-store embeddings (always up to date).  Fall back
  // to snapshot-embedding for users that haven't been indexed yet.
  const studentIds = applications.map((a) => String(a.studentId?._id || a.studentId));
  const semMap = await userStore.scoreMap(qEmbed, studentIds);

  // For missing users, embed the application snapshot on the fly.
  const missing = [];
  for (let i = 0; i < applications.length; i++) {
    const sid = studentIds[i];
    if (!semMap.has(sid)) missing.push({ i, sid });
  }
  if (missing.length > 0) {
    const texts = missing.map(({ i }) =>
      textBuilder.buildStudentText(applications[i].studentSnapshot || {})
    );
    const embs = await embedder.embedBatch(texts);
    for (let k = 0; k < missing.length; k++) {
      const { sid } = missing[k];
      // cosine vs query
      let s = 0;
      const v = embs[k];
      for (let d = 0; d < v.length; d++) s += qEmbed[d] * v[d];
      if (s > 1) s = 1;
      if (s < -1) s = -1;
      semMap.set(sid, s);
    }
  }

  // BM25 against user index; for unindexed users, score their snapshot
  // against the query tokens using a transient scoring pass.
  const bmMap = new Map();
  for (let i = 0; i < applications.length; i++) {
    const sid = studentIds[i];
    if (userBM25.size() > 0 && userBM25.docs?.has?.(sid)) {
      bmMap.set(sid, userBM25.score(queryTokens, sid));
    } else {
      // Lightweight ad-hoc TF count against the snapshot tokens.
      const snapTokens = textBuilder.tokenize(
        textBuilder.buildStudentText(applications[i].studentSnapshot || {})
      );
      const tf = new Map();
      for (const t of snapTokens) tf.set(t, (tf.get(t) || 0) + 1);
      // Since we don't have IDF for unknown docs, fall back to a
      // raw-overlap score (queryTokens ∩ docTokens weighted by tf).
      let raw = 0;
      for (const qt of new Set(queryTokens)) raw += tf.get(qt) || 0;
      bmMap.set(sid, raw);
    }
  }

  const semN = _normaliseSemantic(semMap);
  const bmN = _normaliseBM25(bmMap);

  const ranked = applications.map((app) => {
    const sid = String(app.studentId?._id || app.studentId);
    const sem = semN.get(sid) || 0;
    const bm = bmN.get(sid) || 0;
    const score = _clamp01(w.semantic * sem + w.bm25 * bm);
    return {
      application: app,
      score,
      breakdown: {
        semantic: Number(sem.toFixed(4)),
        bm25: Number(bm.toFixed(4)),
        weights: { semantic: w.semantic, bm25: w.bm25 },
      },
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

module.exports = {
  recommendJobsForStudent,
  rankApplicantsForJob,
  _internal: { _normaliseBM25, _normaliseSemantic, _clamp01 },
};
