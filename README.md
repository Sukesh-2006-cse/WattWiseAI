# WattWise AI

> **Tagline:** *"Smart Energy Monitoring, Prediction and Awareness"*

WattWise AI is an IoT-based smart energy monitoring application built with React Native (Expo) and a Node.js Express backend. It connects directly to Blynk IoT Cloud via HTTPS REST API to display real-time electrical telemetry from household circuits, stores continuous historical logs in MongoDB Atlas, and provides email alert notifications via Nodemailer.

---

## 📌 Project Overview

WattWise AI empowers users with real-time visibility into their electricity consumption. The hardware layer consists of an ESP32 microcontroller, a Phoenix 32A Current Transformer (CT) for real current measurement, and simulated voltage (220 V – 230 V) for the current prototype phase. The telemetry is streamed to Blynk IoT Cloud, synchronized with MongoDB Atlas, and visualized in a sleek, modern dark-themed mobile/web dashboard.

---

## ✨ Features

- **Single All-in-One Runner**: Launch both the backend API and frontend with a single command (`npm run dev`).
- **Real-Time Telemetry Dashboard**: Live updates every 5 seconds for Voltage (V), Current (A), Power (W), and Energy (kWh).
- **Load Presence Detection**: Automatically detects active load draw (`LOAD DETECTED` vs `NO LOAD`).
- **Power Classification**: Configurable threshold classification (`LOW LOAD` 0–300W, `NORMAL` 300–1000W, `HIGH LOAD` 1000–1800W, `CRITICAL` >1800W).
- **Live Power Consumption Chart**: Interactive SVG sparkline rendering real-time power fluctuation.
- **Hardware Connection Monitoring**: Displays `Device Online` or `DEVICE OFFLINE` status along with local device timestamp.
- **MongoDB Atlas Cloud Sync**: Automatically persists live telemetry logs and maintains user accounts.
- **Automated Email Notifications**: Nodemailer email alerts sent when circuit load states change.
- **Isolated Blynk API Service**: Token credentials are securely managed via environment variables and isolated in `src/services/blynkService.ts`.
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

Credentials **MUST NEVER** be hardcoded inside source files.

### 1. Configure `.env`
Create or edit your `.env` file in the project root:

```env
# Blynk IoT Cloud Configuration
EXPO_PUBLIC_BLYNK_API_URL=https://blynk.cloud
EXPO_PUBLIC_BLYNK_AUTH_TOKEN=your_real_blynk_device_token

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.lg2htpb.mongodb.net/wattwise?retryWrites=true&w=majority

# Backend API Configuration
EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
PORT=5000

# Nodemailer SMTP Configuration (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# SMTP_FROM=WattWise AI Alerts <no-reply@wattwise.ai>
```

> `.env` files are ignored by Git via `.gitignore` to prevent secret leaks.

---

## 🏗️ Architecture & Project Structure

```
WattWiseAI/
├── .env.example              # Environment variables template
├── .gitignore                # Excludes secrets and build artifacts
├── App.tsx                   # Main React Native entrypoint
├── package.json              # App dependencies, concurrent scripts & tools
├── server/                   # Node.js Express Backend API
│   ├── index.js              # Express server & API endpoints
│   ├── package.json          # Server dependencies (Express, Mongoose, Nodemailer)
│   ├── models/
│   │   ├── User.js           # Mongoose User schema
│   │   └── Telemetry.js      # Mongoose Telemetry log schema
│   └── services/
│       └── emailService.js   # Nodemailer email alert pipeline
└── src/
    ├── types/
    │   └── energy.ts         # EnergyData interfaces & type definitions
    ├── constants/
    │   ├── theme.ts          # Centralized dark theme palette (#0B0F14)
    │   └── blynk.ts          # Datastream keys & configurable power thresholds
    ├── context/
    │   └── AuthContext.tsx   # User authentication & session state context
    ├── services/
    │   ├── blynkService.ts   # Isolated Blynk HTTPS API client & error handler
    │   └── apiService.ts     # Backend API client for telemetry & user auth
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
    │   ├── AuthScreen.tsx         # User Register & Login screen
    │   ├── DashboardScreen.tsx    # Main real-time monitoring dashboard
    │   ├── AnalyticsScreen.tsx    # Session telemetry & historical placeholder
    │   └── BillPredictionScreen.tsx # ML forecasting & anomaly detection blueprint
    └── navigation/
        └── AppNavigator.tsx  # Dark theme bottom navigation tab bar & user header
```

---

## 🚀 Running the Project

### 1. Install Dependencies
Run in the project root (installs frontend & server dependencies):

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

---

### 2. Single All-in-One Command (Recommended)

Run **both** the Express Backend API Server and Expo Frontend concurrently in a single terminal:

```bash
npm run dev
```

> ✨ Both outputs will be color-coded and prefixed in your terminal:
> - `[SERVER]` in cyan (runs on `http://localhost:5000`)
> - `[EXPO]` in magenta (runs the Expo development CLI)

To automatically launch the **Web Browser Preview** along with the backend:
```bash
npm run dev:web
```

---

### 3. Complete Command Reference

| Command | Description | Target |
| :--- | :--- | :--- |
| **`npm run dev`** | **Run Backend & Expo together (Interactive)** | **All-in-One** |
| **`npm run dev:web`** | **Run Backend & Expo together with Web Browser** | **All-in-One (Web)** |
| **`npm run dev:android`** | Run Backend & Expo together with Android Emulator | All-in-One (Android) |
| **`npm run dev:ios`** | Run Backend & Expo together with iOS Simulator | All-in-One (iOS) |
| `npm run server` | Run Backend API only with file watcher (`node --watch`) | Backend |
| `npm run server:start` | Run Backend API only in standard mode (`node index.js`) | Backend |
| `npm start` | Run Expo Dev Server only | Frontend |
| `npm run web` | Run Expo Web Browser preview only | Frontend (Web) |
| `npm run android` | Run Expo Android emulator / device only | Frontend (Android) |
| `npm run ios` | Run Expo iOS simulator only | Frontend (iOS) |
| `npm run typecheck` | Run TypeScript compiler validation (`tsc --noEmit`) | Quality / Lint |

---

### 4. Running Services Separately (Alternative)

If you prefer two separate terminal windows:

**Terminal 1 (Backend):**
```bash
npm run server
```

**Terminal 2 (Frontend):**
```bash
npm start
```
- Press <kbd>w</kbd> for Web browser
- Press <kbd>a</kbd> for Android Emulator
- Scan QR code with the **Expo Go** mobile app on your phone

---

## 🧪 Testing the Blynk Connection

1. Flash your ESP32 with the Blynk IoT firmware mapping pins `V0` to `V4`.
2. Insert your Blynk Device Auth Token into `.env` under `EXPO_PUBLIC_BLYNK_AUTH_TOKEN`.
3. Launch the project using `npm run dev` (or `npm run dev:web`).
4. Verify that:
   - Status displays `Device Online`.
   - Datastreams `V0`, `V1`, `V2`, `V3` show live numerical values.
   - Turning on an electrical load changes Load Status to `LOAD DETECTED`.
   - Telemetry logs sync to MongoDB Atlas.

---

## 🔮 Future Enhancements & Machine Learning Roadmap

1. **ZMPT101B Voltage Integration**: Transition from simulated voltage (V0) to physical ZMPT101B hardware sampling.
2. **ML Monthly Bill Prediction**: Deploy machine learning regression model to forecast monthly energy bills based on consumption trends.
3. **AI Anomaly Detection**: Automatic alert notifications for abnormal consumption spikes or appliance malfunction.

---

## 📄 Tech Stack

- **Frontend**: React Native with Expo SDK 54 (TypeScript)
- **Backend API**: Node.js & Express
- **Database**: MongoDB Atlas (`Mongoose`)
- **Alerts**: Nodemailer SMTP
- **IoT Cloud**: Blynk IoT Cloud (HTTPS REST API)
- **Hardware**: ESP32 Microcontroller, Phoenix 32A Current Transformer
- **Visualization**: `react-native-svg` & `@expo/vector-icons`
- **Runner**: `concurrently`
