const Sensor = require("../models/Sensor");

exports.getTrends = async (req, res) => {
  try {
    const data = await Sensor.find()
      .sort({ createdAt: 1 }) // ✅ oldest → newest
      .limit(50);

    if (data.length < 5) {
      return res.json({
        message: "Not enough data for trend analysis"
      });
    }

    let heartRates = data.map(d => d.heart_rate);
    let temperatures = data.map(d => d.temperature);

    // 🔍 Debug logs
    console.log("Heart Rates:", heartRates);
    console.log("Temperatures:", temperatures);

    // 🔥 Improved Trend Logic (count-based)
    const getTrend = (arr) => {
      let increasing = 0;
      let decreasing = 0;

      for (let i = 1; i < arr.length; i++) {
        if (arr[i] > arr[i - 1]) increasing++;
        else if (arr[i] < arr[i - 1]) decreasing++;
      }

      if (increasing > decreasing) return "INCREASING";
      if (decreasing > increasing) return "DECREASING";
      return "STABLE";
    };

    res.json({
      heart_rate_trend: getTrend(heartRates),
      temperature_trend: getTrend(temperatures),
      samples: data.length,
      method: "count_based" // 🔥 indicates improved logic
    });

  } catch (err) {
    console.error("Trend Error:", err);
    res.status(500).json({ error: err.message });
  }
};