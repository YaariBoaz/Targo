import { Component, inject, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
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
import { StackNavigationService } from '@core/services/stack-navigation.service';
import { TabRefreshService } from '@core/services/tab-refresh.service';
import { Subscription } from 'rxjs';
import { FEATURE_FLAGS } from '@core/feature-flags';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(IonTabs) tabs!: IonTabs;

  private modalController = inject(ModalController);
  private bulletsService = inject(BulletsService);
  private bleService = inject(BLEService);
  private stackNav = inject(StackNavigationService);
  private tabRefreshService = inject(TabRefreshService);
  private bulletsSubscription?: Subscription;
  private bleSubscription?: Subscription;

  readonly flags = FEATURE_FLAGS;
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

  async ngAfterViewInit() {
    // Listen for tab changes and broadcast to all components
    this.tabs.ionTabsWillChange.subscribe((event: any) => {
      console.log('Tab changing to:', event.tab);
      this.tabRefreshService.notifyTabChange(event.tab);
    });
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
