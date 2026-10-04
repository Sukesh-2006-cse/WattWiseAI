/**
 * Integration test for prediction API endpoints against Express server
 */

const assert = require('assert');
const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testEndpoints() {
  console.log('Testing Prediction API Endpoints on:', BASE_URL);

  // 1. Test GET /api/prediction/tariff
  const tariffRes = await makeRequest('GET', '/api/prediction/tariff');
  assert.strictEqual(tariffRes.status, 200, `Tariff endpoint returned ${tariffRes.status}`);
  assert.strictEqual(tariffRes.body.success, true);
  assert.ok(Array.isArray(tariffRes.body.slabs), 'Tariff slabs array must be returned');
  console.log('✅ GET /api/prediction/tariff passed. Total slabs:', tariffRes.body.slabs.length);

  // 2. Test POST /api/prediction/simulate
  const simRes = await makeRequest('POST', '/api/prediction/simulate', {
    hoursPerDay: 8,
    wattage: 40,
    daysInCycle: 60,
  });
  assert.strictEqual(simRes.status, 200);
  assert.strictEqual(simRes.body.success, true);
  assert.strictEqual(simRes.body.simulation.hoursPerDay, 8);
  assert.strictEqual(simRes.body.simulation.wattage, 40);
  assert.strictEqual(simRes.body.simulation.tangedco.subsidizedBill, 0.00, '40W @ 8h/day must be Rs 0.00');
  console.log('✅ POST /api/prediction/simulate passed. Projected bimonthly units:', simRes.body.simulation.projectedBimonthlyUnits);

  // 3. Test GET /api/prediction/bill?email=test@example.com
  const billRes = await makeRequest('GET', '/api/prediction/bill?email=test@example.com');
  assert.strictEqual(billRes.status, 200);
  assert.strictEqual(billRes.body.success, true);
  assert.ok(billRes.body.predictedMonthlyKwh > 0);
  assert.ok(billRes.body.tangedco !== undefined);
  assert.strictEqual(billRes.body.tangedco.isFreeTier, true);
  console.log('✅ GET /api/prediction/bill passed. Inference latency:', billRes.body.inferenceLatencyMs, 'ms');

  console.log('🎉 ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!');
}

testEndpoints().catch((err) => {
  console.error('❌ API Endpoint Test Failed:', err.message);
  process.exit(1);
});
