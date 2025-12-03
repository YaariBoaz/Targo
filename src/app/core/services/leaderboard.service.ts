import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from '@angular/fire/firestore';

export interface UserScore {
  uid: string;
  displayName: string;
  photoURL?: string;
  ratingPoints: number;
  totalDrills: number;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private firestore = inject(Firestore);

  /**
   * Get global leaderboard sorted by rating points
   */
  async getGlobalLeaderboard(limitCount: number = 100): Promise<UserScore[]> {
    try {
      const scoresRef = collection(this.firestore, 'user-scores');
      const leaderboardQuery = query(
        scoresRef,
        orderBy('ratingPoints', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(leaderboardQuery);
      const scores: UserScore[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data['displayName'] || 'Unknown User',
          photoURL: data['photoURL'],
          ratingPoints: data['ratingPoints'] || 0,
          totalDrills: data['totalDrills'] || 0,
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        } as UserScore;
      });

      console.log('[LeaderboardService] Fetched', scores.length, 'leaderboard entries');
      return scores;
    } catch (error) {
      console.error('[LeaderboardService] Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's rank in the global leaderboard
   */
  async getUserRank(uid: string, userRatingPoints: number): Promise<number> {
    try {
      // Get all users with higher rating points
      const scoresRef = collection(this.firestore, 'user-scores');
      const higherScoresQuery = query(
        scoresRef,
        orderBy('ratingPoints', 'desc')
      );

      const snapshot = await getDocs(higherScoresQuery);
      let rank = 1;

      for (const doc of snapshot.docs) {
        if (doc.id === uid) {
          break;
        }
        rank++;
      }

      return rank;
    } catch (error) {
      console.error('[LeaderboardService] Error calculating rank:', error);
      return 0;
    }
  }

  /**
   * Update user's score in the leaderboard
   */
  async updateUserScore(
    uid: string,
    displayName: string,
    ratingPoints: number,
    photoURL?: string
  ): Promise<void> {
    try {
      const userScoreRef = doc(this.firestore, `user-scores/${uid}`);

      // Get current score to increment drill count
      const currentScore = await getDoc(userScoreRef);
      const currentDrillCount = currentScore.exists()
        ? (currentScore.data()['totalDrills'] || 0)
        : 0;

      await setDoc(
        userScoreRef,
        {
          displayName,
          photoURL: photoURL || null,
          ratingPoints,
          totalDrills: currentDrillCount + 1,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[LeaderboardService] Updated score for user:', uid, 'RP:', ratingPoints);
    } catch (error) {
      console.error('[LeaderboardService] Error updating user score:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard entries around a specific user
   */
  async getLeaderboardAroundUser(
    uid: string,
    userRatingPoints: number,
    range: number = 2
  ): Promise<{ entries: UserScore[]; userRank: number }> {
    try {
      // Get all leaderboard entries
      const allScores = await this.getGlobalLeaderboard(1000);

      // Find user's position
      const userIndex = allScores.findIndex((score) => score.uid === uid);
      const userRank = userIndex + 1;

      // Calculate the range to show
      const start = Math.max(0, userIndex - range);
      const end = Math.min(allScores.length, userIndex + range + 1);

      const entries = allScores.slice(start, end);

      return { entries, userRank };
    } catch (error) {
      console.error('[LeaderboardService] Error getting leaderboard around user:', error);
      return { entries: [], userRank: 0 };
    }
  }
}
