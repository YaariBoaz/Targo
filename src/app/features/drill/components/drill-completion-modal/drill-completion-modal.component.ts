import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { ChallengeService } from '@core/services/challenge.service';
import { ChallengeDrill } from '@models/challenge-drill.model';

interface DrillStats {
  score: number;
  shots: number;
  totalTime: number;
  avgDistance: number;
  stars?: number;
}

interface NextDrillInfo {
  bullets: number;
  distance: number;
  weapon: string;
  title?: string;
}

@Component({
  selector: 'app-drill-completion-modal',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './drill-completion-modal.component.html',
  styleUrls: ['./drill-completion-modal.component.scss'],
})
export class DrillCompletionModalComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private challengeService = inject(ChallengeService);

  @Input() isChallenge: boolean = false;
  @Input() stats!: DrillStats;
  @Input() challengeId?: string;
  @Input() currentDrillOrder?: number;
  @Output() close = new EventEmitter<void>();
  @Output() startNext = new EventEmitter<void>();

  feedbackTitle: string = '';
  subtitle: string = '';
  nextDrillInfo: NextDrillInfo | null = null;
  countdown: number = 15;
  progress: number = 100;
  private countdownInterval: any;

  constructor() {
    addIcons({ close });
  }

  async ngOnInit() {
    this.generateFeedback();
    await this.loadNextDrillInfo();
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private generateFeedback() {
    const score = this.stats.score || 0;
    const stars = this.stats.stars || 0;

    // Determine feedback based on performance
    if (stars >= 3 || score >= 900) {
      this.feedbackTitle = 'OUTSTANDING!';
    } else if (stars >= 2 || score >= 750) {
      this.feedbackTitle = 'GREAT WORK!';
    } else if (stars >= 1 || score >= 600) {
      this.feedbackTitle = 'KEEP PUSHING!';
    } else {
      this.feedbackTitle = 'KEEP PRACTICING!';
    }

    this.subtitle = this.isChallenge
      ? "Let's continue the challenge"
      : "Let's continue practicing";
  }

  private async loadNextDrillInfo() {
    if (this.isChallenge && this.challengeId && this.currentDrillOrder !== undefined) {
      try {
        const currentOrder = this.currentDrillOrder; // Store in local variable
        const drills = await this.challengeService.getChallengeDrills(this.challengeId);
        const nextDrill = drills.find((d) => d.order === currentOrder + 1);

        if (nextDrill) {
          this.nextDrillInfo = {
            bullets: nextDrill.requirements.numberOfBullets,
            distance: nextDrill.requirements.distance,
            weapon: this.getWeaponName(nextDrill.requirements.weaponCategory),
            title: nextDrill.title,
          };
        }
      } catch (error) {
        console.error('Error loading next drill:', error);
      }
    } else {
      // For training, generate a random next drill
      this.nextDrillInfo = {
        bullets: Math.floor(Math.random() * 10) + 8, // 8-17 bullets
        distance: [15, 25, 50, 75][Math.floor(Math.random() * 4)],
        weapon: ['Glock 19', 'AR-15', 'Sig P320'][Math.floor(Math.random() * 3)],
      };
    }
  }

  private getWeaponName(category: string): string {
    const weapons: Record<string, string> = {
      pistol: 'Glock 19',
      rifle: 'AR-15',
      sniper: 'Remington 700',
    };
    return weapons[category] || 'Glock 19';
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      this.progress = (this.countdown / 15) * 100;

      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.onStartNext();
      }
    }, 1000);
  }

  onClose() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.close.emit();

    // Navigate to home
    if (this.isChallenge && this.challengeId) {
      this.router.navigate(['/challenges-drills', this.challengeId]);
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }

  onStartNext() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.startNext.emit();
  }
}
