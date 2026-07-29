const SensorData = require("../models/sensorModel");

// 🔹 GET: Advanced Analytics (Aggregation-based)
exports.getAnalytics = async (req, res) => {
    try {
        const { startTime, endTime } = req.query;

        const pipeline = [];

        // 🔴 FIXED: Always apply filter correctly
        if (startTime || endTime) {
            const match = {};

            if (startTime) {
                const start = new Date(startTime);
                if (!isNaN(start)) {
                    match.timestamp = { $gte: start };
                }
            }

            if (endTime) {
                const end = new Date(endTime);
                if (!isNaN(end)) {
                    match.timestamp = {
                        ...(match.timestamp || {}),
                        $lte: end
                    };
                }
            }

            // ✅ Push match ONLY if valid
            if (Object.keys(match).length > 0) {
                pipeline.push({ $match: match });
            }
        }

        // 🔹 Aggregation logic
        pipeline.push({
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                avgHeartRate: { $avg: "$heart_rate" },
                avgTemperature: { $avg: "$temperature" },
                criticalCases: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "CRITICAL"] },
                            1,
                            0
                        ]
                    }
                }
            }
        });

        // 🔍 Debug (remove later if needed)
        console.log("Query:", req.query);
        console.log("Pipeline:", JSON.stringify(pipeline, null, 2));

        const result = await SensorData.aggregate(pipeline);

        const data = result[0] || {
            totalRecords: 0,
            avgHeartRate: 0,
            avgTemperature: 0,
            criticalCases: 0
        };

        res.status(200).json({
            success: true,
            totalRecords: data.totalRecords,
            avgHeartRate: Number(data.avgHeartRate || 0).toFixed(2),
            avgTemperature: Number(data.avgTemperature || 0).toFixed(2),
            criticalCases: data.criticalCases
        });

    } catch (error) {
        console.error("Analytics Error:", error);

        res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
};