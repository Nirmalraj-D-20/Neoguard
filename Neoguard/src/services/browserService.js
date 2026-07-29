function sendBrowser(io, alert) {
    io.emit("alert", alert)
}

module.exports = { sendBrowser }