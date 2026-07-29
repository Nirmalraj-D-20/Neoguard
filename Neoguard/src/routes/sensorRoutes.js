const express = require("express");
const router = express.Router();

const {
  handleSensorData,
  getHistory
} = require("../controllers/sensorController");

// 🔹 POST: Save sensor data
// Endpoint: POST /sensor
router.post("/", handleSensorData);

// 🔹 GET: Fetch sensor history
// Endpoint: GET /sensor?page=1&limit=10&device_id=xyz
router.get("/", getHistory);

module.exports = router;