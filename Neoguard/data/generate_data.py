import pandas as pd
import numpy as np
from datetime import datetime, timedelta

rows = 1500
data = []

start_time = datetime(2026, 3, 22, 10, 0, 0)

for i in range(rows):
    # --- Generate base signals ---
    heart_rate = np.random.randint(60, 130)
    spo2 = np.random.randint(85, 100)
    temperature = round(np.random.uniform(35.5, 40.5), 1)
    humidity = np.random.randint(30, 90)
    noise = np.random.randint(30, 100)
    light = np.random.randint(100, 600)
    vibration = np.random.randint(5, 80)

    # --- Timestamp ---
    timestamp = start_time + timedelta(minutes=i)
    hour = timestamp.hour
    day_of_week = timestamp.weekday()

    # --- Derived metrics ---
    stress_index = (
        heart_rate * 0.8 +
        (100 - spo2) * 1.5 +
        noise * 0.5 +
        vibration * 0.3
    )

    env_risk = (
        temperature * 2 +
        humidity * 0.5 +
        noise * 0.7 +
        light * 0.2
    )

    # --- Label logic ---
    label = 1 if (
        heart_rate > 110 or
        spo2 < 90 or
        temperature > 38 or
        noise > 85 or
        env_risk > 120
    ) else 0

    data.append([
        heart_rate, spo2, temperature, humidity, noise,
        light, vibration, timestamp, hour, day_of_week,
        round(stress_index, 2), round(env_risk, 2), label
    ])

# --- DataFrame ---
columns = [
    "heart_rate", "spo2", "temperature", "humidity",
    "noise", "light", "vibration", "timestamp",
    "hour", "day_of_week", "stress_index",
    "env_risk", "label"
]

df = pd.DataFrame(data, columns=columns)

# Save
df.to_csv("neoguard_1500_rows.csv", index=False)

print("✅ Dataset generated:", df.shape)