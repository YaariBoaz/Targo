/**
 * UDP Relay — forwards packets from the simulator to the Android phone.
 *
 * Usage:
 *   node udp-relay.js <PHONE_IP>
 *
 * Example:
 *   node udp-relay.js 192.168.4.2
 *
 * How it works:
 *   1. Binds to 127.0.0.1:23456 — receives packets from the C# simulator
 *   2. Forwards each packet to PHONE_IP:23456 over UDP
 *
 * Run the C# simulator (SIM_UDP.exe) alongside this script.
 * The phone must be reachable from this PC on port 23456.
 */

const dgram = require('dgram');

const PHONE_IP = process.argv[2];
const PHONE_PORT = 23456;
const LISTEN_PORT = 23456;

if (!PHONE_IP) {
  console.error('Usage: node udp-relay.js <PHONE_IP>');
  console.error('Example: node udp-relay.js 192.168.4.2');
  process.exit(1);
}

const receiver = dgram.createSocket('udp4');
const sender = dgram.createSocket('udp4');

receiver.on('message', (msg) => {
  const text = msg.toString().trim();
  console.log(`[RELAY] "${text}" → ${PHONE_IP}:${PHONE_PORT}`);
  sender.send(msg, PHONE_PORT, PHONE_IP, (err) => {
    if (err) console.error('[RELAY] Send error:', err.message);
  });
});

receiver.on('listening', () => {
  console.log(`[RELAY] Listening on 127.0.0.1:${LISTEN_PORT}`);
  console.log(`[RELAY] Forwarding to ${PHONE_IP}:${PHONE_PORT}`);
  console.log(`[RELAY] Now start SIM_UDP.exe`);
});

receiver.on('error', (err) => {
  console.error('[RELAY] Error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${LISTEN_PORT} is already in use. Stop the C# UdpClient and try again.`);
  }
  process.exit(1);
});

receiver.bind(LISTEN_PORT, '127.0.0.1');
