# 🛡️ NeoGuard

> Real-time IoT health and environment monitoring system with intelligent alert dispatching.

NeoGuard collects sensor data from connected devices, computes threat scores, detects anomalies, and fires alerts through browser (Socket.IO), SMS, and Telegram when critical conditions are identified.

---

## 📸 Overview

```
IoT Device → POST /api/sensor → Validate → Score → Save to MongoDB
                                                  ↓
                                          Socket.IO (real-time)
                                                  ↓
                                        Alert Engine (rules + priority)
                                                  ↓
                                   Browser | SMS (Twilio) | Telegram
```

---

## ✨ Features

- 📡 Real-time sensor data ingestion via REST API
- 🔍 Per-field validation with severity levels (SAFE / WARNING / CRITICAL / INVALID)
- 📊 Threat score computation using weighted multi-sensor metrics
- 🧠 Z-score based anomaly detection (ML service)
- 🚨 Rule-based alert engine with priority sorting and duplicate suppression
- ⏱️ Cooldown management to prevent alert flooding
- 📲 Multi-channel alerts: browser, SMS, Telegram
- 📈 Trend analysis for heart rate and temperature
- 🗂️ Paginated sensor history API

---

## 🛠️ Tech Stack

| Layer        | Technology               |
|--------------|--------------------------|
| Runtime      | Node.js ≥ 18             |
| Framework    | Express.js               |
| Database     | MongoDB (Mongoose)       |
| Real-time    | Socket.IO                |
| SMS Alerts   | Twilio                   |
| Chat Alerts  | Telegram Bot API         |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Twilio account (SMS alerts)
- Telegram Bot token (chat alerts)

### Installation

```bash
git clone https://github.com/Nirmalraj-D-20/Neoguard.git
cd Neoguard/Neoguard
npm install
```

### Environment Variables

Create a `.env` file inside `Neoguard/`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/neoguard

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=+1234567890
ALERT_PHONE=+0987654321

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Run

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Server starts on `http://localhost:5000`

---

## 📡 API Reference

### Health Check

```
GET /
```
Returns server status and timestamp.

---

### Sensor

| Method | Endpoint      | Description                      |
|--------|---------------|----------------------------------|
| POST   | `/api/sensor` | Ingest sensor data from a device |
| GET    | `/api/sensor` | Fetch paginated sensor history   |

**POST `/api/sensor` — Request Body**

```json
{
  "device_id": "device-001",
  "raw": {
    "temperature": 36.5,
    "humidity": 55,
    "noise": 60,
    "light": 400,
    "vibration": 0,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**GET `/api/sensor` — Query Params**

| Param       | Type   | Default | Description                        |
|-------------|--------|---------|------------------------------------|
| `page`      | number | 1       | Page number                        |
| `limit`     | number | 10      | Records per page (max: 100)        |
| `device_id` | string | —       | Filter by specific device          |

---

### Analytics & ML

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | `/api/analytics/trends`   | Heart rate & temperature trends      |
| GET    | `/api/analytics/summary`  | Aggregated stats (avg, totals)       |
| GET    | `/api/ml/anomaly`         | Z-score anomaly detection            |

**GET `/api/ml/anomaly` — Query Params**

| Param       | Type   | Description       |
|-------------|--------|-------------------|
| `device_id` | string | Target device ID  |

---

## 📏 Sensor Validation Ranges

| Sensor      | Valid Range  | Unit | CRITICAL threshold         |
|-------------|--------------|------|----------------------------|
| Temperature | 0 – 60       | °C   | ≤ 10°C or > 38°C           |
| Humidity    | 0 – 100      | %    | > 80%                      |
| Noise       | 0 – 150      | dB   | > 90 dB                    |
| Light       | 0 – 100,000  | lux  | > 10,000 lux               |
| Vibration   | 0 – 100      | —    | > 70                       |
| Heart Rate  | 30 – 220     | bpm  | < 50 or > 120 bpm          |
| SpO2        | 70 – 100     | %    | < 90%                      |

---

## 🚨 Alert System

Only the **single highest-priority alert** is dispatched per cycle to prevent noise. State tracking and cooldown (60s) prevent duplicate alerts.

### Priority Order

| Priority | Alert Type           | Trigger Condition                              |
|----------|----------------------|------------------------------------------------|
| 0        | `FALL_DETECTION`     | Dangerous vibration + low heart rate           |
| 1        | `HEALTH_EMERGENCY`   | Critical vitals (HR, SpO2, or temperature)     |
| 1        | `CARDIAC_RISK`       | High HR + Low SpO2                             |
| 2        | `ENVIRONMENT_HAZARD` | Critical humidity, noise, or light             |
| 3        | `FEVER_WARNING`      | Elevated temperature + elevated heart rate     |

### Dispatch Channels

| Alert Level | Browser | SMS | Telegram |
|-------------|---------|-----|----------|
| WARNING     | ✅      | ❌  | ❌       |
| CRITICAL    | ✅      | ✅  | ✅       |

---

## 📁 Project Structure

```
Neoguard/
├── src/
│   ├── app.js                  # Express entry point
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── socket.js           # Socket.IO singleton
│   ├── controllers/
│   │   ├── sensorController.js
│   │   ├── trendController.js
│   │   ├── analyticsController.js
│   │   └── mlController.js
│   ├── models/
│   │   └── Sensor.js           # Mongoose schema
│   ├── routes/
│   │   ├── sensorRoutes.js
│   │   ├── trendRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── mlRoutes.js
│   ├── services/
│   │   ├── sensorService.js    # Core data processing
│   │   ├── alertEngine.js      # Rule engine
│   │   ├── alertDispatcher.js  # Multi-channel dispatch
│   │   ├── mlService.js        # Anomaly detection
│   │   ├── smsService.js
│   │   └── telegramService.js
│   └── utils/
│       ├── sensorValidator.js  # Per-field validation
│       ├── alertFormatter.js   # SMS & Telegram formatting
│       ├── alertCategories.js
│       ├── cooldownManager.js  # Alert flood prevention
│       └── stateManager.js     # Duplicate suppression
├── data/
│   └── neoguard_1500_rows.csv  # Sample dataset
├── public/
│   └── index.html
└── package.json
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Nirmalraj D](https://github.com/Nirmalraj-D-20)
