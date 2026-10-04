"""
Tamil Nadu 40W Single Electric Bulb Realistic Sensor Dataset Generator
Simulates 1 full year (52,560 records at 10-minute intervals) of AC voltage,
operating current, active power, and energy consumption mirroring real-world
grid conditions in Tamil Nadu and TANGEDCO LT-1A domestic tariff slabs.
"""

import os
import math
import random
import datetime
import numpy as np

def calculate_tangedco_domestic_bill(bimonthly_units):
    """
    Official TANGEDCO LT Tariff 1A (Domestic) bi-monthly slab calculation:
    - 0 to 100 units: Free (100% subsidized by Govt of Tamil Nadu)
    - 101 to 200 units: Rs 2.35 / unit
    - 201 to 400 units: Rs 4.70 / unit
    - 401 to 500 units: Rs 6.30 / unit
    - 501 to 600 units: Rs 8.40 / unit
    - Above 600 units: Rs 9.45 to 11.55 / unit
    """
    units = max(0.0, float(bimonthly_units))
    
    # 1. Subsidized Bill (Actual consumer payable amount)
    subsidized_bill = 0.0
    if units <= 100.0:
        subsidized_bill = 0.0
    elif units <= 200.0:
        subsidized_bill = (units - 100.0) * 2.35
    elif units <= 400.0:
        subsidized_bill = (100.0 * 2.35) + ((units - 200.0) * 4.70)
    elif units <= 500.0:
        subsidized_bill = (100.0 * 2.35) + (200.0 * 4.70) + ((units - 400.0) * 6.30)
    else:
        subsidized_bill = (100.0 * 2.35) + (200.0 * 4.70) + (100.0 * 6.30) + ((units - 500.0) * 8.40)

    # 2. Unsubsidized Bill (True cost without Tamil Nadu 100 free units scheme)
    # Base generation/distribution cost ~ Rs 4.70/unit
    unsubsidized_bill = units * 4.70

    return round(subsidized_bill, 2), round(unsubsidized_bill, 2)

def generate_dataset(output_path, num_steps=52560):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    start_time = datetime.datetime(2026, 1, 1, 0, 0, 0)
    step_minutes = 10
    step_hours = step_minutes / 60.0
    
    # 40W Bulb at nominal 230V -> R ~ 1322.5 Ohms
    R_bulb = 230.0 * 230.0 / 40.0

    print(f"Phase 1: Simulating {num_steps} intervals of Tamil Nadu grid & 40W bulb telemetry...")

    timestamps = []
    voltages = []
    currents = []
    powers = []
    energies_step = []
    hours_of_day = []
    days_of_week = []
    billing_cycle_days = []

    is_bulb_on = False

    for step in range(num_steps):
        dt = start_time + datetime.timedelta(minutes=step * step_minutes)
        hour = dt.hour + dt.minute / 60.0
        day_of_week = dt.weekday()
        day_of_year = dt.timetuple().tm_yday
        billing_cycle_day = (day_of_year % 60) + 1

        # 1. Realistic Tamil Nadu AC Grid Voltage
        seasonal_v_drift = 2.0 * math.sin(2 * math.pi * (day_of_year - 80) / 365.0)
        evening_droop = 0.0
        if 18.0 <= hour <= 22.5:
            evening_droop = -5.5 * math.exp(-((hour - 20.0) ** 2) / 3.0)
        grid_noise = random.gauss(0.0, 1.8)
        voltage = round(230.0 + seasonal_v_drift + evening_droop + grid_noise, 2)
        voltage = max(212.0, min(243.0, voltage))

        # 2. Bulb Activation Behavior
        prob_on = 0.03
        if 5.5 <= hour <= 7.5:
            prob_on = 0.65
        elif 7.5 < hour < 17.75:
            prob_on = 0.08 if day_of_week >= 5 else 0.04
        elif 17.75 <= hour <= 23.0:
            prob_on = 0.93
        elif 23.0 < hour <= 23.75:
            prob_on = 0.40

        if is_bulb_on:
            prob_stay_on = 0.90 if (18.0 <= hour <= 22.5 or 5.5 <= hour <= 7.0) else 0.35
            is_bulb_on = random.random() < prob_stay_on
        else:
            is_bulb_on = random.random() < prob_on

        # 3. Electrical Sensor Readings
        if is_bulb_on:
            thermal_factor = 1.0 + 0.015 * math.sin(step * 0.1)
            nominal_current = voltage / (R_bulb * thermal_factor)
            current = round(nominal_current + random.gauss(0.0, 0.003), 4)
            current = max(0.155, min(0.190, current))
            power = round(voltage * current, 2)
        else:
            current = 0.0000
            power = 0.00

        step_kwh = (power * step_hours) / 1000.0

        timestamps.append(dt.isoformat())
        voltages.append(voltage)
        currents.append(current)
        powers.append(power)
        energies_step.append(step_kwh)
        hours_of_day.append(int(dt.hour))
        days_of_week.append(int(day_of_week))
        billing_cycle_days.append(int(billing_cycle_day))

    print("Phase 2: Calculating rolling ground-truth 30-day and 60-day consumption...")
    # Rolling 30 days = 30 * 24 * 6 = 4320 steps
    # Rolling 60 days = 60 * 24 * 6 = 8640 steps
    window_30d = 30 * 24 * 6
    window_60d = 60 * 24 * 6

    energies_arr = np.array(energies_step)
    cumulative_energy = np.cumsum(energies_arr)

    # Rolling sum with circular wrap for full annual periodicity
    extended_energies = np.concatenate([energies_arr, energies_arr[:window_60d]])
    extended_cumsum = np.cumsum(extended_energies)

    rolling_30d = np.zeros(num_steps)
    rolling_60d = np.zeros(num_steps)

    for i in range(num_steps):
        rolling_30d[i] = extended_cumsum[i + window_30d] - extended_cumsum[i]
        rolling_60d[i] = extended_cumsum[i + window_60d] - extended_cumsum[i]

    print(f"Average Monthly kWh: {np.mean(rolling_30d):.2f} (Min: {np.min(rolling_30d):.2f}, Max: {np.max(rolling_30d):.2f})")
    print(f"Average Bi-monthly Units: {np.mean(rolling_60d):.2f} (Min: {np.min(rolling_60d):.2f}, Max: {np.max(rolling_60d):.2f})")

    # Build final rows
    data_rows = []
    for i in range(num_steps):
        monthly_kwh = round(float(rolling_30d[i]), 3)
        bimonthly_units = round(float(rolling_60d[i]), 2)
        sub_bill, unsub_bill = calculate_tangedco_domestic_bill(bimonthly_units)

        data_rows.append([
            timestamps[i],
            f"{voltages[i]:.2f}",
            f"{currents[i]:.4f}",
            f"{powers[i]:.2f}",
            f"{cumulative_energy[i]:.5f}",
            f"{hours_of_day[i]}",
            f"{days_of_week[i]}",
            f"{billing_cycle_days[i]}",
            f"{monthly_kwh:.3f}",
            f"{bimonthly_units:.2f}",
            f"{sub_bill:.2f}",
            f"{unsub_bill:.2f}"
        ])

    header = [
        'timestamp', 'voltage', 'current', 'power', 'energy_accumulated_kwh',
        'hour_of_day', 'day_of_week', 'billing_cycle_day',
        'actual_monthly_kwh', 'actual_bimonthly_units',
        'tangedco_subsidized_bill', 'tangedco_unsubsidized_bill'
    ]

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(','.join(header) + '\n')
        for row in data_rows:
            f.write(','.join(row) + '\n')

    print(f"SUCCESS: Realistic dataset saved to {output_path} ({len(data_rows)} rows)")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), '..', 'server', 'models', 'ml', 'tn_bulb_dataset.csv')
    generate_dataset(target)
