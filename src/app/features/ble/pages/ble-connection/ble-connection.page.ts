import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from 'ionicons/icons';
import { BLEService, BLEConnectionState } from '@core/services/ble.service';
import { BleDevice } from '@capacitor-community/bluetooth-le';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ble-connection',
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner, IonIcon],
  templateUrl: './ble-connection.page.html',
  styleUrls: ['./ble-connection.page.scss'],
})
export class BLEConnectionPage implements OnInit, OnDestroy {
  private bleService = inject(BLEService);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Subscriptions
  private connectionStateSubscription?: Subscription;
  private errorSubscription?: Subscription;

  // UI State
  isScanning = false;
  isInitialized = false;
  connectingDeviceId: string | null = null;
  devices: BleDevice[] = [];
  connectionState: BLEConnectionState = BLEConnectionState.DISCONNECTED;
  hasImage = false;

  // Navigation
  private returnUrl: string = '/tabs/training'; // Default return URL

  constructor() {
    addIcons({
      'bluetooth-outline': bluetoothOutline,
      'refresh-outline': refreshOutline,
      'chevron-back-outline': chevronBackOutline,
    });
  }

  async ngOnInit() {
    // Get return URL from query params
    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    // Check if already connected - if so, skip to drill prepare
    if (this.bleService.isConnected()) {
      this.router.navigate(['/drill/prepare']);
      return;
    }

    await this.initializeBLE();
    this.subscribeToUpdates();

    // Auto-scan on load
    await this.scanForDevices();
  }

  ngOnDestroy() {
    this.unsubscribeAll();
  }

  /**
   * Initialize BLE service
   */
  async initializeBLE() {
    try {
      // Initialize BLE first (required before any BLE operations)
      await this.bleService.initialize();
      this.isInitialized = true;
      console.log('BLE initialized successfully');

      // Check if BLE is enabled
      const isEnabled = await this.bleService.isBLEEnabled();

      if (!isEnabled) {
        const alert = await this.alertController.create({
          header: 'Bluetooth Disabled',
          message:
            'Bluetooth is required to connect to ADL Monitor targets. Would you like to enable it?',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                this.goBack();
              },
            },
            {
              text: 'Enable',
              handler: async () => {
                try {
                  await this.bleService.requestBLEEnable();
                  // Check again if enabled after request
                  const nowEnabled = await this.bleService.isBLEEnabled();
                  if (!nowEnabled) {
                    this.showError('Bluetooth must be enabled to continue.');
                    this.goBack();
                  }
                } catch (error) {
                  console.error('User denied BLE enable:', error);
                  this.goBack();
                }
              },
            },
          ],
        });
        await alert.present();
        return;
      }
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      this.showError(
        'Failed to initialize Bluetooth. Please check permissions.'
      );
    }
  }

  /**
   * Subscribe to BLE service updates
   */
  private subscribeToUpdates() {
    // Connection state
    this.connectionStateSubscription =
      this.bleService.connectionState$.subscribe((state) => {
        this.connectionState = state;

        // If connected, navigate to drill prepare
        if (state === BLEConnectionState.CONNECTED) {
          this.onConnectionSuccess();
        }
      });

    // Errors
    this.errorSubscription = this.bleService.error$.subscribe((error) => {
      this.showError(error);
      this.connectingDeviceId = null;
    });
  }

  /**
   * Unsubscribe from all observables
   */
  private unsubscribeAll() {
    this.connectionStateSubscription?.unsubscribe();
    this.errorSubscription?.unsubscribe();
  }

  /**
   * Scan for ADL Monitor devices
   */
  async scanForDevices() {
    if (!this.isInitialized) {
      await this.initializeBLE();
    }

    if (!this.isInitialized) {
      return;
    }

    try {
      this.isScanning = true;
      this.devices = [];

      console.log('Scanning for ADL Monitor devices...');
      const foundDevices = await this.bleService.scanForDevices(10000);

      this.devices = foundDevices;
      console.log(`Found ${foundDevices.length} devices`);

      if (foundDevices.length === 0) {
        this.showError(
          'No ADL Monitor targets found. Make sure the target is powered on and nearby.'
        );
      }
    } catch (error) {
      console.error('Scan failed:', error);
      this.showError('Failed to scan for targets. Please try again.');
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Connect to a device
   */
  async connectToDevice(device: BleDevice) {
    try {
      this.connectingDeviceId = device.deviceId;
      console.log('Connecting to device:', device.name);
      await this.bleService.connect(device);
      console.log('Connected successfully');
    } catch (error) {
      console.error('Connection failed:', error);
      this.showError('Failed to connect to target. Please try again.');
      this.connectingDeviceId = null;
    }
  }

  /**
   * Handle successful connection
   */
  private onConnectionSuccess() {
    // Store that we've connected (for future sessions)
    localStorage.setItem('bleConnected', 'true');

    // Navigate to drill prepare page
    setTimeout(() => {
      this.router.navigate(['/drill/prepare']);
    }, 500);
  }

  /**
   * Get device signal strength display
   */
  getDeviceSignalStrength(device: BleDevice): string {
    // You can enhance this with actual RSSI values if available
    return 'Signal: Strong';
  }

  /**
   * Check if currently connecting
   */
  get isConnecting(): boolean {
    return this.connectingDeviceId !== null;
  }

  /**
   * Go back to previous page
   */
  goBack() {
    this.router.navigate([this.returnUrl]);
  }

  /**
   * Show error alert
   */
  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  onDemoClicked() {
    // Navigate to drill prepare page in demo mode
    // The drill setup is already stored in DrillService from the previous page (training or challenge)
    // We just need to navigate to the prepare screen which will use that setup
    console.log('Demo mode activated - proceeding with existing drill setup');
    this.router.navigate(['/drill/prepare']);
  }
}
