const { dispatchAlert } = require("./alertDispatcher");
const { getIO } = require("../config/socket");
const { hasStateChanged, resetState } = require("../utils/stateManager");

// ⚙️ Thresholds
const THRESHOLDS = {
    HEART_RATE_HIGH: 120,
    HEART_RATE_LOW: 60,
    SPO2_LOW: 92,
    TEMP_HIGH: 38,
};

// 🧠 PRIORITY MAP (LOWER VALUE = HIGHER PRIORITY)
const ALERT_PRIORITY = {
    FALL_DETECTION: 0,
    HEALTH_EMERGENCY: 1,
    CARDIAC_RISK: 1,
    ENVIRONMENT_HAZARD: 2,
    FEVER_WARNING: 3,
};

// 🛡️ VALIDATION
function isValidPayload(data) {
    if (!data || typeof data !== "object") {
        console.error("❌ Payload is not an object");
        return false;
    }

    if (!data.raw || typeof data.raw !== "object") {
        console.error("❌ Missing or invalid 'raw'");
        return false;
    }

    if (!data.validated || typeof data.validated !== "object") {
        console.error("❌ Missing or invalid 'validated'");
        return false;
    }

    return true;
}

// 🧠 NORMALIZATION
function normalizeData(data) {
    if (!isValidPayload(data)) return null;

const hr = Number(
  data.validated?.heart_rate?.value ??
  data.raw?.heart_rate ??
  data.heart_rate
);

const spo2 = Number(
  data.validated?.spo2?.value ??
  data.raw?.spo2 ??
  data.spo2
);

const temp = Number(data.raw?.temperature ?? data.temperature);

// 🔥 DEBUG (add this)
console.log("🚨 ALERT INPUT:", JSON.stringify(data, null, 2));
console.log("DEBUG VALUES:", { hr, spo2, temp });

// ✅ ONLY validate temperature (CRITICAL FIX)
if (Number.isNaN(temp)) {
    console.warn("⚠️ Invalid temperature");
    return null;
}

    return {
        hr,
        spo2,
        temp,
        v: data.validated,
        vibrationStatus: data.validated.vibration?.status,
        original: data,
    };
}

// 🧠 RULE ENGINE
const ALERT_RULES = [
    {
        name: "CARDIAC_RISK",
        level: "CRITICAL",
        check: (d) =>
            d.hr > THRESHOLDS.HEART_RATE_HIGH &&
            d.spo2 < THRESHOLDS.SPO2_LOW,
        message: "Critical: High HR + Low SpO2",
    },
    {
        name: "FALL_DETECTION",
        level: "CRITICAL",
        check: (d) =>
            d.vibrationStatus === "DANGEROUS" &&
            d.hr < THRESHOLDS.HEART_RATE_LOW,
        message: "Possible fall detected",
    },
    {
        name: "ENVIRONMENT_HAZARD",
        level: "WARNING",
        check: (d) =>
            d.v.humidity?.severity === "CRITICAL" &&
            d.temp > THRESHOLDS.TEMP_HIGH,
        message: "Extreme environmental condition",
    },
    {
        name: "FEVER_WARNING",
        level: "WARNING",
        check: (d) =>
            d.temp > THRESHOLDS.TEMP_HIGH &&
            d.hr > 100 &&
            d.spo2 >= THRESHOLDS.SPO2_LOW,
        message: "Possible fever detected",
    },
];

// 🧠 ALERT GENERATION
function generateAlerts(data) {
    const normalized = normalizeData(data);
    if (!normalized) return [];

    const alerts = [];
    const v = normalized.v;

    // 🚨 HEALTH EMERGENCY
    if (
        v.heart_rate?.severity === "CRITICAL" ||
        v.spo2?.severity === "CRITICAL" ||
        v.temperature?.severity === "CRITICAL"
    ) {
        alerts.push({
            type: "HEALTH_EMERGENCY",
            level: "CRITICAL",
            message: "Critical health condition detected",
            timestamp: new Date().toISOString(),
            data: normalized.original,
        });
    }

    // 🌍 ENVIRONMENT (CRITICAL SOURCE)
    if (
        v.humidity?.severity === "CRITICAL" ||
        v.noise?.severity === "CRITICAL" ||
        v.light?.severity === "CRITICAL"
    ) {
        alerts.push({
            type: "ENVIRONMENT_HAZARD",
            level: "CRITICAL",
            message: "Unsafe environmental conditions detected",
            timestamp: new Date().toISOString(),
            data: normalized.original,
        });
    }

    // 🧠 RULE-BASED ALERTS
    for (const rule of ALERT_RULES) {
        try {
            if (rule.check(normalized)) {
                alerts.push({
                    type: rule.name,
                    level: rule.level,
                    message: rule.message,
                    timestamp: new Date().toISOString(),
                    data: normalized.original,
                });
            }
        } catch (err) {
            console.error(`❌ Rule failure (${rule.name}):`, err.message);
        }
    }

    return alerts;
}

// 🔥 CORE ENGINE (SINGLE ALERT GUARANTEE)
async function triggerAlerts(data) {
    try {
        console.log("🔥 Alert Engine Triggered");

        // ❌ Reject invalid payload early
        if (!isValidPayload(data)) {
            console.log("❌ Invalid data structure");
            return;
        }

        const alerts = generateAlerts(data);
        const deviceKey = data.device_id || "UNKNOWN_DEVICE";

        // ✅ No alerts case
        if (!alerts.length) {
            console.log("✅ No alerts generated");

            for (const rule of ALERT_RULES) {
                resetState(`${deviceKey}_${rule.name}`);
            }

            return;
        }

        // ✅ GLOBAL PRIORITY SORT (CRITICAL FIX)
        alerts.sort((a, b) => {
            const pa = ALERT_PRIORITY[a.type] ?? 999;
            const pb = ALERT_PRIORITY[b.type] ?? 999;
            return pa - pb;
        });

        // ✅ SINGLE ALERT ONLY
        const topAlert = alerts[0];
        if (!topAlert) return;

        let io;
        try {
            io = getIO();
        } catch (err) {
            console.error("❌ Socket.IO not initialized:", err.message);
            return;
        }

        const alertKey = `${deviceKey}_${topAlert.type}`;

        // ✅ DUPLICATE PREVENTION
        const changed = hasStateChanged(alertKey, "ACTIVE");
        if (!changed) {
            console.log(`⏭️ Duplicate skipped: ${topAlert.type}`);
            return;
        }

        console.log("🚀 Dispatching ONLY:", topAlert.type);

        // ✅ ONLY ONE DISPATCH
        await dispatchAlert(io, topAlert);

    } catch (error) {
        console.error("❌ Error in triggerAlerts:", error);
    }
}

module.exports = {
    triggerAlerts,
};