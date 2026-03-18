import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import {
  ChallengeCardComponent,
  Challenge,
} from '@shared/components/challenge-card/challenge-card.component';
import { ChallengeService } from '@core/services/challenge.service';
import { StackNavigationService } from '@core/services/stack-navigation.service';
import { TabRefreshService } from '@core/services/tab-refresh.service';
import { Challenge as FirebaseChallenge } from '@models/challenge.model';
import { ChallengeProgress } from '@models/challenge-progress.model';
import { ChallengeDrillsPage } from '@features/challenges/pages/challenge-drills/challenge-drills.page';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-challenges-section',
  standalone: true,
  imports: [CommonModule, ChallengeCardComponent],
  templateUrl: './challenges-section.component.html',
  styleUrls: ['./challenges-section.component.scss'],
})
export class ChallengesSectionComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private challengeService = inject(ChallengeService);
  private router = inject(Router);
  private stackNav = inject(StackNavigationService);
  private tabRefreshService = inject(TabRefreshService);
  private tabSubscription?: Subscription;

  challenges: Challenge[] = [];
  loading = true;

  async ngOnInit() {
    await this.loadChallenges();

    // Subscribe to tab changes to reload challenges when home tab is activated
    this.tabSubscription = this.tabRefreshService.tabChange$.subscribe(async (tabName) => {
      if (tabName === 'home') {
        console.log('Challenges section - Home tab activated, refreshing challenges...');
        await this.loadChallenges();
      }
    });
  }

  ngOnDestroy() {
    this.tabSubscription?.unsubscribe();
  }

  private async loadChallenges() {
    try {
      this.loading = true;

      // Fetch all challenges — does not require auth
      const [globalChallenges, heroesChallenges] = await Promise.all([
        this.challengeService.getChallengesByType('global'),
        this.challengeService.getChallengesByType('heroes'),
      ]);

      // Fetch user progress only if logged in
      const user = this.auth.currentUser;
      const userProgress = user
        ? await this.challengeService.getUserActiveChallenges(user.uid)
        : [];

      const allChallenges = [...globalChallenges, ...heroesChallenges];

      // Find the challenge with most progress
      let mostProgressedChallenge: Challenge | null = null;
      if (userProgress.length > 0) {
        // Sort by progress percentage, then by last activity
        const sorted = userProgress.sort((a, b) => {
          if (b.progress !== a.progress) {
            return b.progress - a.progress;
          }
          return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
        });

        const topProgress = sorted[0];
        const challenge = allChallenges.find(
          (c) => c.id === topProgress.challengeId
        );

        if (challenge) {
          mostProgressedChallenge = this.mapToDisplayChallenge(
            challenge,
            topProgress
          );
        }
      }

      // Get challenges the user hasn't started yet
      const startedChallengeIds = new Set(
        userProgress.map((p) => p.challengeId)
      );
      const unstartedChallenges = allChallenges.filter(
        (c) => !startedChallengeIds.has(c.id)
      );

      // Shuffle and take random 3 unstarted challenges
      const randomUnstarted = this.shuffleArray(unstartedChallenges)
        .slice(0, 3)
        .map((c) => this.mapToDisplayChallenge(c));

      // Combine: most progressed first, then random unstarted
      this.challenges = mostProgressedChallenge
        ? [mostProgressedChallenge, ...randomUnstarted]
        : randomUnstarted;
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      this.loading = false;
    }
  }

  private mapToDisplayChallenge(
    challenge: FirebaseChallenge,
    progress?: ChallengeProgress
  ): Challenge {
    return {
      id: challenge.id,
      title: challenge.title,
      imageUrl: challenge.imageUrl,
      progress: {
        current: progress?.completedDrills || 0,
        total: challenge.drillsCount,
        label: 'Drills',
      },
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  onStartChallenge(challenge: Challenge) {
    console.log('Starting challenge:', challenge);
    // Switch to challenges tab and push the drill page with source tracking
    this.router.navigate(['/tabs/challenges']).then(() => {
      // Small delay to ensure tab is loaded
      setTimeout(() => {
        this.stackNav.push(
          ChallengeDrillsPage,
          { challengeId: challenge.id, sourceTab: 'home' },
          'challenges'
        );
      }, 100);
    });
  }

  onSeeMore() {
    this.router.navigate(['/tabs/challenges']);
  }
}
