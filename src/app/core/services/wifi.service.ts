import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UdpPlugin } from './udp-plugin';
import { BLEConnectionState, ShotData } from './ble.service';

@Injectable({
  providedIn: 'root',
})
export class WifiService {
  private ngZone = inject(NgZone);
  private connectionStateSubject = new BehaviorSubject<BLEConnectionState>(
    BLEConnectionState.DISCONNECTED
  );
  public connectionState$: Observable<BLEConnectionState> =
    this.connectionStateSubject.asObservable();

  private shotDataSubject = new Subject<ShotData>();
  public shotData$: Observable<ShotData> = this.shotDataSubject.asObservable();

  private errorSubject = new Subject<string>();
  public error$: Observable<string> = this.errorSubject.asObservable();

  private socketId: number | null = null;
  private receiveListener: { remove: () => void } | null = null;
  private receiveErrorListener: { remove: () => void } | null = null;
  private keepaliveInterval: any = null;
  private targetHost: string | null = null;
  private targetPort: number | null = null;

  private readonly KEEPALIVE_INTERVAL_MS = 8_000;
  private webviewKeepAlive: any = null;

  isConnected(): boolean {
    return this.connectionStateSubject.value === BLEConnectionState.CONNECTED;
  }

  /** Bind to a UDP port and listen for incoming shot packets (broadcast — no target IP needed). */
  async listen(port: number): Promise<void> {
    await this.teardown();
    try {
      this.connectionStateSubject.next(BLEConnectionState.CONNECTING);

      const { socketId } = await UdpPlugin.create();
      this.socketId = socketId;

      await UdpPlugin.bind({ socketId, port });

      this.receiveListener = await UdpPlugin.addListener('receive', (event) => {
        this.ngZone.run(() => {
          try {
            const message = atob(event.buffer.trim());
            console.log('[WifiService] Received UDP:', message);
            this.doGatewayLogic(message);
          } catch (e) {
            console.error('[WifiService] Failed to decode buffer:', event.buffer, e);
          }
        });
      });

      this.receiveErrorListener = await UdpPlugin.addListener('receiveError', (event) => {
        console.error('[WifiService] UDP error:', event.message);
      });

      this.connectionStateSubject.next(BLEConnectionState.CONNECTED);
      console.log(`[WifiService] Listening on UDP port ${port}`);
    } catch (error: any) {
      console.error('[WifiService] Listen failed:', error);
      this.errorSubject.next(error?.message ?? 'WiFi listen failed');
      this.connectionStateSubject.next(BLEConnectionState.ERROR);
      throw error;
    }
  }

  async connect(host: string, port: number): Promise<void> {
    await this.teardown();
    try {
      this.connectionStateSubject.next(BLEConnectionState.CONNECTING);

      const { socketId } = await UdpPlugin.create();
      this.socketId = socketId;

      await UdpPlugin.bind({ socketId, port });

      this.receiveListener = await UdpPlugin.addListener('receive', (event) => {
        this.ngZone.run(() => {
          try {
            const message = atob(event.buffer.trim());
            console.log('[WifiService] Received UDP:', message);
            this.doGatewayLogic(message);
          } catch (e) {
            console.error('[WifiService] Failed to decode buffer:', event.buffer, e);
          }
        });
      });

      this.receiveErrorListener = await UdpPlugin.addListener('receiveError', (event) => {
        console.error('[WifiService] UDP error:', event.message);
      });

      // Send probe so target knows our address
      this.targetHost = host;
      this.targetPort = port;
      const probe = btoa('ka,probe,x,x');
      await UdpPlugin.send({ socketId, address: host, port, buffer: probe });
      this.startKeepalive();

      this.connectionStateSubject.next(BLEConnectionState.CONNECTED);
      console.log(`[WifiService] Listening on port ${port}, probe sent to ${host}:${port}`);
    } catch (error: any) {
      console.error('[WifiService] Connection failed:', error);
      this.errorSubject.next(error?.message ?? 'WiFi connection failed');
      this.connectionStateSubject.next(BLEConnectionState.ERROR);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.teardown();
    this.connectionStateSubject.next(BLEConnectionState.DISCONNECTED);
  }

  private async teardown(): Promise<void> {
    this.stopKeepalive();
    this.receiveListener?.remove();
    this.receiveListener = null;
    this.receiveErrorListener?.remove();
    this.receiveErrorListener = null;
    if (this.socketId !== null) {
      try {
        await UdpPlugin.close({ socketId: this.socketId });
      } catch (error) {
        console.error('[WifiService] Error closing socket:', error);
      }
      this.socketId = null;
    }
    this.targetHost = null;
    this.targetPort = null;
  }

  private startKeepalive(): void {
    this.stopKeepalive();
    // Prevent Android WebView intensive throttling by keeping JS event loop active
    this.webviewKeepAlive = setInterval(() => { /* prevent WebView throttle */ }, 500);
    this.keepaliveInterval = setInterval(async () => {
      if (this.socketId === null || !this.targetHost || !this.targetPort) return;
      try {
        const probe = btoa('ka,probe,x,x');
        await UdpPlugin.send({ socketId: this.socketId, address: this.targetHost, port: this.targetPort, buffer: probe });
        console.log('[WifiService] Keepalive sent');
      } catch (e) {
        console.error('[WifiService] Keepalive send failed:', e);
      }
    }, this.KEEPALIVE_INTERVAL_MS);
  }

  private stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
    if (this.webviewKeepAlive) {
      clearInterval(this.webviewKeepAlive);
      this.webviewKeepAlive = null;
    }
  }

  private doGatewayLogic(message: string): void {
    if (message.includes('ka')) return;
    this.processData(message);
  }

  private processData(input: string): void {
    console.log('[WifiService] ProcessData =>', input);
    const dataArray = input.split(',');
    if (dataArray.length >= 3) {
      this.handleShotMessage(dataArray);
    } else {
      console.warn(`[WifiService] Invalid data: ${input}`);
    }
  }

  private handleShotMessage(dataArray: string[]): void {
    const xCoord = parseFloat(dataArray[0]) || 0;
    const yCoord = parseFloat(dataArray[1]) || 0;

    if (xCoord < 0 || xCoord > 1 || yCoord < 0 || yCoord > 1) {
      console.warn('[WifiService] Invalid coordinates:', xCoord, yCoord);
      return;
    }

    const targetId = dataArray.length > 2 ? dataArray[2] : '3';
    const shotData: ShotData = { x: xCoord, y: yCoord, targetId, timestamp: new Date() };
    this.shotDataSubject.next(shotData);
  }
}
