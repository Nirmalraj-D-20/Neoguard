function getCategory(type) {
    switch (type) {
        case "CARDIAC_RISK":
            return "CRITICAL_HEALTH"

        case "FEVER_WARNING":
            return "HEALTH_WARNING"

        case "FALL_DETECTION":
            return "PHYSICAL_RISK"

        case "ENVIRONMENT_HAZARD":
            return "ENVIRONMENT_ALERT"

        default:
            return "SYSTEM_WARNING"
    }
}

module.exports = { getCategory }