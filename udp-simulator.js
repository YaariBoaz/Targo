/**
 * ADL Target UDP Simulator
 * Run with: node udp-simulator.js
 *
 * Listens on 0.0.0.0:23456 for packets from the Targo app.
 * When it receives a keep-alive probe it:
 *   1. Logs the incoming packet
 *   2. Sends keep-alive replies back to the app
 *   3. After a short delay, streams simulated shot data
 *
 * Usage:
 *   1. adb reverse tcp:23456 tcp:23456   (one-time per adb session)
 *   2. node udp-simulator.js
 *   3. Open app → BLE Connection page → enter 127.0.0.1 / 23456 → Connect
 */

const dgram = require('dgram');

const LOCAL_PORT = 23456;
const TARGET_ID = '3';

// Optional: set PHONE_IP to proactively send without waiting for a probe
// e.g. node udp-simulator.js 192.168.1.50
const PHONE_IP = process.argv[2] || null;
const PHONE_PORT = 23456;

const server = dgram.createSocket('udp4');

// Track the app's address so we can send back to it
let appAddress = null;
let appPort = null;
let shotInterval = null;

server.on('message', (msg, rinfo) => {
  const text = msg.toString();
  console.log(`[IN]  ${rinfo.address}:${rinfo.port} → "${text}"`);

  // Remember where the app is
  if (appAddress !== rinfo.address || appPort !== rinfo.port) {
    appAddress = rinfo.address;
    appPort = rinfo.port;
    console.log(`[SIM] App registered at ${appAddress}:${appPort}`);

    // Start sending keep-alive every 2 seconds
    setInterval(() => {
      send(`ka,${TARGET_ID},x,x`);
    }, 2000);

    // Send first shot after 2 seconds, then every 1.5s
    setTimeout(() => {
      if (!shotInterval) {
        shotInterval = setInterval(sendRandomShot, 1500);
      }
    }, 2000);
  }
});

server.on('listening', () => {
  const { address, port } = server.address();
  console.log(`[SIM] UDP simulator listening on ${address}:${port}`);
  if (PHONE_IP) {
    appAddress = PHONE_IP;
    appPort = PHONE_PORT;
    console.log(`[SIM] Proactively sending to ${PHONE_IP}:${PHONE_PORT}`);
    setInterval(() => send(`ka,${TARGET_ID},x,x`), 2000);
    setTimeout(() => { shotInterval = setInterval(sendRandomShot, 1500); }, 2000);
  } else {
    console.log(`[SIM] Waiting for probe from app...`);
    console.log(`[SIM] Usage: node udp-simulator.js <PHONE_IP>  (to send without waiting for probe)`);
  }
});

server.on('error', (err) => {
  console.error(`[SIM] Server error: ${err.message}`);
  server.close();
});

server.bind(LOCAL_PORT);

function send(message) {
  if (!appAddress) return;
  const buf = Buffer.from(message);
  server.send(buf, appPort, appAddress, (err) => {
    if (err) {
      console.error(`[OUT] Send error: ${err.message}`);
    } else {
      console.log(`[OUT] → "${message}"`);
    }
  });
}

function sendRandomShot() {
  // Random normalized coordinates in center cluster (0.3–0.7)
  const x = (Math.random() * 0.4 + 0.3).toFixed(4);
  const y = (Math.random() * 0.4 + 0.3).toFixed(4);
  const msg = `${x},${y},${TARGET_ID},0`;
  send(msg);
}
