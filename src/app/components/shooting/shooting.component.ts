import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { ScreenState } from 'src/app/shared/models/screen-state';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';
import { ShootingStatsTableComponent } from './shooting-stats-table/shooting-stats-table.component';
import {
  HitPoint,
  ShootingSessionResult,
  ShotStat,
} from 'src/app/shared/models/shot-stat';
import { UserStatsService } from 'src/app/shared/services/user-stats.service';
import { BadgeProgressService } from 'src/app/shared/services/badge-progress.service';
import { AchievmentsService } from 'src/app/shared/services/achievments.service';

@Component({
  selector: 'app-shooting',
  templateUrl: './shooting.component.html',
  styleUrls: ['./shooting.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ShootingComponent implements OnInit {
  private _bottomSheet = inject(MatBottomSheet);

  bulletsLeft = 0;
  totalShots = 0;
  isDrillComplete = false;
  shotStats: ShotStat[] = [];
  lastShotTime: number = 0;
  trainingConfig = {
    bullets: 10,
    distance: 50,
    weapon: 'Pistol',
  };

  hitPoints: HitPoint[] = [];

  startTime: number = 0;
  elapsedTime: number = 0;
  timerInterval: any;
  isFinished = false;

  constructor(
    private navigationService: NavigationService,
    private userStatsService: UserStatsService,
    private badgeProgressService: BadgeProgressService,
    private achiementService: AchievmentsService
  ) {}
  ngOnInit() {
    this.bulletsLeft = this.trainingConfig.bullets;
    this.shotStats = [];
    this.startTimer();
    this.startFakeShooting(); // 🔁 simulate random hits
  }

  startTimer() {
    this.startTime = Date.now();
    this.elapsedTime = 0;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  onHitFired() {
    if (this.isDrillComplete || this.bulletsLeft <= 0) return;

    const now = Date.now();
    const splitTime = (now - this.lastShotTime) / 1000;
    const totalElapsed = (now - this.startTime) / 1000;
    this.lastShotTime = now;

    this.bulletsLeft--;
    this.totalShots++;

    this.shotStats.push({
      shotNumber: this.totalShots,
      splitTime: parseFloat(splitTime.toFixed(2)),
      distanceFromCenter: this.generateRandomDistance(),
      totalElapsed: parseFloat(totalElapsed.toFixed(2)),
    });

    this.spawnHit(); // Adds a visual marker

    if (this.bulletsLeft === 0) {
      this.endDrill();
    }
  }

  generateRandomDistance(): number {
    return parseFloat((Math.random() * 10).toFixed(2)); // 0.00 to 10.00 cm
  }

  spawnHit() {
    const id = Date.now();
    const x = Math.random() * 100; // % within target
    const y = Math.random() * 100;

    const now = (Date.now() - this.startTime) / 1000; // seconds since drill started

    const hit: HitPoint = {
      x,
      y,
      distanceFromCenter: Math.sqrt(x * x + y * y),
      timestamp: now,
    };

    this.hitPoints.push(hit);
  }

  endDrill() {
    this.isDrillComplete = true;
    this.stopTimer();
    const result: ShootingSessionResult = {
      totalShots: this.hitPoints.length,
      bullseyes: this.hitPoints.filter(
        (s) => this.generateRandomDistance() < 10
      ).length,
      hitRate: this.calculateAccuracy(),
      bestSplitTime: this.getBestSplitTime(),
    };

    // this.userStatsService.updateFromSession(result);

    // const updatedBadges = this.badgeProgressService.getBadgeProgress();
    // this.achiementService.checkNewUnlocks(updatedBadges);
  }

  calculateAccuracy(): number {
    if (!this.hitPoints.length) return 0;

    const maxDistance = 100; // Adjust based on target size
    const totalAccuracy = this.hitPoints.reduce((sum, shot) => {
      const accuracy = Math.max(
        0,
        1 - this.generateRandomDistance() / maxDistance
      );
      return sum + accuracy;
    }, 0);

    return +((totalAccuracy / this.hitPoints.length) * 100).toFixed(2); // percentage
  }

  getBestSplitTime(): number {
    if (this.hitPoints.length < 2) return 0;

    let bestSplit = Infinity;
    for (let i = 1; i < this.hitPoints.length; i++) {
      const split =
        this.hitPoints[i].timestamp - this.hitPoints[i - 1].timestamp;
      if (split < bestSplit) bestSplit = split;
    }

    return +bestSplit.toFixed(2);
  }

  resetDrill() {
    this.isDrillComplete = false;
    this.isFinished = false;
    this.totalShots = 0;
    this.bulletsLeft = this.trainingConfig.bullets;
    this.hitPoints = [];
    this.shotStats = [];
    this.startTimer();
    this.startFakeShooting();
  }

  retry() {
    this.resetDrill();
  }

  exit() {
    this.navigationService.popTo(ScreenState.Dashboard);
  }

  viewStats() {
    // Show stats or navigate to stats screen
    this._bottomSheet.open(ShootingStatsTableComponent, {
      data: this.shotStats,
    });
  }

  startFakeShooting() {
    const simulateShot = () => {
      if (this.isDrillComplete || this.bulletsLeft <= 0) return;

      this.onHitFired(); // ← This is your real shooting logic

      const nextDelay = Math.floor(Math.random() * 3000) + 1000; // 1–4 seconds
      setTimeout(simulateShot, nextDelay); // recursively call itself
    };

    simulateShot(); // Start the first shot
  }
}
