const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema(
{
    device_id: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    temperature: {
        type: Number,
        min: 10,
        max: 45
    },

    heart_rate: {
        type: Number,
        min: 40,
        max: 220
    },

    spo2: {
        type: Number,
        min: 50,
        max: 100
    },

    humidity: {
        type: Number,
        min: 0,
        max: 100
    },

    noise: {
        type: Number,
        min: 0,
        max: 150
    },

    light: {
        type: Number,
        min: 0,
        max: 100000
    },

    vibration: {
        type: Number,
        min: 0,
        max: 100,
        validate: {
            validator: Number.isFinite,
            message: "Vibration must be a valid number"
        }
    },

    threatScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        index: true
    },

    status: {
        type: String,
        enum: ["SAFE", "WARNING", "CRITICAL"],
        default: "SAFE",
        index: true
    }
},
{
    timestamps: true
}
);

// Compound index for fast latest-record queries
sensorSchema.index({ device_id: 1, createdAt: -1 });

/*
 ⚠️ IMPORTANT CHANGE:
 - Removed `next`
 - Using async middleware
 - Throwing error instead of next(error)
*/
sensorSchema.pre("save", async function () {
    if (
        this.temperature == null &&
        this.heart_rate == null &&
        this.spo2 == null &&
        this.humidity == null &&
        this.noise == null &&
        this.light == null &&
        this.vibration == null
    ) {
        throw new Error("At least one sensor value is required");
    }
});

module.exports = mongoose.model("Sensor", sensorSchema);