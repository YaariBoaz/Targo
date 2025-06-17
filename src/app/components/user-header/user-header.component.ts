import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {
  ScreenComponentMap,
  ScreenState,
} from 'src/app/shared/models/screen-state';
import { NavigationService } from 'src/app/shared/services/navigation.service';

@Component({
  selector: 'app-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss'],
  standalone: true,
  imports: [MatIcon],
})
export class UserHeaderComponent implements OnInit {
  constructor(private navigationService: NavigationService) {}

  ngOnInit() {}

  goToSettings() {
    this.navigationService.push(ScreenComponentMap[ScreenState.UserSettings]);
  }
}
