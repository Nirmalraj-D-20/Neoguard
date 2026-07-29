const axios = require("axios");
const { generateSensorPayload } = require("./randomSensorData");

const URL = "http://localhost:5000/api/sensor";

setInterval(async () => {
  const data = generateSensorPayload();

  try {
    const res = await axios.post(URL, data);

    console.log("Sent:", data.raw);
    console.log("Response:", res.data.data.status);
    console.log("---------------------------");

  } catch (err) {
    console.error("❌ FULL ERROR MESSAGE:", err.message);
    console.error("📦 ERROR DATA:", err.response?.data);
  }

}, 20000); // every 20 seconds