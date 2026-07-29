const { sendTelegram } = require("../services/telegramService")
require("dotenv").config()

async function test() {
    try {
        await sendTelegram("🚨 NeoGuard Test Alert")
        console.log("✅ Test completed")
    } catch (err) {
        console.error("❌ Test failed", err)
    }
}

test()