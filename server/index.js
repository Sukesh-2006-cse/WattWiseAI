const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// Configure DNS servers to resolve MongoDB Atlas SRV records smoothly on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Telemetry = require('./models/Telemetry');
const { processLoadStateAndSendEmail, sendTestEmail } = require('./services/emailService');
const {
  predictBillFromTelemetry,
  simulateBill,
  getModelMetadata,
} = require('./services/predictionService');
const {
  TANGEDCO_DOMESTIC_SLABS,
  BASE_UNSUBSIDIZED_RATE_PER_UNIT,
} = require('./services/tariffEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Default MongoDB URI supplied by user
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://sukesh_2006:zlly7wo1oaPULOyF@cluster0.lg2htpb.mongodb.net/wattwise?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas database!');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB Atlas database:', err.message);
  });

// --- API ENDPOINTS ---

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

/**
 * Register or Update User Account
 * POST /api/auth/register
 * Body: { name, email, mobile }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    if (!name || !email || !mobile) {
      return res.status(400).json({ error: 'Name, Email, and Mobile number are all required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists, update or create new
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.name = name.trim();
      user.mobile = mobile.trim();
      user.lastLogin = new Date();
      await user.save();
      console.log(`👤 Updated existing user account: ${user.email}`);
    } else {
      user = new User({
        name: name.trim(),
        email: cleanEmail,
        mobile: mobile.trim(),
        lastLogin: new Date(),
      });
      await user.save();
      console.log(`👤 Registered new user account: ${user.email}`);
    }

    res.status(200).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
});

/**
 * Login User by Email or Mobile
 * POST /api/auth/login
 * Body: { identifier } or { email }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, email } = req.body;
    const searchTarget = (identifier || email || '').toLowerCase().trim();

    if (!searchTarget) {
      return res.status(400).json({ error: 'Email or mobile number is required to log in.' });
    }

    const user = await User.findOne({
      $or: [{ email: searchTarget }, { mobile: searchTarget }],
    });

    if (!user) {
      return res.status(444 || 404).json({ error: 'User not found. Please register first.' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({ error: 'Server error during login', details: error.message });
  }
});

/**
 * Record Telemetry & Evaluate Load Events for Email Alert
 * POST /api/telemetry
 * Body: { userEmail, userName, voltage, current, power, energy, status }
 */
app.post('/api/telemetry', async (req, res) => {
  try {
    const { userEmail, userName, voltage, current, power, energy, status } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required to log telemetry.' });
    }

    const numVoltage = Number(voltage) || 0;
    const numCurrent = Number(current) || 0;
    const numPower = Number(power) || 0;
    const numEnergy = Number(energy) || 0;
    const cleanStatus = String(status || 'NO LOAD');

    // 1. Save Telemetry Log into MongoDB Atlas
    const telemetry = new Telemetry({
      userEmail: userEmail.toLowerCase().trim(),
      voltage: numVoltage,
      current: numCurrent,
      power: numPower,
      energy: numEnergy,
      status: cleanStatus,
      timestamp: new Date(),
    });
    await telemetry.save();

    // 2. Process load state transitions & send email if needed
    const emailResult = await processLoadStateAndSendEmail(
      userEmail.toLowerCase().trim(),
      userName,
      {
        voltage: numVoltage,
        current: numCurrent,
        power: numPower,
        energy: numEnergy,
        status: cleanStatus,
      }
    );

    res.status(201).json({
      message: 'Telemetry recorded successfully',
      telemetryId: telemetry._id,
      emailAlert: emailResult,
    });
  } catch (error) {
    console.error('Error in /api/telemetry:', error);
    res.status(500).json({ error: 'Failed to record telemetry', details: error.message });
  }
});

/**
 * Fetch Recent Telemetry History for Logged-In User
 * GET /api/telemetry/history?email=user@example.com&limit=20
 */
app.get('/api/telemetry/history', async (req, res) => {
  try {
    const email = (req.query.email || '').toString().toLowerCase().trim();
    const limit = parseInt(req.query.limit || '30', 10);

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const history = await Telemetry.find({ userEmail: email })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({ history });
  } catch (error) {
    console.error('Error fetching telemetry history:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry history' });
  }
});

/**
 * Test Email Endpoint
 * POST /api/alerts/test-email
 * Body: { email, name }
 */
app.post('/api/alerts/test-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const result = await sendTestEmail(email, name);
    res.json({ message: 'Test email processed', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * TANGEDCO Domestic Tariff Information Endpoint
 * GET /api/prediction/tariff
 */
app.get('/api/prediction/tariff', (req, res) => {
  res.json({
    success: true,
    region: 'Tamil Nadu, India',
    authority: 'TANGEDCO',
    scheme: 'LT Tariff 1A (Domestic)',
    billingCycle: 'Bi-monthly (60 Days)',
    freeSubsidyAllowanceUnits: 100,
    baseUnsubsidizedRate: BASE_UNSUBSIDIZED_RATE_PER_UNIT,
    slabs: TANGEDCO_DOMESTIC_SLABS,
  });
});

/**
 * Bill Simulation Endpoint
 * POST /api/prediction/simulate
 * Body: { hoursPerDay, wattage, daysInCycle }
 */
app.post('/api/prediction/simulate', (req, res) => {
  try {
    const { hoursPerDay, wattage, daysInCycle } = req.body || {};
    const simulation = simulateBill({
      hoursPerDay: hoursPerDay !== undefined ? parseFloat(hoursPerDay) : 8.0,
      wattage: wattage !== undefined ? parseFloat(wattage) : 40.0,
      daysInCycle: daysInCycle !== undefined ? parseInt(daysInCycle, 10) : 60,
    });
    res.json({
      success: true,
      simulation,
    });
  } catch (error) {
    console.error('Error in /api/prediction/simulate:', error);
    res.status(500).json({ error: 'Failed to simulate bill prediction', details: error.message });
  }
});

/**
 * Live Electricity Bill Prediction & ML Forecasting Endpoint
 * GET /api/prediction/bill?email=user@example.com
 */
app.get('/api/prediction/bill', async (req, res) => {
  try {
    const email = (req.query.email || '').toString().toLowerCase().trim();

    let latestTelemetry = null;
    if (email) {
      latestTelemetry = await Telemetry.findOne({ userEmail: email }).sort({ timestamp: -1 });
    }

    // Default telemetry if not yet logged in MongoDB Atlas (calibrated for 40W bulb)
    const telemetrySnapshot = latestTelemetry
      ? {
          voltage: latestTelemetry.voltage || 230.0,
          current: latestTelemetry.current || 0.0,
          power: latestTelemetry.power || 0.0,
          energy: latestTelemetry.energy || 0.0,
        }
      : {
          voltage: 230.0,
          current: 0.174,
          power: 40.0,
          energy: 0.05,
        };

    const prediction = predictBillFromTelemetry(telemetrySnapshot);

    res.json({
      success: true,
      userEmail: email || 'guest@wattwise.ai',
      dataSource: latestTelemetry ? 'MongoDB Atlas Live Telemetry' : 'Hardware Benchmark Default (40W Bulb)',
      ...prediction,
    });
  } catch (error) {
    console.error('Error in /api/prediction/bill:', error);
    res.status(500).json({ error: 'Prediction error', details: error.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WattWise AI Backend Server running on http://0.0.0.0:${PORT}`);
});
