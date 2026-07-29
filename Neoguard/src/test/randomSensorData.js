function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ✅ Only randomize health data
function generateHealthData() {
  return {
    heart_rate: getRandom(60, 140),
    spo2: getRandom(85, 100)
  };
}

// ✅ Keep others fixed (safe values)
function generateFixedEnvData() {
  return {
    temperature: 36.5,
    humidity: 55,
    noise: 30,
    light: 150,
    vibration: 0   // ⚠️ keep as number if backend expects number
  };
}

// 🔥 Final payload
function generateSensorPayload() {
  return {
    device_id: "wearable_01",
    raw: {
      ...generateHealthData(),
      ...generateFixedEnvData()
    }
  };
}

module.exports = { generateSensorPayload };