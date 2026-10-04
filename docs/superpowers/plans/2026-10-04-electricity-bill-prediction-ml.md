# Electricity Bill Prediction ML & Tamil Nadu Tariff Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a complete Machine Learning electricity bill prediction system calibrated for a single 40W bulb using realistic Tamil Nadu grid telemetry and official TANGEDCO domestic tariff slabs, with model weights stored and served via Node.js Express backend and visualized in the React Native mobile app.

**Architecture:** A Python-based synthetic dataset generator creates 52,560 time-series records of Tamil Nadu grid voltage and 40W bulb diurnal behavior. A 3-layer MLP Neural Network is trained with NumPy Adam backpropagation and its weights/scalers exported to `bill_model_weights.json`. The Node.js Express backend performs sub-2ms feed-forward inference and calculates bi-monthly TANGEDCO LT-1A tariff slabs (featuring the 100 Free Units scheme). The React Native app (`BillPredictionScreen.tsx`) provides real-time bill predictions, slab progress visualizations, interactive what-if usage simulations, and AI telemetry diagnostics.

**Tech Stack:** Python 3.13, NumPy, Node.js, Express, MongoDB Atlas, React Native / Expo, TypeScript.

**Spec:** [docs/superpowers/specs/2026-10-04-electricity-bill-prediction-ml-design.md](file:///c:/Users/msuke/Documents/WattWiseAI/docs/superpowers/specs/2026-10-04-electricity-bill-prediction-ml-design.md)

## Global Constraints
- Target load: Single 40W Tungsten / Halogen electric bulb ($R \approx 1320\ \Omega$, $I \approx 0.165\text{A} - 0.180\text{A}$ at 230V AC).
- Tariff structure: TANGEDCO LT-1A Domestic (bi-monthly 60-day cycle, first 100 units free, subsequent slabs at ₹2.35, ₹4.70, ₹6.30, etc.).
- Weight format: Portable JSON (`server/models/ml/bill_model_weights.json`) for zero-dependency sub-2ms inference in Node.js Express.
- No UI placeholders: Rich, modern mobile UI with glassmorphic cards, live metrics, and reactive simulator sliders.

---

### Task 1: Tamil Nadu Realistic 40W Bulb Dataset Generator

**Files:**
- Create: `scripts/generate_tn_dataset.py`
- Test: `scripts/test_dataset.py`
- Output: `server/models/ml/tn_bulb_dataset.csv`

**Interfaces:**
- Produces: `server/models/ml/tn_bulb_dataset.csv` containing columns `[timestamp, voltage, current, power, energy_accumulated_kwh, hour_of_day, day_of_week, billing_cycle_day, actual_monthly_kwh, actual_bimonthly_units, tangedco_subsidized_bill, tangedco_unsubsidized_bill]`.

- [ ] **Step 1: Write test for dataset generation**
Create `scripts/test_dataset.py` to assert row count, voltage boundaries (210–245V), current draw (~0.16–0.185A when active, 0A when off), and power (~36–44W when active).

- [ ] **Step 2: Run test to verify it fails before dataset creation**
Run: `python scripts/test_dataset.py`
Expected: FAIL with FileNotFoundError.

- [ ] **Step 3: Implement `scripts/generate_tn_dataset.py`**
Generate 52,560 10-minute intervals covering 365 days. Include Tamil Nadu diurnal lighting probabilities (morning 05:30–07:30 65%, daytime 10%, evening 17:30–23:30 92%, night 5%), TN grid voltage fluctuations with evening droop, cumulative energy, and TANGEDCO ground truth targets.

- [ ] **Step 4: Execute generator and verify test passes**
Run: `python scripts/generate_tn_dataset.py` then `python scripts/test_dataset.py`
Expected: PASS with 52,560 rows validated.

- [ ] **Step 5: Commit Task 1**
Run:
```bash
git add scripts/generate_tn_dataset.py scripts/test_dataset.py
git commit -m "feat(ml): add realistic tamil nadu 40w bulb dataset generator"
```

---

### Task 2: MLP Neural Network Training & Portable Weight Export

**Files:**
- Create: `scripts/train_model.py`
- Test: `scripts/test_model.py`
- Output: `server/models/ml/bill_model_weights.json`, `server/models/ml/model_metadata.json`

**Interfaces:**
- Consumes: `server/models/ml/tn_bulb_dataset.csv`
- Produces: `server/models/ml/bill_model_weights.json` containing `weights` ($W_1, b_1, W_2, b_2, W_3, b_3$), `scaler` ($\mu, \sigma$ for 7 features), and `metrics` ($R^2$, RMSE).

- [ ] **Step 1: Write test for model weight export & inference**
Create `scripts/test_model.py` to check that `bill_model_weights.json` exists, has correct tensor shapes (7 $\rightarrow$ 16 $\rightarrow$ 8 $\rightarrow$ 2), $R^2 > 0.88$, and runs a mock forward pass.

- [ ] **Step 2: Run test to verify it fails**
Run: `python scripts/test_model.py`
Expected: FAIL with missing weights file.

- [ ] **Step 3: Implement `scripts/train_model.py`**
Implement 7-input MLP with Adam optimizer, He weight initialization, mini-batch gradient descent (64 batch size), ReLU activations, and linear outputs for monthly kWh and bi-monthly units. Save trained weights, feature scalers, and training metrics to `server/models/ml/bill_model_weights.json`.

- [ ] **Step 4: Execute training and verify test passes**
Run: `python scripts/train_model.py` then `python scripts/test_model.py`
Expected: PASS with validation $R^2 \ge 0.90$.

- [ ] **Step 5: Commit Task 2**
Run:
```bash
git add scripts/train_model.py scripts/test_model.py server/models/ml/bill_model_weights.json server/models/ml/model_metadata.json
git commit -m "feat(ml): train mlp model and export portable weights for bill prediction"
```

---

### Task 3: TANGEDCO Domestic Tariff Engine & In-Process Inference Service

**Files:**
- Create: `server/services/tariffEngine.js`
- Create: `server/services/predictionService.js`
- Test: `server/test/test_tariff_prediction.js`

**Interfaces:**
- `calculateTangedcoBill(bimonthlyUnits: number)`: Returns `{ subsidizedBill, unsubsidizedCost, subsidySavings, slabBreakdown, isFreeTier }`.
- `predictBillFromTelemetry(features: { voltage, current, power, energy, hour, dayOfWeek, dayOfCycle })`: Returns ML predictions + tariff calculation.

- [ ] **Step 1: Write test for tariff engine and prediction service**
Create `server/test/test_tariff_prediction.js` verifying:
1. 0–100 units has ₹0.00 subsidized bill.
2. 40W bulb running 8 hrs/day (~19.2 bi-monthly units) yields ₹0.00 subsidized, ~₹90.24 unsubsidized.
3. Neural network forward pass in JS matches expected dimensions and executes in <5ms.

- [ ] **Step 2: Run test to verify it fails**
Run: `node server/test/test_tariff_prediction.js`
Expected: FAIL.

- [ ] **Step 3: Implement `server/services/tariffEngine.js` & `server/services/predictionService.js`**
Code the exact TANGEDCO domestic LT-1A slabs and load `bill_model_weights.json` to perform standardized matrix math in pure JavaScript.

- [ ] **Step 4: Run test to verify it passes**
Run: `node server/test/test_tariff_prediction.js`
Expected: PASS with all assertions satisfied and inference latency < 2ms.

- [ ] **Step 5: Commit Task 3**
Run:
```bash
git add server/services/tariffEngine.js server/services/predictionService.js server/test/test_tariff_prediction.js
git commit -m "feat(server): add tangedco domestic tariff engine and nodejs ml prediction service"
```

---

### Task 4: Backend Express Prediction API Endpoints

**Files:**
- Modify: `server/index.js`
- Test: `server/test/test_api_endpoints.js`

**Interfaces:**
- `GET /api/prediction/bill?email=...`: Live prediction endpoint.
- `POST /api/prediction/simulate`: Body `{ hoursPerDay, wattage, daysInCycle }`.
- `GET /api/prediction/tariff`: Returns TANGEDCO slab table.

- [ ] **Step 1: Write test for prediction API endpoints**
Create `server/test/test_api_endpoints.js` to test `/api/prediction/tariff`, `/api/prediction/simulate`, and `/api/prediction/bill`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node server/test/test_api_endpoints.js`
Expected: FAIL with 404 or connection error.

- [ ] **Step 3: Update `server/index.js` with new prediction routes**
Import `predictionService` and `tariffEngine`. Register the 3 API routes and connect them with latest Telemetry query for the user.

- [ ] **Step 4: Run test to verify endpoints pass**
Run: `node server/test/test_api_endpoints.js`
Expected: PASS with HTTP 200 and complete prediction JSON structures.

- [ ] **Step 5: Commit Task 4**
Run:
```bash
git add server/index.js server/test/test_api_endpoints.js
git commit -m "feat(server): add prediction and simulation api endpoints"
```

---

### Task 5: Mobile Client Integration & Type Definitions

**Files:**
- Create/Modify: `src/types/prediction.ts`
- Modify: `src/services/apiService.ts`

**Interfaces:**
- `fetchBillPrediction(email: string): Promise<BillPredictionResponse>`
- `simulateBillPrediction(params: SimulationParams): Promise<BillPredictionResponse>`
- `fetchTangedcoTariff(): Promise<TariffInfoResponse>`

- [ ] **Step 1: Create `src/types/prediction.ts`**
Define interfaces for `BillPredictionResponse`, `TangedcoSlabBreakdown`, `ModelDiagnostics`, and `SimulationParams`.

- [ ] **Step 2: Add prediction client methods to `src/services/apiService.ts`**
Add `fetchBillPrediction`, `simulateBillPrediction`, and `fetchTangedcoTariff` with graceful fallback handling if backend is offline.

- [ ] **Step 3: Run TypeScript typecheck to verify contracts**
Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit Task 5**
Run:
```bash
git add src/types/prediction.ts src/services/apiService.ts
git commit -m "feat(client): add prediction service and typescript definitions"
```

---

### Task 6: Premium UI Redesign for `BillPredictionScreen.tsx`

**Files:**
- Modify: `src/screens/BillPredictionScreen.tsx`

**Components to implement:**
1. **Live Prediction Header & Subsidized Bill Banner**:
   - Monthly projected kWh, bi-monthly units.
   - Payable bill: **₹0.00** (Highlighted in emerald green with "100 Units Free Scheme Applied").
   - Unsubsidized value and Subsidy savings callout.
2. **TANGEDCO Slab Progress Bar**:
   - Visual bar highlighting 0–100 free units tier and current bulb position (~19.2 units).
3. **Hardware Sensor Telemetry Strip**:
   - Displays real-time 40W bulb status (Voltage, Current ~0.17A, Power ~40W, Energy kWh).
4. **Interactive Usage Simulator**:
   - Stepper / Slider to adjust bulb active hours (1h to 24h) and instantly re-simulate bill.
5. **AI Model Telemetry Card**:
   - Displays ML Architecture (MLP Neural Net), weights status (Active), inference latency (<2ms), dataset size (52,560 TN samples), and validation $R^2$ score.

- [ ] **Step 1: Refactor `src/screens/BillPredictionScreen.tsx` with complete functionality**
Replace coming-soon placeholders with live hooks, server API integration, simulator controls, and rich visual presentation.

- [ ] **Step 2: Verify TypeScript compilation**
Run: `npm run typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 6**
Run:
```bash
git add src/screens/BillPredictionScreen.tsx
git commit -m "feat(ui): complete bill prediction screen with tangedco tariff and ml telemetry"
```

---

### Task 7: Full System Verification

- [ ] **Step 1: End-to-end verification of dataset, model, backend endpoints, and frontend build**
- [ ] **Step 2: Verify in running app without regressions**
- [ ] **Step 3: Final integration commit**
