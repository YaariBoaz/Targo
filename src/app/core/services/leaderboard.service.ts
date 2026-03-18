import { Injectable, inject } from '@angular/core';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { FirebaseService } from '@shared/services/firebase.service';

export interface UserScore {
  uid: string;
  displayName: string;
  photoURL?: string;
  ratingPoints: number;
  totalDrills: number;
  updatedAt: Date;
}

export interface ChallengeLeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalScore: number;
  completedDrills: number;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private firebase = inject(FirebaseService);

  async getGlobalLeaderboard(limitCount: number = 100): Promise<UserScore[]> {
    try {
      const scoresRef = collection(this.firebase.db, 'user-scores');
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

  async getUserRank(uid: string, userRatingPoints: number): Promise<number> {
    try {
      const scoresRef = collection(this.firebase.db, 'user-scores');
      const higherScoresQuery = query(scoresRef, orderBy('ratingPoints', 'desc'));
      const snapshot = await getDocs(higherScoresQuery);
      let rank = 1;
      for (const doc of snapshot.docs) {
        if (doc.id === uid) break;
        rank++;
      }
      return rank;
    } catch (error) {
      console.error('[LeaderboardService] Error calculating rank:', error);
      return 0;
    }
  }

  async updateUserScore(
    uid: string,
    displayName: string,
    ratingPoints: number,
    photoURL?: string
  ): Promise<void> {
    try {
      const userScoreRef = doc(this.firebase.db, `user-scores/${uid}`);
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

  async getChallengeLeaderboard(challengeId: string, limitCount: number = 100): Promise<ChallengeLeaderboardEntry[]> {
    try {
      const ref = collection(this.firebase.db, `challenges/${challengeId}/leaderboard`);
      const q = query(ref, orderBy('totalScore', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          displayName: data['displayName'] || 'Unknown',
          photoURL: data['photoURL'],
          totalScore: data['totalScore'] || 0,
          completedDrills: data['completedDrills'] || 0,
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        } as ChallengeLeaderboardEntry;
      });
    } catch (error) {
      console.error('[LeaderboardService] Error fetching challenge leaderboard:', error);
      return [];
    }
  }

  async updateChallengeLeaderboard(
    uid: string,
    challengeId: string,
    displayName: string,
    totalScore: number,
    completedDrills: number,
    photoURL?: string
  ): Promise<void> {
    try {
      const ref = doc(this.firebase.db, `challenges/${challengeId}/leaderboard/${uid}`);
      await setDoc(ref, {
        displayName,
        photoURL: photoURL || null,
        totalScore,
        completedDrills,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('[LeaderboardService] Error updating challenge leaderboard:', error);
    }
  }

  async getLeaderboardAroundUser(
    uid: string,
    userRatingPoints: number,
    range: number = 2
  ): Promise<{ entries: UserScore[]; userRank: number }> {
    try {
      const allScores = await this.getGlobalLeaderboard(1000);
      const userIndex = allScores.findIndex((score) => score.uid === uid);
      const userRank = userIndex + 1;
      const start = Math.max(0, userIndex - range);
      const end = Math.min(allScores.length, userIndex + range + 1);
      return { entries: allScores.slice(start, end), userRank };
    } catch (error) {
      console.error('[LeaderboardService] Error getting leaderboard around user:', error);
      return { entries: [], userRank: 0 };
    }
  }
}
