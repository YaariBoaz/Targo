import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {
  ScreenComponentMap,
  ScreenState,
} from 'src/app/shared/models/screen-state';
import { User } from 'src/app/shared/models/shot-stat';
import { AuthService } from 'src/app/shared/services/authentication/auth.service';
import { UserStoreService } from 'src/app/shared/services/authentication/user-store.service';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { WelcomeComponent } from '../welcome/welcome.component';

@Component({
  selector: 'app-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIcon],
})
export class UserHeaderComponent implements OnInit {
  score = 3580;
  user: User;
  constructor(
    private navigationService: NavigationService,
    private userStoreService: UserStoreService
  ) {
    this.user = this.userStoreService.user;
    if (!this.user) {
      this.navigationService.reset(WelcomeComponent);
    }
  }

  ngOnInit() {}

  goToSettings() {
    this.navigationService.push(ScreenComponentMap[ScreenState.UserSettings]);
  }
}
