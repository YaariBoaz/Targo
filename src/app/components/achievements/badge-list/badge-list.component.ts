import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BadgeProgressService } from 'src/app/shared/services/badge-progress.service';
import { MatTabsModule } from '@angular/material/tabs';
import { Badge } from 'src/app/shared/data/badges';

@Component({
  selector: 'app-badge-list',
  templateUrl: './badge-list.component.html',
  styleUrls: ['./badge-list.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, MatTabsModule],
})
export class BadgeListComponent implements OnInit {
  badges: Badge[] = [
    { name: 'Bullseye Master', done: true },
    { name: 'Quick Reload', done: false },
    { name: 'Deadeye', done: false },
    { name: 'Long Range', done: true },
    { name: 'Steady Hands', done: false },
    { name: 'Challenge Crusher', done: true },
    { name: 'Sharpshooter', done: false },
    { name: 'Speedster', done: false },
    { name: 'Tactical Genius', done: false },
  ];
  selectedTab: 'all' | 'earned' | 'locked' | string = 'all';

  constructor(private badgeProgressService: BadgeProgressService) {}

  ngOnInit() {}

  get filteredBadges(): Badge[] {
    if (this.selectedTab === 'earned') return this.badges.filter((b) => b.done);
    if (this.selectedTab === 'locked')
      return this.badges.filter((b) => !b.done);
    return this.badges;
  }
}
