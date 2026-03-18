import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '@core/services/navigation.service';
import { AuthService } from '@core/services/auth';
import { SplashScreen } from '@capacitor/splash-screen';
import { Platform } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
})
export class SplashComponent implements OnInit {
  constructor(
    private navigationService: NavigationService,
    private authService: AuthService,
    private platform: Platform
  ) {}

  async ngOnInit() {
    // Immediately hide native splash (if it somehow shows)
    if (this.platform.is('capacitor')) {
      try {
        await SplashScreen.hide();
      } catch (e) {
        // Native splash may already be hidden, that's fine
      }
    }

    // Show custom splash for 2 seconds
    setTimeout(() => {
      this.checkAuthAndNavigate();
    }, 2000);
  }

  private async checkAuthAndNavigate() {
    // Check if user is authenticated
    const isAuthenticated = this.authService.isAuthenticated;

    if (isAuthenticated) {
      // User is already logged in, go directly to home
      this.navigationService.navigateRoot('/tabs/home');
    } else {
      // User is not logged in, show welcome/login screen
      this.navigationService.navigateRoot('/auth/welcome');
    }
  }
}
