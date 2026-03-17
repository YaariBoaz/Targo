/**
 * WiFi UDP target configuration.
 * Change these values to match your ADL target's network settings.
 */
export const WIFI_CONFIG = {
  /** IP address of the ADL target device on its WiFi network */
  targetIp: '192.168.4.1',

  /** UDP port the ADL target listens on */
  targetPort: 23456,

  /** Exact SSID of the network the ADL target is on.
   *  If the device is already connected to this network, the scanner
   *  is skipped and the app connects directly to the target. */
  targetSsid: 'Yaari',

  /** SSID prefix used to visually highlight matching networks in the scanner */
  targetSsidPrefix: 'ADL',
} as const;
