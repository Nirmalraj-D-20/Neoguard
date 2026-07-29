require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

// 🔹 DB Connection
const connectDB = require("./config/db");

// 🔹 Routes
const sensorRoutes = require("./routes/sensorRoutes");
const trendRoutes = require("./routes/trendRoutes");

// 🔹 Socket
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);

// 🔹 Connect Database FIRST (critical)
connectDB();

// 🔹 Initialize Socket (after server created)
initSocket(server);

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔍 Debug Middleware (helps trace requests — remove in production if noisy)
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// 🔹 Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "NeoGuard Backend Running 🚀",
        status: "OK",
        timestamp: new Date()
    });
});

// 🔹 API Routes
app.use("/api/sensor", sensorRoutes);
app.use("/api/analytics", trendRoutes);

// 🔹 404 Handler (must be AFTER routes)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found"
    });
});

// 🔹 Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.stack);

    res.status(500).json({
        success: false,
        error: "Something went wrong",
        details: err.message
    });
});

// 🔹 Server Start
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});