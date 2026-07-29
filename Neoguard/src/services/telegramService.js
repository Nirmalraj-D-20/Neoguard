const axios = require("axios");

const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendTelegram(message, attempt = 1) {
    try {
        const response = await axios.post(TELEGRAM_URL, {
            chat_id: process.env.CHAT_ID,
            text: message
        });

        console.log("✅ Telegram sent");
        return response.data;

    } catch (err) {
        const status = err.response?.status;
        const errorData = err.response?.data;

        console.error(`❌ Telegram failed (Attempt ${attempt}):`, errorData || err.message);

        // ❗ Stop if max retries reached
        if (attempt >= MAX_RETRIES) {
            console.error("🚫 Max retries reached. Giving up.");
            throw err;
        }

        // 📌 Handle Telegram rate limit (429)
        if (status === 429) {
            const retryAfter = errorData?.parameters?.retry_after || 2;
            console.log(`⏳ Rate limited. Retrying after ${retryAfter}s...`);
            await sleep(retryAfter * 1000);
        } else {
            // 📌 Exponential backoff for other errors
            const delay = BASE_DELAY * Math.pow(2, attempt - 1);
            console.log(`🔁 Retrying in ${delay}ms...`);
            await sleep(delay);
        }

        return sendTelegram(message, attempt + 1);
    }
}

module.exports = { sendTelegram };