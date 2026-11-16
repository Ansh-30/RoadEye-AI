
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createReport,
    getMyReports,
    getNearbyReports,
    getAllReports,
    getPendingDuplicateReviews,
    createDuplicateReview,
    getDuplicateReviewHistory,
    updateReportStatus
} = require("../controllers/reportController");

// Create a new pothole report
router.post("/", authMiddleware, createReport);

// Get all reports of logged-in user
router.get("/", authMiddleware, getMyReports);

// Find nearby reports
router.get("/nearby", authMiddleware, getNearbyReports);

// Duplicate review APIs (Admin only)
router.get("/admin/duplicate-reviews/history", authMiddleware, getDuplicateReviewHistory);
router.get("/admin/duplicate-reviews", authMiddleware, getPendingDuplicateReviews);
router.post("/admin/duplicate-reviews", authMiddleware, createDuplicateReview);

// Get all reports (Admin only)
router.get("/admin", authMiddleware, getAllReports);

// Update report status (Admin only)
router.patch("/:id/status", authMiddleware, updateReportStatus);

module.exports = router;
