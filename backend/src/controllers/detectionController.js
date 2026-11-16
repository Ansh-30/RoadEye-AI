
const fs = require("fs");
const prisma = require("../config/prisma");
const { detectPotholes, fetchAnnotatedImage } = require("../services/aiService");
const {
    uploadLocalImage,
    uploadImageBuffer,
    deleteImage
} = require("../services/cloudinaryService");

const parseOptionalCoordinate = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "string" && value.trim() === "")
    ) {
        return null;
    }

    const coordinate = Number(value);
    return Number.isFinite(coordinate) ? coordinate : NaN;
};

const detectImage = async (req, res) => {
    const imagePath = req.file?.path;
    let originalImageAsset = null;
    let annotatedImageAsset = null;
    let failureStage = "AI detection";
    let reportCreated = false;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a road image."
            });
        }

        const latitude = parseOptionalCoordinate(req.body?.latitude);
        const longitude = parseOptionalCoordinate(req.body?.longitude);
        const hasLatitude = latitude !== null;
        const hasLongitude = longitude !== null;

        if (hasLatitude !== hasLongitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude must be provided together."
            });
        }

        if (
            (hasLatitude && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) ||
            (hasLongitude && (Number.isNaN(longitude) || longitude < -180 || longitude > 180))
        ) {
            return res.status(400).json({
                success: false,
                message: "Latitude or longitude is invalid."
            });
        }

        const locationAddress = typeof req.body?.locationAddress === "string"
            ? req.body.locationAddress.trim()
            : "";

        if (locationAddress.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Location address must be 500 characters or fewer."
            });
        }

        // Send image to Python AI service
        const result = await detectPotholes(
            imagePath,
            req.file.originalname
        );

        failureStage = "original image upload";
        originalImageAsset = await uploadLocalImage(imagePath, {
            folder: "roadeye/reports/original"
        });

        failureStage = "annotated image retrieval";
        const annotatedImageBuffer = await fetchAnnotatedImage(result.annotated_image);

        failureStage = "annotated image upload";
        annotatedImageAsset = await uploadImageBuffer(annotatedImageBuffer, {
            folder: "roadeye/reports/annotated"
        });

        const detections = result.detections || [];

        // Calculate highest detection confidence
        const highestConfidence = detections.length > 0
            ? Math.max(...detections.map(item => item.confidence))
            : null;

        failureStage = "report creation";
        const report = await prisma.report.create({
            data: {
                imageUrl: annotatedImageAsset.secureUrl,
                originalImageUrl: originalImageAsset.secureUrl,
                latitude,
                longitude,
                locationAddress: locationAddress || null,
                detectionLabel: "pothole",
                confidence: highestConfidence,
                detectionCount: result.total_potholes,
                userId: req.user.id
            }
        });
        reportCreated = true;

        return res.status(201).json({
            success: true,
            message: "Pothole detection completed and report saved successfully.",

            data: {
                reportId: report.id,
                totalPotholes: result.total_potholes,
                detections: detections,
                annotatedImage: annotatedImageAsset.secureUrl,
                originalImageUrl: originalImageAsset.secureUrl,
                reportStatus: report.status
            }
        });

    } catch (error) {
        console.error(`Detection Controller Error during ${failureStage}:`, error.message);

        if (!reportCreated) {
            for (const asset of [annotatedImageAsset, originalImageAsset]) {
                if (!asset?.publicId) {
                    continue;
                }

                try {
                    await deleteImage(asset.publicId);
                } catch (cleanupError) {
                    console.error("Cloudinary rollback failed:", cleanupError.message);
                }
            }
        }

        if (failureStage === "original image upload" || failureStage === "annotated image upload") {
            if (error.code === "CLOUDINARY_NOT_CONFIGURED") {
                return res.status(503).json({
                    success: false,
                    message: "Image storage is not configured. No report was created."
                });
            }

            return res.status(502).json({
                success: false,
                message: "Image storage failed. No report was created."
            });
        }

        if (failureStage === "annotated image retrieval") {
            return res.status(502).json({
                success: false,
                message: "Unable to retrieve the annotated image. No report was created."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Detection failed or report could not be saved."
        });

    } finally {
        if (imagePath) {
            try {
                await fs.promises.unlink(imagePath);
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    console.error("Temporary upload cleanup failed:", cleanupError.message);
                }
            }
        }
    }
};

module.exports = { detectImage };
