/**
 * Unit tests for TANGEDCO domestic tariff engine & Node.js MLP neural network prediction service
 */

const assert = require('assert');
const path = require('path');
const { calculateTangedcoBill, TANGEDCO_DOMESTIC_SLABS } = require('../services/tariffEngine');
const { predictBillFromTelemetry, isModelReady, getModelMetadata } = require('../services/predictionService');

function runTests() {
  console.log('Testing TANGEDCO Tariff Engine & Prediction Service...');

  // 1. Model Ready Check
  assert.strictEqual(isModelReady(), true, 'ML Model weights must be successfully loaded at startup');
  const metadata = getModelMetadata();
  assert.ok(metadata.architecture, 'Model metadata should contain architecture details');
  console.log('✅ Model is loaded & ready. Version:', metadata.version, 'R2 score:', metadata.metrics.r2_score);

  // 2. Test TANGEDCO Domestic Tariff Engine (LT Tariff 1A)
  // Scenario A: 0 to 100 units (Single 40W bulb running ~8h/day = ~17.5 units bi-monthly)
  const bulbBill = calculateTangedcoBill(17.5);
  assert.strictEqual(bulbBill.bimonthlyUnits, 17.5);
  assert.strictEqual(bulbBill.subsidizedBill, 0.00, 'Under 100 units must be Rs 0.00 (100 Free Units Scheme)');
  assert.strictEqual(bulbBill.isFreeTier, true);
  assert.ok(bulbBill.unsubsidizedCost > 0, 'Unsubsidized cost should be > 0');
  assert.strictEqual(bulbBill.subsidySavings, bulbBill.unsubsidizedCost, 'Subsidy savings should equal full cost');
  console.log('✅ Single 40W bulb (17.5 units): Subsidized = ₹0.00, Unsubsidized = ₹' + bulbBill.unsubsidizedCost + ', Saved = ₹' + bulbBill.subsidySavings);

  // Scenario B: 150 units (Exceeds 100 free units)
  // First 100 units = Free (Rs 0)
  // Next 50 units @ Rs 2.35 = Rs 117.50 + Rs 20 fixed charge = Rs 137.50
  const bill150 = calculateTangedcoBill(150);
  assert.strictEqual(bill150.subsidizedBill, 137.50);
  assert.strictEqual(bill150.fixedCharges, 20.00);
  console.log('✅ 150 units: Subsidized = ₹' + bill150.subsidizedBill + ' (50 x 2.35 + ₹20 fixed charge)');

  // Scenario C: 250 units
  // 0-100: 0
  // 101-200 (100 units): 100 * 2.35 = 235
  // 201-250 (50 units): 50 * 4.70 = 235 -> Energy = 470 + ₹20 fixed charge = 490
  const bill250 = calculateTangedcoBill(250);
  assert.strictEqual(bill250.subsidizedBill, 490.00);
  console.log('✅ 250 units: Subsidized = ₹' + bill250.subsidizedBill);

  // 3. Test In-Process Node.js Inference (<2ms latency)
  const startTime = process.hrtime.bigint();
  const prediction = predictBillFromTelemetry({
    voltage: 230.0,
    current: 0.174,
    power: 40.0,
    energy: 0.05,
    hour: 20,
    dayOfWeek: 5,
    cycleDay: 15,
  });
  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  console.log(`✅ Inference executed in ${latencyMs.toFixed(3)} ms`);
  assert.ok(latencyMs < 10.0, 'Inference must execute in <10ms');
  assert.ok(prediction.predictedMonthlyKwh >= 6.0 && prediction.predictedMonthlyKwh <= 15.0,
    `Monthly kWh out of expected range for 40W bulb: ${prediction.predictedMonthlyKwh}`);
  assert.ok(prediction.predictedBimonthlyUnits >= 12.0 && prediction.predictedBimonthlyUnits <= 30.0,
    `Cycle units out of expected range: ${prediction.predictedBimonthlyUnits}`);
  assert.strictEqual(prediction.tangedco.subsidizedBill, 0.00, 'Predicted bulb bill must be Rs 0.00');

  console.log('Sample Prediction Output:', {
    monthlyKwh: prediction.predictedMonthlyKwh,
    bimonthlyUnits: prediction.predictedBimonthlyUnits,
    subsidizedBill: prediction.tangedco.subsidizedBill,
    unsubsidizedCost: prediction.tangedco.unsubsidizedCost,
    subsidySavings: prediction.tangedco.subsidySavings,
    inferenceMs: prediction.inferenceLatencyMs,
  });

  console.log('🎉 ALL TARIFF ENGINE & PREDICTION TESTS PASSED SUCCESSFULLY!');
}

runTests();
