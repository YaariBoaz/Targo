import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BadgeListComponent } from './badge-list/badge-list.component';
import { MatTabsModule } from '@angular/material/tabs';
@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  standalone: true,
  imports: [CommonModule, MatTabsModule, BadgeListComponent],
})
export class AchievementsComponent implements OnInit {
  ngOnInit(): void {}
}
