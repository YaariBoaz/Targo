import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from '@angular/fire/firestore';
import { DrillSessionRecord } from '@models/drill-session-record.model';
import { LeaderboardService } from './leaderboard.service';
import { Auth } from '@angular/fire/auth';

export interface UserStatistics {
  // Rating & Rank
  ratingPoints: number;
  globalRank: number;
  rankChange: number; // +15 positions
  rpChange: number; // +23 RP

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userPosition: number;

  // Performance Stats
  hitRatio: number; // percentage
  hitRatioChange: number; // +2.1%
  accuracy: number; // in cm
  accuracyChange: number; // -0.3cm (negative is better)
  reactionTime: number; // in seconds
  reactionTimeChange: number; // -0.3cm
  groupingTightness: number; // in cm
  groupingChange: number; // -0.3cm
  splitTimes: number; // average in seconds
  splitTimesChange: number; // +0.1s
  sessionVariance: number; // +12.3
  sessionVarianceChange: string; // "More Consistent"

  // Challenge Stats
  challengeCompleteRate: number; // percentage
  challengeCompleteRateChange: number; // +23% This Month

  // Historical data for charts
  accuracyHistory: { date: Date; value: number }[];
  sessionHistory: DrillSessionRecord[];
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  avatar?: string;
  points: number;
  isCurrentUser?: boolean;
  ratingPoints?: number; // Alias for points
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private firestore = inject(Firestore);
  private leaderboardService = inject(LeaderboardService);
  private auth = inject(Auth);

  async getUserStatistics(uid: string): Promise<UserStatistics> {
    console.log('[StatisticsService] Fetching statistics for uid:', uid);

    // Fetch all drill sessions for the user from their drills subcollection
    const sessionsRef = collection(this.firestore, `users/${uid}/drills`);
    const userSessionsQuery = query(
      sessionsRef,
      orderBy('completedAt', 'desc')
    );

    const snapshot = await getDocs(userSessionsQuery);
    console.log('[StatisticsService] Found', snapshot.size, 'drill sessions');

    const sessions: DrillSessionRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('[StatisticsService] Session data:', data);
      return {
        ...data,
        completedAt: data['completedAt'].toDate(),
      } as DrillSessionRecord;
    });

    // Calculate statistics
    const stats = await this.calculateStatistics(sessions, uid);

    return stats;
  }

  private async calculateStatistics(
    sessions: DrillSessionRecord[],
    uid: string
  ): Promise<UserStatistics> {
    if (sessions.length === 0) {
      return this.getEmptyStatistics(uid);
    }

    // Split sessions into current month and previous month for comparison
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const currentMonthSessions = sessions.filter(
      (s) => s.completedAt >= currentMonthStart
    );
    const previousMonthSessions = sessions.filter(
      (s) =>
        s.completedAt >= previousMonthStart && s.completedAt < currentMonthStart
    );

    // Recent sessions for comparison (last 10 vs previous 10)
    const recentSessions = sessions.slice(0, 10);
    const previousSessions = sessions.slice(10, 20);

    // Calculate averages
    const currentAvgs = this.calculateAverages(recentSessions);
    const previousAvgs = this.calculateAverages(previousSessions);

    // Calculate hit ratio (shots within acceptable distance)
    const hitRatio = this.calculateHitRatio(recentSessions);
    const previousHitRatio = this.calculateHitRatio(previousSessions);

    // Calculate challenge completion rate
    const challengeSessions = sessions.filter((s) => s.source === 'challenge');
    const completedChallenges = challengeSessions.filter(
      (s) => s.stars && s.stars > 0
    );
    const challengeCompleteRate =
      challengeSessions.length > 0
        ? (completedChallenges.length / challengeSessions.length) * 100
        : 0;

    const currentMonthChallenges = currentMonthSessions.filter(
      (s) => s.source === 'challenge'
    );
    const previousMonthChallenges = previousMonthSessions.filter(
      (s) => s.source === 'challenge'
    );

    const currentMonthCompleteRate =
      currentMonthChallenges.length > 0
        ? (currentMonthChallenges.filter((s) => s.stars && s.stars > 0).length /
            currentMonthChallenges.length) *
          100
        : 0;
    const previousMonthCompleteRate =
      previousMonthChallenges.length > 0
        ? (previousMonthChallenges.filter((s) => s.stars && s.stars > 0)
            .length /
            previousMonthChallenges.length) *
          100
        : 0;

    // Calculate session variance (consistency)
    const sessionVariance = this.calculateVariance(recentSessions);
    const previousVariance = this.calculateVariance(previousSessions);

    // Generate accuracy history for chart
    const accuracyHistory = this.generateAccuracyHistory(sessions);

    // Calculate rating points (simplified - based on average score)
    const avgScore = this.calculateAverageScore(sessions);
    const ratingPoints = Math.round(avgScore);

    // Get real leaderboard data
    const leaderboardData = await this.leaderboardService.getLeaderboardAroundUser(
      uid,
      ratingPoints,
      2 // Show 2 users above and below
    );

    // Convert to LeaderboardEntry format
    // Find the actual rank of the first entry in the list
    const firstEntryIndex = leaderboardData.entries.length > 0
      ? await this.leaderboardService.getGlobalLeaderboard(1000).then(allScores => {
          const idx = allScores.findIndex(s => s.uid === leaderboardData.entries[0].uid);
          return idx + 1; // Convert to rank (1-based)
        })
      : 1;

    const leaderboard: LeaderboardEntry[] = leaderboardData.entries.map((entry, index) => ({
      rank: firstEntryIndex + index, // Calculate actual rank from first entry
      uid: entry.uid,
      displayName: entry.displayName,
      avatar: entry.photoURL,
      points: entry.ratingPoints,
      isCurrentUser: entry.uid === uid,
    }));

    return {
      ratingPoints,
      globalRank: leaderboardData.userRank,
      rankChange: 15, // TODO: Calculate from previous rank
      rpChange: 23, // TODO: Calculate from previous RP

      leaderboard,
      userPosition: leaderboardData.userRank,

      hitRatio,
      hitRatioChange: hitRatio - previousHitRatio,

      accuracy: currentAvgs.avgDistance,
      accuracyChange: currentAvgs.avgDistance - previousAvgs.avgDistance,

      reactionTime: currentAvgs.avgSplitTime,
      reactionTimeChange: currentAvgs.avgSplitTime - previousAvgs.avgSplitTime,

      groupingTightness: currentAvgs.avgGrouping,
      groupingChange: currentAvgs.avgGrouping - previousAvgs.avgGrouping,

      splitTimes: currentAvgs.avgSplitTime,
      splitTimesChange: currentAvgs.avgSplitTime - previousAvgs.avgSplitTime,

      sessionVariance,
      sessionVarianceChange:
        sessionVariance < previousVariance
          ? 'More Consistent'
          : 'Less Consistent',

      challengeCompleteRate,
      challengeCompleteRateChange:
        currentMonthCompleteRate - previousMonthCompleteRate,

      accuracyHistory,
      sessionHistory: sessions.slice(0, 30), // Last 30 sessions
    };
  }

  private calculateAverages(sessions: DrillSessionRecord[]): {
    avgDistance: number;
    avgSplitTime: number;
    avgGrouping: number;
  } {
    if (sessions.length === 0) {
      return { avgDistance: 0, avgSplitTime: 0, avgGrouping: 0 };
    }

    const totalDistance = sessions.reduce(
      (sum, s) => sum + (s.statistics.avgDistance || 0),
      0
    );
    const totalSplitTime = sessions.reduce(
      (sum, s) => sum + (s.statistics.avgSplitTime || 0),
      0
    );
    const totalGrouping = sessions.reduce(
      (sum, s) => sum + (s.statistics.grouping || 0),
      0
    );

    return {
      avgDistance: totalDistance / sessions.length,
      avgSplitTime: totalSplitTime / sessions.length,
      avgGrouping: totalGrouping / sessions.length,
    };
  }

  private calculateHitRatio(sessions: DrillSessionRecord[]): number {
    if (sessions.length === 0) return 0;

    let totalBullets = 0; // Total bullets fired (from drill setup)
    let actualHits = 0;   // Actual shots that hit the target

    sessions.forEach((session) => {
      // Total bullets that should have been fired
      const expectedBullets = session.drillSetup?.numberOfBullets || 0;
      totalBullets += expectedBullets;

      // Actual shots that registered (hit the target)
      const shotsRecorded = session.shots?.length || 0;
      actualHits += shotsRecorded;

      console.log(`[StatisticsService] Session: ${shotsRecorded}/${expectedBullets} bullets hit target`);
    });

    const hitRatio = totalBullets > 0 ? (actualHits / totalBullets) * 100 : 0;
    console.log(`[StatisticsService] Overall hit ratio: ${hitRatio.toFixed(1)}% (${actualHits}/${totalBullets} bullets hit target)`);
    return hitRatio;
  }

  private calculateVariance(sessions: DrillSessionRecord[]): number {
    if (sessions.length === 0) return 0;

    const distances = sessions.map((s) => s.statistics.avgDistance);
    const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const squaredDiffs = distances.map((d) => Math.pow(d - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, d) => sum + d, 0) / distances.length;

    return Math.round(variance * 10) / 10;
  }

  private calculateAverageScore(sessions: DrillSessionRecord[]): number {
    const scoredSessions = sessions.filter((s) => s.score !== undefined);
    if (scoredSessions.length === 0) return 0;

    const totalScore = scoredSessions.reduce(
      (sum, s) => sum + (s.score || 0),
      0
    );
    return totalScore / scoredSessions.length;
  }

  private generateAccuracyHistory(
    sessions: DrillSessionRecord[]
  ): { date: Date; value: number }[] {
    // Group by date and calculate daily average
    const dailyAverages = new Map<string, { total: number; count: number }>();

    sessions.forEach((session) => {
      const dateKey = session.completedAt.toISOString().split('T')[0];
      const existing = dailyAverages.get(dateKey) || { total: 0, count: 0 };
      existing.total += session.statistics.avgDistance;
      existing.count += 1;
      dailyAverages.set(dateKey, existing);
    });

    const history: { date: Date; value: number }[] = [];
    dailyAverages.forEach((data, dateKey) => {
      history.push({
        date: new Date(dateKey),
        value: data.total / data.count,
      });
    });

    return history.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getEmptyStatistics(uid: string): UserStatistics {
    return {
      ratingPoints: 0,
      globalRank: 0,
      rankChange: 0,
      rpChange: 0,
      leaderboard: [],
      userPosition: 0,
      hitRatio: 0,
      hitRatioChange: 0,
      accuracy: 0,
      accuracyChange: 0,
      reactionTime: 0,
      reactionTimeChange: 0,
      groupingTightness: 0,
      groupingChange: 0,
      splitTimes: 0,
      splitTimesChange: 0,
      sessionVariance: 0,
      sessionVarianceChange: 'No Data',
      challengeCompleteRate: 0,
      challengeCompleteRateChange: 0,
      accuracyHistory: [],
      sessionHistory: [],
    };
  }

  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const scores = await this.leaderboardService.getGlobalLeaderboard(limit);
    return scores.map((score, index) => ({
      rank: index + 1,
      uid: score.uid,
      displayName: score.displayName,
      avatar: score.photoURL,
      points: score.ratingPoints,
      isCurrentUser: false,
    }));
  }
}
