import { Component, OnInit } from '@angular/core';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { ScreenComponentMap } from 'src/app/shared/models/screen-state';
import { AuthService } from 'src/app/shared/services/authentication/auth.service';
import { UserService } from 'src/app/shared/services/user.service';
import { UserStoreService } from 'src/app/shared/services/authentication/user-store.service';
import { GuestService } from '@core/services/guest.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [IonContent, IonButton],
})
export class WelcomeComponent implements OnInit {
  constructor(
    private nav: NavigationService,
    private authService: AuthService,
    private userService: UserService,
    private userStore: UserStoreService,
    private guestService: GuestService,
    private router: Router
  ) {}

  ngOnInit() {}

  navigateTo(path: 'login' | 'register') {
    if (path === 'login') {
      this.nav.push(ScreenComponentMap.Login);
    } else {
      this.nav.push(ScreenComponentMap.Register);
    }
  }

  continueAsGuest() {
    console.log('Continuing as guest...');

    // Enable guest mode
    this.guestService.enableGuestMode();

    // Navigate to home/dashboard
    // Using the router to navigate to tabs/home
    this.router.navigate(['/tabs/home'], { replaceUrl: true });
  }

  async loginWithGoogle() {
    try {
      const cred = await this.authService.loginWithGoogle();
      const user = cred.user;

      const userSnap = await this.userService.getUser(user.uid);

      if (!userSnap.exists()) {
        await this.userService.createUser(user.uid, {
          email: user.email,
          nickname: user.displayName,
          shooterLevel: 'Recruit',
          imgUrl: user.photoURL || '',
        });
      }

      // const userData = (await this.userService.getUser(user.uid)).data();
      // this.userStore.user = userData;
      // Navigate to app dashboard
      this.nav.reset(ScreenComponentMap.Dashboard);
    } catch (err) {
      console.error('Google login failed:', err);
    }
  }

  async loginWithFacebook() {
    try {
      const cred = await this.authService.loginWithFacebook();
      const user = cred.user;

      const userSnap = await this.userService.getUser(user.uid);
      if (!userSnap.exists()) {
        await this.userService.createUser(user.uid, {
          email: user.email,
          nickname: user.displayName,
          shooterLevel: 'Recruit',
          imgUrl: user.photoURL || '',
        });
      }

      const userData = (await this.userService.getUser(user.uid)).data();
      this.userStore;
      // Navigate to app dashboard
      this.nav.reset(ScreenComponentMap.Dashboard);
    } catch (err) {
      console.error('Facebook login failed:', err);
    }
  }
}
