# WattWise AI

> **Tagline:** *"Smart Energy Monitoring, Prediction and Awareness"*

WattWise AI is an IoT-based smart energy monitoring application built with React Native and Expo. It connects directly to Blynk IoT Cloud via HTTPS REST API to display real-time electrical telemetry from household circuits.

---

## 📌 Project Overview

WattWise AI empowers users with real-time visibility into their electricity consumption. The hardware layer consists of an ESP32 microcontroller, a Phoenix 32A Current Transformer (CT) for real current measurement, and simulated voltage (220 V – 230 V) for the current prototype phase. The telemetry is streamed to Blynk IoT Cloud, and this React Native application retrieves and visualizes the energy data in a sleek, modern dark-themed dashboard.

---

## ✨ Features

- **Real-Time Telemetry Dashboard**: Live updates every 5 seconds for Voltage (V), Current (A), Power (W), and Energy (kWh).
- **Load Presence Detection**: Automatically detects active load draw (`LOAD DETECTED` vs `NO LOAD`).
- **Power Classification**: Configurable threshold classification (`LOW LOAD` 0–300W, `NORMAL` 300–1000W, `HIGH LOAD` 1000–1800W, `CRITICAL` >1800W).
- **Live Power Consumption Chart**: Interactive SVG sparkline rendering real-time power fluctuation.
- **Hardware Connection Monitoring**: Displays `Device Online` or `DEVICE OFFLINE` status along with local device timestamp.
- **Isolated Blynk API Service**: Token credentials are securely managed via environment variables and isolated in `src/services/blynkService.ts`.
- **Pull-to-Refresh**: Native pull-to-refresh support to trigger immediate Blynk API refetch.
- **Modular Analytics & ML Prediction UI**: Pre-built navigation views for session telemetry and future Machine Learning bill prediction & anomaly detection.

---

## 🛠️ Datastream Mapping

| Datastream | Measurement | Hardware Source | Unit | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| **V0** | Voltage | Simulated Grid Input (220–230 V) | `V` | `227.42` |
| **V1** | Current | Phoenix 32A Current Transformer | `A` | `0.1842` |
| **V2** | Power | Calculated (`V0` × `V1`) | `W` | `41.77` |
| **V3** | Energy | Accumulated Energy Over Time | `kWh` | `0.00006` |
| **V4** | Status | System Message / Load Status | `String` | `"LOAD DETECTED"` |

> ⚠️ **Hardware Prototype Note:** In the current prototype phase, current (V1) is measured from the physical Phoenix 32A CT sensor. Voltage (V0) is simulated between 220 V and 230 V. Future iterations will integrate the ZMPT101B voltage sensor.

---

## 🔐 Environment Setup & Security

The Blynk authentication token **MUST NEVER** be hardcoded inside source files.

### 1. Configure `.env`
Create a `.env` file in the project root:

```env
EXPO_PUBLIC_BLYNK_API_URL=https://blynk.cloud
EXPO_PUBLIC_BLYNK_AUTH_TOKEN=your_real_blynk_device_token
```

> `.env` files are ignored by Git via `.gitignore` to prevent secret leaks.

### 2. Environment Template (`.env.example`)
An example environment template is provided:

```env
EXPO_PUBLIC_BLYNK_API_URL=https://blynk.cloud
EXPO_PUBLIC_BLYNK_AUTH_TOKEN=YOUR_BLYNK_DEVICE_TOKEN
```

---

## 🏗️ Architecture & Project Structure

```
WattWiseAI/
├── .env.example              # Environment variables template
├── .gitignore                # Excludes secrets and build artifacts
├── App.tsx                   # Main entrypoint
├── package.json              # App dependencies & scripts
└── src/
    ├── types/
    │   └── energy.ts         # EnergyData interfaces & type definitions
    ├── constants/
    │   ├── theme.ts          # Centralized dark theme palette (#0B0F14)
    │   └── blynk.ts          # Datastream keys & configurable power thresholds
    ├── services/
    │   └── blynkService.ts   # Isolated Blynk HTTPS API client & error handler
    ├── utils/
    │   └── energyUtils.ts    # Power classification & formatting helpers
    ├── hooks/
    │   └── useEnergyData.ts  # Custom ~5s interval polling hook (memory leak safe)
    ├── components/
    │   ├── MetricCard.tsx    # Reusable card component (Voltage, Current, Power, Energy)
    │   ├── StatusBadge.tsx   # Load presence & Power classification badges
    │   ├── ConnectionHeader.tsx # Device Online/Offline banner & last updated time
    │   ├── EnergyChart.tsx   # Live SVG power consumption chart
    │   ├── LoadingView.tsx   # Connecting state UI
    │   └── ErrorView.tsx     # Network error screen with Retry option
    ├── screens/
    │   ├── DashboardScreen.tsx    # Main real-time monitoring dashboard
    │   ├── AnalyticsScreen.tsx    # Session telemetry & historical placeholder
    │   └── BillPredictionScreen.tsx # Future ML forecasting & anomaly detection
    └── navigation/
        └── AppNavigator.tsx  # Dark theme bottom navigation tab bar
```

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run start
```
Or run directly on target platforms:
```bash
npm run web       # Launch Web Browser Preview
npm run android   # Launch Android Emulator / Expo Go
npm run ios       # Launch iOS Simulator
```

---

## 🧪 Testing the Blynk Connection

1. Flash your ESP32 with the Blynk IoT firmware mapping pins `V0` to `V4`.
2. Insert your Blynk Device Auth Token into `.env` under `EXPO_PUBLIC_BLYNK_AUTH_TOKEN`.
3. Launch the app (`npm run web` or `npm run start`).
4. Verify that:
   - Status displays `Device Online`.
   - Datastreams `V0`, `V1`, `V2`, `V3` show live numerical values.
   - Turning on an electrical load changes Load Status to `LOAD DETECTED`.

---

## 🔮 Future Enhancements & Machine Learning Roadmap

1. **ZMPT101B Voltage Integration**: Transition from simulated voltage (V0) to physical ZMPT101B hardware sampling.
2. **Backend Proxy Layer**: Transition direct Blynk HTTPS requests to a dedicated Node.js / Python backend service (`src/services/blynkService.ts` is pre-isolated for this purpose).
3. **ML Monthly Bill Prediction**: Deploy machine learning regression model to forecast monthly energy bills based on consumption trends.
4. **AI Anomaly Detection**: Automatic alert notifications for abnormal consumption spikes or appliance malfunction.

---

## 📄 Tech Stack
- **Framework**: React Native with Expo SDK 54 (TypeScript)
- **IoT Cloud Platform**: Blynk IoT Cloud (HTTPS REST API)
- **Hardware**: ESP32 Microcontroller, Phoenix 32A Current Transformer
- **Visualization**: `react-native-svg` & `@expo/vector-icons`
