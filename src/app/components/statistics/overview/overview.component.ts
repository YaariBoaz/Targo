import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
// @ts-ignore
import * as shape from 'd3-shape';

@Component({
  selector: 'app-stats-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgxChartsModule],
})
export class OverviewComponent implements OnInit {
  overviewData = {
    accuracy: 83,
    bestDrillScore: 95,
    totalShots: 1250,
    weeklyActivity: [
      { day: 'M', value: 20 },
      { day: 'TU', value: 27 },
      { day: 'W', value: 16 },
      { day: 'TH', value: 48 },
      { day: 'F', value: 38 },
      { day: 'SA', value: 10 },
      { day: 'SU', value: 49 },
    ],
  };

  chartData: { name: string; value: number }[] = [
    { name: 'M', value: 3 },
    { name: 'T', value: 5 },
    { name: 'W', value: 6 },
    { name: 'T', value: 7 },
    { name: 'F', value: 8 },
    { name: 'S', value: 10 },
    { name: 'S', value: 9 },
  ];
  barColor: Color = {
    name: 'activityRed',
    selectable: false,
    group: ScaleType.Ordinal,
    domain: ['#e53935'], // deep tactical red
  };
  constructor() {}

  ngOnInit() {
    this.chartData = this.overviewData.weeklyActivity.map((d) => ({
      name: d.day,
      value: d.value,
    }));
  }
}
