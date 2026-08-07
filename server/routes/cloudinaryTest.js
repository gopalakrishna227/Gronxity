const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

router.post("/test-upload", upload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const result = await uploadToCloudinary(
      req.file.buffer,
      "gronxtiy/test",
      isVideo ? "video" : "image"
    );

    res.status(200).json({
      message: "Upload success",
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
});

module.exports = router;