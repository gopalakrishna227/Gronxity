// ====================================================================
// Text Builder
// --------------------------------------------------------------------
// Turns Mongo documents (users, jobs, application snapshots) into the
// plain-text "representation" that both the embedding model and the
// BM25 index consume.
//
// Keep fields semantically labelled – BGE & BM25 both benefit from the
// field name acting as a soft weight.
// ====================================================================

function _arr(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v == null || v === "") return [];
  return [v];
}

function _join(list, sep = ", ") {
  return _arr(list).map((x) => String(x).trim()).filter(Boolean).join(sep);
}

function _line(label, value) {
  if (!value) return "";
  return `${label}: ${value}`;
}

// --------------------------------------------------------------------
// STUDENT (user document OR application snapshot)
// --------------------------------------------------------------------
function buildStudentText(student) {
  if (!student) return "";
  const s = student;

  const experience = _arr(s.experience)
    .map((e) => {
      const role = e.role || "";
      const company = e.company || "";
      const desc = e.description || "";
      const tags = _join(e.tags);
      return [
        role && company ? `${role} at ${company}` : role || company,
        desc,
        tags ? `Tags: ${tags}` : "",
      ]
        .filter(Boolean)
        .join(". ");
    })
    .filter(Boolean)
    .join(" | ");

  const education = _arr(s.education)
    .map((e) => [e.degree, e.school, e.grade].filter(Boolean).join(" – "))
    .filter(Boolean)
    .join(" | ");

  const projects = _arr(s.projects)
    .map((p) =>
      [p.title, p.techStack, p.description].filter(Boolean).join(". ")
    )
    .filter(Boolean)
    .join(" | ");

  const lines = [
    _line("Headline", s.headline),
    _line("About", s.about),
    _line("Career goal", s.careerGoal),
    _line("Top skill", s.topSkill),
    _line("Best area", s.bestArea),
    _line("Main skills", _join(s.mainSkills)),
    _line("Skills", _join(s.skills)),
    _line("Experience", experience),
    _line("Projects", projects),
    _line("Education", education),
    _line("Years of experience", s.yearsOfExperience),
    _line("Preferred locations", _join(s.preferredLocations)),
    _line("Open to", s.openTo),
    _line("Notice period", s.noticePeriod),
  ];

  return lines.filter(Boolean).join("\n");
}

// --------------------------------------------------------------------
// JOB
// --------------------------------------------------------------------
function buildJobText(job) {
  if (!job) return "";
  const j = job;

  const lines = [
    _line("Title", j.title),
    _line("Department", j.department),
    _line("Description", j.description),
    _line("Responsibilities", _join(j.responsibilities, ". ")),
    _line("Qualifications", _join(j.qualifications, ". ")),
    _line("Required skills", _join(j.skills)),
    _line("Experience level", j.experienceLevel),
    _line("Education", _join(j.educationLevels)),
    _line("Job type", j.jobType),
    _line("Location", j.location),
    _line("Benefits", _join(j.benefits, ". ")),
  ];

  return lines.filter(Boolean).join("\n");
}

// --------------------------------------------------------------------
// Simple tokenizer shared by BM25 and keyword helpers
// --------------------------------------------------------------------
const STOPWORDS = new Set([
  "a","an","the","and","or","but","if","of","to","in","for","on","with",
  "at","by","from","is","are","was","were","be","been","being","as","it",
  "this","that","these","those","we","you","they","he","she","i","our",
  "your","their","has","have","had","do","does","did","will","would",
  "should","can","could","may","might","must","not","no","so","than",
  "then","there","here","what","which","who","whom","how","why","when",
  "where","into","over","under","about","above","below","between","through",
  "because","while","after","before","during","against","per","via",
]);

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    // keep + # . (useful for C++, C#, Node.js)
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && t.length > 1 && !STOPWORDS.has(t));
}

module.exports = {
  buildStudentText,
  buildJobText,
  tokenize,
};
