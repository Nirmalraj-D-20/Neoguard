const express = require("express");
const router = express.Router();
const { getTrends } = require("../controllers/trendController");
console.log("Trend routes loaded");
router.get("/trends", getTrends);

module.exports = router;