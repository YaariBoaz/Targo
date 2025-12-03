import { Component, inject, OnInit } from '@angular/core';
import { IonContent, IonButton, IonIcon, ToastController, LoadingController } from '@ionic/angular/standalone';
import { NavigationService } from '@core/services/navigation.service';
import { AuthService } from '@core/services/auth';
import { addIcons } from 'ionicons';
import { logoFacebook, logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {
  private navigationService = inject(NavigationService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {
    // Register icons
    addIcons({
      'logo-facebook': logoFacebook,
      'logo-google': logoGoogle,
    });
  }

  ngOnInit() {
    // Subscribe to auth state to check if user is already authenticated
    // This ensures we wait for Firebase Auth to initialize
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('Welcome page - User already authenticated, redirecting to home...');
        this.navigationService.navigateRoot('/tabs/home');
      }
    });
  }

  goToLogin() {
    this.navigationService.navigateForward('/auth/login');
  }

  goToRegister() {
    this.navigationService.navigateForward('/auth/register');
  }

  async loginWithFacebook() {
    const loading = await this.loadingController.create({
      message: 'Connecting to Facebook...',
    });
    await loading.present();

    try {
      await this.authService.loginWithFacebook();
      await loading.dismiss();
      this.navigationService.navigateRoot('/tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      await this.showError(error.message || 'Facebook login failed');
    }
  }

  async loginWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Connecting to Google...',
    });
    await loading.present();

    try {
      await this.authService.loginWithGoogle();
      await loading.dismiss();
      this.navigationService.navigateRoot('/tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      console.error('Google login error:', error);
      await this.showError(error.message || 'Google login is not configured yet. Please check SOCIAL_LOGIN_SETUP.md');
    }
  }

  continueAsGuest() {
    // Navigate to home without authentication
    this.navigationService.navigateRoot('/tabs/home');
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
