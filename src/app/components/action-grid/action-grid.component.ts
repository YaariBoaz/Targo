import {
  ScreenComponentMap,
  ScreenState,
} from './../../shared/models/screen-state';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationService } from 'src/app/shared/services/navigation.service';

@Component({
  selector: 'app-action-grid',
  templateUrl: './action-grid.component.html',
  styleUrls: ['./action-grid.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ActionGridComponent implements OnInit {
  [x: string]: any;
  hasNewStoreContent = true; // or use a service later
  ScreenState = ScreenState;
  constructor(private navigationService: NavigationService) {}

  ngOnInit() {}

  goTo(screenState: ScreenState) {
    this.navigationService.push(ScreenComponentMap[screenState]);
  }
}
