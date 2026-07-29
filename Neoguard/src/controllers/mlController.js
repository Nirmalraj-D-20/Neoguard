const { detectAnomaly } = require("../services/mlService");

exports.getAnomaly = async (req, res) => {
    try {
        const { device_id } = req.query;

        if (!device_id) {
            return res.status(400).json({
                success: false,
                error: "device_id required"
            });
        }

        const result = await detectAnomaly(device_id);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};