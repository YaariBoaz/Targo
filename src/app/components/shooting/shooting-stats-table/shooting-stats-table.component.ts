import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { ShotStat } from 'src/app/shared/models/shot-stat';

@Component({
  selector: 'app-shooting-stats-table',
  templateUrl: './shooting-stats-table.component.html',
  styleUrls: ['./shooting-stats-table.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ShootingStatsTableComponent implements OnInit {
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public stats: ShotStat[]) {}
  ngOnInit() {}
}
