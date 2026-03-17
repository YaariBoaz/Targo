import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UdpPlugin } from './udp-plugin';
import { BLEConnectionState, ShotData } from './ble.service';

@Injectable({
  providedIn: 'root',
})
export class WifiService {
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

  isConnected(): boolean {
    return this.connectionStateSubject.value === BLEConnectionState.CONNECTED;
  }

  async connect(host: string, port: number): Promise<void> {
    try {
      this.connectionStateSubject.next(BLEConnectionState.CONNECTING);

      const { socketId } = await UdpPlugin.create();
      this.socketId = socketId;

      await UdpPlugin.bind({ socketId, port });

      this.receiveListener = await UdpPlugin.addListener('receive', (event) => {
        const message = atob(event.data);
        console.log('[WifiService] Received UDP:', message);
        this.doGatewayLogic(message);
      });

      await UdpPlugin.addListener('receiveError', (event) => {
        console.error('[WifiService] UDP error:', event.message);
      });

      // Send probe so target knows our address
      const probe = btoa('ka,probe,x,x');
      await UdpPlugin.send({ socketId, address: host, port, data: probe });

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
    if (this.socketId === null) return;
    try {
      this.receiveListener?.remove();
      this.receiveListener = null;
      await UdpPlugin.close({ socketId: this.socketId });
    } catch (error) {
      console.error('[WifiService] Error disconnecting:', error);
    } finally {
      this.socketId = null;
      this.connectionStateSubject.next(BLEConnectionState.DISCONNECTED);
    }
  }

  private doGatewayLogic(message: string): void {
    if (message.includes('ka')) return;
    this.processData(message);
  }

  private processData(input: string): void {
    console.log('[WifiService] ProcessData =>', input);
    const dataArray = input.split(',');
    if (dataArray.length === 4) {
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
