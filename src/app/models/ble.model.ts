export interface BLEDevice {
  id: string;
  name: string;
  rssi?: number;
  connected: boolean;
}

export interface ShotData {
  x: number; // X coordinate on target
  y: number; // Y coordinate on target
  timestamp: number;
  score?: number; // Optional scoring
  sessionId: string;
}

export interface BLEConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  device?: BLEDevice;
  error?: string;
}
