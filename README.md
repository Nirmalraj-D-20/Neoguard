# NeoGuard

A real-time IoT health and environment monitoring backend. NeoGuard ingests sensor data from connected devices, scores threat levels, and dispatches alerts through browser (Socket.IO), SMS, and Telegram when critical conditions are detected.

---

## Features

- Real-time sensor data ingestion and validation
- Threat score calculation using weighted sensor metrics
- Anomaly detection via Z-score analysis
- Rule-based alert engine with priority sorting and cooldown management
- Multi-channel alert dispatch: browser (Socket.IO), SMS (Twilio), Telegram
- Trend analysis for heart rate and temperature
- Paginated sensor history API

---

## Tech Stack

| Layer       | Technology                  |
|-------------|-----------------------------|
| Runtime     | Node.js (≥ 18)              |
| Framework   | Express.js                  |
| Database    | MongoDB (Mongoose)          |
| Real-time   | Socket.IO                   |
| SMS         | Twilio                      |
| Messaging   | Telegram Bot API            |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB instance (local or Atlas)
- Twilio account (for SMS alerts)
- Telegram Bot token (for Telegram alerts)

### Installation

```bash
git clone https://github.com/Nirmalraj-D-20/Neoguard.git
cd Neoguard/Neoguard
npm install
```

### Environment Variables

Create a `.env` file in the `Neoguard/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/neoguard

# Twilio
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

# Development (with auto-reload)
npm run dev
```

---

## API Reference

### Sensor

| Method | Endpoint       | Description                        |
|--------|----------------|------------------------------------|
| POST   | `/api/sensor`  | Ingest sensor data from a device   |
| GET    | `/api/sensor`  | Fetch paginated sensor history     |

**POST `/api/sensor` — Request body:**

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

**GET `/api/sensor` — Query params:**

| Param       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `page`      | number | Page number (default: 1)             |
| `limit`     | number | Records per page (default: 10, max: 100) |
| `device_id` | string | Filter by device                     |

---

### Analytics

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/api/analytics/trends`     | Heart rate and temperature trends    |
| GET    | `/api/analytics/summary`    | Aggregated analytics (avg, totals)   |
| GET    | `/api/ml/anomaly`           | Z-score anomaly detection            |

**GET `/api/ml/anomaly` — Query params:**

| Param       | Type   | Description       |
|-------------|--------|-------------------|
| `device_id` | string | Target device ID  |

---

## Sensor Validation Ranges

| Sensor      | Valid Range      | Units  |
|-------------|------------------|--------|
| Temperature | 0 – 60           | °C     |
| Humidity    | 0 – 100          | %      |
| Noise       | 0 – 150          | dB     |
| Light       | 0 – 100,000      | lux    |
| Vibration   | 0 – 100          | —      |
| Heart Rate  | 30 – 220         | bpm    |
| SpO2        | 70 – 100         | %      |

---

## Alert System

Alerts are generated when sensor readings cross defined thresholds. Only the highest-priority alert per device is dispatched per cycle to prevent noise.

**Alert types (highest → lowest priority):**

1. `FALL_DETECTION` — dangerous vibration + low heart rate
2. `HEALTH_EMERGENCY` / `CARDIAC_RISK` — critical vitals
3. `ENVIRONMENT_HAZARD` — extreme humidity/noise/light
4. `FEVER_WARNING` — elevated temperature + elevated heart rate

Critical alerts are sent via SMS and Telegram. Warning alerts are browser-only.

---

## Project Structure

```
Neoguard/
├── src/
│   ├── app.js               # Express app entry point
│   ├── config/
│   │   ├── db.js            # MongoDB connection
│   │   └── socket.js        # Socket.IO singleton
│   ├── controllers/         # Route handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── services/            # Business logic & alert engine
│   └── utils/               # Validators, formatters, helpers
├── data/
│   └── neoguard_1500_rows.csv   # Sample dataset
├── public/
│   └── index.html
└── package.json
```

---

## License

MIT
