const { formatTelegram, formatSMS } = require("../utils/alertFormatter.js");
const { sendSMS } = require("./smsService");
const { sendTelegram } = require("./telegramService");
const { sendBrowser } = require("./browserService");

const { isCooldownActive, updateCooldown } = require("../utils/cooldownManager.js");
const { hasStateChanged, resetState } = require("../utils/stateManager.js");

async function dispatchAlert(io, alert) {

    console.log("🚀 Dispatching Alert:", alert?.type);

    if (!alert || !alert.type) {
        console.warn("⚠️ Invalid alert object");
        return;
    }

    const deviceId = alert?.data?.device_id || "UNKNOWN_DEVICE";
    const key = `${deviceId}_${alert.type}`;

    // 🧠 1. STATE MACHINE (ONLY HERE)
    const changed = hasStateChanged(key, alert.level);

    if (!changed) {
        console.log(`⏭️ Skipped (No state change): ${key}`);
        return;
    }

    // ⏱️ 2. COOLDOWN
    if (isCooldownActive(key)) {
        console.log(`⏱️ Skipped (Cooldown active): ${key}`);
        return;
    }

    updateCooldown(key);

    // 🧾 3. FORMAT
    const telegramMsg = formatTelegram(alert);
    const smsMsg = formatSMS(alert);

    // 🌐 4. BROWSER (always)
    try {
        if (!io) throw new Error("Socket not initialized");

        sendBrowser(io, {
            ...alert,
            telegramMsg,
            smsMsg
        });

    } catch (err) {
        console.error("❌ Browser emit failed:", err.message);
    }

    // ⚠️ 5. ROUTING
    if (alert.level === "WARNING") {
        console.log("⚠️ Warning alert - browser only");
        return;
    }

    if (alert.level === "CRITICAL") {

        try {
            await sendSMS(smsMsg);
        } catch (err) {
            console.log("⚠️ SMS failed, fallback to Telegram");
        }

        try {
            await sendTelegram(telegramMsg);
        } catch (err) {
            console.log("❌ Telegram also failed");
        }
    }
}

module.exports = { dispatchAlert };