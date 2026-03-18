import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, close } from 'ionicons/icons';
import { Auth } from '@angular/fire/auth';
import { UserHeaderComponent } from '@shared/components/user-header/user-header.component';
import { ChallengeService } from '@core/services/challenge.service';
import { StackNavigationService } from '@core/services/stack-navigation.service';
import { TabRefreshService } from '@core/services/tab-refresh.service';
import { Challenge } from '@models/challenge.model';
import { ChallengeDrillsPage } from '../challenge-drills/challenge-drills.page';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, UserHeaderComponent],
  templateUrl: './challenges.page.html',
  styleUrl: './challenges.page.scss',
})
export class ChallengesPage implements OnInit, OnDestroy {
  private stackNav = inject(StackNavigationService);
  private challengeService = inject(ChallengeService);
  private auth = inject(Auth);
  private tabRefreshService = inject(TabRefreshService);
  private tabSubscription?: Subscription;

  isLoading = false;

  allChallenges: Challenge[] = [];

  constructor() {
    addIcons({ arrowBack, close });
  }

  async ngOnInit() {
    await this.loadChallenges();

    // Subscribe to tab changes to reload challenges when challenges tab is activated
    this.tabSubscription = this.tabRefreshService.tabChange$.subscribe(async (tabName) => {
      if (tabName === 'challenges') {
        console.log('Challenges page - Challenges tab activated, refreshing challenges...');
        await this.loadChallenges();
      }
    });
  }

  ngOnDestroy() {
    this.tabSubscription?.unsubscribe();
  }

  private async loadChallenges() {
    this.isLoading = true;

    try {
      const [global, heroes] = await Promise.all([
        this.challengeService.getChallengesByType('global'),
        this.challengeService.getChallengesByType('heroes'),
      ]);

      this.allChallenges = [...global, ...heroes];
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      this.isLoading = false;
    }
  }

  close() {
    // Pop to root will go back to the challenges tab root
    this.stackNav.popToRoot('challenges');
  }

  async onChallengeClick(challenge: Challenge) {
    console.log('Challenge clicked:', challenge);

    // If user is authenticated and clicks a challenge they haven't started, start it
    if (this.auth.currentUser) {
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
