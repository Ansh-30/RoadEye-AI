
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const AI_SERVICE_URL = "http://127.0.0.1:8000";

const detectPotholes = async (imagePath, originalName) => {
    try {
        const formData = new FormData();

        formData.append("file", fs.createReadStream(imagePath), {
            filename: originalName
        });

        const response = await axios.post(
            `${AI_SERVICE_URL}/detect/image`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 120000,
                maxBodyLength: Infinity
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "AI Service Error:",
            error.response?.data || error.message
        );

        throw new Error("Pothole detection service is unavailable.");
    }
};

const fetchAnnotatedImage = async (imagePath) => {
    let imageUrl;

    try {
        imageUrl = new URL(imagePath, `${AI_SERVICE_URL}/`);
    } catch {
        throw new Error("AI service returned an invalid annotated image path.");
    }

    const serviceUrl = new URL(AI_SERVICE_URL);
    if (
        imageUrl.origin !== serviceUrl.origin ||
        !imageUrl.pathname.startsWith("/results/")
    ) {
        throw new Error("AI service returned an invalid annotated image path.");
    }

    try {
        const response = await axios.get(imageUrl.href, {
            responseType: "arraybuffer",
            timeout: 30000
        });
        const contentType = response.headers["content-type"] || "";

        if (!contentType.startsWith("image/")) {
            throw new Error("AI service did not return an image.");
        }

        return Buffer.from(response.data);
    } catch (error) {
        console.error("Annotated image fetch error:", error.message);
        throw new Error("Unable to retrieve the annotated image from the AI service.");
    }
};

module.exports = { detectPotholes, fetchAnnotatedImage };
