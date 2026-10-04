# WattWise AI: Tamil Nadu Electricity Bill Prediction & ML Model Architecture

## 1. Overview & Objectives
This specification defines the machine learning architecture, synthetic dataset generation, TANGEDCO (Tamil Nadu Generation and Distribution Corporation) domestic tariff calculation engine, backend inference pipeline, and interactive mobile UI for predicting electricity consumption and monthly bills. The system is specifically calibrated for a **single 40W Tungsten / Halogen electric bulb** (~0.17A current at 230V AC) connected to hardware sensors (Phoenix 32A CT sensor + simulated/metered AC grid voltage) streaming via Blynk IoT Cloud into MongoDB Atlas.

---

## 2. Tamil Nadu Grid & 40W Bulb Realistic Dataset Generation
### 2.1 Dataset Generator (`scripts/generate_tn_dataset.py`)
- **Dataset Size**: 52,560 time-series data points (1 full year at 10-minute intervals).
- **Tamil Nadu AC Grid Voltage Characteristics**:
  - Nominal: 230V AC RMS.
  - Range: 212V – 242V sinusoidal variations with ambient temperature and grid loading effects.
  - Peak-hour voltage droop: Typical reduction of 4–8V during evening peak load (18:00 to 22:00 IST).
- **Single 40W Bulb Load Profile**:
  - Rated Power: 40W at 230V ($R \approx 1322.5\ \Omega$).
  - Current Draw: Active operating current $I = V / R \approx 0.160\text{A} - 0.183\text{A}$ (nominal ~0.174A).
  - Inrush current: Simulated transient cold filament spike at switch-on transitions.
  - Idle/Off State: Current = 0.00A, Power = 0.00W.
- **Diurnal Usage Behavior in Tamil Nadu Households**:
  - Morning active window (05:30 – 07:30): 65% probability of being switched ON.
  - Daytime window (07:30 – 17:30): 10% probability (cloudy/dark days).
  - Evening active window (17:30 – 23:30): 92% probability of being switched ON.
  - Late Night window (23:30 – 05:30): 5% probability (night lamp usage).
  - Weekend shift: Slight increase in morning and evening active hours.
- **Dataset Columns**:
  - `timestamp`: ISO timestamp.
  - `voltage`: Volts (V).
  - `current`: Amperes (A).
  - `power`: Watts (W).
  - `energy_accumulated_kwh`: Running total kWh.
  - `hour_of_day`: 0 – 23.
  - `day_of_week`: 0 – 6 (Monday = 0, Sunday = 6).
  - `billing_cycle_day`: Day 1 to 60 within the TANGEDCO bi-monthly billing period.
  - `actual_monthly_kwh`: Target label 1 (ground truth end-of-month kWh).
  - `actual_bimonthly_units`: Target label 2 (ground truth end-of-cycle units).
  - `tangedco_subsidized_bill`: Target label 3 (ground truth subsidized ₹).
  - `tangedco_unsubsidized_bill`: Target label 4 (ground truth unsubsidized ₹).

---

## 3. Machine Learning Model Architecture & Weight Export
### 3.1 Neural Network Model (`scripts/train_model.py`)
- **Type**: Multi-Layer Perceptron (MLP) Neural Network built with NumPy.
- **Input Features (7 dimensions)**:
  1. `voltage` (Normalized)
  2. `current` (Normalized)
  3. `power` (Normalized)
  4. `energy_accumulated` (Normalized)
  5. `hour_of_day` (Cyclic sin/cos encoding or standard normalized)
  6. `day_of_week` (Normalized)
  7. `billing_cycle_day` (Normalized 1–60)
- **Layer Architecture**:
  - Input Layer: 7 nodes
  - Hidden Layer 1: 16 neurons with ReLU activation and He initialization
  - Hidden Layer 2: 8 neurons with ReLU activation
  - Output Layer: 2 neurons (`predicted_monthly_kwh`, `projected_cycle_units`) with Linear activation
- **Training Strategy**:
  - Train/Validation/Test split: 80% / 10% / 10%.
  - Optimizer: Adam (Adaptive Moment Estimation) with learning rate $\eta = 0.005$, $\beta_1 = 0.9$, $\beta_2 = 0.999$.
  - Loss function: Mean Squared Error (MSE) with L2 regularization ($\lambda = 1e-4$).
  - Target metrics: $R^2 > 0.92$, $RMSE < 1.0\text{ kWh}$.
- **Export Artifacts (`server/models/ml/`)**:
  - `bill_model_weights.json`: Exported weights ($W_1, b_1, W_2, b_2, W_3, b_3$), normalization parameters ($\mu, \sigma$ for all 7 inputs), and evaluation metrics ($R^2$, RMSE, training epoch count).
  - `tn_bulb_dataset.csv`: Generated massive dataset.
  - `model_metadata.json`: Dataset distribution stats and model timestamp.

---

## 4. Tamil Nadu TANGEDCO Domestic Tariff Engine
### 4.1 Tariff Schedule (LT Tariff 1A - Domestic)
TANGEDCO follows a bi-monthly billing cycle (60 days). The tariff engine implements the official domestic rate slabs:
1. **0 to 100 units (bi-monthly)**: ₹0.00 / unit (100% Subsidized by Govt of Tamil Nadu).
2. **101 to 200 units**: ₹2.35 / unit for units in this slab.
3. **201 to 400 units**: ₹4.70 / unit for units in this slab.
4. **401 to 500 units**: ₹6.30 / unit for units in this slab.
5. **501 to 600 units**: ₹8.40 / unit for units in this slab.
6. **601 to 800 units**: ₹9.45 / unit for units in this slab.
7. **801 to 1000 units**: ₹10.50 / unit for units in this slab.
8. **Above 1000 units**: ₹11.55 / unit for units in this slab.

### 4.2 Single 40W Bulb Calculation Realities
- 40W Bulb operated 8 hours/day:
  - Daily consumption: $40\text{W} \times 8\text{h} = 0.32\text{ kWh/day}$.
  - Monthly (30 days): $9.6\text{ kWh}$.
  - Bi-monthly (60 days): $19.2\text{ kWh}$.
- **Subsidized Bill**: ₹0.00 (Falls cleanly within the 100 Free Units slab).
- **Unsubsidized Energy Cost**: $19.2\text{ units} \times ₹4.70/\text{unit} = ₹90.24$.
- **Government Subsidy Value**: ₹90.24 saved by the consumer.
- **Interactive Scaling**: The engine supports custom simulated hours (e.g. 24h continuous operation or scaling up to multiple appliances) to demonstrate how the bill transitions into higher TANGEDCO tariff tiers.

---

## 5. Backend Server Architecture & Endpoints
### 5.1 Service Modules
- `server/services/tariffEngine.js`: Pure mathematical calculation of TANGEDCO domestic slabs, fixed charges, subsidized bill, unsubsidized cost, and subsidy savings.
- `server/services/predictionService.js`: Loads `server/models/ml/bill_model_weights.json` on initialization. Implements matrix multiplication in Node.js for sub-2ms feed-forward inference.
### 5.2 API Endpoints
- `GET /api/prediction/bill?email=<userEmail>`:
  - Retrieves user's latest telemetry from MongoDB Atlas or live Blynk IoT Cloud.
  - Extracts active features (voltage, current, power, cumulative kWh, current hour, day of week, day of month).
  - Runs MLP neural network prediction for end-of-month and end-of-cycle kWh.
  - Passes predictions into `tariffEngine.js`.
  - Returns complete prediction payload with confidence score, slab position, and bill breakdown.
- `POST /api/prediction/simulate`:
  - Body: `{ hoursPerDay, wattage, daysInCycle }`
  - Runs scenario prediction and returns expected bill.
- `GET /api/prediction/tariff`:
  - Returns active TANGEDCO domestic tariff slabs table.

---

## 6. Frontend Mobile Screen (`BillPredictionScreen.tsx`)
1. **Live Prediction Header & Primary Bill Card**:
   - Projected Monthly Usage: e.g. `9.60 kWh`
   - Subsidized Amount Payable: `₹0.00` (Free under TN 100 units scheme)
   - Unsubsidized Value: `₹90.24`
   - Government Subsidy Saved: `₹90.24 (100% OFF)`
2. **TANGEDCO Slab Visual Indicator**:
   - Visual gauge from 0 to 100 units with green "FREE TIER" badge.
   - Indicator pointer showing exact single 40W bulb position (~19.2 units).
3. **Hardware Sensor Telemetry Bar**:
   - Live stream readouts: Voltage (230.4 V), Current (0.174 A), Power (40.1 W), Cumulative Energy (0.038 kWh).
4. **Interactive Usage Simulator**:
   - Slider / Stepper allowing user to adjust bulb active hours (1 to 24 hrs/day).
   - Real-time recalculation of projected monthly units and estimated bill.
5. **AI Model Diagnostics Card**:
   - Model Architecture: Multi-Layer Perceptron (7 $\rightarrow$ 16 $\rightarrow$ 8 $\rightarrow$ 2)
   - Weights Status: Active (`bill_model_weights.json`)
   - Inference Latency: <2ms
   - Training Samples: 52,560 Tamil Nadu Sensor Records
   - Validation $R^2$ Score: Displayed live from model metadata.

---

## 7. Verification & Testing Plan
1. **Dataset Generation Verification**:
   - Execute `python scripts/generate_tn_dataset.py`.
   - Verify `server/models/ml/tn_bulb_dataset.csv` contains 52,560 rows, realistic voltage (212–242V), current (~0.17A when on, 0A when off), and expected power.
2. **Model Training & Weights Export Verification**:
   - Execute `python scripts/train_model.py`.
   - Verify training convergence ($R^2 > 0.90$) and creation of `server/models/ml/bill_model_weights.json`.
3. **Backend Service Unit Test**:
   - Verify `server/services/predictionService.js` and `server/services/tariffEngine.js` with simulated inputs (40W bulb at 8 hrs/day).
   - Confirm subsidized bill equals ₹0.00 and unsubsidized cost matches TANGEDCO slab calculation.
4. **Backend API Endpoints Test**:
   - Query `/api/health`, `/api/prediction/bill`, `/api/prediction/simulate`, and `/api/prediction/tariff`.
5. **Frontend UI Verification**:
   - Run typecheck (`npm run typecheck`).
   - Launch app preview and verify real-time data binding, simulator responsiveness, and responsive layout.
