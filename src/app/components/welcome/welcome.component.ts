import { Component, OnInit } from '@angular/core';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { ScreenComponentMap } from 'src/app/shared/models/screen-state';
import { AuthService } from 'src/app/shared/services/authentication/auth.service';
import { UserService } from 'src/app/shared/services/user.service';
import { UserStoreService } from 'src/app/shared/services/authentication/user-store.service';

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
    private userStore: UserStoreService
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
    // This is where you can init an anonymous user or skip auth
    console.log('Continuing as guest...');

    // Optionally, navigate to dashboard or setup
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
