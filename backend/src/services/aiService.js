
const axios = require("axios");
const fs = require("fs");

const HF_SPACE_ID = "Ansh-S30/roadeye-ai-detection";
const HF_ENDPOINT = "/detect_potholes";

let gradioClientPromise = null;

const getGradioClient = async () => {
    if (!gradioClientPromise) {
        gradioClientPromise = (async () => {
            const { Client } = await import("@gradio/client");

            if (!process.env.HF_TOKEN) {
                throw new Error("HF_TOKEN environment variable is missing.");
            }

            return Client.connect(HF_SPACE_ID, {
                token: process.env.HF_TOKEN
            });
        })();
    }

    try {
        return await gradioClientPromise;
    } catch (error) {
        gradioClientPromise = null;
        throw error;
    }
};

const detectPotholes = async (imagePath, originalName) => {
    try {
        if (!imagePath || !fs.existsSync(imagePath)) {
            throw new Error("Uploaded image file was not found.");
        }

        const { handle_file } = await import("@gradio/client");
        const client = await getGradioClient();

        console.log(`Sending ${originalName} to Hugging Face AI...`);

        const response = await client.predict(HF_ENDPOINT, [
            handle_file(imagePath)
        ]);

        const [annotatedImage, detectionResults] = response.data || [];

        if (!annotatedImage || !detectionResults) {
            throw new Error("Hugging Face returned an incomplete response.");
        }

        const annotatedImageUrl =
            typeof annotatedImage === "string"
                ? annotatedImage
                : annotatedImage.url;

        if (!annotatedImageUrl) {
            throw new Error("Annotated image URL was not returned.");
        }

        if (
            !detectionResults.success ||
            !Array.isArray(detectionResults.detections) ||
            typeof detectionResults.total_potholes !== "number"
        ) {
            throw new Error("Invalid detection results returned by AI service.");
        }

        return {
            ...detectionResults,
            annotated_image: annotatedImageUrl
        };

    } catch (error) {
        console.error(
            "Hugging Face AI Service Error:",
            error.message
        );

        throw new Error(
            `Pothole detection service failed: ${error.message}`
        );
    }
};

const fetchAnnotatedImage = async (imageUrl) => {
    try {
        const parsedUrl = new URL(imageUrl);

        const isAllowedHost =
            parsedUrl.protocol === "https:" &&
            (
                parsedUrl.hostname.endsWith(".hf.space") ||
                parsedUrl.hostname === "huggingface.co" ||
                parsedUrl.hostname.endsWith(".huggingface.co")
            );

        if (!isAllowedHost) {
            throw new Error("AI service returned an invalid image URL.");
        }

        const response = await axios.get(parsedUrl.href, {
            responseType: "arraybuffer",
            timeout: 60000
        });

        const contentType = response.headers["content-type"] || "";

        if (!contentType.startsWith("image/")) {
            throw new Error("AI service did not return a valid image.");
        }

        return Buffer.from(response.data);

    } catch (error) {
        console.error(
            "Annotated Image Fetch Error:",
            error.message
        );

        throw new Error(
            "Unable to retrieve the annotated image from Hugging Face."
        );
    }
};

module.exports = {
    detectPotholes,
    fetchAnnotatedImage
};
