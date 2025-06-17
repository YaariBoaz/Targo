import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import {
  ScreenComponentMap,
  ScreenState,
} from 'src/app/shared/models/screen-state';
import { NavigationService } from 'src/app/shared/services/navigation.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss'],
  standalone: true,
  imports: [MatIcon, CommonModule, FormsModule],
})
export class UserSettingsComponent implements OnInit {
  constructor(private nav: NavigationService) {}

  user = {
    name: 'ALON',
    avatarUrl: 'assets/images/avatar-default.jpg',
    isPro: true, // or false to test both flows
  };

  ngOnInit() {}

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
}
