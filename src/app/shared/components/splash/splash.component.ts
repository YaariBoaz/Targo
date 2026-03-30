import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '@core/services/navigation.service';
import { FirebaseService } from '@shared/services/firebase.service';
import { signInAnonymously } from 'firebase/auth';
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
  private navigationService = inject(NavigationService);
  private firebase = inject(FirebaseService);
  private platform = inject(Platform);

  async ngOnInit() {
    if (this.platform.is('capacitor')) {
      try {
        await SplashScreen.hide();
      } catch (e) {
        // Native splash may already be hidden, that's fine
      }
    }

    setTimeout(() => this.initAndNavigate(), 2000);
  }

  private async initAndNavigate() {
    if (!this.firebase.auth.currentUser) {
      try {
        await signInAnonymously(this.firebase.auth);
      } catch (e) {
        console.error('[Splash] Anonymous sign-in failed:', e);
      }
    }
    this.navigationService.navigateRoot('/lahav/sessions');
  }
}
