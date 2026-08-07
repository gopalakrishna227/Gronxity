/**
 * Seed script for the trending hashtags feature.
 *
 *   Usage:
 *     node server/scripts/seedTrendingPosts.js            # insert sample posts
 *     node server/scripts/seedTrendingPosts.js --cleanup  # remove seeded posts
 *
 * The script bypasses Mongoose schemas and writes directly via the raw
 * collection so it can set arbitrary `createdAt` values (useful for testing
 * the 7-day trending window) and stamp a hidden `_seed: true` marker that
 * makes cleanup trivial without polluting the visible `tags` array.
 *
 * It picks the first user it finds as the post author. If your DB is empty,
 * create a student account through the app first.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");

const SEED_FLAG = "_seed";
const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;

// Each entry: { content, tags, ageHours, likes, comments }
// `ageHours` controls how far back createdAt is set so we can verify the
// 7-day trending window (anything > 168h must NOT appear in trending).
const SAMPLE_POSTS = [
  // --- Heavy hitters: should dominate trending ---
  { content: "Building a full app with #ReactJS hooks. The DX is unreal.", tags: ["#ReactJS"], ageHours: 4, likes: 42, comments: 12 },
  { content: "#ReactJS performance tips thread — start with React.memo.", tags: ["#ReactJS"], ageHours: 16, likes: 33, comments: 8 },
  { content: "Why I switched from Vue to #reactjs (case-sensitivity test).", tags: ["#reactjs"], ageHours: 28, likes: 21, comments: 5 },
  { content: "Cracked my first #SystemDesign mock interview!", tags: ["#SystemDesign"], ageHours: 8, likes: 38, comments: 14 },
  { content: "#SystemDesign Primer is gold. Reading chapter 4 today.", tags: ["#SystemDesign", "#FullStackDev"], ageHours: 22, likes: 19, comments: 6 },

  // --- Mid-tier ---
  { content: "Deployed my side project on AWS. #CloudComputing is wild.", tags: ["#CloudComputing"], ageHours: 12, likes: 15, comments: 3 },
  { content: "Lambda cold starts are brutal. #CloudComputing #NodeJS", tags: ["#CloudComputing", "#NodeJS"], ageHours: 36, likes: 11, comments: 2 },
  { content: "Streams in #NodeJS finally clicked for me today.", tags: ["#NodeJS"], ageHours: 50, likes: 9, comments: 4 },
  { content: "Async/await deep dive — my notes on #JavaScript event loop.", tags: ["#JavaScript"], ageHours: 18, likes: 24, comments: 7 },
  { content: "Tailwind has ruined plain CSS for me. #WebDevelopment", tags: ["#WebDevelopment"], ageHours: 30, likes: 17, comments: 5 },

  // --- Long tail (single mention) ---
  { content: "Anyone using #StartupLife to vent? It's therapy.", tags: ["#StartupLife"], ageHours: 60, likes: 7, comments: 2 },
  { content: "Pitch deck draft v4 done. #StartupLife", tags: ["#StartupLife"], ageHours: 90, likes: 4, comments: 1 },
  { content: "Loving #FullStackDev grind. MERN ftw.", tags: ["#FullStackDev"], ageHours: 70, likes: 12, comments: 3 },
  { content: "TypeScript generics are no longer scary. #JavaScript", tags: ["#JavaScript"], ageHours: 110, likes: 6, comments: 1 },
  { content: "Built my portfolio with Vite + #ReactJS in one weekend.", tags: ["#ReactJS"], ageHours: 130, likes: 14, comments: 4 },

  // --- Edge cases ---
  // Outside the 7-day window — must NOT appear in trending.
  { content: "Old post about #ReactJS that should be excluded.", tags: ["#ReactJS"], ageHours: 24 * 10, likes: 99, comments: 30 },
  { content: "Ancient #SystemDesign rambling.", tags: ["#SystemDesign"], ageHours: 24 * 14, likes: 60, comments: 20 },
  // No tags — must NOT affect trending counts.
  { content: "Just a plain text post with no hashtags.", tags: [], ageHours: 6, likes: 5, comments: 1 },
];

async function main() {
  const cleanup = process.argv.includes("--cleanup");

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;
  const postsCol = db.collection("posts");
  const usersCol = db.collection("users");

  if (cleanup) {
    const result = await postsCol.deleteMany({ [SEED_FLAG]: true });
    console.log(`🧹 Removed ${result.deletedCount} seeded post(s).`);
    await mongoose.disconnect();
    return;
  }

  // Author: prefer a student, otherwise any user.
  let author = await usersCol.findOne({ role: "student" });
  if (!author) author = await usersCol.findOne({});

  if (!author) {
    console.error("❌ No users found. Register a student account first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`👤 Using author: ${author.name || author.email || author._id}`);

  const now = Date.now();
  const docs = SAMPLE_POSTS.map((sample) => {
    const createdAt = new Date(now - sample.ageHours * HOURS);

    const likes = Array.from({ length: sample.likes }, () => new mongoose.Types.ObjectId());

    const comments = Array.from({ length: sample.comments }, (_, idx) => ({
      _id: new mongoose.Types.ObjectId(),
      userId: author._id,
      name: author.name || "Seed Commenter",
      profileImage: author.avatar || "",
      text: `Seeded comment ${idx + 1}`,
      likes: [],
      replies: [],
      createdAt,
      updatedAt: createdAt,
    }));

    return {
      userId: author._id,
      author: author.name || "Seed User",
      profileImage: author.avatar || "",
      content: sample.content,
      postType: "text",
      imageUrl: "",
      videoUrl: "",
      thumbnail: "",
      duration: "",
      cloudinaryPublicId: "",
      cloudinaryResourceType: "",
      schedule: null,
      likes,
      comments,
      tags: sample.tags,
      [SEED_FLAG]: true,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const result = await postsCol.insertMany(docs);
  console.log(`🌱 Inserted ${result.insertedCount} seeded post(s).`);
  console.log(`   Run 'node server/scripts/seedTrendingPosts.js --cleanup' to remove them.`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
