// alertFormatter.js

const { getCategory } = require("./alertCategories");

// 🛡️ Safe helper
function safe(value, fallback = "N/A") {
    return value !== undefined && value !== null ? value : fallback;
}

// 🕒 Time helpers (consistent format)
function getFullTime() {
    return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function getShortTime() {
    return new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

// 📩 Telegram Formatter
function formatTelegram(alert) {
    if (!alert || !alert.data) return "Invalid alert data";

    const type = safe(alert?.type, "UNKNOWN");
    const level = safe(alert?.level, "UNKNOWN");
    const data = alert.data;

    // 🧠 Category (safe fallback)
    let category;
    try {
        category = getCategory(type);
    } catch {
        category = "GENERAL";
    }
    category = safe(category, "GENERAL");

    // 📊 Raw values
    const heartRate = safe(data?.raw?.heart_rate);
    const spo2 = safe(data?.raw?.spo2);
    const deviceId = safe(data?.device_id);

    // 🧪 Validated insights (optional)
    const hrStatus = safe(data?.validated?.heart_rate?.status, "");
    const spo2Status = safe(data?.validated?.spo2?.status, "");

    const time = getFullTime();

    return `
${level} ALERT

Type: ${type}
Category: ${category}

Vitals:
- Heart Rate: ${heartRate} bpm ${hrStatus ? `(${hrStatus})` : ""}
- SpO2: ${spo2}% ${spo2Status ? `(${spo2Status})` : ""}

Time: ${time}
Device: ${deviceId}
`.trim();
}

// 📱 SMS Formatter
function formatSMS(alert) {
    if (!alert || !alert.data) return "Invalid alert data";

    const type = safe(alert?.type, "UNKNOWN");
    const level = safe(alert?.level, "UNKNOWN");
    const data = alert.data;

    const heartRate = safe(data?.raw?.heart_rate);
    const spo2 = safe(data?.raw?.spo2);
    const deviceId = safe(data?.device_id);

    const time = getShortTime();

    let message = `
${level} ALERT
${type}

HR: ${heartRate} bpm
SpO2: ${spo2}%

Time: ${time}
Device: ${deviceId}
`.trim();

    // ⚠️ Optional SMS limit (enable if needed)
    // message = message.substring(0, 160);

    return message;
}

// 📦 Export
module.exports = {
    formatTelegram,
    formatSMS
};