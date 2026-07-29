const SensorData = require("../models/sensorModel");

// 🔹 Calculate mean
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// 🔹 Calculate standard deviation
const stdDev = (arr, avg) => {
    const variance =
        arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
        arr.length;
    return Math.sqrt(variance);
};

// 🔹 Detect anomaly
exports.detectAnomaly = async (device_id) => {
    try {
        // Get last 20 records
        const data = await SensorData.find({ device_id })
            .sort({ timestamp: -1 })
            .limit(20);

        if (data.length < 5) {
            return { message: "Not enough data", anomaly: false };
        }

        const heartRates = data.map(d => d.heart_rate);

        const avg = mean(heartRates);
        const std = stdDev(heartRates, avg);

        const latest = heartRates[0];

        const zScore = std === 0 ? 0 : (latest - avg) / std;

        const isAnomaly = Math.abs(zScore) > 2;

        return {
            avg,
            std,
            latest,
            zScore: zScore.toFixed(2),
            anomaly: isAnomaly
        };

    } catch (error) {
        throw new Error("ML Error: " + error.message);
    }
};