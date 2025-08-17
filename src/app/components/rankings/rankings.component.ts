import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  RankingService,
  UserScore,
} from '../../shared/services/ranking.service';
import { UserStoreService } from '../../shared/services/authentication/user-store.service';
import { ShootingSessionService } from '../../shared/services/shooting-session.service';

interface RankingDisplay {
  name: string;
  points: number;
  avatar: string;
  isYou?: boolean;
  rank: number;
  userId: string;
}

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class RankingsComponent implements OnInit, OnDestroy {
  ranking: RankingDisplay[] = [];
  loading = true;
  currentUser: any;
  userScore: UserScore | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private rankingService: RankingService,
    private userStoreService: UserStoreService,
    private shootingSessionService: ShootingSessionService
  ) {}

  ngOnInit() {
    this.currentUser = this.userStoreService.user;
    this.loadRankings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadRankings() {
    try {
      // First, check if current user needs score backfill
      await this.ensureUserHasScore();

      // Load global rankings
      this.rankingService
        .getGlobalRankings(50)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (rankings) => {
            this.ranking = this.mapToRankingDisplay(rankings);

            // Find current user's score in the rankings
            this.userScore =
              rankings.find((r) => r.userId === this.currentUser?.email) ||
              null;

            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading rankings:', error);
            this.loading = false;
          },
        });
    } catch (error) {
      console.error('Error loading rankings:', error);
      this.loading = false;
    }
  }

  /**
   * Ensures current user has a score record, creates one if missing
   */
  private async ensureUserHasScore(): Promise<void> {
    if (!this.currentUser?.email) {
      console.warn('No current user email found for score calculation');
      return;
    }

    try {
      // Check if user already has a score record
      const existingRank = await this.rankingService.getUserRank(
        this.currentUser.email
      );

      if (existingRank === -1) {
        // User not ranked yet - backfill from existing sessions
        const sessions =
          (await this.shootingSessionService
            .getUserSessions(this.currentUser.email, 100)
            .toPromise()) || [];

        const completedSessions = sessions.filter((s) => {
          return s.endTime && s.results && s.hitPoints?.length > 0;
        });

        if (completedSessions.length > 0) {
          // Create initial score record from existing sessions
          await this.rankingService.updateUserScore(
            this.currentUser.email,
            this.currentUser.nickname || this.currentUser.email,
            this.currentUser.imgUrl
          );
        }
      }
    } catch (error) {
      console.error('ERROR in ensureUserHasScore:', error);
    }
  }

  private mapToRankingDisplay(userScores: UserScore[]): RankingDisplay[] {
    return userScores.map((score) => ({
      name: score.username.toUpperCase(),
      points: score.totalScore,
      avatar: score.avatar || `https://i.pravatar.cc/40?u=${score.userId}`,
      rank: score.rank,
      userId: score.userId,
      isYou: this.currentUser?.email === score.userId,
    }));
  }

  async refreshRankings() {
    this.loading = true;

    // Force update current user's score, then reload rankings
    if (this.currentUser?.email) {
      try {
        await this.rankingService.updateUserScore(
          this.currentUser.email,
          this.currentUser.nickname || this.currentUser.email,
          this.currentUser.imgUrl
        );
      } catch (error) {
        console.warn('Failed to refresh user score:', error);
      }
    }

    await this.loadRankings();
  }

  // TEST: Create a sample score directly to test the display
  async createTestScore() {
    if (!this.currentUser?.email) return;
    
    try {
      // Create a test score directly in user-scores collection
      const testScore = {
        userId: this.currentUser.email,
        username: this.currentUser.nickname || this.currentUser.email,
        avatar: this.currentUser.imgUrl,
        totalScore: 750,
        rank: 1,
        sessionCount: 3,
        lastUpdated: Date.now(),
        accuracyScore: 250,
        speedScore: 180,
        consistencyScore: 160,
        difficultyScore: 100,
        volumeScore: 60
      };

      await this.rankingService.createDirectScore(this.currentUser.email, testScore);
      console.log('Test score created successfully');
      await this.loadRankings();
    } catch (error) {
      console.error('Failed to create test score:', error);
    }
  }

  getScoreBreakdown(): string {
    if (!this.userScore) return '';

    return `Accuracy: ${this.userScore.accuracyScore} | Speed: ${this.userScore.speedScore} | Consistency: ${this.userScore.consistencyScore}`;
  }

  getRankSuffix(rank: number): string {
    if (rank % 10 === 1 && rank % 100 !== 11) return 'st';
    if (rank % 10 === 2 && rank % 100 !== 12) return 'nd';
    if (rank % 10 === 3 && rank % 100 !== 13) return 'rd';
    return 'th';
  }
}
