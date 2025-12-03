import { Injectable } from '@angular/core';
import {
  BleClient,
  BleDevice,
  numbersToDataView,
  dataViewToText,
} from '@capacitor-community/bluetooth-le';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

/**
 * Shot data coordinates (normalized 0-1)
 */
export interface ShotData {
  x: number;
  y: number;
  targetId: string;
  timestamp: Date;
}

/**
 * BLE notification event
 */
export interface BLENotifyEvent {
  message: string;
  targetId: string;
  timestamp: Date;
}

/**
 * BLE connection state
 */
export enum BLEConnectionState {
  DISCONNECTED = 'disconnected',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * BLE Service for ADL Monitor device
 * Handles connection, message parsing, and shot data processing
 */
@Injectable({
  providedIn: 'root',
})
export class BLEService {
  // BLE Service and Characteristic UUIDs
  // Nordic UART Service (NUS) - discovered from ADL Monitor device
  private readonly SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  private readonly CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // RX characteristic for notifications
  private readonly TX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // TX characteristic for writing

  // Device name filter
  private readonly DEVICE_NAME_FILTER = 'ADL Monitor';

  // Connection state
  private connectionStateSubject = new BehaviorSubject<BLEConnectionState>(
    BLEConnectionState.DISCONNECTED
  );
  public connectionState$: Observable<BLEConnectionState> =
    this.connectionStateSubject.asObservable();

  // Connected device
  private connectedDevice: BleDevice | null = null;

  // Shot data stream
  private shotDataSubject = new Subject<ShotData>();
  public shotData$: Observable<ShotData> = this.shotDataSubject.asObservable();

  // BLE notification stream
  private notificationSubject = new Subject<BLENotifyEvent>();
  public notification$: Observable<BLENotifyEvent> =
    this.notificationSubject.asObservable();

  // Error stream
  private errorSubject = new Subject<string>();
  public error$: Observable<string> = this.errorSubject.asObservable();

  constructor() {}

  /**
   * Initialize BLE and request permissions
   */
  async initialize(): Promise<void> {
    try {
      await BleClient.initialize();
      console.log('BLE initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      this.errorSubject.next('Failed to initialize BLE');
      throw error;
    }
  }

  /**
   * Scan for ADL Monitor devices
   * @param timeoutMs Scan timeout in milliseconds (default: 10000)
   * @returns Promise<BleDevice[]> Array of found devices
   */
  async scanForDevices(timeoutMs: number = 10000): Promise<BleDevice[]> {
    const devices: BleDevice[] = [];

    try {
      this.connectionStateSubject.next(BLEConnectionState.SCANNING);

      await BleClient.requestLEScan(
        {
          // Filter by name containing "ADL Monitor"
          namePrefix: this.DEVICE_NAME_FILTER,
        },
        (result) => {
          console.log('Found device:', result.localName);
          // Check if device already in list
          if (!devices.find((d) => d.deviceId === result.device.deviceId)) {
            devices.push(result.device);
          }
        }
      );

      // Stop scan after timeout
      await new Promise((resolve) => setTimeout(resolve, timeoutMs));
      await BleClient.stopLEScan();
      return devices;
    } catch (error) {
      console.error('Error scanning for devices:', error);
      this.errorSubject.next('Failed to scan for devices');
      this.connectionStateSubject.next(BLEConnectionState.ERROR);
      throw error;
    } finally {
      // Ensure scan is stopped
      try {
        await BleClient.stopLEScan();
      } catch (e) {
        // Ignore if already stopped
      }
    }
  }

  /**
   * Connect to an ADL Monitor device
   * @param device BLE device to connect to
   */
  async connect(device: BleDevice): Promise<void> {
    try {
      this.connectionStateSubject.next(BLEConnectionState.CONNECTING);

      // Connect to device
      await BleClient.connect(device.deviceId, (deviceId) => {
        console.log('Device disconnected:', deviceId);
        this.handleDisconnect();
      });

      console.log('Connected to device:', device.deviceId);
      this.connectedDevice = device;

      // Discover services and characteristics
      console.log('Discovering services and characteristics...');
      const services = await BleClient.getServices(device.deviceId);
      console.log('Available services:', services);

      // Log all available services and characteristics for debugging
      services.forEach((service) => {
        console.log(`Service UUID: ${service.uuid}`);
        service.characteristics.forEach((char) => {
          console.log(`  - Characteristic UUID: ${char.uuid}, Properties:`, char.properties);
        });
      });

      // Try to start notifications
      await this.startNotifications(device.deviceId);

      this.connectionStateSubject.next(BLEConnectionState.CONNECTED);
    } catch (error) {
      console.error('Failed to connect to device:', error);
      this.errorSubject.next('Failed to connect to device');
      this.connectionStateSubject.next(BLEConnectionState.ERROR);
      throw error;
    }
  }

  /**
   * Start receiving notifications from the device
   * @param deviceId Device ID
   */
  private async startNotifications(deviceId: string): Promise<void> {
    try {
      console.log(`Attempting to start notifications on service: ${this.SERVICE_UUID}, characteristic: ${this.CHARACTERISTIC_UUID}`);

      await BleClient.startNotifications(
        deviceId,
        this.SERVICE_UUID,
        this.CHARACTERISTIC_UUID,
        (value) => {
          this.onNotify(value);
        }
      );

      console.log('Started notifications successfully');
    } catch (error: any) {
      console.error('Failed to start notifications:', error);

      // Provide helpful error message
      if (error.message && error.message.includes('Characteristic not found')) {
        const errorMsg = 'The device does not support the expected BLE characteristic. Please check the device configuration or use Demo Mode instead.';
        this.errorSubject.next(errorMsg);
        throw new Error(errorMsg);
      } else {
        this.errorSubject.next('Failed to start notifications');
        throw error;
      }
    }
  }

  /**
   * Handle incoming BLE notification
   * Equivalent to C# OnNotify method
   * @param value DataView from BLE characteristic
   */
  private onNotify(value: DataView): void {
    try {
      // Convert DataView to string (equivalent to C# Encoding.Default.GetString)
      const message = dataViewToText(value);
      console.log('Received BLE message:', message);

      // Process the message
      this.doGatewayLogic(message);
    } catch (error) {
      console.error('Error processing notification:', error);
      this.errorSubject.next('Error processing notification');
    }
  }

  /**
   * Process gateway logic
   * Equivalent to C# DoGateWayLogic method
   * @param message Message string from BLE device
   */
  private doGatewayLogic(message: string): void {
    console.log('Processing message:', message);

    if (message.includes('ka')) {
      // Keep-alive message
      const targetId = this.fetchTargetId(message);

      if (targetId === '') {
        console.error('Received message from unknown target');
        this.errorSubject.next('Unknown target ID');
        return;
      }

      // Emit keep-alive notification event
      this.notificationSubject.next({
        message: message,
        targetId: targetId,
        timestamp: new Date(),
      });
    } else {
      // Shot data message
      this.notificationSubject.next({
        message: message,
        targetId: '3',
        timestamp: new Date(),
      });

      // Process shot data
      this.processData(message);
    }
  }

  /**
   * Fetch target ID from message
   * Equivalent to C# FetchTargetId method
   * @param input Message string
   * @returns Target ID or empty string
   */
  private fetchTargetId(input: string): string {
    const dataArray = input.split(',');

    if (
      dataArray.length === 4 ||
      (dataArray.length === 5 && input.charCodeAt(1) === 44)
    ) {
      const id = dataArray[1];
      return id;
    }

    return '';
  }

  /**
   * Process shot data from message
   * Equivalent to C# ProcessData method
   * @param input Message string
   */
  private processData(input: string): void {
    console.log('ProcessData =>', input);

    // Ignore keep-alive messages
    if (input.startsWith('ka')) {
      return;
    }

    const dataArray = input.split(',');

    if (dataArray.length === 4) {
      this.handleShotMessage(dataArray);
    } else {
      console.warn(
        `Invalid data: ${input}, expected 4 parts, got ${dataArray.length}`
      );
    }
  }

  /**
   * Handle shot message and extract coordinates
   * Equivalent to C# HandleShot_MSG method
   * @param dataArray Array of message parts
   */
  private handleShotMessage(dataArray: string[]): void {
    console.log('Handling shot message');

    // Parse X coordinate
    const xStr = dataArray[0];
    let xCoord = 0;
    if (xStr && xStr.trim() !== '') {
      xCoord = parseFloat(xStr);
    }

    // Parse Y coordinate
    const yStr = dataArray[1];
    let yCoord = 0;
    if (yStr && yStr.trim() !== '') {
      yCoord = parseFloat(yStr);
    }

    // Validate coordinates (must be between 0 and 1)
    if (xCoord < 0 || xCoord > 1 || yCoord < 0 || yCoord > 1) {
      console.warn('Invalid coordinates:', xCoord, yCoord);
      return;
    }

    console.log(`Shot coordinates: [X,Y] -> [${xCoord}, ${yCoord}]`);

    // Extract target ID
    const targetId = dataArray.length > 2 ? dataArray[2] : '3';

    // Emit shot data
    const shotData: ShotData = {
      x: xCoord,
      y: yCoord,
      targetId: targetId,
      timestamp: new Date(),
    };

    this.shotDataSubject.next(shotData);
  }

  /**
   * Disconnect from current device
   */
  async disconnect(): Promise<void> {
    if (!this.connectedDevice) {
      console.log('No device connected');
      return;
    }

    try {
      await BleClient.disconnect(this.connectedDevice.deviceId);
      console.log('Disconnected from device');
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      this.handleDisconnect();
    }
  }

  /**
   * Handle device disconnect
   */
  private handleDisconnect(): void {
    this.connectedDevice = null;
    this.connectionStateSubject.next(BLEConnectionState.DISCONNECTED);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): BLEConnectionState {
    return this.connectionStateSubject.value;
  }

  /**
   * Check if device is connected
   */
  isConnected(): boolean {
    return this.connectionStateSubject.value === BLEConnectionState.CONNECTED;
  }

  /**
   * Get connected device
   */
  getConnectedDevice(): BleDevice | null {
    return this.connectedDevice;
  }

  /**
   * Write data to the device (if needed)
   * @param data String data to write
   */
  async writeData(data: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      // Convert string to DataView
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);
      const dataView = new DataView(bytes.buffer);

      // Use TX characteristic for writing
      await BleClient.write(
        this.connectedDevice.deviceId,
        this.SERVICE_UUID,
        this.TX_CHARACTERISTIC_UUID,
        dataView
      );

      console.log('Data written to device:', data);
    } catch (error) {
      console.error('Failed to write data:', error);
      this.errorSubject.next('Failed to write data');
      throw error;
    }
  }

  /**
   * Check if BLE is enabled on device
   */
  async isBLEEnabled(): Promise<boolean> {
    try {
      const enabled = await BleClient.isEnabled();
      return enabled;
    } catch (error) {
      console.error('Failed to check BLE status:', error);
      return false;
    }
  }

  /**
   * Request to enable BLE (Android only)
   */
  async requestBLEEnable(): Promise<void> {
    try {
      await BleClient.requestEnable();
    } catch (error) {
      console.error('Failed to enable BLE:', error);
      this.errorSubject.next('User denied BLE enable request');
      throw error;
    }
  }
}
