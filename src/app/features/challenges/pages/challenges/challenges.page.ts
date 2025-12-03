import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, close } from 'ionicons/icons';
import { Auth } from '@angular/fire/auth';
import { UserHeaderComponent } from '@shared/components/user-header/user-header.component';
import { ChallengeService } from '@core/services/challenge.service';
import { StackNavigationService } from '@core/services/stack-navigation.service';
import { Challenge } from '@models/challenge.model';
import { ChallengeProgress } from '@models/challenge-progress.model';
import { ChallengeDrillsPage } from '../challenge-drills/challenge-drills.page';

interface ChallengeWithProgress extends Challenge {
  progress?: number; // 0-100 for My Challenges
  completedDrills?: number; // for My Challenges
  isCompleted?: boolean; // for My Challenges
}

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, UserHeaderComponent],
  templateUrl: './challenges.page.html',
  styleUrl: './challenges.page.scss',
})
export class ChallengesPage implements OnInit {
  private stackNav = inject(StackNavigationService);
  private challengeService = inject(ChallengeService);
  private auth = inject(Auth);

  activeTab: 'my' | 'global' | 'heroes' = 'my';
  isLoading = false;

  // My Challenges - challenges user has started
  myChallenges: ChallengeWithProgress[] = [];

  // Global Challenges - tactical competitions
  globalChallenges: Challenge[] = [];

  // Heroes Challenges - in honor of fallen heroes
  heroesChallenges: Challenge[] = [];

  constructor() {
    addIcons({ arrowBack, close });
  }

  async ngOnInit() {
    await this.loadChallenges();
  }

  private async loadChallenges() {
    this.isLoading = true;

    try {
      // Load global and heroes challenges in parallel
      const [global, heroes] = await Promise.all([
        this.challengeService.getChallengesByType('global'),
        this.challengeService.getChallengesByType('heroes'),
      ]);

      this.globalChallenges = global;
      this.heroesChallenges = heroes;

      // Load user's active challenges if authenticated
      if (this.auth.currentUser) {
        await this.loadMyChallenges();
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadMyChallenges() {
    if (!this.auth.currentUser) return;

    try {
      const progressList = await this.challengeService.getUserActiveChallenges(
        this.auth.currentUser.uid
      );

      // Load full challenge data for each progress record
      const myChallengesWithProgress = await Promise.all(
        progressList.map(async (progress) => {
          const challenge = await this.challengeService.getChallenge(
            progress.challengeId
          );
          if (!challenge) return null;

          return {
            ...challenge,
            progress: progress.progress,
            completedDrills: progress.completedDrills,
            isCompleted: progress.status === 'completed',
          } as ChallengeWithProgress;
        })
      );

      this.myChallenges = myChallengesWithProgress.filter(
        (c): c is ChallengeWithProgress => c !== null
      );
      this.myChallenges.sort((a, b) => {
        // Incomplete challenges first, then by progress descending
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        return (b.progress || 0) - (a.progress || 0);
      });
    } catch (error) {
      console.error('Error loading my challenges:', error);
    }
  }

  switchTab(tab: 'my' | 'global' | 'heroes') {
    this.activeTab = tab;
  }

  close() {
    // Pop to root will go back to the challenges tab root
    this.stackNav.popToRoot('challenges');
  }

  async onChallengeClick(challenge: Challenge) {
    console.log('Challenge clicked:', challenge);

    // If user is authenticated and clicks a challenge they haven't started, start it
    if (
      this.auth.currentUser &&
      (this.activeTab === 'global' || this.activeTab === 'heroes')
    ) {
      const existingProgress =
        await this.challengeService.getUserChallengeProgress(
          this.auth.currentUser.uid,
          challenge.id
        );

      if (!existingProgress) {
        try {
          await this.challengeService.startChallenge(
            this.auth.currentUser.uid,
            challenge
          );
          console.log('Challenge started:', challenge.id);
        } catch (error) {
          console.error('Error starting challenge:', error);
        }
      }
    }

    // Use stack navigation to push the drill page
    this.stackNav.push(
      ChallengeDrillsPage,
      { challengeId: challenge.id },
      'challenges'
    );
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#f44336';
      default:
        return '#ffffff';
    }
  }
}
