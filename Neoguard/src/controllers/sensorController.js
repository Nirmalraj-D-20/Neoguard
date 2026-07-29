const asyncHandler = require("express-async-handler");

const { validateAllSensors } = require("../utils/sensorValidator.js");
const { processSensorData, getSensorHistory } = require("../services/sensorService");
const { getIO } = require("../config/socket");
const { triggerAlerts } = require("../services/alertEngine");

/* =========================================================
   🔹 POST: Save sensor data + emit real-time
========================================================= */
exports.handleSensorData = asyncHandler(async (req, res) => {
    let data = req.body;

    // 🔥 Normalize input safely
    if (data.device_id) {
        data.device_id = String(data.device_id).trim();
    }

    // 🚨 Basic validation
    if (!data.device_id || typeof data.device_id !== "string") {
        return res.status(400).json({
            success: false,
            message: "Invalid or missing device_id"
        });
    }

    // 🔍 Centralized validation
    const validatedData = validateAllSensors(data);

    // 🚨 STRUCTURE VALIDATION
    if (!validatedData?.raw || !validatedData?.validated) {
        return res.status(400).json({
            success: false,
            message: "Invalid sensor data structure"
        });
    }

    // 🚨 Reject invalid sensor values
    for (const key in validatedData.validated) {
        if (validatedData.validated[key]?.severity === "INVALID") {
            return res.status(400).json({
                success: false,
                message: `${key} has invalid value`
            });
        }
    }

    // ✅ Process & store (returns FLAT structure)
    const result = await processSensorData(validatedData);

    // 🔍 Defensive integrity check
    if (!result || !result.device_id) {
        throw new Error("Processed data missing device_id");
    }

    /* =========================================================
       🔥 REAL-TIME SOCKET EMIT (NON-BLOCKING)
    ========================================================= */
    try {
        const io = getIO();

        if (!io) {
            throw new Error("Socket.IO not initialized");
        }

        // ✅ Emit FLAT structure (matches service output)
        io.to(result.device_id).emit("sensor_data", {
            device_id: result.device_id,
            temperature: result.temperature,
            humidity: result.humidity,
            noise: result.noise,
            light: result.light,
            vibration: result.vibration,
            heart_rate: result.heart_rate,
            spo2: result.spo2,
            threatScore: result.threatScore,
            status: result.status,
            isAnomaly: result.isAnomaly
        });

        console.log(`📤 Emitted to device room: ${result.device_id}`);

    } catch (socketError) {
        console.error("⚠️ Socket Emit Error:", socketError.message);
    }

    /* =========================================================
       🔥 ALERT ENGINE (NON-BLOCKING)
    ========================================================= */
    try {
        await triggerAlerts({
            ...validatedData,              // raw + validated
            heart_rate: result.heart_rate,
            spo2: result.spo2
        });
    } catch (alertError) {
        console.error("⚠️ Alert Engine Error:", alertError.message);
    }

    // ✅ Success response
    res.status(201).json({
        success: true,
        message: "Data processed successfully",
        data: result
    });
});


/* =========================================================
   🔹 GET: Fetch sensor history
========================================================= */
exports.getHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, device_id } = req.query;

    const filters = {};

    // 🔍 Validate device_id filter
    if (device_id && typeof device_id === "string") {
        filters.device_id = device_id.trim();
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    // 🚨 Guard against invalid pagination
    if (isNaN(parsedPage) || parsedPage <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid page number"
        });
    }

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid limit value"
        });
    }

    const options = {
        page: parsedPage,
        limit: parsedLimit
    };

    const history = await getSensorHistory(filters, options);

    const total = history?.total || 0;
    const data = history?.data || [];

    res.status(200).json({
        success: true,
        count: data.length,
        total,
        page: options.page,
        totalPages: Math.ceil(total / options.limit),
        data
    });
});