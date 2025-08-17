import { signal, computed } from '@angular/core';
import { DrillMode } from 'src/app/shared/dialogs/post-drill-dialog/post-drill-dialog.component';
import { HitPoint, ShotStat } from 'src/app/shared/models/shot-stat';

export class ShootingState {
  trainingConfig = signal({ bullets: 10, distance: 50, weapon: 'Pistol' });
  bulletsLeft = signal(150);
  totalShots = signal(0);
  startTime = signal(0);
  elapsedTime = signal(0);
  shotStats = signal<ShotStat[]>([]);
  hitPoints = signal<HitPoint[]>([]);
  isDrillComplete = signal(false);
  currentMode = signal<DrillMode>(DrillMode.training);
  avgSplitTime = computed(() => {
    const stats = this.shotStats();
    if (stats.length <= 1) return 0;
    const total = stats.slice(1).reduce((sum, s) => sum + s.splitTime, 0);
    return +(total / (stats.length - 1)).toFixed(2);
  });

  avgDistance = computed(() => {
    const stats = this.shotStats();
    const total = stats.reduce((sum, s) => sum + s.distanceFromCenter, 0);
    return +(total / stats.length).toFixed(1);
  });

  reset(): void {
    const config = this.trainingConfig();
    this.bulletsLeft.set(config.bullets);
    this.totalShots.set(0);
    this.shotStats.set([]);
    this.hitPoints.set([]);
    this.isDrillComplete.set(false);
    this.elapsedTime.set(0);
    this.startTime.set(0);
  }
}
