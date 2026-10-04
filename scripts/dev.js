/**
 * WattWise AI - Dual Process Runner
 * Starts both the Express Backend API and Expo Frontend concurrently.
 * 0 dependencies - compatible with Node.js v18 through v24+.
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const targetArg = process.argv[2] || '';
const isWindows = process.platform === 'win32';

const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

// Detect active local IPv4 address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const envPath = path.join(__dirname, '../.env');

// Automatically sync EXPO_PUBLIC_BACKEND_URL in .env if on a local network
if (fs.existsSync(envPath) && localIp !== 'localhost') {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    const newBackendUrl = `EXPO_PUBLIC_BACKEND_URL=http://${localIp}:5000`;
    if (envContent.includes('EXPO_PUBLIC_BACKEND_URL=')) {
      envContent = envContent.replace(/EXPO_PUBLIC_BACKEND_URL=http:\/\/[^\s\n\r]+/g, newBackendUrl);
    } else {
      envContent += `\n${newBackendUrl}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (e) {}
}

console.log(`${green}=========================================${reset}`);
console.log(`${green} 🚀 Starting WattWise AI (Backend + Expo)${reset}`);
console.log(`${green}=========================================${reset}`);
console.log(`${cyan}📡 Network IP detected: ${localIp}${reset}`);
console.log(`${cyan}🌐 Backend API URL:    http://${localIp}:5000${reset}\n`);

// 1. Start Node.js Express Backend in watch mode
const serverDir = path.join(__dirname, '../server');
const serverProcess = spawn('node --watch index.js', {
  cwd: serverDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});

function prefixStream(stream, prefix, color) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`${color}${prefix}${reset} ${line}`);
      }
    }
  });
}

prefixStream(serverProcess.stdout, '[SERVER]', cyan);
prefixStream(serverProcess.stderr, '[SERVER ERR]', red);

serverProcess.on('error', (err) => {
  console.error(`${red}[SERVER FAILED]${reset} ${err.message}`);
});

// 2. Start Expo Frontend with full terminal interactivity (QR code, keyboard controls)
const expoCmd = `npx expo start ${targetArg}`.trim();
const expoProcess = spawn(expoCmd, {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
});

expoProcess.on('error', (err) => {
  console.error(`${red}[EXPO FAILED]${reset} ${err.message}`);
});

// Clean shutdown handler for Ctrl+C
let isShuttingDown = false;
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n\x1b[33m🛑 Shutting down WattWise AI services...\x1b[0m');

  try {
    if (isWindows) {
      if (serverProcess.pid) {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F'], { stdio: 'ignore' });
      }
      if (expoProcess.pid) {
        spawn('taskkill', ['/pid', String(expoProcess.pid), '/T', '/F'], { stdio: 'ignore' });
      }
    } else {
      serverProcess.kill('SIGTERM');
      expoProcess.kill('SIGTERM');
    }
  } catch (e) {}

  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
expoProcess.on('exit', () => cleanup());
serverProcess.on('exit', (code) => {
  if (!isShuttingDown && code !== 0) {
    console.log(`${red}[SERVER] Process exited unexpectedly with code ${code}.${reset}`);
  }
});
