// ====================================================================
// Recommender – public entry point
// --------------------------------------------------------------------
// Usage (server.js):
//   const recommender = require("./recommender");
//   recommender.mount(app, {
//     authMiddleware,
//     UserModel,
//     Job,
//     JobApplication,
//   });
//
// On mount:
//   - Express router is registered at /api/recommender
//   - Indexer is initialised and kicked off in the background so the
//     server boots immediately; semantic scores return 0 until ready,
//     after which hybrid fusion is active.
//
// Incremental hooks (call from your existing mutation handlers):
//   await recommender.onJobUpsert(job);
//   await recommender.onJobDelete(jobId);
//   await recommender.onUserUpsert(user);
//   await recommender.onUserDelete(userId);
// ====================================================================

const mongoose = require("mongoose");
const indexer = require("./indexer");
const { createRouter } = require("./routes");
const config = require("./config");

// Don't start a build until mongoose has a live connection.  This
// avoids the 10s "buffering timed out" error when MONGO_URI is
// missing / the cluster is unreachable, and ensures the build runs
// exactly once per (re)connect event.
function _onConnected(fn) {
  const conn = mongoose.connection;

  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (conn.readyState === 1) {
    setImmediate(fn);
    return;
  }

  let fired = false;
  const run = () => {
    if (fired) return;
    fired = true;
    fn();
  };
  conn.once("connected", run);
  conn.once("open", run);
}

function mount(app, opts) {
  if (!app) throw new Error("recommender.mount: express app required");
  const { authMiddleware, UserModel, Job, JobApplication } = opts || {};
  if (!authMiddleware || !UserModel || !Job || !JobApplication) {
    throw new Error(
      "recommender.mount: authMiddleware + {UserModel, Job, JobApplication} required"
    );
  }

  indexer.init({ UserModel, Job, JobApplication });

  const router = createRouter({
    authMiddleware,
    UserModel,
    Job,
    JobApplication,
  });
  app.use("/api/recommender", router);

  // Wait for Mongo, then kick off the build *without* blocking startup.
  _onConnected(() => {
    if (config.verbose) {
      console.log("[recommender] mongo connected – starting initial build");
    }
    indexer
      .buildAll()
      .then((r) => {
        if (config.verbose) console.log("[recommender] initial build:", r);
      })
      .catch((err) =>
        console.error("[recommender] initial build failed:", err.message)
      );
  });

  // Rebuild after a reconnect (e.g. cluster flap) so the indices stay fresh.
  mongoose.connection.on("reconnected", () => {
    console.log("[recommender] mongo reconnected – rebuilding indices");
    indexer.buildAll({ force: true }).catch((err) =>
      console.error("[recommender] rebuild failed:", err.message)
    );
  });

  // Fail-fast log if mongoose never connects within a minute – the
  // recommender simply stays in "not ready" state and requests will
  // degrade gracefully to 0 semantic / raw BM25 scores.
  if (mongoose.connection.readyState !== 1) {
    setTimeout(() => {
      if (!indexer.ready && mongoose.connection.readyState !== 1) {
        console.warn(
          "[recommender] mongo still not connected after 60s – " +
            "check MONGO_URI in your .env; recommender build deferred."
        );
      }
    }, 60_000).unref?.();
  }

  return { router, indexer };
}

module.exports = {
  mount,
  config,
  indexer,
  onJobUpsert: (job) => indexer.upsertJob(job).catch((e) =>
    console.error("[recommender] onJobUpsert:", e.message)
  ),
  onJobDelete: (jobId) => indexer.removeJob(jobId).catch((e) =>
    console.error("[recommender] onJobDelete:", e.message)
  ),
  onUserUpsert: (user) => indexer.upsertUser(user).catch((e) =>
    console.error("[recommender] onUserUpsert:", e.message)
  ),
  onUserDelete: (userId) => indexer.removeUser(userId).catch((e) =>
    console.error("[recommender] onUserDelete:", e.message)
  ),
};
