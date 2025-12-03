import { Component, OnInit } from '@angular/core';
import { OverviewComponent } from './overview/overview.component';
import { StatsHistoryComponent } from './stats-history/stats-history.component';
import { StatsProComponent } from './stats-pro/stats-pro.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  imports: [
    OverviewComponent,
    StatsHistoryComponent,
    StatsProComponent,
    CommonModule,
    FormsModule,
  ],
})
export class StatisticsComponent implements OnInit {
  selectedTab: 'overview' | 'history' | 'pro' = 'overview';

  constructor() {}

  ngOnInit() {}
}
