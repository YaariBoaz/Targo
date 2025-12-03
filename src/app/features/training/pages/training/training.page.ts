import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonIcon,
  ViewWillEnter,
  LoadingController,
  ToastController,
  ModalController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TipsService } from '@core/services/tips.service';
import { DrillService } from '@core/services/drill.service';
import { AuthService } from '@core/services/auth';
import { BulletsService } from '@core/services/bullets.service';
import { BLEService } from '@core/services/ble.service';
import { DrillSetup } from '@models/drill-session.model';
import { checkAndDeductBullets } from '@utils/bullets.utils';
import { addIcons } from 'ionicons';
import { bluetoothOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

export type WeaponCategory = 'pistol' | 'rifle' | 'sniper';

export interface WeaponType {
  id: string;
  name: string;
  category: WeaponCategory;
}

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
  templateUrl: './training.page.html',
  styleUrls: ['./training.page.scss'],
})
export class TrainingPage implements OnInit, OnDestroy, ViewWillEnter {
  private tipsService = inject(TipsService);
  private drillService = inject(DrillService);
  private authService = inject(AuthService);
  private bulletsService = inject(BulletsService);
  private bleService = inject(BLEService);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);
  private bleSubscription?: Subscription;

  // Form data
  distance: number = 50;
  selectedCategory: WeaponCategory = 'pistol';
  selectedWeapon: string = 'glock-19';
  numberOfBullets: number = 15;
  maxBullets: number = 80;

  // BLE connection state
  isBleConnected = false;

  // Tip display
  currentTip: string =
    'Choose fewer bullets for quick drills, or max out for endurance!';

  // Available weapons by category
  weapons: WeaponType[] = [
    // Pistols
    { id: 'glock-19', name: 'Glock 19', category: 'pistol' },
    { id: 'glock-17', name: 'Glock 17', category: 'pistol' },
    { id: 'm1911', name: 'M1911', category: 'pistol' },
    { id: 'sig-p320', name: 'SIG P320', category: 'pistol' },
    { id: 'beretta-92', name: 'Beretta 92', category: 'pistol' },

    // Rifles
    { id: 'ar-15', name: 'AR-15', category: 'rifle' },
    { id: 'ak-47', name: 'AK-47', category: 'rifle' },
    { id: 'm4', name: 'M4 Carbine', category: 'rifle' },
    { id: 'scar', name: 'SCAR-L', category: 'rifle' },

    // Snipers
    { id: 'remington-700', name: 'Remington 700', category: 'sniper' },
    { id: 'barrett-50', name: 'Barrett M82', category: 'sniper' },
    { id: 'awp', name: 'AWP', category: 'sniper' },
    { id: 'dragunov', name: 'Dragunov SVD', category: 'sniper' },
  ];

  constructor(private router: Router) {
    addIcons({
      'bluetooth-outline': bluetoothOutline,
    });
  }

  async ngOnInit() {
    console.log('Training page - Initializing tips...');

    // Initialize tips in Firestore (only runs once if collection is empty)
    await this.tipsService.initializeTips();

    // Subscribe to BLE connection state
    this.bleSubscription = this.bleService.connectionState$.subscribe((state) => {
      this.isBleConnected = this.bleService.isConnected();
    });
  }

  ngOnDestroy() {
    this.bleSubscription?.unsubscribe();
  }

  /**
   * Ionic lifecycle hook - runs every time the view is about to enter
   * This ensures a new random tip is loaded each time the user switches to this tab
   */
  async ionViewWillEnter() {
    console.log('Training page - View entering, loading new tip...');
    await this.loadRandomTip();
  }

  /**
   * Load a random tip from Firestore
   */
  async loadRandomTip() {
    try {
      console.log('Training page - Loading random tip...');
      const tip = await this.tipsService.getRandomTip();
      console.log('Training page - Tip loaded:', tip.text);
      this.currentTip = tip.text;
    } catch (error) {
      console.error('Training page - Error loading tip:', error);
      // Keep default tip on error
    }
  }

  get filteredWeapons(): WeaponType[] {
    return this.weapons.filter((w) => w.category === this.selectedCategory);
  }

  selectCategory(category: WeaponCategory) {
    this.selectedCategory = category;
    // Set first weapon of selected category as default
    const firstWeapon = this.filteredWeapons[0];
    if (firstWeapon) {
      this.selectedWeapon = firstWeapon.id;
    }
  }

  async startDrill() {
    // Check if user is authenticated
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      await this.showError('Please log in to start a drill');
      return;
    }

    // Validate form data
    if (!this.distance || this.distance <= 0) {
      await this.showError('Please enter a valid distance');
      return;
    }

    if (!this.numberOfBullets || this.numberOfBullets <= 0) {
      await this.showError('Please enter a valid number of bullets');
      return;
    }

    // Check if user has enough bullets and deduct them
    const hasEnoughBullets = await checkAndDeductBullets(
      this.numberOfBullets,
      this.modalController,
      this.bulletsService
    );

    if (!hasEnoughBullets) {
      console.log('User does not have enough bullets or cancelled');
      return; // User doesn't have enough bullets or cancelled the modal
    }

    try {
      // Get selected weapon name
      const selectedWeaponObj = this.weapons.find(
        (w) => w.id === this.selectedWeapon
      );
      const weaponName = selectedWeaponObj?.name || 'Unknown';

      // Create drill setup
      const drillSetup: DrillSetup = {
        distance: this.distance,
        weaponCategory: this.selectedCategory,
        weaponType: this.selectedWeapon,
        weaponName: weaponName,
        numberOfBullets: this.numberOfBullets,
        source: 'training', // Explicitly mark as training drill
      };

      console.log('Storing drill setup in memory:', drillSetup);

      // Store drill setup in memory (not saved to Firestore yet)
      this.drillService.setCurrentDrillSetup(currentUser.uid, drillSetup);

      console.log('Drill setup stored successfully, bullets deducted');

      // Check if BLE is connected, if not navigate to BLE connection page
      if (!this.bleService.isConnected()) {
        this.router.navigate(['/ble-connection'], {
          queryParams: { returnUrl: '/tabs/training' },
        });
      } else {
        // Already connected, go straight to drill preparation
        this.router.navigate(['/drill/prepare']);
      }
    } catch (error: any) {
      console.error('Error setting up drill:', error);
      await this.showError(
        error.message || 'Failed to set up drill. Please try again.'
      );
    }
  }

  async openBLEConnection() {
    // Check if user is authenticated
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      await this.showError('Please log in to connect');
      return;
    }

    // Validate form data
    if (!this.distance || this.distance <= 0) {
      await this.showError('Please enter a valid distance');
      return;
    }

    if (!this.numberOfBullets || this.numberOfBullets <= 0) {
      await this.showError('Please enter a valid number of bullets');
      return;
    }

    // Check if user has enough bullets and deduct them
    const hasEnoughBullets = await checkAndDeductBullets(
      this.numberOfBullets,
      this.modalController,
      this.bulletsService
    );

    if (!hasEnoughBullets) {
      console.log('User does not have enough bullets or cancelled');
      return; // User doesn't have enough bullets or cancelled the modal
    }

    try {
      // Get selected weapon name
      const selectedWeaponObj = this.weapons.find(
        (w) => w.id === this.selectedWeapon
      );
      const weaponName = selectedWeaponObj?.name || 'Unknown';

      // Create drill setup
      const drillSetup: DrillSetup = {
        distance: this.distance,
        weaponCategory: this.selectedCategory,
        weaponType: this.selectedWeapon,
        weaponName: weaponName,
        numberOfBullets: this.numberOfBullets,
        source: 'training', // Explicitly mark as training drill
      };

      console.log('Storing drill setup before BLE connection:', drillSetup);

      // Store drill setup in memory (not saved to Firestore yet)
      this.drillService.setCurrentDrillSetup(currentUser.uid, drillSetup);

      console.log('Drill setup stored, navigating to BLE connection');

      // Navigate to BLE connection page
      this.router.navigate(['/ble-connection'], {
        queryParams: { returnUrl: '/tabs/training' },
      });
    } catch (error: any) {
      console.error('Error setting up drill:', error);
      await this.showError(
        error.message || 'Failed to set up drill. Please try again.'
      );
    }
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }
}
