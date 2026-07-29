const Sensor = require("../models/Sensor");
const { getIO } = require("../config/socket");
const { triggerAlerts } = require("./alertEngine"); // ✅ FIXED

// 🔹 Per-device state
const deviceState = {};

// 🔹 Normalize
const normalize = (val, fallback = null) => {
    return typeof val === "number" && !Number.isNaN(val) ? val : fallback;
};

// 🔹 Clamp
const clamp = (val, min, max) => {
    if (val == null) return null;
    return Math.max(min, Math.min(max, val));
};

// 🔹 Generate vitals
const generateVitals = (device_id, sensorData) => {
    if (!deviceState[device_id]) {
        deviceState[device_id] = {
            lastHR: 80,
            lastSpO2: 97,
            lastTemp: sensorData.temperature,
            lastScore: 0,
            baseline: 20,
            lastSeen: Date.now()
        };
    }

    let state = deviceState[device_id];

    let newHR = state.lastHR;
    let newSpO2 = state.lastSpO2;

    const abnormal = Math.random() > 0.8;

    if (abnormal) {
        newHR = 120 + Math.random() * 20;
        newSpO2 = 85 + Math.random() * 5;
    } else {
        newHR += (Math.random() - 0.5) * 5;
        newSpO2 += (Math.random() - 0.5) * 2;
    }

    // 🔥 Correlation with temperature
    if (sensorData.temperature != null && sensorData.temperature > 37.5) {
        newHR += 10;
        newSpO2 -= 2;
    }

    newHR = clamp(newHR, 50, 150);
    newSpO2 = clamp(newSpO2, 80, 100);

    state.lastHR = newHR;
    state.lastSpO2 = newSpO2;
    state.lastTemp = sensorData.temperature;
    state.lastSeen = Date.now();

    return {
        heart_rate: Math.round(newHR),
        spo2: Math.round(newSpO2)
    };
};

// 🔹 Cleanup old devices
setInterval(() => {
    const now = Date.now();
    for (const id in deviceState) {
        if (now - deviceState[id].lastSeen > 60000) {
            delete deviceState[id];
            console.log(`🧹 Cleaned device: ${id}`);
        }
    }
}, 60000);

// 🔹 Compute Threat Score
function computeThreatScore(data, prevState) {
    let score = 0;

    const temperature = clamp(normalize(data.temperature), 30, 45);
    const heart_rate = clamp(normalize(data.heart_rate), 40, 180);
    const spo2 = clamp(normalize(data.spo2), 70, 100);
    const noise = clamp(normalize(data.noise), 0, 120);
    const vibration = normalize(data.vibration);
    const light = clamp(normalize(data.light), 0, 1000);

    if (temperature != null) score += Math.abs(temperature - 37) * 5;

    if (
        prevState?.lastTemp != null &&
        temperature != null &&
        Math.abs(temperature - prevState.lastTemp) > 2
    ) {
        score += 15;
    }

    if (heart_rate != null) score += Math.abs(heart_rate - 80) * 0.5;

    if (
        prevState?.lastHR != null &&
        heart_rate != null &&
        Math.abs(heart_rate - prevState.lastHR) > 15
    ) {
        score += 20;
    }

    if (spo2 != null && spo2 < 95) score += (95 - spo2) * 2;

    if (noise != null) {
        if (noise > 85) score += 20;
        else if (noise > 60) score += 10;
    }

    if (vibration === 1 && noise != null && noise > 70) score += 25;
    else if (vibration === 1) score += 10;

    if (light != null && light < 50) score += 5;

    return Math.round(score);
}

// 🔹 Status
function getStatus(score) {
    if (score > 60) return "CRITICAL";
    if (score > 20) return "WARNING";
    return "SAFE";
}

// 🔹 MAIN FUNCTION
async function processSensorData(payload) {
    try {
        const { device_id, raw } = payload;

        if (!device_id || !raw) {
            throw new Error("Invalid payload");
        }

        const cleanDeviceId = device_id.trim();

        const sensorData = {
            temperature: normalize(raw.temperature),
            humidity: normalize(raw.humidity),
            noise: normalize(raw.noise),
            light: normalize(raw.light),
            vibration: normalize(raw.vibration),
        };

        const prevState = deviceState[cleanDeviceId] || null;

        const generated = generateVitals(cleanDeviceId, sensorData);

        const finalData = {
            device_id: cleanDeviceId,
            ...sensorData,
            ...generated
        };

        const rawScore = computeThreatScore(finalData, prevState);

        const state = deviceState[cleanDeviceId];
        state.lastScore = state.lastScore * 0.7 + rawScore * 0.3;

        const smoothScore = Math.min(100, Math.round(state.lastScore));
        const status = getStatus(smoothScore);

        const baseline = state.baseline;
        const isAnomaly = smoothScore > baseline + 20;

        const deviceTime = raw.timestamp ? new Date(raw.timestamp) : null;

        const savedData = await Sensor.create({
            device_id: cleanDeviceId,
            ...sensorData,
            heart_rate: generated.heart_rate,
            spo2: generated.spo2,
            threatScore: smoothScore,
            status,
            isAnomaly,
            deviceTime,
            raw
        });

        // 🔹 Socket emit
        const io = getIO();
        io.to(cleanDeviceId).emit("sensor_data", {
            device_id: cleanDeviceId,
            ...finalData,
            threatScore: smoothScore,
            status,
            isAnomaly,
            deviceTime,
            createdAt: savedData.createdAt
        });

        // ✅ FIXED ALERT CALL
       
        console.log(
            "📡 Score:",
            smoothScore,
            "| Status:",
            status,
            "| Anomaly:",
            isAnomaly
        );

        return savedData;

    } catch (err) {
        console.error("❌ Service Error:", err.message);
        throw err;
    }
}

// 🔹 History
async function getSensorHistory(filters = {}, options = {}) {
    try {
        let { page = 1, limit = 10, startTime, endTime } = options;

        page = Math.max(parseInt(page) || 1, 1);
        limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

        const query = { ...filters };

        if (startTime || endTime) {
            query.createdAt = {};
            if (startTime) query.createdAt.$gte = new Date(startTime);
            if (endTime) query.createdAt.$lte = new Date(endTime);
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Sensor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Sensor.countDocuments(query)
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };

    } catch (error) {
        console.error("❌ History Error:", error.message);
        throw error;
    }
}

module.exports = {
    processSensorData,
    getSensorHistory
};