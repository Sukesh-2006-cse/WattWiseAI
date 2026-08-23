# WattWise AI

> **Tagline:** *"Smart Energy Monitoring, Prediction and Awareness"*

WattWise AI is an IoT-based smart energy monitoring application built with React Native and Expo. It connects directly to Blynk IoT Cloud via HTTPS REST API to display real-time electrical telemetry from household circuits.

---

## 📌 Project Overview

WattWise AI empowers users with real-time visibility into their electricity consumption. The hardware layer consists of an ESP32 microcontroller, a Phoenix 32A Current Transformer (CT) for real current measurement, and simulated voltage (220 V – 230 V) for the current prototype phase. The telemetry is streamed to Blynk IoT Cloud, and this React Native application retrieves and visualizes the energy data in a sleek, modern dark-themed dashboard.

---

## ✨ Features

- **Local Account Authentication**: Fully offline email/password sign up & sign in, with salted iterated SHA-256 password hashing, a live password strength meter, local password reset, and a persisted session that survives app restarts.
- **High Load Email Alerts**: When heavy load is *sustained* (not a momentary spike), an email alert is sent to the signed-in user, with per-level cooldowns, an on/off switch, and a severity threshold.
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
Create a `.env` file in the project root (copy `.env.example` and fill in real values):

```env
EXPO_PUBLIC_BLYNK_API_URL=https://blynk.cloud
EXPO_PUBLIC_BLYNK_AUTH_TOKEN=your_real_blynk_device_token
```

> `.env` files are ignored by Git via `.gitignore` to prevent secret leaks.
> Expo inlines `EXPO_PUBLIC_*` values at build time, so **restart the dev server after editing `.env`**.

**Authentication needs no configuration.** Sign in and sign up run entirely on-device, so there are no auth keys, no external project to create, and no network dependency.

### 2. Set Up Email Alerts (EmailJS)

Email alerts are **optional** - without these keys the app runs normally and the dashboard shows the alert card in an unconfigured state.

1. Create an account at [emailjs.com](https://www.emailjs.com) and add an **Email Service** (Gmail, Outlook, ...).
2. Create an **Email Template**. Set the recipient field to `{{to_email}}` and the subject to `{{subject}}`. For the body, `{{message}}` alone gives the full pre-formatted alert; the individual variables below are also available if you prefer to design your own layout.
3. **Account -> Security -> enable "API requests from non-browser applications."** A React Native app is not a browser, so EmailJS rejects its requests with `403` until this is on.
4. Copy the Service ID, Template ID, and Public Key (Account -> API Keys) into `.env`:

```env
EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

Template variables available: `{{to_email}}`, `{{to_name}}`, `{{subject}}`, `{{message}}`, `{{alert_level}}`, `{{power}}`, `{{voltage}}`, `{{current}}`, `{{energy}}`, `{{device_status}}`, `{{threshold}}`, `{{guidance}}`, `{{detected_at}}`.

> EmailJS Service/Template IDs and the Public Key are public client identifiers by design - delivery is restricted by the allow-list and rate limits in the EmailJS dashboard, not by hiding these values. Do **not** put your EmailJS *private* key in `.env`: anything prefixed `EXPO_PUBLIC_` is inlined into the app bundle.

### 3. Environment Template (`.env.example`)
An environment template is provided in `.env.example`.

---

## 🔑 Authentication Flow

The app is gated behind authentication: no telemetry is rendered until a session exists. Accounts are stored **locally on the device** via AsyncStorage, so the entire flow works offline with zero backend setup.

```
App.tsx
└── <AuthProvider>            # Global session state (src/context/AuthContext.tsx)
    └── <RootNavigator>       # Auth gate (src/navigation/RootNavigator.tsx)
        ├── <LoadingView/>    # While the persisted session is being restored
        ├── <AuthNavigator/>  # Signed out -> Sign In / Sign Up / Reset Password
        └── <AppNavigator/>   # Signed in  -> Dashboard / Analytics / Bill & AI
```

| Capability | Behaviour |
| :--- | :--- |
| **Sign Up** | Full name, email, password + confirmation. Requires 8+ characters containing both letters and numbers, with a live strength meter. Duplicate emails are rejected. |
| **Sign In** | Email + password verified against the stored salted hash. A missing account and a wrong password return the *same* message, so the screen cannot be used to discover which emails are registered. |
| **Reset Password** | With no mail provider offline, the screen matches the account by email and sets a new password directly. A fresh salt is generated so the old digest cannot be replayed. |
| **Session Persistence** | The session pointer is stored in AsyncStorage, so a returning user lands straight on the dashboard. A session referencing a deleted account is discarded on restore. |
| **Sign Out** | Available from the account bar above the dashboard, behind a confirmation prompt. Clears the session but preserves the account. |

### Password Storage

Raw passwords are **never persisted**. Each account stores a random 16-byte salt and an iterated SHA-256 digest of `salt:password` (1000 rounds, via `expo-crypto`), and verification uses a constant-time digest comparison. Hashing parameters live in `PASSWORD_HASHING` in `src/constants/auth.ts`.

> **Scope note:** local auth secures accounts against casual inspection of the device store and is ideal for a self-contained prototype. It is not a substitute for a server-side identity provider - accounts exist only on the device that created them, do not sync across devices, and are removed if the app's data is cleared. The service boundary below is what makes that upgrade cheap when you need it.

### Service Isolation

Authentication follows the same isolation rule as Blynk: **no screen ever reads the account store.** Screens call `src/services/authService.ts`, which owns all credential policy and returns a normalized `AuthUser` (never a password hash) plus stable `AuthErrorCode` values. Persistence is one layer deeper in `src/services/localAuthStore.ts`. Moving to Firebase, Supabase, or a custom Node backend means rewriting `authService.ts` alone.


---

## 📧 High Load Email Alerts

Once signed in, the app watches the live power reading and emails **the signed-in account's own address** when a heavy load is sustained. The watcher runs on every tab, not just the dashboard.

### When an alert fires

| Guard | Rule |
| :--- | :--- |
| **Severity** | Only `HIGH` (1000-1800 W) and `CRITICAL` (>1800 W) alert. `LOW` and `NORMAL` never do. |
| **Sustain** | The level must hold for 3 consecutive readings (~15 s at the 5 s poll) before it counts, so motor inrush and switching spikes are ignored. |
| **Cooldown** | 30 min between `HIGH` emails, 10 min between `CRITICAL` ones - per account, and **persisted**, so restarting the app cannot bypass it. |
| **Escalation** | `CRITICAL` sends even while `HIGH` is in cooldown. A high-load email 5 minutes ago must never silence a critical one. |
| **User control** | A switch turns alerts off entirely, and the severity floor can be raised to "Critical only". Both are per account. |

A sustained overload re-evaluates about once a minute, so if load stays high the alert repeats when its cooldown expires rather than going silent.

Every dispatch outcome - sent, suppressed, or failed - is recorded and surfaced on the dashboard card. **The cooldown starts only after a confirmed send**, so a failed delivery never silences the next genuine alert. Delivery failures are shown with the provider's reason rather than swallowed.

All timings and thresholds live in `ALERT_RULES` in `src/constants/alerts.ts`; the wattage bands come from `POWER_THRESHOLDS` in `src/constants/blynk.ts`.

### Where the watcher runs

The watcher is mounted in `AlertsProvider`, **above** the tab switcher - not inside a screen. A screen-level watcher would stop evaluating (and reset its sustained-load streak) every time the user switched tabs.

```
<EnergyProvider>        # one shared ~5s Blynk poll for the whole app
  <AlertsProvider>      # the alert watcher - runs on every tab
    <AppTabs>           # Dashboard / Analytics / Bill & AI
```

The reading stream also had to outlive any one screen, so `EnergyProvider` runs a single `useEnergyData` poll shared by the dashboard, analytics, and the watcher. Previously each screen polled Blynk independently.

### Service Isolation

Same rule as everywhere else: **no component or hook talks to the mail provider.** `useLoadAlerts` owns the sustain state machine, `alertService` owns the policy (cooldowns, severity floor, message composition), and `emailService` is the only module that knows EmailJS exists. Swapping to SendGrid, Resend, or a backend proxy means rewriting `emailService.ts` alone.

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
    │   ├── energy.ts         # EnergyData interfaces & type definitions
    │   ├── auth.ts           # AuthUser, AuthErrorCode & form validation types
    │   └── alert.ts          # AlertLevel, AlertRecord & delivery result types
    ├── constants/
    │   ├── theme.ts          # Centralized dark theme palette (#0B0F14)
    │   ├── blynk.ts          # Datastream keys & configurable power thresholds
    │   ├── auth.ts           # Storage keys, hashing params & password/email rules
    │   └── alerts.ts         # EmailJS config, sustain/cooldown rules
    ├── services/
    │   ├── blynkService.ts   # Isolated Blynk HTTPS API client & error handler
    │   ├── authService.ts    # Isolated credential policy & error mapping
    │   ├── localAuthStore.ts # AsyncStorage account & session persistence
    │   ├── emailService.ts   # Isolated EmailJS transport & error mapping
    │   ├── alertService.ts   # Alert policy, message composition & dispatch
    │   └── alertStore.ts     # Per-account preferences, cooldowns & history
    ├── context/
    │   ├── AuthContext.tsx   # Global session provider & useAuth() hook
    │   ├── EnergyContext.tsx # Single shared telemetry poll for the whole app
    │   └── AlertsContext.tsx # App-wide alert watcher, mounted above the tabs
    ├── utils/
    │   ├── energyUtils.ts    # Power classification & formatting helpers
    │   ├── authUtils.ts      # Email/password validation & strength scoring
    │   └── passwordUtils.ts  # Salt generation & iterated SHA-256 hashing
    ├── hooks/
    │   ├── useEnergyData.ts  # Custom ~5s interval polling hook (memory leak safe)
    │   └── useLoadAlerts.ts  # Sustained-load watcher driving email alerts
    ├── components/
    │   ├── MetricCard.tsx    # Reusable card component (Voltage, Current, Power, Energy)
    │   ├── AuthInput.tsx     # Themed form field with reveal toggle & inline error
    │   ├── AuthButton.tsx    # Primary/outline action button with loading state
    │   ├── AuthBanner.tsx    # Inline error / success / setup notice banner
    │   ├── AccountHeader.tsx # Signed-in identity bar with sign out
    │   ├── AlertStatusCard.tsx # Alert status, on/off switch & severity picker
    │   ├── StatusBadge.tsx   # Load presence & Power classification badges
    │   ├── ConnectionHeader.tsx # Device Online/Offline banner & last updated time
    │   ├── EnergyChart.tsx   # Live SVG power consumption chart
    │   ├── LoadingView.tsx   # Connecting state UI
    │   └── ErrorView.tsx     # Network error screen with Retry option
    ├── screens/
    │   ├── DashboardScreen.tsx    # Main real-time monitoring dashboard
    │   ├── AnalyticsScreen.tsx    # Session telemetry & historical placeholder
    │   ├── BillPredictionScreen.tsx # Future ML forecasting & anomaly detection
    │   └── auth/
    │       ├── AuthLayout.tsx         # Shared branded auth shell
    │       ├── SignInScreen.tsx       # Email + password sign in
    │       ├── SignUpScreen.tsx       # Registration with strength meter
    │       └── ForgotPasswordScreen.tsx # Local password reset
    └── navigation/
        ├── RootNavigator.tsx # Auth gate: splash / auth stack / app
        ├── AuthNavigator.tsx # Sign In <-> Sign Up <-> Reset Password
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
- **Authentication**: On-device accounts via `@react-native-async-storage/async-storage` + `expo-crypto` (salted iterated SHA-256)
- **Hardware**: ESP32 Microcontroller, Phoenix 32A Current Transformer
- **Email Delivery**: EmailJS REST API (no backend required)
- **Visualization**: `react-native-svg` & `@expo/vector-icons`
