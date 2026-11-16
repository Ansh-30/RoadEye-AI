
const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { detectImage } = require("../controllers/detectionController");

// Upload image and detect potholes
router.post(
    "/image",
    authMiddleware,
    upload.single("image"),
    detectImage
);

module.exports = router;
