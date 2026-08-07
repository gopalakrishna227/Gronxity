// ====================================================================
// Recommender Routes
// --------------------------------------------------------------------
// GET  /api/recommender/jobs                -> student:   ranked jobs
//                                              includes matchPercent
// GET  /api/recommender/applicants/:jobId   -> recruiter: ranked
//                                              applicants (no percent)
// GET  /api/recommender/stats               -> debug info
// POST /api/recommender/reindex             -> manual rebuild
// ====================================================================

const express = require("express");
const indexer = require("./indexer");
const hybrid = require("./hybridSearch");

function createRouter({ authMiddleware, UserModel, Job, JobApplication }) {
  if (!authMiddleware || !UserModel || !Job || !JobApplication) {
    throw new Error(
      "recommender.createRouter: authMiddleware + models are required"
    );
  }

  const router = express.Router();

  // --------------------------------------------------------------
  // STUDENT – ranked list of published jobs with matchPercent
  // --------------------------------------------------------------
  router.get("/jobs", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students allowed" });
      }

      const student = await UserModel.findById(req.user.id)
        .select("-password")
        .lean();
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const jobs = await Job.find({ status: "published" })
        .populate("recruiterId", "name company email")
        .lean();

      if (!indexer.ready) {
        // Kick off a build in the background; fall back to fresh scoring
        // using transient indices so the first caller isn't blocked.
        indexer.buildAll().catch(() => {});
      }

      const ranked = await hybrid.recommendJobsForStudent({
        student,
        jobs,
        jobStore: indexer.jobStore,
        jobBM25: indexer.jobBM25,
      });

      // Only expose matchPercent once the full semantic index is ready.
      // Before that the score is BM25-only and misleadingly low/high.
      const semanticReady = indexer.semanticReady;

      const payload = ranked.map((r) => ({
        ...r.job,
        matchPercent: semanticReady ? r.matchPercent : undefined,
        matchBreakdown: semanticReady ? r.breakdown : undefined,
      }));

      return res.json(payload);
    } catch (err) {
      console.error("[recommender] /jobs error:", err);
      return res
        .status(500)
        .json({ message: err.message || "Recommender error" });
    }
  });

  // --------------------------------------------------------------
  // RECRUITER – ranked list of applicants for one of their jobs
  // --------------------------------------------------------------
  router.get("/applicants/:jobId", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Only recruiters allowed" });
      }

      const job = await Job.findOne({
        _id: req.params.jobId,
        recruiterId: req.user.id,
      }).lean();

      if (!job) {
        return res
          .status(404)
          .json({ message: "Job not found or access denied" });
      }

      const applications = await JobApplication.find({ jobId: job._id })
        .populate("studentId", "name email")
        .sort({ createdAt: -1 })
        .lean();

      if (!indexer.ready) {
        indexer.buildAll().catch(() => {});
      }

      const ranked = await hybrid.rankApplicantsForJob({
        job,
        applications,
        userStore: indexer.userStore,
        userBM25: indexer.userBM25,
      });

      // Return the application objects in ranked order only.  Do NOT
      // expose the numerical score – the recruiter view intentionally
      // omits percentages (per spec).
      return res.json(ranked.map((r) => r.application));
    } catch (err) {
      console.error("[recommender] /applicants error:", err);
      return res
        .status(500)
        .json({ message: err.message || "Recommender error" });
    }
  });

  // --------------------------------------------------------------
  // STATS / DEBUG (authenticated)
  // --------------------------------------------------------------
  router.get("/stats", authMiddleware, async (req, res) => {
    const stats = indexer.stats();
    // If semantic failed last time and we're not currently building, kick
    // off a background retry so the next request benefits from full hybrid.
    if (!stats.semanticReady && !stats.building && stats.lastEmbedError) {
      indexer.buildAll({ force: true }).catch(() => {});
    }
    return res.json(stats);
  });

  router.post("/reindex", authMiddleware, async (req, res) => {
    try {
      // Only recruiters or admins can trigger a full rebuild.
      if (!["recruiter", "admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Not allowed" });
      }
      const result = await indexer.buildAll({ force: true });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = { createRouter };
