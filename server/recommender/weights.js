// ====================================================================
// Dynamic Hybrid Weighting
// --------------------------------------------------------------------
// Two signals: semantic (BGE cosine) + BM25 (keyword).
// Three tiers — the more skills, the more BM25 dominates:
//   sparse    (<  5 skills)  semantic 0.70 / BM25 0.30
//   rich      ( 5-9 skills)  semantic 0.40 / BM25 0.60
//   hyperRich (≥ 10 skills)  semantic 0.20 / BM25 0.80
// ====================================================================

const config = require("./config");

function _countSkills(student) {
  const s = new Set();
  (student?.skills || []).forEach((x) => x && s.add(String(x).toLowerCase().trim()));
  (student?.mainSkills || []).forEach((x) => x && s.add(String(x).toLowerCase().trim()));
  if (student?.topSkill) s.add(String(student.topSkill).toLowerCase().trim());
  return s.size;
}

/**
 * @param {object} student mongoose user doc or plain object
 * @returns {{semantic: number, bm25: number, skillCount: number, profile: 'sparse'|'rich'|'hyperRich'}}
 */
function computeStudentWeights(student) {
  const skillCount = _countSkills(student);

  let tier, w;
  if (skillCount >= config.skillThresholdHyper) {
    tier = "hyperRich";
    w    = config.weights.hyperRichProfile;
  } else if (skillCount >= config.skillThresholdRich) {
    tier = "rich";
    w    = config.weights.richProfile;
  } else {
    tier = "sparse";
    w    = config.weights.sparseProfile;
  }

  return {
    semantic:   w.semantic,
    bm25:       w.bm25,
    skillCount,
    profile:    tier,
  };
}

/** Fixed balanced weights for recruiter-side applicant ranking. */
function recruiterWeights() {
  return {
    semantic: config.weights.recruiter.semantic,
    bm25: config.weights.recruiter.bm25,
  };
}

module.exports = {
  computeStudentWeights,
  recruiterWeights,
};
