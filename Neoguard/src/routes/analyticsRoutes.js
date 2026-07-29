const express = require("express");
const router = express.Router();

const { getAnalytics } = require("../controllers/analyticsController");

// GET analytics
router.get("/", getAnalytics);

module.exports = router;