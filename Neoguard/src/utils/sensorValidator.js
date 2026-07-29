const SEVERITY = {
  SAFE: "SAFE",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
  INVALID: "INVALID"
};

const buildResponse = (value, status, severity) => ({
  value,
  status,
  severity
});

// 🔒 Strict number validator
const isInvalidNumber = (v) =>
  typeof v !== "number" || Number.isNaN(v) || !Number.isFinite(v);

// ❤️ Heart Rate
function validateHeartRate(hr) {
  if (isInvalidNumber(hr) || hr < 30 || hr > 220) {
    return buildResponse(hr, "INVALID", SEVERITY.INVALID);
  }
  if (hr < 50) return buildResponse(hr, "CRITICAL_LOW", SEVERITY.CRITICAL);
  if (hr < 60) return buildResponse(hr, "WARNING_LOW", SEVERITY.WARNING);
  if (hr <= 100) return buildResponse(hr, "NORMAL", SEVERITY.SAFE);
  if (hr <= 120) return buildResponse(hr, "WARNING_HIGH", SEVERITY.WARNING);
  return buildResponse(hr, "CRITICAL_HIGH", SEVERITY.CRITICAL);
}

// 🫁 SpO2
function validateSpO2(spo2) {
  if (isInvalidNumber(spo2) || spo2 < 70 || spo2 > 100) {
    return buildResponse(spo2, "INVALID", SEVERITY.INVALID);
  }
  if (spo2 < 90) return buildResponse(spo2, "CRITICAL", SEVERITY.CRITICAL);
  if (spo2 <= 94) return buildResponse(spo2, "LOW", SEVERITY.WARNING);
  return buildResponse(spo2, "NORMAL", SEVERITY.SAFE);
}

// 🌡️ Temperature Validation
function validateTemperature(temp) {
  // Accept realistic sensor range (0°C – 60°C)
  if (isInvalidNumber(temp) || temp < 0 || temp > 60) {
    return buildResponse(temp, "INVALID", SEVERITY.INVALID);
  }

  // Conditions must be ordered from lowest to highest to avoid
  // unreachable branches (e.g. temp <= 10 was dead after temp < 18)
  if (temp <= 10)
    return buildResponse(temp, "COLD", SEVERITY.CRITICAL);

  if (temp < 18)
    return buildResponse(temp, "COOL", SEVERITY.WARNING);

  if (temp <= 37)
    return buildResponse(temp, "NORMAL", SEVERITY.SAFE);

  if (temp <= 38)
    return buildResponse(temp, "WARM", SEVERITY.WARNING);

  return buildResponse(temp, "HOT", SEVERITY.CRITICAL);
}

// 💧 Humidity
function validateHumidity(humidity) {
  if (isInvalidNumber(humidity) || humidity < 0 || humidity > 100) {
    return buildResponse(humidity, "INVALID", SEVERITY.INVALID);
  }
  if (humidity < 30) return buildResponse(humidity, "LOW", SEVERITY.WARNING);
  if (humidity <= 60) return buildResponse(humidity, "NORMAL", SEVERITY.SAFE);
  if (humidity <= 80) return buildResponse(humidity, "HIGH", SEVERITY.WARNING);
  return buildResponse(humidity, "CRITICAL_HIGH", SEVERITY.CRITICAL);
}

// 🔊 Noise
function validateNoise(noise) {
  if (isInvalidNumber(noise) || noise < 0 || noise > 150) {
    return buildResponse(noise, "INVALID", SEVERITY.INVALID);
  }
  if (noise <= 50) return buildResponse(noise, "NORMAL", SEVERITY.SAFE);
  if (noise <= 70) return buildResponse(noise, "MODERATE", SEVERITY.SAFE);
  if (noise <= 90) return buildResponse(noise, "LOUD", SEVERITY.WARNING);
  return buildResponse(noise, "DANGEROUS", SEVERITY.CRITICAL);
}

// ☀️ Light
function validateLight(light) {
  if (
    typeof light !== "number" ||
    Number.isNaN(light) ||
    !Number.isFinite(light) ||
    light < 0 ||
    light > 100000
  ) {
    return buildResponse(light, "INVALID", SEVERITY.INVALID);
  }

  if (light < 100)
    return buildResponse(light, "LOW_LIGHT", SEVERITY.WARNING);

  if (light <= 500)
    return buildResponse(light, "NORMAL", SEVERITY.SAFE);

  if (light <= 2000)
    return buildResponse(light, "BRIGHT", SEVERITY.SAFE);

  if (light <= 10000)
    return buildResponse(light, "VERY_BRIGHT", SEVERITY.WARNING);

  return buildResponse(light, "EXTREME_LIGHT", SEVERITY.CRITICAL);
}

// 📳 Vibration
function validateVibration(vibration) {
  if (isInvalidNumber(vibration) || vibration < 0 || vibration > 100) {
    return buildResponse(vibration, "INVALID", SEVERITY.INVALID);
  }
  if (vibration > 70) return buildResponse(vibration, "DANGEROUS", SEVERITY.CRITICAL);
  if (vibration > 40) return buildResponse(vibration, "HIGH", SEVERITY.WARNING);
  return buildResponse(vibration, "SAFE", SEVERITY.SAFE);
}

// 🔥 MAIN VALIDATOR
function validateAllSensors(data) {
  console.log("🔥 VALIDATOR CALLED");
  console.log("DATA RECEIVED:", JSON.stringify(data, null, 2));

  if (!data || typeof data !== "object") {
    throw new Error("Invalid payload: data must be an object");
  }

  if (!data.raw || typeof data.raw !== "object") {
    throw new Error("Invalid payload: 'raw' field is required");
  }

  const raw = data.raw;

  return {
    device_id: data.device_id,

    raw: {
      temperature: raw.temperature,
      humidity: raw.humidity,
      noise: raw.noise,
      light: raw.light,
      vibration: raw.vibration
    },

    validated: {
      
      temperature: validateTemperature(raw.temperature),
      humidity: validateHumidity(raw.humidity),
      noise: validateNoise(raw.noise),
      light: validateLight(raw.light),
      vibration: validateVibration(raw.vibration)
    }
  };
}

module.exports = {
  validateAllSensors
};