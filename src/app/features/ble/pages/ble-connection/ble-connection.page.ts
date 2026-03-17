import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonSpinner,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  bluetoothOutline,
  refreshOutline,
  chevronBackOutline,
  wifiOutline,
} from 'ionicons/icons';
import { BLEConnectionState } from '@core/services/ble.service';
import { DeviceService } from '@core/services/device.service';
import { BleDevice } from '@capacitor-community/bluetooth-le';
import { CapacitorWifi } from '@capgo/capacitor-wifi';
import { FEATURE_FLAGS } from '@core/feature-flags';
import { WIFI_CONFIG } from '@core/wifi.config';
import { Subscription } from 'rxjs';

export interface WifiNetwork {
  ssid: string;
  rssi: number;
  isTarget: boolean;
}

@Component({
  selector: 'app-ble-connection',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonSpinner, IonIcon],
  templateUrl: './ble-connection.page.html',
  styleUrls: ['./ble-connection.page.scss'],
})
export class BLEConnectionPage implements OnInit, OnDestroy {
  private deviceService = inject(DeviceService);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Subscriptions
  private connectionStateSubscription?: Subscription;
  private errorSubscription?: Subscription;

  // ── WiFi state ─────────────────────────────────────────────────────────────
  readonly isWifiMode = FEATURE_FLAGS.useWifiConnection;
  readonly wifiConfig = WIFI_CONFIG;

  wifiNetworks: WifiNetwork[] = [];
  isScanning = false;
  connectingSSID: string | null = null;

  // ── BLE state ──────────────────────────────────────────────────────────────
  isInitialized = false;
  connectingDeviceId: string | null = null;
  devices: BleDevice[] = [];
  hasImage = false;

  // Shared
  connectionState: BLEConnectionState = BLEConnectionState.DISCONNECTED;
  private returnUrl: string = '/tabs/training';

  constructor() {
    addIcons({
      'bluetooth-outline': bluetoothOutline,
      'refresh-outline': refreshOutline,
      'chevron-back-outline': chevronBackOutline,
      'wifi-outline': wifiOutline,
    });
  }

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) this.returnUrl = params['returnUrl'];
    });

    if (this.deviceService.isConnected()) {
      this.router.navigate(['/drill/prepare']);
      return;
    }

    this.subscribeToUpdates();

    if (this.isWifiMode) {
      await this.initWifi();
    } else {
      await this.initializeBLE();
      await this.scanForDevices();
    }
  }

  ngOnDestroy() {
    this.connectionStateSubscription?.unsubscribe();
    this.errorSubscription?.unsubscribe();
  }

  // ── WiFi ────────────────────────────────────────────────────────────────────

  /** Check current SSID — skip scanner if already on the target network. */
  private async initWifi() {
    try {
      await CapacitorWifi.requestPermissions();
      const { ssid } = await CapacitorWifi.getSsid();
      if (ssid === WIFI_CONFIG.targetSsid) {
        console.log(`[BleConnectionPage] Already on ${ssid}, connecting directly`);
        this.connectingSSID = ssid;
        await this.deviceService.connect(WIFI_CONFIG.targetIp, WIFI_CONFIG.targetPort);
        return; // navigation handled by connectionState$ subscription
      }
    } catch {
      // getSsid can fail if location permission not granted yet — fall through to scanner
    }
    await this.scanWifiNetworks();
  }

  async scanWifiNetworks() {
    this.isScanning = true;
    this.wifiNetworks = [];
    try {
      // Request location permission — required for WiFi scanning on Android 6+
      const status = await CapacitorWifi.requestPermissions();
      if (status.location === 'denied') {
        this.showError('Location permission is required to scan WiFi networks. Please grant it in Settings.');
        this.isScanning = false;
        return;
      }

      const { networks } = await CapacitorWifi.getAvailableNetworks();
      // Deduplicate by SSID and sort: target SSIDs first, then by signal strength
      const seen = new Set<string>();
      const parsed: WifiNetwork[] = [];
      for (const n of networks) {
        if (!n.ssid || seen.has(n.ssid)) continue;
        seen.add(n.ssid);
        parsed.push({
          ssid: n.ssid,
          rssi: n.rssi,
          isTarget: n.ssid.startsWith(WIFI_CONFIG.targetSsidPrefix),
        });
      }
      parsed.sort((a, b) => {
        if (a.isTarget !== b.isTarget) return a.isTarget ? -1 : 1;
        return b.rssi - a.rssi;
      });
      this.wifiNetworks = parsed;
    } catch (error: any) {
      console.error('[BleConnectionPage] WiFi scan failed:', error);
      this.showError('Failed to scan WiFi networks. Make sure Location permission is granted.');
    } finally {
      this.isScanning = false;
    }
  }

  async connectToWifi(network: WifiNetwork) {
    this.connectingSSID = network.ssid;
    try {
      // Join the WiFi network (autoRouteTraffic = true binds app traffic to this network)
      await CapacitorWifi.connect({
        ssid: network.ssid,
        autoRouteTraffic: true,
      } as any);

      console.log(`[BleConnectionPage] Joined WiFi: ${network.ssid}`);

      // Now open UDP connection to the target at the configured IP
      await this.deviceService.connect(WIFI_CONFIG.targetIp, WIFI_CONFIG.targetPort);
    } catch (error: any) {
      console.error('[BleConnectionPage] WiFi connect failed:', error);
      this.showError(`Could not connect to ${network.ssid}: ${error?.message ?? 'unknown error'}`);
      this.connectingSSID = null;
    }
    // Navigation triggered by connectionState$ on CONNECTED
  }

  getSignalBars(rssi: number): number {
    // Convert dBm to 1–4 bars
    if (rssi >= -55) return 4;
    if (rssi >= -67) return 3;
    if (rssi >= -75) return 2;
    return 1;
  }

  // ── BLE ─────────────────────────────────────────────────────────────────────

  async initializeBLE() {
    try {
      await this.deviceService.bleOnly.initialize();
      this.isInitialized = true;

      const isEnabled = await this.deviceService.bleOnly.isBLEEnabled();
      if (!isEnabled) {
        const alert = await this.alertController.create({
          header: 'Bluetooth Disabled',
          message: 'Bluetooth is required to connect to ADL Monitor targets. Would you like to enable it?',
          buttons: [
            { text: 'Cancel', role: 'cancel', handler: () => this.goBack() },
            {
              text: 'Enable',
              handler: async () => {
                try {
                  await this.deviceService.bleOnly.requestBLEEnable();
                  const nowEnabled = await this.deviceService.bleOnly.isBLEEnabled();
                  if (!nowEnabled) { this.showError('Bluetooth must be enabled to continue.'); this.goBack(); }
                } catch { this.goBack(); }
              },
            },
          ],
        });
        await alert.present();
      }
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      this.showError('Failed to initialize Bluetooth. Please check permissions.');
    }
  }

  async scanForDevices() {
    if (!this.isInitialized) await this.initializeBLE();
    if (!this.isInitialized) return;

    try {
      this.isScanning = true;
      this.devices = [];
      const foundDevices = await this.deviceService.bleOnly.scanForDevices(10000);
      this.devices = foundDevices;
      if (foundDevices.length === 0) {
        this.showError('No ADL Monitor targets found. Make sure the target is powered on and nearby.');
      }
    } catch {
      this.showError('Failed to scan for targets. Please try again.');
    } finally {
      this.isScanning = false;
    }
  }

  async connectToDevice(device: BleDevice) {
    try {
      this.connectingDeviceId = device.deviceId;
      await this.deviceService.connect(device);
    } catch {
      this.showError('Failed to connect to target. Please try again.');
      this.connectingDeviceId = null;
    }
  }

  // ── Shared ──────────────────────────────────────────────────────────────────

  private subscribeToUpdates() {
    this.connectionStateSubscription = this.deviceService.connectionState$.subscribe((state) => {
      this.connectionState = state;
      if (state === BLEConnectionState.CONNECTED) {
        this.onConnectionSuccess();
      }
      if (state !== BLEConnectionState.CONNECTING) {
        this.connectingSSID = null;
      }
    });

    this.errorSubscription = this.deviceService.error$.subscribe((error) => {
      this.showError(error);
      this.connectingDeviceId = null;
      this.connectingSSID = null;
    });
  }

  private onConnectionSuccess() {
    localStorage.setItem('bleConnected', 'true');
    setTimeout(() => this.router.navigate(['/drill/prepare']), 500);
  }

  get isConnecting(): boolean {
    return this.connectingDeviceId !== null || this.connectingSSID !== null;
  }

  getDeviceSignalStrength(_device: BleDevice): string {
    return 'Signal: Strong';
  }

  goBack() {
    this.router.navigate([this.returnUrl]);
  }

  onDemoClicked() {
    this.router.navigate(['/drill/prepare']);
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
