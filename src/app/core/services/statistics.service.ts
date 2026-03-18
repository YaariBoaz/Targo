import { Injectable, inject } from '@angular/core';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { DrillSessionRecord } from '@models/drill-session-record.model';
import { LeaderboardService } from './leaderboard.service';
import { FirebaseService } from '@shared/services/firebase.service';

export interface UserStatistics {
  // Rating & Rank
  ratingPoints: number;
  globalRank: number;
  rankChange: number;
  rpChange: number;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userPosition: number;

  // Performance Stats
  hitRatio: number;
  hitRatioChange: number;
  accuracy: number;
  accuracyChange: number;
  reactionTime: number;
  reactionTimeChange: number;
  groupingTightness: number;
  groupingChange: number;
  splitTimes: number;
  splitTimesChange: number;
  sessionVariance: number;
  sessionVarianceChange: string;

  // Challenge Stats
  challengeCompleteRate: number;
  challengeCompleteRateChange: number;

  // Historical data for charts
  accuracyHistory: { date: Date; value: number }[];
  sessionHistory: DrillSessionRecord[];
}

// Lightweight stats used by the home page — no leaderboard needed
export interface HomeStatistics {
  hitRatio: number;
  hitRatioChange: number;
  accuracy: number;
  accuracyChange: number;
  splitTimes: number;
  splitTimesChange: number;
  avgGrouping: number;
  groupingChange: number;
  sessionHistory: DrillSessionRecord[];
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  avatar?: string;
  points: number;
  isCurrentUser?: boolean;
  ratingPoints?: number;
}

// Simple in-memory cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private firebase = inject(FirebaseService);
  private leaderboardService = inject(LeaderboardService);

  // Cache TTL: 5 minutes
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private fullStatsCache = new Map<string, CacheEntry<UserStatistics>>();
  private homeStatsCache = new Map<string, CacheEntry<HomeStatistics>>();

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Full statistics including leaderboard — used by the statistics page. */
  async getUserStatistics(uid: string): Promise<UserStatistics> {
    const cached = this.fullStatsCache.get(uid);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      console.log('[StatisticsService] Returning cached full stats for:', uid);
      return cached.data;
    }

    const sessions = await this.fetchSessions(uid);
    const stats = await this.calculateStatistics(sessions, uid);

    this.fullStatsCache.set(uid, { data: stats, timestamp: Date.now() });
    return stats;
  }

  /**
   * Lightweight statistics for the home page.
   * Only fetches drill sessions — no leaderboard, no ranking queries.
   */
  async getHomeStatistics(uid: string): Promise<HomeStatistics> {
    const cached = this.homeStatsCache.get(uid);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      console.log('[StatisticsService] Returning cached home stats for:', uid);
      return cached.data;
    }

    const sessions = await this.fetchSessions(uid);
    const stats = this.calculateHomeStatistics(sessions);

    this.homeStatsCache.set(uid, { data: stats, timestamp: Date.now() });
    return stats;
  }

  /** Call after completing a drill to invalidate caches for that user. */
  invalidateCache(uid: string): void {
    this.fullStatsCache.delete(uid);
    this.homeStatsCache.delete(uid);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async fetchSessions(uid: string): Promise<DrillSessionRecord[]> {
    console.log('[StatisticsService] Fetching drill sessions for uid:', uid);
    const sessionsRef = collection(this.firebase.db, `users/${uid}/drills`);
    const snapshot = await getDocs(query(sessionsRef, orderBy('completedAt', 'desc')));
    console.log('[StatisticsService] Found', snapshot.size, 'drill sessions');

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        completedAt: data['completedAt'] ? data['completedAt'].toDate() : new Date(),
      } as DrillSessionRecord;
    });

    if (sessions.length > 0) {
      const s = sessions[0];
      console.log('[StatisticsService] Sample session:', {
        shots: s.shots?.length,
        numberOfBullets: s.drillSetup?.numberOfBullets,
        avgSplitTime: s.statistics?.avgSplitTime,
        avgDistance: s.statistics?.avgDistance,
        source: s.source,
      });
    }

    return sessions;
  }

  private calculateHomeStatistics(sessions: DrillSessionRecord[]): HomeStatistics {
    if (sessions.length === 0) {
      return {
        hitRatio: 0, hitRatioChange: 0,
        accuracy: 0, accuracyChange: 0,
        splitTimes: 0, splitTimesChange: 0,
        avgGrouping: 0, groupingChange: 0,
        sessionHistory: [],
      };
    }

    const recent = sessions.slice(0, 10);
    const previous = sessions.slice(10, 20);

    const currentAvgs = this.calculateAverages(recent);
    const previousAvgs = this.calculateAverages(previous);
    const hitRatio = this.calculateHitRatio(recent);
    const previousHitRatio = this.calculateHitRatio(previous);

    const result = {
      hitRatio,
      hitRatioChange: hitRatio - previousHitRatio,
      accuracy: currentAvgs.avgDistance,
      accuracyChange: currentAvgs.avgDistance - previousAvgs.avgDistance,
      splitTimes: currentAvgs.avgSplitTime,
      splitTimesChange: currentAvgs.avgSplitTime - previousAvgs.avgSplitTime,
      avgGrouping: currentAvgs.avgGrouping,
      groupingChange: currentAvgs.avgGrouping - previousAvgs.avgGrouping,
      sessionHistory: sessions.slice(0, 30),
    };
    console.log('[StatisticsService] Home stats result:', result);
    return result;
  }

  private async calculateStatistics(
    sessions: DrillSessionRecord[],
    uid: string
  ): Promise<UserStatistics> {
    if (sessions.length === 0) {
      return this.getEmptyStatistics();
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthSessions = sessions.filter((s) => s.completedAt >= currentMonthStart);
    const previousMonthSessions = sessions.filter(
      (s) => s.completedAt >= previousMonthStart && s.completedAt < currentMonthStart
    );

    const recentSessions = sessions.slice(0, 10);
    const previousSessions = sessions.slice(10, 20);

    const currentAvgs = this.calculateAverages(recentSessions);
    const previousAvgs = this.calculateAverages(previousSessions);
    const hitRatio = this.calculateHitRatio(recentSessions);
    const previousHitRatio = this.calculateHitRatio(previousSessions);

    const challengeSessions = sessions.filter((s) => s.source === 'challenge');
    const completedChallenges = challengeSessions.filter((s) => s.stars && s.stars > 0);
    const challengeCompleteRate =
      challengeSessions.length > 0
        ? (completedChallenges.length / challengeSessions.length) * 100
        : 0;

    const currentMonthChallenges = currentMonthSessions.filter((s) => s.source === 'challenge');
    const previousMonthChallenges = previousMonthSessions.filter((s) => s.source === 'challenge');
    const currentMonthCompleteRate =
      currentMonthChallenges.length > 0
        ? (currentMonthChallenges.filter((s) => s.stars && s.stars > 0).length /
            currentMonthChallenges.length) * 100
        : 0;
    const previousMonthCompleteRate =
      previousMonthChallenges.length > 0
        ? (previousMonthChallenges.filter((s) => s.stars && s.stars > 0).length /
            previousMonthChallenges.length) * 100
        : 0;

    const sessionVariance = this.calculateVariance(recentSessions);
    const previousVariance = this.calculateVariance(previousSessions);
    const accuracyHistory = this.generateAccuracyHistory(sessions);
    const avgScore = this.calculateAverageScore(sessions);
    const ratingPoints = Math.round(avgScore);

    // Single leaderboard fetch — no duplicate call
    const leaderboardData = await this.leaderboardService.getLeaderboardAroundUser(
      uid,
      ratingPoints,
      2
    );

    // Derive the rank of the first entry from userRank + range (no extra fetch needed)
    const firstEntryRank = leaderboardData.entries.length > 0
      ? Math.max(1, leaderboardData.userRank - 2)
      : 1;

    const leaderboard: LeaderboardEntry[] = leaderboardData.entries.map((entry, index) => ({
      rank: firstEntryRank + index,
      uid: entry.uid,
      displayName: entry.displayName,
      avatar: entry.photoURL,
      points: entry.ratingPoints,
      isCurrentUser: entry.uid === uid,
    }));

    return {
      ratingPoints,
      globalRank: leaderboardData.userRank,
      rankChange: 15,
      rpChange: 23,
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
      sessionVarianceChange: sessionVariance < previousVariance ? 'More Consistent' : 'Less Consistent',
      challengeCompleteRate,
      challengeCompleteRateChange: currentMonthCompleteRate - previousMonthCompleteRate,
      accuracyHistory,
      sessionHistory: sessions.slice(0, 30),
    };
  }

  private calculateAverages(sessions: DrillSessionRecord[]): {
    avgDistance: number;
    avgSplitTime: number;
    avgGrouping: number;
  } {
    if (sessions.length === 0) return { avgDistance: 0, avgSplitTime: 0, avgGrouping: 0 };

    return {
      avgDistance: sessions.reduce((sum, s) => sum + (s.statistics.avgDistance || 0), 0) / sessions.length,
      avgSplitTime: sessions.reduce((sum, s) => sum + (s.statistics.avgSplitTime || 0), 0) / sessions.length,
      avgGrouping: sessions.reduce((sum, s) => sum + (s.statistics.grouping || 0), 0) / sessions.length,
    };
  }

  private calculateHitRatio(sessions: DrillSessionRecord[]): number {
    if (sessions.length === 0) return 0;

    let totalBullets = 0;
    let actualHits = 0;

    sessions.forEach((session) => {
      totalBullets += session.drillSetup?.numberOfBullets || 0;
      actualHits += session.shots?.length || 0;
    });

    return totalBullets > 0 ? (actualHits / totalBullets) * 100 : 0;
  }

  private calculateVariance(sessions: DrillSessionRecord[]): number {
    if (sessions.length === 0) return 0;
    const distances = sessions.map((s) => s.statistics.avgDistance);
    const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length;
    return Math.round(variance * 10) / 10;
  }

  private calculateAverageScore(sessions: DrillSessionRecord[]): number {
    const scored = sessions.filter((s) => s.score !== undefined);
    if (scored.length === 0) return 0;
    return scored.reduce((sum, s) => sum + (s.score || 0), 0) / scored.length;
  }

  private generateAccuracyHistory(sessions: DrillSessionRecord[]): { date: Date; value: number }[] {
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
      history.push({ date: new Date(dateKey), value: data.total / data.count });
    });
    return history.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getEmptyStatistics(): UserStatistics {
    return {
      ratingPoints: 0, globalRank: 0, rankChange: 0, rpChange: 0,
      leaderboard: [], userPosition: 0,
      hitRatio: 0, hitRatioChange: 0,
      accuracy: 0, accuracyChange: 0,
      reactionTime: 0, reactionTimeChange: 0,
      groupingTightness: 0, groupingChange: 0,
      splitTimes: 0, splitTimesChange: 0,
      sessionVariance: 0, sessionVarianceChange: 'No Data',
      challengeCompleteRate: 0, challengeCompleteRateChange: 0,
      accuracyHistory: [], sessionHistory: [],
    };
  }

  async getLeaderboard(limitCount: number = 100): Promise<LeaderboardEntry[]> {
    const scores = await this.leaderboardService.getGlobalLeaderboard(limitCount);
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
