"""
Unit test for MLP Neural Network weight export and inference accuracy.
"""

import os
import sys
import json
import numpy as np

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'models', 'ml', 'bill_model_weights.json')
METADATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'models', 'ml', 'model_metadata.json')

def test_model_weights():
    if not os.path.exists(WEIGHTS_PATH):
        print(f"FAIL: Weights file does not exist at {WEIGHTS_PATH}")
        sys.exit(1)

    with open(WEIGHTS_PATH, 'r', encoding='utf-8') as f:
        model_data = json.load(f)

    # 1. Check architecture and shapes
    weights = model_data.get('weights', {})
    scaler = model_data.get('scaler', {})
    metrics = model_data.get('metrics', {})

    W1 = np.array(weights['W1'])
    b1 = np.array(weights['b1'])
    W2 = np.array(weights['W2'])
    b2 = np.array(weights['b2'])
    W3 = np.array(weights['W3'])
    b3 = np.array(weights['b3'])

    assert W1.shape == (7, 16), f"W1 shape mismatch: {W1.shape}"
    assert b1.shape == (16,), f"b1 shape mismatch: {b1.shape}"
    assert W2.shape == (16, 8), f"W2 shape mismatch: {W2.shape}"
    assert b2.shape == (8,), f"b2 shape mismatch: {b2.shape}"
    assert W3.shape == (8, 2), f"W3 shape mismatch: {W3.shape}"
    assert b3.shape == (2,), f"b3 shape mismatch: {b3.shape}"

    # 2. Check normalization scalers
    means = np.array(scaler['mean'])
    stds = np.array(scaler['std'])
    assert len(means) == 7, "Scaler mean must have 7 features"
    assert len(stds) == 7, "Scaler std must have 7 features"
    assert np.all(stds > 0), "Scaler std must be strictly positive"

    # 3. Check performance metrics
    r2_score = metrics.get('r2_score', 0)
    rmse = metrics.get('rmse', 999)
    print(f"Model validation metrics: R2 = {r2_score:.4f}, RMSE = {rmse:.4f}")
    assert r2_score >= 0.88, f"Expected R2 >= 0.88, got {r2_score}"

    # 4. Test forward pass with realistic single 40W bulb inputs
    # Features: [voltage, current, power, energy_acc, hour, day_of_week, cycle_day]
    # Bulb ON sample: 230V, 0.174A, 40W, 0.5 kWh, 20:00 (evening), Saturday (5), day 15
    sample_raw = np.array([230.0, 0.1739, 40.0, 0.5, 20.0, 5.0, 15.0])
    sample_norm = (sample_raw - means) / stds

    # Forward propagation
    h1 = np.maximum(0, np.dot(sample_norm, W1) + b1) # ReLU
    h2 = np.maximum(0, np.dot(h1, W2) + b2)           # ReLU
    out = np.dot(h2, W3) + b3                         # Linear

    pred_monthly_kwh = float(out[0])
    pred_cycle_units = float(out[1])

    print(f"Sample prediction: Monthly kWh = {pred_monthly_kwh:.2f}, Bi-monthly Units = {pred_cycle_units:.2f}")
    # Single 40W bulb running ~8h/day uses ~9.6 kWh/month (19.2 bi-monthly units)
    assert 5.0 <= pred_monthly_kwh <= 25.0, f"Predicted monthly kWh out of expected range for 40W bulb: {pred_monthly_kwh}"
    assert 10.0 <= pred_cycle_units <= 50.0, f"Predicted cycle units out of expected range: {pred_cycle_units}"

    print("SUCCESS: Model weights and forward pass validation passed!")

if __name__ == '__main__':
    test_model_weights()
