/**
 * WattWise AI - Tamil Nadu TANGEDCO Domestic Tariff Engine
 * Implements official LT Tariff 1A (Domestic) bi-monthly billing slabs,
 * 100 Free Units Government Subsidy Scheme, and detailed cost breakdown.
 */

const TANGEDCO_DOMESTIC_SLABS = [
  { min: 0, max: 100, rate: 0.00, label: '0 - 100 units (100% Free Scheme)', free: true },
  { min: 101, max: 200, rate: 2.35, label: '101 - 200 units (Subsidized Tier)' },
  { min: 201, max: 400, rate: 4.70, label: '201 - 400 units (Standard Tier)' },
  { min: 401, max: 500, rate: 6.30, label: '401 - 500 units (Upper Tier)' },
  { min: 501, max: 600, rate: 8.40, label: '501 - 600 units (High Tier)' },
  { min: 601, max: 800, rate: 9.45, label: '601 - 800 units' },
  { min: 801, max: 1000, rate: 10.50, label: '801 - 1000 units' },
  { min: 1001, max: Infinity, rate: 11.55, label: 'Above 1000 units' },
];

// Average base electricity generation and delivery cost in Tamil Nadu
const BASE_UNSUBSIDIZED_RATE_PER_UNIT = 4.70;

/**
 * Calculates official TANGEDCO LT-1A domestic electricity bill
 * @param {number} bimonthlyUnits - Total energy units consumed over standard 60-day billing cycle
 * @returns {object} Full billing breakdown, subsidy savings, and slab details
 */
function calculateTangedcoBill(bimonthlyUnits) {
  const units = Math.max(0.0, parseFloat(bimonthlyUnits) || 0.0);
  const monthlyUnits = parseFloat((units / 2.0).toFixed(2));

  let remaining = units;
  let subsidizedBill = 0.0;
  const slabBreakdown = [];

  // Slab 1: 0 - 100 Units (Free)
  const slab1Units = Math.min(remaining, 100.0);
  if (slab1Units > 0) {
    slabBreakdown.push({
      slab: '0 - 100 units',
      units: parseFloat(slab1Units.toFixed(2)),
      rate: 0.00,
      cost: 0.00,
      note: 'TN Govt 100 Units Free Subsidy',
    });
    remaining -= slab1Units;
  }

  // Slab 2: 101 - 200 Units (@ Rs 2.35)
  if (remaining > 0) {
    const slab2Units = Math.min(remaining, 100.0);
    const cost = slab2Units * 2.35;
    subsidizedBill += cost;
    slabBreakdown.push({
      slab: '101 - 200 units',
      units: parseFloat(slab2Units.toFixed(2)),
      rate: 2.35,
      cost: parseFloat(cost.toFixed(2)),
    });
    remaining -= slab2Units;
  }

  // Slab 3: 201 - 400 Units (@ Rs 4.70)
  if (remaining > 0) {
    const slab3Units = Math.min(remaining, 200.0);
    const cost = slab3Units * 4.70;
    subsidizedBill += cost;
    slabBreakdown.push({
      slab: '201 - 400 units',
      units: parseFloat(slab3Units.toFixed(2)),
      rate: 4.70,
      cost: parseFloat(cost.toFixed(2)),
    });
    remaining -= slab3Units;
  }

  // Slab 4: 401 - 500 Units (@ Rs 6.30)
  if (remaining > 0) {
    const slab4Units = Math.min(remaining, 100.0);
    const cost = slab4Units * 6.30;
    subsidizedBill += cost;
    slabBreakdown.push({
      slab: '401 - 500 units',
      units: parseFloat(slab4Units.toFixed(2)),
      rate: 6.30,
      cost: parseFloat(cost.toFixed(2)),
    });
    remaining -= slab4Units;
  }

  // Slab 5: 501 - 600 Units (@ Rs 8.40)
  if (remaining > 0) {
    const slab5Units = Math.min(remaining, 100.0);
    const cost = slab5Units * 8.40;
    subsidizedBill += cost;
    slabBreakdown.push({
      slab: '501 - 600 units',
      units: parseFloat(slab5Units.toFixed(2)),
      rate: 8.40,
      cost: parseFloat(cost.toFixed(2)),
    });
    remaining -= slab5Units;
  }

  // Slab 6+: Above 600 Units
  if (remaining > 0) {
    const cost = remaining * 9.45;
    subsidizedBill += cost;
    slabBreakdown.push({
      slab: 'Above 600 units',
      units: parseFloat(remaining.toFixed(2)),
      rate: 9.45,
      cost: parseFloat(cost.toFixed(2)),
    });
    remaining = 0;
  }

  // Fixed charges: Rs 0 for <=100 units, tiered thereafter
  let fixedCharges = 0.0;
  if (units > 100.0 && units <= 500.0) {
    fixedCharges = 20.0;
  } else if (units > 500.0) {
    fixedCharges = 50.0;
  }

  const finalSubsidizedBill = parseFloat((subsidizedBill + fixedCharges).toFixed(2));
  const unsubsidizedCost = parseFloat((units * BASE_UNSUBSIDIZED_RATE_PER_UNIT).toFixed(2));
  const subsidySavings = parseFloat(Math.max(0.0, unsubsidizedCost - finalSubsidizedBill).toFixed(2));
  const isFreeTier = units <= 100.0;

  return {
    bimonthlyUnits: parseFloat(units.toFixed(2)),
    monthlyUnits,
    subsidizedBill: finalSubsidizedBill,
    unsubsidizedCost,
    subsidySavings,
    fixedCharges,
    isFreeTier,
    freeAllowanceUnits: 100,
    remainingFreeUnits: Math.max(0.0, parseFloat((100.0 - units).toFixed(2))),
    percentOfFreeTierUsed: parseFloat(Math.min(100.0, (units / 100.0) * 100.0).toFixed(1)),
    tariffScheme: 'TANGEDCO LT-1A Domestic (Tamil Nadu)',
    slabBreakdown,
  };
}

module.exports = {
  calculateTangedcoBill,
  TANGEDCO_DOMESTIC_SLABS,
  BASE_UNSUBSIDIZED_RATE_PER_UNIT,
};
