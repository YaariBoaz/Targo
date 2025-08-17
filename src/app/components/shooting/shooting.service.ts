import { Injectable, WritableSignal } from '@angular/core';
import { Subject, takeUntil, timer } from 'rxjs';
import {
  HitPoint,
  ShootingSessionResult,
} from 'src/app/shared/models/shot-stat';

@Injectable({
  providedIn: 'root',
})
export class ShootingService {
  currentShootingType: ShootingType = ShootingType.Training;
  private stop$ = new Subject<void>();

  constructor() {}

  set ShootingType(type: ShootingType) {
    this.currentShootingType = type;
  }
  get ShootingType() {
    return this.currentShootingType;
  }

  startTimer(
    start: WritableSignal<number>,
    elapsed: WritableSignal<number>
  ): void {
    start.set(Date.now());
    timer(0, 1000)
      .pipe(takeUntil(this.stop$))
      .subscribe(() => {
        const now = Date.now();
        elapsed.set(Math.floor((now - start()) / 1000));
      });
  }

  stopTimer(): void {
    this.stop$.next();
  }

  generateHit(bulletsLeft: number, startTime: number): HitPoint | null {
    if (bulletsLeft <= 0) return null;

    const x = Math.random() * 100;
    const y = Math.random() * 100;
    return {
      x,
      y,
      distanceFromCenter: Math.sqrt(x * x + y * y),
      timestamp: (Date.now() - startTime) / 1000,
    };
  }

  // generateResult(
  //   hitPoints: HitPoint[],
  //   bestSplit: number
  // ): ShootingSessionResult {
  //   const total = hitPoints.length;
  //   const bullseyes = hitPoints.filter((p) => p.distanceFromCenter < 10).length;
  //   const hitRate = this.calculateAccuracy(hitPoints);
  //   return {
  //     totalShots: total,
  //     bullseyes,
  //     hitRate,
  //     bestSplitTime: bestSplit,
  //   };
  // }

  private calculateAccuracy(hitPoints: HitPoint[]): number {
    if (!hitPoints.length) return 0;
    const maxDistance = 100;
    const totalAccuracy = hitPoints.reduce((sum, shot) => {
      const acc = Math.max(0, 1 - shot.distanceFromCenter / maxDistance);
      return sum + acc;
    }, 0);
    return +((totalAccuracy / hitPoints.length) * 100).toFixed(2);
  }
}

export enum ShootingType {
  'Training',
  'Challenge',
}
