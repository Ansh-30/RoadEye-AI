const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const assertConfigured = () => {
    const requiredVariables = [
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
    ];
    const missingVariables = requiredVariables.filter((name) => !process.env[name]);

    if (missingVariables.length > 0) {
        const error = new Error(
            `Cloudinary is not configured. Missing backend environment variables: ${missingVariables.join(", ")}.`
        );
        error.code = "CLOUDINARY_NOT_CONFIGURED";
        throw error;
    }
};

const normalizeUploadResult = (result) => {
    if (!result?.secure_url || !result?.public_id) {
        const error = new Error("Cloudinary did not return a secure URL and public ID.");
        error.code = "CLOUDINARY_UPLOAD_FAILED";
        throw error;
    }

    return {
        secureUrl: result.secure_url,
        publicId: result.public_id
    };
};

const uploadLocalImage = async (filePath, options = {}) => {
    assertConfigured();

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "image",
            folder: options.folder || "roadeye/reports"
        });
        return normalizeUploadResult(result);
    } catch (error) {
        if (error.code === "CLOUDINARY_UPLOAD_FAILED") {
            throw error;
        }

        const uploadError = new Error("Cloudinary failed to upload the local image.");
        uploadError.code = "CLOUDINARY_UPLOAD_FAILED";
        throw uploadError;
    }
};

const uploadImageBuffer = async (imageBuffer, options = {}) => {
    assertConfigured();

    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        const error = new Error("Image data is empty or invalid.");
        error.code = "CLOUDINARY_UPLOAD_FAILED";
        throw error;
    }

    try {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: options.folder || "roadeye/reports"
                },
                (error, uploadResult) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(uploadResult);
                }
            );

            uploadStream.on("error", reject);
            uploadStream.end(imageBuffer);
        });

        return normalizeUploadResult(result);
    } catch (error) {
        if (error.code === "CLOUDINARY_UPLOAD_FAILED") {
            throw error;
        }

        const uploadError = new Error("Cloudinary failed to upload the image data.");
        uploadError.code = "CLOUDINARY_UPLOAD_FAILED";
        throw uploadError;
    }
};

const deleteImage = async (publicId) => {
    if (!publicId) {
        return;
    }

    assertConfigured();
    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image"
    });

    if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary did not delete the image asset (${result.result || "unknown result"}).`);
    }
};

module.exports = {
    uploadLocalImage,
    uploadImageBuffer,
    deleteImage
};
