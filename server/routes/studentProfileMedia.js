const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// import these from where they exist in your project
const { authMiddleware, studentOnly, UserModel, buildProfileResponse } = require("../whatever-path");

router.put(
  "/upload-media",
  authMiddleware,
  studentOnly,
  upload.single("media"),
  async (req, res) => {
    try {
      const { mediaType } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!["avatar", "coverImage", "introVideo"].includes(mediaType)) {
        return res.status(400).json({
          message: "Invalid mediaType",
        });
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }

      let folder = "gronxtiy/profile";
      let resourceType = "image";

      if (mediaType === "avatar") {
        folder = "gronxtiy/profile/avatar";
        resourceType = "image";
      } else if (mediaType === "coverImage") {
        folder = "gronxtiy/profile/cover";
        resourceType = "image";
      } else if (mediaType === "introVideo") {
        folder = "gronxtiy/profile/intro-video";
        resourceType = "video";
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        folder,
        resourceType
      );

      if (mediaType === "avatar") user.avatar = result.secure_url;
      if (mediaType === "coverImage") user.coverImage = result.secure_url;
      if (mediaType === "introVideo") user.introVideoUrl = result.secure_url;

      await user.save();

      return res.json({
        message: `${mediaType} uploaded successfully`,
        profile: buildProfileResponse(user),
      });
    } catch (err) {
      console.error("Upload profile media error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

module.exports = router;