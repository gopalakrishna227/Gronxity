// ====================================================================
// Filters
// --------------------------------------------------------------------
// Education and experience-level matching.  Data in these fields is
// notoriously uneven (degrees spelled many ways, years missing, etc.)
// so filters are SOFT by default – they apply a multiplicative penalty
// rather than hard-dropping candidates.  Set RECO_STRICT_FILTERS=true
// in env to make them hard filters.
// ====================================================================

const config = require("./config");

// ------- Education normalisation --------------------------------------
const DEGREE_PATTERNS = [
  { re: /\bphd\b|doctor(ate|al)?/i, level: "PhD" },
  { re: /\b(m\.?tech|mtech)\b/i, level: "M.Tech" },
  { re: /\b(mba)\b/i, level: "MBA" },
  { re: /\bmca\b/i, level: "MCA" },
  { re: /\bm\.?sc\b/i, level: "M.Sc" },
  { re: /\bm\.?com\b/i, level: "M.Com" },
  { re: /\b(master'?s?|m\.?s\b|postgrad)/i, level: "Master's Degree" },
  { re: /\b(b\.?tech|btech|b\.?e\b)\b/i, level: "B.Tech" },
  { re: /\bb\.?sc\b/i, level: "B.Sc" },
  { re: /\bb\.?com\b/i, level: "B.Com" },
  { re: /\b(bachelor'?s?|b\.?a\b|undergrad)/i, level: "Bachelor's Degree" },
  { re: /\bdiploma\b/i, level: "Diploma" },
  { re: /\bintermediate\b|\+2\b|12th\b/i, level: "Intermediate" },
  { re: /\b(high school|10th|ssc)\b/i, level: "High School" },
];

function normaliseDegree(degreeStr) {
  if (!degreeStr) return null;
  const s = String(degreeStr);
  for (const p of DEGREE_PATTERNS) if (p.re.test(s)) return p.level;
  return null;
}

function studentEducationLevels(student) {
  const out = new Set();
  for (const e of student?.education || []) {
    const lvl = normaliseDegree(e?.degree);
    if (lvl) out.add(lvl);
  }
  return out;
}

// ------- Experience bucket matching ----------------------------------
// Canonical buckets used by the job form:
//   Fresher, 0-1 Year, 1-3 Years, 3-6 Years, 6-9 Years,
//   9-12 Years, 12-15 Years, 15+ Years
function experienceBucketToYears(label) {
  if (!label) return null;
  const s = String(label).toLowerCase();
  if (/fresher/.test(s)) return [0, 0];
  const m = s.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const plus = s.match(/(\d+)\s*\+/);
  if (plus) return [parseInt(plus[1], 10), 99];
  const single = s.match(/(\d+)/);
  if (single) {
    const n = parseInt(single[1], 10);
    return [n, n];
  }
  return null;
}

/**
 * Returns a multiplicative penalty [0, 1] based on how far the student's
 * experience range is from the job's required range.
 *
 *   Gap (years)   Penalty   Example
 *   ──────────────────────────────────────────────────────────────
 *   0  (overlap)  1.00      "1-3 Yrs" student → "1-3 Yrs" job  ✅
 *   ≤ 1           0.85      "0-1 Yr"  student → "1-3 Yrs" job  slight miss
 *   2-3           0.70      "1-3 Yrs" student → "3-6 Yrs" job  moderate miss
 *   > 3           0.55      "3-6 Yrs" student → "Fresher" job  bury it
 */
function computeExperiencePenalty(studentLabel, jobLabel) {
  if (!jobLabel || !studentLabel) return 1.0; // unknown → no penalty
  const s = experienceBucketToYears(studentLabel);
  const j = experienceBucketToYears(jobLabel);
  if (!s || !j) return 1.0;

  // Ranges overlap → perfect match, no penalty
  if (!(s[1] < j[0] || s[0] > j[1])) return 1.0;

  // Gap = years between the two ranges (always > 0 here)
  const gap = s[1] < j[0] ? j[0] - s[1] : s[0] - j[1];

  const p = config.experienceFilterPenalty;
  if (gap <= 1) return p.close;
  if (gap <= 3) return p.moderate;
  return p.far;
}

// Kept for backward-compat; internally used by applyFilters via penalty now.
function experienceMatches(studentLabel, jobLabel) {
  return computeExperiencePenalty(studentLabel, jobLabel) === 1.0;
}

function educationMatches(student, job) {
  const required = (job?.educationLevels || []).filter(Boolean);
  if (required.length === 0) return true;
  const owned = studentEducationLevels(student);
  if (owned.size === 0) return true; // unknown -> don't penalise
  for (const r of required) if (owned.has(r)) return true;
  return false;
}

// ------- Location matching -------------------------------------------
// Remote / work-from-anywhere jobs are considered a match for everyone.
// Otherwise checks if the job location string overlaps (case-insensitive
// substring) with any of the student's preferredLocations.
function locationMatches(student, job) {
  const preferred = (student?.preferredLocations || [])
    .map((l) => String(l).trim().toLowerCase())
    .filter(Boolean);
  if (preferred.length === 0) return true; // no preference set → always ok

  const jobLoc = String(job?.location || "").trim().toLowerCase();
  if (!jobLoc) return true; // no location on job → don't penalise

  // Remote/WFH/Anywhere jobs are universally acceptable
  if (/remote|anywhere|work.?from.?home|wfh/i.test(jobLoc)) return true;

  // Substring overlap in either direction to handle "Bangalore" ↔ "Bengaluru / Bangalore"
  for (const pref of preferred) {
    if (pref && (jobLoc.includes(pref) || pref.includes(jobLoc))) return true;
  }

  return false;
}

// ------- Combined adjuster -------------------------------------------
/**
 * Apply education + experience + location checks.
 *
 * All three are SOFT by default: mismatches reduce the score via a
 * multiplicative penalty instead of hard-dropping the job.
 * Set strictFilters=true (or RECO_STRICT_FILTERS env) to hard-drop.
 *
 * @returns {{ pass: boolean, penalty: number, reasons: string[] }}
 */
function applyFilters(student, job) {
  const reasons = [];
  let penalty = 1.0;

  // ── Education ──────────────────────────────────────────────────────
  // Logged for visibility but no score penalty – degree data is too
  // inconsistent to penalise reliably.
  if (!educationMatches(student, job)) {
    reasons.push("education mismatch");
    if (config.strictFilters) return { pass: false, penalty: 0, reasons };
    // no penalty *= here intentionally
  }

  // ── Experience (graduated) ─────────────────────────────────────────
  // A Fresher job shown to a 5-year senior gets a 0.55 penalty;
  // a 1-year gap gets 0.85.  Overlap = no penalty.
  const expPenalty = computeExperiencePenalty(
    student?.yearsOfExperience,
    job?.experienceLevel
  );
  if (expPenalty < 1.0) {
    const gap =
      (() => {
        const s = experienceBucketToYears(student?.yearsOfExperience);
        const j = experienceBucketToYears(job?.experienceLevel);
        if (!s || !j) return 0;
        return s[1] < j[0] ? j[0] - s[1] : s[0] - j[1];
      })();
    reasons.push(`experience mismatch (${gap}yr gap)`);
    if (config.strictFilters) return { pass: false, penalty: 0, reasons };
    penalty *= expPenalty;
  }

  // ── Location ───────────────────────────────────────────────────────
  // Strong enough that a preferred-location job at 75 % beats a
  // non-preferred job at 90 %  (90 × 0.80 = 72 < 75).
  if (!locationMatches(student, job)) {
    reasons.push("location mismatch");
    if (config.strictFilters) return { pass: false, penalty: 0, reasons };
    penalty *= config.locationFilterPenalty;
  }

  return { pass: true, penalty, reasons };
}

module.exports = {
  normaliseDegree,
  studentEducationLevels,
  educationMatches,
  experienceMatches,
  computeExperiencePenalty,
  locationMatches,
  applyFilters,
};
