const twilio = require("twilio")
require("dotenv").config()

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

async function sendSMS(message) {
    try {
        const res = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE,
            to: process.env.ALERT_PHONE
        })

        console.log("✅ SMS sent:", res.sid)
    } catch (err) {
        console.error("❌ SMS failed:", err.message)
        throw err
    }
}

module.exports = { sendSMS }