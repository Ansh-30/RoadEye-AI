
const prisma = require("../config/prisma");

const DEFAULT_DUPLICATE_RADIUS_METERS = 30;
const EARTH_RADIUS_METERS = 6371000;

const calculateDistanceMeters = (latitudeA, longitudeA, latitudeB, longitudeB) => {
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const latitudeDifference = toRadians(latitudeB - latitudeA);
    const longitudeDifference = toRadians(longitudeB - longitudeA);
    const haversine =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(latitudeA)) *
        Math.cos(toRadians(latitudeB)) *
        Math.sin(longitudeDifference / 2) ** 2;
    const centralAngle = 2 * Math.atan2(
        Math.sqrt(Math.min(1, haversine)),
        Math.sqrt(Math.max(0, 1 - haversine))
    );

    return EARTH_RADIUS_METERS * centralAngle;
};

const getDuplicateRadiusMeters = () => {
    const configuredRadius = process.env.DUPLICATE_RADIUS_METERS;
    if (configuredRadius === undefined || configuredRadius.trim() === "") {
        return DEFAULT_DUPLICATE_RADIUS_METERS;
    }

    const radius = Number(configuredRadius);
    if (!Number.isFinite(radius) || radius <= 0) {
        throw new Error("DUPLICATE_RADIUS_METERS must be a positive finite number.");
    }

    return radius;
};

const isAdmin = (req, res) => {
    if (req.user?.role === "ADMIN") {
        return true;
    }

    res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
    });
    return false;
};

const getCanonicalReportPair = (reportAId, reportBId) => (
    reportAId < reportBId
        ? [reportAId, reportBId]
        : [reportBId, reportAId]
);

const getReportPairKey = (reportAId, reportBId) => (
    JSON.stringify(getCanonicalReportPair(reportAId, reportBId))
);

const getEligibleLocatedReports = () => prisma.report.findMany({
    where: {
        status: { not: "REJECTED" },
        latitude: { not: null },
        longitude: { not: null }
    },
    select: {
        id: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        originalImageUrl: true,
        status: true,
        createdAt: true
    }
});

const getPossibleDuplicatePairs = async (radiusMeters) => {
    const [reports, reviews] = await Promise.all([
        getEligibleLocatedReports(),
        prisma.duplicateReview.findMany({
            select: {
                reportAId: true,
                reportBId: true
            }
        })
    ]);

    const reviewedPairKeys = new Set(
        reviews.map((review) => getReportPairKey(review.reportAId, review.reportBId))
    );
    const validReports = reports.filter((report) =>
        Number.isFinite(report.latitude) &&
        Number.isFinite(report.longitude) &&
        report.latitude >= -90 &&
        report.latitude <= 90 &&
        report.longitude >= -180 &&
        report.longitude <= 180
    );
    const pairs = [];

    for (let firstIndex = 0; firstIndex < validReports.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < validReports.length; secondIndex += 1) {
            const firstReport = validReports[firstIndex];
            const secondReport = validReports[secondIndex];
            const distanceMeters = calculateDistanceMeters(
                firstReport.latitude,
                firstReport.longitude,
                secondReport.latitude,
                secondReport.longitude
            );

            if (distanceMeters > radiusMeters) {
                continue;
            }

            const [reportAId, reportBId] = getCanonicalReportPair(firstReport.id, secondReport.id);
            if (reviewedPairKeys.has(getReportPairKey(reportAId, reportBId))) {
                continue;
            }

            const reportById = new Map([
                [firstReport.id, firstReport],
                [secondReport.id, secondReport]
            ]);

            pairs.push({
                reportA: reportById.get(reportAId),
                reportB: reportById.get(reportBId),
                distanceMeters
            });
        }
    }

    return pairs.sort((pairA, pairB) => pairA.distanceMeters - pairB.distanceMeters);
};

// Create a new pothole report
const createReport = async (req, res) => {
    try {
        const {
            imageUrl,
            latitude,
            longitude,
            detectionLabel,
            confidence,
            detectionCount
        } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required"
            });
        }

        if (
            confidence !== undefined &&
            confidence !== null &&
            (typeof confidence !== "number" ||
                confidence < 0 ||
                confidence > 1)
        ) {
            return res.status(400).json({
                success: false,
                message: "Confidence must be between 0 and 1"
            });
        }

        const report = await prisma.report.create({
            data: {
                imageUrl,
                latitude,
                longitude,
                detectionLabel: detectionLabel || "pothole",
                confidence,
                detectionCount: detectionCount || 1,
                userId: req.user.id
            }
        });

        return res.status(201).json({
            success: true,
            message: "Pothole report created successfully",
            report
        });

    } catch (error) {
        console.error("Create Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create report"
        });
    }
};

// Get all reports of logged-in user
const getMyReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: {
                userId: req.user.id
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports
        });

    } catch (error) {
        console.error("Get Reports Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
};

// Find reports near the supplied coordinates
const getNearbyReports = async (req, res) => {
    const { latitude: latitudeValue, longitude: longitudeValue } = req.query;

    if (
        latitudeValue === undefined ||
        longitudeValue === undefined ||
        Array.isArray(latitudeValue) ||
        Array.isArray(longitudeValue) ||
        String(latitudeValue).trim() === "" ||
        String(longitudeValue).trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Latitude and longitude query parameters are required."
        });
    }

    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(400).json({
            success: false,
            message: "Latitude or longitude is outside the valid geographic range."
        });
    }

    let radiusMeters;
    try {
        radiusMeters = getDuplicateRadiusMeters();
    } catch (error) {
        console.error("Nearby Reports Configuration Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Nearby report search is not configured correctly."
        });
    }

    try {
        const reports = await prisma.report.findMany({
            where: {
                status: { not: "REJECTED" },
                latitude: { not: null },
                longitude: { not: null }
            },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                imageUrl: true,
                status: true,
                detectionCount: true,
                confidence: true,
                createdAt: true
            }
        });

        const nearbyReports = reports
            .filter((report) =>
                Number.isFinite(report.latitude) &&
                Number.isFinite(report.longitude) &&
                report.latitude >= -90 &&
                report.latitude <= 90 &&
                report.longitude >= -180 &&
                report.longitude <= 180
            )
            .map((report) => ({
                ...report,
                distanceMeters: calculateDistanceMeters(
                    latitude,
                    longitude,
                    report.latitude,
                    report.longitude
                )
            }))
            .filter((report) => report.distanceMeters <= radiusMeters)
            .sort((reportA, reportB) => reportA.distanceMeters - reportB.distanceMeters);

        return res.status(200).json({
            success: true,
            radiusMeters,
            count: nearbyReports.length,
            nearbyReports
        });
    } catch (error) {
        console.error("Get Nearby Reports Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch nearby reports."
        });
    }
};

// List unreviewed nearby report pairs for administrators
const getPendingDuplicateReviews = async (req, res) => {
    if (!isAdmin(req, res)) {
        return;
    }

    let radiusMeters;
    try {
        radiusMeters = getDuplicateRadiusMeters();
        const duplicateReviews = await getPossibleDuplicatePairs(radiusMeters);

        return res.status(200).json({
            success: true,
            radiusMeters,
            count: duplicateReviews.length,
            duplicateReviews
        });
    } catch (error) {
        console.error("Get Pending Duplicate Reviews Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending duplicate reviews."
        });
    }
};

// Save an administrator's duplicate review decision
const createDuplicateReview = async (req, res) => {
    if (!isAdmin(req, res)) {
        return;
    }

    const { reportAId, reportBId, decision } = req.body || {};
    const allowedDecisions = ["DUPLICATE", "NOT_DUPLICATE"];

    if (
        typeof reportAId !== "string" ||
        !reportAId.trim() ||
        typeof reportBId !== "string" ||
        !reportBId.trim() ||
        reportAId === reportBId
    ) {
        return res.status(400).json({
            success: false,
            message: "Two distinct report IDs are required."
        });
    }

    if (!allowedDecisions.includes(decision)) {
        return res.status(400).json({
            success: false,
            message: "Decision must be DUPLICATE or NOT_DUPLICATE."
        });
    }

    const [canonicalReportAId, canonicalReportBId] = getCanonicalReportPair(
        reportAId,
        reportBId
    );

    try {
        const reports = await prisma.report.findMany({
            where: {
                id: { in: [canonicalReportAId, canonicalReportBId] }
            },
            select: { id: true }
        });

        if (reports.length !== 2) {
            return res.status(404).json({
                success: false,
                message: "One or both reports were not found."
            });
        }

        const review = await prisma.duplicateReview.create({
            data: {
                reportAId: canonicalReportAId,
                reportBId: canonicalReportBId,
                decision,
                reviewedById: req.user.id
            },
            include: {
                reportA: true,
                reportB: true,
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Duplicate review decision saved.",
            review
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "These reports have already been reviewed."
            });
        }

        console.error("Create Duplicate Review Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save duplicate review decision."
        });
    }
};

// List saved duplicate review decisions for administrators
const getDuplicateReviewHistory = async (req, res) => {
    if (!isAdmin(req, res)) {
        return;
    }

    try {
        const reviews = await prisma.duplicateReview.findMany({
            include: {
                reportA: true,
                reportB: true,
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                reviewedAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error("Get Duplicate Review History Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch duplicate review history."
        });
    }
};

// Get all reports for administrators
const getAllReports = async (req, res) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin only."
        });
    }

    try {
        const reports = await prisma.report.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports
        });
    } catch (error) {
        console.error("Get All Reports Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
};

// Update report status (Admin only)
const updateReportStatus = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "VERIFIED",
            "REJECTED",
            "IN_PROGRESS",
            "RESOLVED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report status"
            });
        }

        const existingReport = await prisma.report.findUnique({
            where: { id }
        });

        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        const updatedReport = await prisma.report.update({
            where: { id },
            data: { status }
        });

        return res.status(200).json({
            success: true,
            message: "Report status updated successfully",
            report: updatedReport
        });

    } catch (error) {
        console.error("Update Report Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update report status"
        });
    }
};

module.exports = {
    createReport,
    getMyReports,
    getNearbyReports,
    getAllReports,
    getPendingDuplicateReviews,
    createDuplicateReview,
    getDuplicateReviewHistory,
    updateReportStatus
};
