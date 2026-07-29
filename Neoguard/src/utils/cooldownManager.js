const cooldownMap = new Map()

const COOLDOWN_TIME = 60 * 1000 // 60 seconds

function isCooldownActive(key) {
    const lastTime = cooldownMap.get(key)
    if (!lastTime) return false

    return (Date.now() - lastTime) < COOLDOWN_TIME
}

function updateCooldown(key) {
    cooldownMap.set(key, Date.now())
}

module.exports = {
    isCooldownActive,
    updateCooldown
}