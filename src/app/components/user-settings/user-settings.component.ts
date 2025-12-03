import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import {
  ScreenComponentMap,
  ScreenState,
} from 'src/app/shared/models/screen-state';
import { AuthService } from 'src/app/shared/services/authentication/auth.service';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { WelcomeComponent } from '../welcome/welcome.component';
import { User } from 'src/app/shared/models/shot-stat';
import { UserStoreService } from 'src/app/shared/services/authentication/user-store.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss'],
  standalone: true,
  imports: [MatIcon, CommonModule, FormsModule],
})
export class UserSettingsComponent implements OnInit {
  constructor(
    private nav: NavigationService,
    private authService: AuthService,
    private userStoreService: UserStoreService
  ) {}

  user!: User;

  ngOnInit() {
    this.user = this.userStoreService.user;
  }

  editProfile() {
    /* ... */
  }
  goToAchievements() {
    this.nav.push(ScreenComponentMap[ScreenState.Achievements]);
  }
  goToStats() {
    this.nav.push(ScreenComponentMap[ScreenState.Statistics]);
  }
  goToRank() {
    this.nav.push(ScreenComponentMap[ScreenState.RankProgress]);
  }
  goToSettings() {
    this.nav.push(ScreenComponentMap[ScreenState.Settings]);
  }
  goToHelp() {
    /* ... */
  }
  goToUpgrade() {
    this.user.isPro = false;
  }

  logout() {
    this.authService
      .logoutFromAllProviders()
      .then(() => {
        this.nav.reset(WelcomeComponent);
      })
      .catch((error) => {
        console.error('Logout failed:', error);
      });
  }
}
