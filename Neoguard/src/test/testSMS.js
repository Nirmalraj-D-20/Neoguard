const { sendSMS } = require("../services/smsService")
require("dotenv").config()

async function test() {
    try {
        await sendSMS("🚨 NeoGuard SMS Test Alert")
        console.log("✅ SMS Test Completed")
    } catch (err) {
        console.error("❌ SMS Test Failed", err)
    }
}

test()