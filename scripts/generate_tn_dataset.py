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
    
    # Start on Jan 1, 2026, 00:00:00 IST
    start_time = datetime.datetime(2026, 1, 1, 0, 0, 0)
    step_minutes = 10
    step_hours = step_minutes / 60.0
    
    # 40W Bulb at nominal 230V -> Resistance ~ 1322.5 Ohms
    R_bulb = 230.0 * 230.0 / 40.0

    print(f"Generating {num_steps} realistic Tamil Nadu 40W bulb telemetry rows...")

    data_rows = []
    
    # State tracking
    is_bulb_on = False
    bulb_minutes_on_today = 0
    current_day = 1
    session_energy_kwh = 0.0
    cycle_energy_kwh = 0.0

    # Weekly pattern factors
    for step in range(num_steps):
        dt = start_time + datetime.timedelta(minutes=step * step_minutes)
        hour = dt.hour + dt.minute / 60.0
        day_of_week = dt.weekday() # 0 = Monday, 6 = Sunday
        day_of_year = dt.timetuple().tm_yday
        billing_cycle_day = (day_of_year % 60) + 1 # 1 to 60 days bi-monthly

        # Reset daily counters at midnight
        if dt.hour == 0 and dt.minute == 0:
            bulb_minutes_on_today = 0

        # Reset bi-monthly cycle energy counter
        if billing_cycle_day == 1 and dt.hour == 0 and dt.minute == 0:
            cycle_energy_kwh = 0.0

        # --- 1. Realistic Tamil Nadu AC Grid Voltage ---
        # Base 230V, seasonal shift (hot summer Chennai/Madurai slightly lower ~226V, winter ~232V)
        seasonal_v_drift = 2.0 * math.sin(2 * math.pi * (day_of_year - 80) / 365.0)
        
        # Diurnal evening peak load droop (18:00 - 22:30 IST)
        evening_droop = 0.0
        if 18.0 <= hour <= 22.5:
            # Gaussian-like evening dip
            evening_droop = -5.5 * math.exp(-((hour - 20.0) ** 2) / 3.0)
        
        # Small random noise (fluctuation from neighborhood loads)
        grid_noise = random.gauss(0.0, 1.8)
        
        voltage = round(230.0 + seasonal_v_drift + evening_droop + grid_noise, 2)
        voltage = max(212.0, min(243.0, voltage))

        # --- 2. Bulb Activation Behavior (Diurnal Residential Lighting) ---
        # Probability of light being switched on depends on time of day
        # Morning: 05:30 to 07:30
        # Evening: 17:45 to 23:00 (Prime lighting hours)
        prob_on = 0.03 # Base standby / incidental
        if 5.5 <= hour <= 7.5:
            prob_on = 0.65
        elif 7.5 < hour < 17.75:
            prob_on = 0.08 if day_of_week >= 5 else 0.04 # More on weekends
        elif 17.75 <= hour <= 23.0:
            prob_on = 0.93 # Strong evening lighting
        elif 23.0 < hour <= 23.75:
            prob_on = 0.40 # Winding down

        # Add hysteresis (lights stay on once turned on)
        if is_bulb_on:
            # Chance of turning off
            prob_stay_on = 0.90 if (18.0 <= hour <= 22.5 or 5.5 <= hour <= 7.0) else 0.35
            is_bulb_on = random.random() < prob_stay_on
        else:
            is_bulb_on = random.random() < prob_on

        # --- 3. Electrical Sensor Readings ---
        if is_bulb_on:
            bulb_minutes_on_today += step_minutes
            # Thermal resistance coefficient for tungsten (slight variation)
            thermal_factor = 1.0 + 0.015 * math.sin(step * 0.1)
            # Current = V / (R * thermal)
            nominal_current = voltage / (R_bulb * thermal_factor)
            current = round(nominal_current + random.gauss(0.0, 0.003), 4)
            current = max(0.155, min(0.190, current))
            power = round(voltage * current, 2)
        else:
            current = 0.0000
            power = 0.00

        # Energy accumulation
        step_kwh = (power * step_hours) / 1000.0
        session_energy_kwh += step_kwh
        cycle_energy_kwh += step_kwh

        # Projected bi-monthly units based on average daily rate for this bulb
        # Single 40W bulb running avg 7.5 hours/day = 0.30 kWh/day = 18.0 kWh / 60 days
        daily_kwh_rate = max(0.08, (bulb_minutes_on_today / max(1, hour * 60)) * 24.0 * (40.0 / 1000.0))
        projected_monthly_kwh = round(daily_kwh_rate * 30.0, 3)
        projected_bimonthly_units = round(daily_kwh_rate * 60.0, 2)

        sub_bill, unsub_bill = calculate_tangedco_domestic_bill(projected_bimonthly_units)

        data_rows.append([
            dt.isoformat(),
            f"{voltage:.2f}",
            f"{current:.4f}",
            f"{power:.2f}",
            f"{session_energy_kwh:.5f}",
            f"{int(dt.hour)}",
            f"{int(day_of_week)}",
            f"{int(billing_cycle_day)}",
            f"{projected_monthly_kwh:.3f}",
            f"{projected_bimonthly_units:.2f}",
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

    print(f"Dataset successfully generated at: {output_path}")
    print(f"Total entries: {len(data_rows)} rows covering 1 year of 40W bulb telemetry.")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), '..', 'server', 'models', 'ml', 'tn_bulb_dataset.csv')
    generate_dataset(target)
