<<<<<<< HEAD
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet, IonIcon, Platform } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { InAppPurchaseService } from '@core/services/in-app-purchase.service';
import { BulletsService } from '@core/services/bullets.service';
import { BLEService } from '@core/services/ble.service';
import { addIcons } from 'ionicons';
import { bluetooth } from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet, IonIcon],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private purchaseService = inject(InAppPurchaseService);
  private bulletsService = inject(BulletsService);
  private bleService = inject(BLEService);
  private bleSubscription?: Subscription;

  isBleConnected = false;

  constructor(private platform: Platform) {
    addIcons({ bluetooth });
  }

  async ngOnInit() {
    await this.platform.ready();
    await this.initializeApp();
    this.setupAuthListener();
    this.setupBleListener();
  }

  ngOnDestroy() {
    this.bleSubscription?.unsubscribe();
  }

  /**
   * Subscribe to BLE connection state
   */
  private setupBleListener() {
    this.bleSubscription = this.bleService.connectionState$.subscribe((state) => {
      this.isBleConnected = this.bleService.isConnected();
    });
  }

  async initializeApp() {
    try {
      // Configure StatusBar to overlay content (translucent)
      await StatusBar.setOverlaysWebView({ overlay: true });

      // Set status bar style to light content (white icons/text)
      await StatusBar.setStyle({ style: Style.Dark });

      // Set background color (will show through when not fully overlaid)
      await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
    } catch (error) {
      // StatusBar is not available (e.g., running in browser)
      console.log('StatusBar not available:', error);
    }
  }

  /**
   * Set up Firebase Auth listener to initialize RevenueCat and Bullets when user logs in
   */
  private setupAuthListener() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        console.log('User authenticated, initializing services...');
        try {
          // Initialize RevenueCat
          await this.purchaseService.initialize(user.uid);

          // Set user attributes for better analytics
          if (user.email) {
            await this.purchaseService.setEmail(user.email);
          }
          if (user.displayName) {
            await this.purchaseService.setDisplayName(user.displayName);
          }

          console.log('RevenueCat initialized successfully for user:', user.uid);

          // Initialize Bullets service
          await this.bulletsService.initialize();
          console.log('Bullets service initialized successfully');
        } catch (error) {
          console.error('Failed to initialize services:', error);
        }
      } else {
        console.log('User logged out');
        // Reset services
        this.bulletsService.reset();
      }
    });
  }
=======
import { Component } from '@angular/core';
import { HomePage } from './home/home.page';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { App } from '@capacitor/app';
import { NavigationService } from './shared/services/navigation.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [HomePage],
  standalone: true,
})
export class AppComponent {
  constructor(private nav: NavigationService) {
    this.changeColor();

    App.addListener('backButton', ({ canGoBack }) => {
      if (this.nav.canGoBack()) {
        this.nav.pop();
      } else {
        App.exitApp();
      }
    });
  }

  async changeColor() {
    await EdgeToEdge.setBackgroundColor({ color: '#ffffff' }); // Replace with your desired color
  }
>>>>>>> e5ece6d90a60c3e35dbc4e11b781a3364886e832
}
