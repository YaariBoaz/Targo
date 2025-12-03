import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { BLEService } from '@core/services/ble.service';
import { addIcons } from 'ionicons';
import { refreshOutline, homeOutline, bluetoothOutline } from 'ionicons/icons';

@Component({
  selector: 'app-ble-disconnect-modal',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './ble-disconnect-modal.component.html',
  styleUrls: ['./ble-disconnect-modal.component.scss'],
})
export class BleDisconnectModalComponent {
  private modalController = inject(ModalController);
  private bleService = inject(BLEService);
  private router = inject(Router);

  isReconnecting = false;
  reconnectFailed = false;
  showReconnectButton = true;

  constructor() {
    addIcons({
      'refresh-outline': refreshOutline,
      'home-outline': homeOutline,
      'bluetooth-outline': bluetoothOutline,
    });
  }

  async reconnect() {
    this.isReconnecting = true;
    this.reconnectFailed = false;

    try {
      const connectedDevice = this.bleService.getConnectedDevice();

      if (!connectedDevice) {
        throw new Error('No device information available');
      }

      // Try to reconnect to the last connected device
      await this.bleService.connect(connectedDevice);

      // If successful, close the modal
      await this.modalController.dismiss({ action: 'reconnected' });
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.reconnectFailed = true;
      this.showReconnectButton = false;
    } finally {
      this.isReconnecting = false;
    }
  }

  async goToDashboard() {
    await this.modalController.dismiss({ action: 'dashboard' });
    this.router.navigate(['/tabs/home']);
  }

  async goToTargetScan() {
    await this.modalController.dismiss({ action: 'scan' });
    this.router.navigate(['/ble-connection'], {
      queryParams: { returnUrl: '/tabs/home' },
    });
  }
}
