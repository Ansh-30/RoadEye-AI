
const express = require("express");
const cors = require("cors");

const app = express();

// Database
const prisma = require("./config/prisma");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const detectionRoutes = require("./routes/detectionRoutes");

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/detection", detectionRoutes);

// Health Check API
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "RoadEye AI Backend is running!",
        status: "Healthy"
    });
});

// Database Connection Test
app.get("/api/db-health", async (req, res) => {
    try {
        await prisma.$connect();

        res.status(200).json({
            success: true,
            message: "PostgreSQL connected through Prisma!",
            database: "Connected"
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

module.exports = app;
