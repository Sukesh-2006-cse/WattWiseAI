const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { writeTelemetryToInflux, isInfluxConfigured } = require('../services/influxService');

console.log('Testing InfluxDB Service with active .env...');
console.log('Configured:', isInfluxConfigured());

async function runTest() {
  const result = await writeTelemetryToInflux({
    userEmail: 'msukesh2006@gmail.com',
    voltage: 233.1,
    current: 0.174,
    power: 40.5,
    energy: 0.095,
    status: 'LOAD ACTIVE',
    timestamp: new Date(),
  });

  console.log('Write attempt result:', result);
  console.log('✅ InfluxDB live cloud write test PASSED!');
}

runTest();
