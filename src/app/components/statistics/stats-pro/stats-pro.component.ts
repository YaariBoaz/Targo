import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProPlanBulletsComponent } from 'src/app/shared/dialogs/pro-plan-bullets/pro-plan-bullets.component';
import { ProToolsService } from 'src/app/shared/services/pro-tools.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions } from 'chart.js';

@Component({
  selector: 'app-stats-pro',
  templateUrl: './stats-pro.component.html',
  styleUrls: ['./stats-pro.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
})
export class StatsProComponent implements OnInit {
  [x: string]: any;
  isProUser = false;

  shotHits = [
    { x: 40, y: 42 },
    { x: 58, y: 37 },
    { x: 48, y: 60 },
    { x: 52, y: 49 },
  ];

  shotGroupData = {
    datasets: [
      {
        label: 'Shots',
        data: [
          { x: 2.1, y: 2.3 },
          { x: -1.4, y: 1.9 },
          { x: 0.7, y: -0.8 },
          { x: 1.2, y: 0.6 },
          { x: -2.2, y: -1.1 },
        ],
        pointBackgroundColor: '#c9a84e',
        pointRadius: 7,
      },
    ],
  };

  shotGroupOpts: ChartOptions<'scatter'> = {
    scales: {
      x: { min: -3, max: 3, display: false },
      y: { min: -3, max: 3, display: false },
    },
    plugins: { legend: { display: false } },
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
  };

  // Reaction Time (line)
  reactionData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    datasets: [
      {
        label: 'RT (ms)',
        data: [285, 270, 260, 300, 250, 240, 230],
        borderColor: '#e53935',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  };

  reactionOpts: ChartOptions<'line'> = {
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
      y: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} ms`,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  weakData = {
    labels: ['Left-Shoulder', 'Right-Shoulder', 'Low-Pull', 'Center-Mass'],
    datasets: [
      {
        data: [28, 6, 12, 54],
        backgroundColor: ['#e53935', '#f57c00', '#c9a84e', '#42a5f5'],
        borderWidth: 0,
      },
    ],
  };

  weakOpts: ChartOptions<'doughnut'> = {
    cutout: '60%',
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
  };

  shots = [
    { x: 51, y: 49 },
    { x: 48, y: 52 },
    { x: 55, y: 46 },
    { x: 50, y: 50 },
  ];
  constructor(private proAccess: ProToolsService, private dialog: MatDialog) {}

  ngOnInit(): void {
    if (this.proAccess.isPro()) {
      this.isProUser = true;
    } else {
      const dialogRef = this.dialog.open(ProPlanBulletsComponent, {
        disableClose: true,
        data: { reason: 'pro-tools' },
      });

      dialogRef.afterClosed().subscribe((subscribed: boolean) => {
        if (subscribed) {
          this.proAccess.setPro();
          this.isProUser = true;
        }
      });
    }
  }

  getZoneForHit(x: number, y: number): string {
    // Shift origin to center of target (50, 50)
    const dx = x - 50;
    const dy = 50 - y;

    // Convert to polar angle
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

    // Match angle to diagnosis zone
    if (angleDeg >= 345 || angleDeg < 15) return 'Jerking or Slapping Trigger';
    if (angleDeg >= 15 && angleDeg < 45) return 'Tightening Fingers';
    if (angleDeg >= 45 && angleDeg < 75)
      return 'Trigger Finger Not Far Enough Over Trigger';
    if (angleDeg >= 75 && angleDeg < 105)
      return 'No Follow Through / Riding the Recoil';
    if (angleDeg >= 105 && angleDeg < 135) return 'Pushing with Heel of Hand';
    if (angleDeg >= 135 && angleDeg < 165)
      return 'Allowing Wrist to Break Upwards';
    if (angleDeg >= 165 && angleDeg < 195)
      return 'Weak Grip / Anticipation of Recoil';
    if (angleDeg >= 195 && angleDeg < 225)
      return 'Squeezing with Thumb / Pinkie Pressure';
    if (angleDeg >= 225 && angleDeg < 255)
      return 'Trigger Finger Too Far Over Trigger';
    if (angleDeg >= 255 && angleDeg < 285)
      return 'Pulling Down on Trigger / Pushing Forward';
    if (angleDeg >= 285 && angleDeg < 315)
      return 'Dropping Head / Relaxing Too Quickly';
    if (angleDeg >= 315 && angleDeg < 345)
      return 'Tightening Grip while Pulling Trigger';

    return 'Unknown';
  }
}
