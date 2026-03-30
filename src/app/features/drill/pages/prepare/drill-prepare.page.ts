import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { DrillService } from '@core/services/drill.service';
import { LahavSessionService } from '@core/services/lahav-session.service';
import { DrillSetup } from '@models/drill-session.model';

@Component({
  selector: 'app-drill-prepare',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drill-prepare.page.html',
  styleUrls: ['./drill-prepare.page.scss'],
})
export class DrillPreparePage implements OnInit {
  private drillService = inject(DrillService);
  readonly lahavService = inject(LahavSessionService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  drillSetup: DrillSetup | null = null;
  challengeTitle: string = 'Precision Rush';
  challengeDescription: string = '';
  isChallengeDrill: boolean = false;

  constructor() {}

  ngOnInit() {
    // Load drill setup from memory
    this.drillSetup = this.drillService.getCurrentDrillSetup();

    if (!this.drillSetup) {
      this.router.navigate(['/lahav/sessions']);
      return;
    }

    // Check if this is a challenge drill
    this.isChallengeDrill = this.drillSetup.source === 'challenge';

    // Generate challenge description based on drill setup
    this.generateChallengeDescription();
  }

  /**
   * Generate dynamic challenge description based on drill setup
   */
  private generateChallengeDescription() {
    if (!this.drillSetup) return;

    const { numberOfBullets, distance, weaponName, source, challengeDrillTitle, drillObjective } = this.drillSetup;

    if (source === 'challenge') {
      // Use challenge drill title and objective
      this.challengeTitle = challengeDrillTitle || 'Challenge Drill';
      this.challengeDescription = drillObjective || `Complete ${numberOfBullets} shots at ${distance}m`;
    } else {
      // Training drill - generate generic description
      this.challengeTitle = 'Precision Rush';
      this.challengeDescription = `Hit ${numberOfBullets} shots at ${distance}m with ${weaponName}. Keep it tight and fast!`;
    }
  }

  /**
   * Start shooting - navigate to countdown page
   */
  startShooting() {
    this.router.navigate(['/drill/countdown']);
  }

  /**
   * Go back to source (training or challenges)
   */
  goBack() {
    if (!this.drillSetup || this.drillSetup.source === 'lahav') {
      this.router.navigate(['/lahav/shooter-select']);
      return;
    }

    if (this.drillSetup.source === 'challenge') {
      this.router.navigate(['/tabs/challenges']);
    } else {
      this.router.navigate(['/tabs/training']);
    }
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  private async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }
}
