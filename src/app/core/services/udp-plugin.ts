import { registerPlugin } from '@capacitor/core';

export interface UdpPluginInterface {
  create(): Promise<{ socketId: number }>;
  bind(options: { socketId: number; port: number }): Promise<void>;
  send(options: { socketId: number; address: string; port: number; buffer: string }): Promise<void>;
  close(options: { socketId: number }): Promise<void>;
  addListener(event: 'receive', handler: (event: { socketId: number; remoteAddress: string; remotePort: number; buffer: string }) => void): Promise<{ remove: () => void }>;
  addListener(event: 'receiveError', handler: (event: { message: string }) => void): Promise<{ remove: () => void }>;
}

export const UdpPlugin = registerPlugin<UdpPluginInterface>('UdpSocket');
