"""
Test dataset generation integrity for Tamil Nadu 40W single bulb simulation.
"""
import os
import sys
import numpy as np

DATASET_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'models', 'ml', 'tn_bulb_dataset.csv')

def test_dataset():
    if not os.path.exists(DATASET_PATH):
        print(f"FAIL: Dataset file does not exist at {DATASET_PATH}")
        sys.exit(1)

    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        header = f.readline().strip().split(',')
        lines = [line.strip().split(',') for line in f if line.strip()]

    print(f"Total records in dataset: {len(lines)}")
    assert len(lines) >= 50000, f"Expected at least 50000 records, got {len(lines)}"

    expected_cols = [
        'timestamp', 'voltage', 'current', 'power', 'energy_accumulated_kwh',
        'hour_of_day', 'day_of_week', 'billing_cycle_day',
        'actual_monthly_kwh', 'actual_bimonthly_units',
        'tangedco_subsidized_bill', 'tangedco_unsubsidized_bill'
    ]
    for col in expected_cols:
        assert col in header, f"Missing column {col} in dataset header"

    voltages = [float(row[1]) for row in lines]
    currents = [float(row[2]) for row in lines]
    powers = [float(row[3]) for row in lines]

    # Tamil Nadu Grid Voltage checks (typically 210V - 245V)
    min_v, max_v, avg_v = min(voltages), max(voltages), np.mean(voltages)
    print(f"Voltage stats: min={min_v:.1f}V, max={max_v:.1f}V, avg={avg_v:.1f}V")
    assert 205.0 <= min_v and max_v <= 250.0, "Voltage out of realistic Tamil Nadu grid bounds"
    assert 225.0 <= avg_v <= 235.0, "Average voltage should be near nominal 230V"

    # Current checks for 40W bulb
    # When active: ~0.16A to 0.185A. When OFF: 0.0A
    active_currents = [c for c in currents if c > 0.05]
    print(f"Active samples: {len(active_currents)} / {len(currents)} ({len(active_currents)/len(currents)*100:.1f}%)")
    assert len(active_currents) > 5000, "Too few active lighting samples"
    avg_active_i = np.mean(active_currents)
    print(f"Average active current: {avg_active_i:.4f}A")
    assert 0.15 <= avg_active_i <= 0.19, f"Active current for 40W bulb should be ~0.17A, got {avg_active_i}"

    # Power checks
    active_powers = [p for p in powers if p > 5.0]
    avg_active_p = np.mean(active_powers)
    print(f"Average active power: {avg_active_p:.2f}W")
    assert 35.0 <= avg_active_p <= 45.0, f"Active power should be near 40W, got {avg_active_p}"

    print("SUCCESS: All dataset integrity tests passed!")

if __name__ == '__main__':
    test_dataset()
