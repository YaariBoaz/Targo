import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  navigateCircleOutline,
  ellipseOutline,
  trophyOutline,
  statsChartOutline,
  bluetoothOutline,
} from 'ionicons/icons';
import { BulletsPanelComponent } from '../modals/bullets-panel/bullets-panel.component';
import { StorePage } from '@features/store/pages/store/store.page';
import { BulletsService } from '@core/services/bullets.service';
import { BLEService } from '@core/services/ble.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsPage implements OnInit, OnDestroy {
  private modalController = inject(ModalController);
  private bulletsService = inject(BulletsService);
  private bleService = inject(BLEService);
  private bulletsSubscription?: Subscription;
  private bleSubscription?: Subscription;

  hasUnlimitedBullets = false;
  bulletCount = 15;
  maxBullets = 80;
  isBleConnected = false;

  constructor() {
    addIcons({
      'home-outline': homeOutline,
      'navigate-circle-outline': navigateCircleOutline,
      'ellipse-outline': ellipseOutline,
      'trophy-outline': trophyOutline,
      'stats-chart-outline': statsChartOutline,
      'bluetooth-outline': bluetoothOutline,
    });
  }
  ngOnInit(): void {
    this.bulletsSubscription = this.bulletsService.bulletCount$.subscribe(
      (count) => {
        this.bulletCount = count;
      }
    );

    // Subscribe to unlimited bullets status
    this.bulletsService.hasUnlimitedBullets$.subscribe((unlimited) => {
      this.hasUnlimitedBullets = unlimited;
    });

    // Subscribe to BLE connection state
    this.bleSubscription = this.bleService.connectionState$.subscribe(
      (state) => {
        this.isBleConnected = this.bleService.isConnected();
      }
    );
  }

  ngOnDestroy(): void {
    this.bulletsSubscription?.unsubscribe();
    this.bleSubscription?.unsubscribe();
  }

  async openSessionModal() {
    const modal = await this.modalController.create({
      component: StorePage,
      cssClass: 'bullets-modal',
      breakpoints: [1],
      initialBreakpoint: 1,
    });

    await modal.present();
  }
}
