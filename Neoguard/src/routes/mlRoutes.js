const express = require("express");
const router = express.Router();

const { getAnomaly } = require("../controllers/mlController");

router.get("/anomaly", getAnomaly);

module.exports = router;