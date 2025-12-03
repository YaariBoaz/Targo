import { CommonModule } from '@angular/common';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { ActionGridComponent } from '../action-grid/action-grid.component';
import { FabMenuComponent } from '../fab-menu/fab-menu.component';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';
import { Component } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { RankingsComponent } from '../rankings/rankings.component';
import { BuyBulletsComponent } from '../buy-bullets/buy-bullets.component';
import { PromotionsPanelComponent } from '../promotions-panel/promotions-panel.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    UserHeaderComponent,
    ActionGridComponent,
    MatBottomSheetModule,
    RankingsComponent,
    BuyBulletsComponent,
    PromotionsPanelComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  constructor(private bottomSheet: MatBottomSheet) {}

  openBottomSheet() {
    this.bottomSheet.open(BottomMenuComponent);
  }
}
