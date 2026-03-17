import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BLEService, BLEConnectionState, ShotData } from './ble.service';
import { WifiService } from './wifi.service';
import { BleDevice } from '@capacitor-community/bluetooth-le';
import { FEATURE_FLAGS } from '@core/feature-flags';

/**
 * DeviceService — transport facade.
 *
 * Delegates to WifiService or BLEService based on FEATURE_FLAGS.useWifiConnection.
 * Consuming components (DrillShootingPage, BleConnectionPage) inject this service
 * instead of BLEService directly, so transport can be swapped via a single flag.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private bleService = inject(BLEService);
  private wifiService = inject(WifiService);

  private get active(): BLEService | WifiService {
    return FEATURE_FLAGS.useWifiConnection ? this.wifiService : this.bleService;
  }

  get connectionState$(): Observable<BLEConnectionState> {
    return this.active.connectionState$;
  }

  get shotData$(): Observable<ShotData> {
    return this.active.shotData$;
  }

  get error$(): Observable<string> {
    return this.active.error$;
  }

  isConnected(): boolean {
    return this.active.isConnected();
  }

  /**
   * Connect to a target device.
   * - WiFi mode: pass host (string) and port (number)
   * - BLE mode:  pass a BleDevice object
   */
  async connect(hostOrDevice: string | BleDevice, port?: number): Promise<void> {
    if (FEATURE_FLAGS.useWifiConnection) {
      await this.wifiService.connect(hostOrDevice as string, port ?? 23456);
    } else {
      await this.bleService.connect(hostOrDevice as BleDevice);
    }
  }

  async disconnect(): Promise<void> {
    await this.active.disconnect();
  }

  // ── BLE-only pass-throughs (used by BleConnectionPage in BLE mode) ──────────

  get bleOnly(): BLEService {
    return this.bleService;
  }
}
