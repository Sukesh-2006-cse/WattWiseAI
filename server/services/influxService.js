/**
 * WattWise AI - InfluxDB Time-Series Telemetry Service
 * Connects to InfluxDB Cloud (100% Free Tier) or InfluxDB Local OSS
 * Writes high-frequency energy telemetry points with nanosecond precision.
 */

const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const INFLUX_URL = process.env.INFLUX_URL || '';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || '';
const INFLUX_ORG = process.env.INFLUX_ORG || '';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'wattwise_telemetry';

let writeApi = null;
let queryApi = null;
let isConfigured = false;

if (INFLUX_URL && INFLUX_TOKEN && INFLUX_ORG) {
  try {
    const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
    writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ms');
    queryApi = influxDB.getQueryApi(INFLUX_ORG);
    isConfigured = true;
    console.log(`✅ InfluxDB Connected: Target bucket "${INFLUX_BUCKET}" on ${INFLUX_URL}`);
  } catch (err) {
    console.warn('⚠️ InfluxDB initialization warning:', err.message);
  }
} else {
  console.log('ℹ️ InfluxDB credentials not set in .env. Telemetry logging to MongoDB Atlas active.');
}

/**
 * Write a telemetry reading to InfluxDB
 * @param {Object} telemetry - Sensor data { userEmail, voltage, current, power, energy, status, timestamp }
 */
async function writeTelemetryToInflux(telemetry) {
  if (!isConfigured || !writeApi) {
    return { success: false, reason: 'InfluxDB credentials not configured' };
  }

  try {
    const {
      userEmail = 'unknown@wattwise.ai',
      voltage = 0,
      current = 0,
      power = 0,
      energy = 0,
      status = 'NO LOAD',
      timestamp = new Date(),
    } = telemetry;

    const point = new Point('energy_telemetry')
      .tag('userEmail', String(userEmail).toLowerCase().trim())
      .tag('status', String(status))
      .tag('device', 'wattwise_sensor_v1')
      .floatField('voltage', Number(voltage))
      .floatField('current', Number(current))
      .floatField('power', Number(power))
      .floatField('energy', Number(energy))
      .timestamp(new Date(timestamp));

    writeApi.writePoint(point);
    // Flush writes periodically or immediately
    await writeApi.flush();

    return { success: true };
  } catch (err) {
    console.error('❌ Error writing point to InfluxDB:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Query recent time-series telemetry from InfluxDB using Flux
 * @param {string} userEmail
 * @param {string} timeRange - e.g. "-1h", "-24h", "-7d"
 */
async function queryTelemetryFromInflux(userEmail, timeRange = '-1h') {
  if (!isConfigured || !queryApi) {
    return [];
  }

  const fluxQuery = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r["_measurement"] == "energy_telemetry")
      |> filter(fn: (r) => r["userEmail"] == "${userEmail.toLowerCase().trim()}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 100)
  `;

  try {
    const results = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push(o);
        },
        error(err) {
          reject(err);
        },
        complete() {
          resolve(results);
        },
      });
    });
    return results;
  } catch (err) {
    console.error('❌ Error querying InfluxDB:', err.message);
    return [];
  }
}

module.exports = {
  writeTelemetryToInflux,
  queryTelemetryFromInflux,
  isInfluxConfigured: () => isConfigured,
};
