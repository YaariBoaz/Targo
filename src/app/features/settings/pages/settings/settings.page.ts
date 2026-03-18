import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, chevronForward } from 'ionicons/icons';
import { AuthService } from '@core/services/auth';
import { OnboardingService } from '@core/services/onboarding.service';
import { FEATURE_FLAGS } from '@core/feature-flags';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  readonly flags = FEATURE_FLAGS;

  private router = inject(Router);
  private authService = inject(AuthService);
  private onboardingService = inject(OnboardingService);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({ close, 'chevron-forward': chevronForward });
  }

  close() {
    this.router.navigate(['/tabs/home']);
  }

  onUpgradeClick() {
    this.router.navigate(['/store']);
  }

  onSettingsClick() {
    this.router.navigate(['/settings-detail']);
  }

  onHelpClick() {
    // Navigate to help & support page
    console.log('Help & Support clicked');
  }

  async onReplayOnboardingClick() {
    await this.onboardingService.resetOnboarding();
    this.router.navigate(['/onboarding']);
  }

  async onLogoutClick() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Logout',
          role: 'confirm',
          handler: async () => {
            await this.performLogout();
          },
        },
      ],
    });

    await alert.present();
  }

  private async performLogout() {
    try {
      // Firebase signOut handles all auth providers automatically
      await this.authService.logout();

      // Navigate to welcome page
      await this.router.navigate(['/auth/welcome'], { replaceUrl: true });
    } catch (error) {
      console.error('Logout failed:', error);

      // Show error alert
      const errorAlert = await this.alertController.create({
        header: 'Logout Failed',
        message: 'An error occurred while logging out. Please try again.',
        buttons: ['OK'],
      });

      await errorAlert.present();
    }
  }
}
