const nodemailer = require('nodemailer');

// State tracking per user to prevent spamming duplicate emails on every periodic polling cycle
const userLoadState = new Map();

/**
 * Creates Nodemailer Transporter
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback to jsonTransport / console logger if SMTP credentials not fully set
  console.log('ℹ️ SMTP credentials not fully configured in .env. Using fallback transport for email notifications.');
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

const transporter = createTransporter();

/**
 * HTML Email Template Generator
 */
function generateEmailContent(eventType, userEmail, userName, telemetryData) {
  const { voltage, current, power, energy } = telemetryData;
  const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  let title = '⚡ WattWise AI Load Alert';
  let badgeColor = '#3B82F6';
  let statusText = 'Load Status Update';
  let messageBody = '';

  switch (eventType) {
    case 'LOAD_ACTIVE':
      title = '🟢 Load Activated Alert';
      badgeColor = '#10B981';
      statusText = 'Load Active';
      messageBody = `An electrical load has been activated on your monitored line.`;
      break;

    case 'MORE_LOAD_DETECTED':
      title = '⚠️ High / Increased Load Warning';
      badgeColor = '#F59E0B';
      statusText = 'More Load Detected';
      messageBody = `Increased electrical load has been detected! Current consumption has spiked to <strong>${current.toFixed(2)} A</strong>.`;
      break;

    case 'LOAD_DEACTIVATED':
      title = '🔌 Load Deactivated Alert';
      badgeColor = '#6B7280';
      statusText = 'Load Deactivated';
      messageBody = `The electrical load on your line has been turned off / deactivated.`;
      break;

    default:
      title = '⚡ WattWise Telemetry Update';
      messageBody = `Updated telemetry values received from your device.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0F172A; color: #E2E8F0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; padding: 30px; border: 1px solid #334155; }
        .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #38BDF8; font-size: 24px; margin: 0; }
        .badge { display: inline-block; padding: 6px 14px; background-color: ${badgeColor}; color: #FFFFFF; font-weight: bold; border-radius: 20px; font-size: 14px; margin-top: 10px; }
        .content { font-size: 16px; line-height: 1.6; color: #CBD5E1; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; background: #0F172A; padding: 20px; border-radius: 8px; border: 1px solid #334155; }
        .metric-card { text-align: center; }
        .metric-label { font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
        .metric-val { font-size: 20px; font-weight: bold; color: #38BDF8; margin-top: 4px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #334155; font-size: 12px; color: #64748B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ WattWise AI</h1>
          <div class="badge">${statusText}</div>
        </div>
        <div class="content">
          <p>Hello <strong>${userName || 'User'}</strong>,</p>
          <p>${messageBody}</p>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Voltage</div>
              <div class="metric-val">${voltage.toFixed(1)} V</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Current</div>
              <div class="metric-val">${current.toFixed(2)} A</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Power</div>
              <div class="metric-val">${power.toFixed(1)} W</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Energy</div>
              <div class="metric-val">${energy.toFixed(3)} kWh</div>
            </div>
          </div>
          <p style="font-size: 13px; color: #94A3B8;">Event Recorded at: <strong>${timeStr}</strong></p>
        </div>
        <div class="footer">
          WattWise AI Smart Energy Monitoring System • Registered to ${userEmail}
        </div>
      </div>
    </body>
    </html>
  `;

  return { title, html };
}

/**
 * Evaluates telemetry changes and sends alert emails on transitions
 */
async function processLoadStateAndSendEmail(userEmail, userName, telemetryData) {
  const { current } = telemetryData;
  const previousState = userLoadState.get(userEmail) || { current: 0, status: 'IDLE' };

  let eventToTrigger = null;

  // 1. Load Activation: Previous current <= 0.05 A and new current > 0.05 A
  if (previousState.current <= 0.05 && current > 0.05) {
    eventToTrigger = 'LOAD_ACTIVE';
  }
  // 2. More Load Detected: Current jumps by >= 0.4 A or crosses 1.5 A threshold
  else if (current > 0.1 && (current - previousState.current >= 0.4 || (current >= 1.5 && previousState.current < 1.5))) {
    eventToTrigger = 'MORE_LOAD_DETECTED';
  }
  // 3. Load Deactivated: Previous current > 0.05 A and new current <= 0.05 A
  else if (previousState.current > 0.05 && current <= 0.05) {
    eventToTrigger = 'LOAD_DEACTIVATED';
  }

  // Update saved state
  userLoadState.set(userEmail, { current, status: telemetryData.status, lastUpdated: new Date() });

  if (!eventToTrigger) {
    return { status: 'NO_EVENT', message: 'No load transition detected.' };
  }

  const { title, html } = generateEmailContent(eventToTrigger, userEmail, userName, telemetryData);

  try {
    const fromAddress = process.env.SMTP_FROM || 'WattWise AI Alerts <no-reply@wattwise.ai>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to: userEmail,
      subject: title,
      html,
    });

    console.log(`✉️ [${eventToTrigger}] Email sent to ${userEmail}. Message ID: ${info.messageId || 'json-transporter-log'}`);
    return { status: 'SENT', eventType: eventToTrigger, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Error sending alert email to ${userEmail}:`, err.message);
    return { status: 'ERROR', error: err.message };
  }
}

/**
 * Test email direct sender function
 */
async function sendTestEmail(userEmail, userName) {
  const dummyTelemetry = { voltage: 230.5, current: 1.85, power: 426.6, energy: 1.25, status: 'TEST LOAD' };
  const { title, html } = generateEmailContent('MORE_LOAD_DETECTED', userEmail, userName, dummyTelemetry);

  const fromAddress = process.env.SMTP_FROM || 'WattWise AI Alerts <no-reply@wattwise.ai>';
  return await transporter.sendMail({
    from: fromAddress,
    to: userEmail,
    subject: `[TEST] ${title}`,
    html,
  });
}

module.exports = {
  processLoadStateAndSendEmail,
  sendTestEmail,
};
