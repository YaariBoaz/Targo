import { registerPlugin } from '@capacitor/core';

export interface TcpPluginInterface {
  listen(options: { port: number }): Promise<{ socketId: number }>;
  close(options: { socketId: number }): Promise<void>;
  addListener(event: 'connected', handler: (event: { socketId: number; remoteAddress: string }) => void): Promise<{ remove: () => void }>;
  addListener(event: 'receive', handler: (event: { socketId: number; data: string }) => void): Promise<{ remove: () => void }>;
}

export const TcpPlugin = registerPlugin<TcpPluginInterface>('TcpPlugin');
