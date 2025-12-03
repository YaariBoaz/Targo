import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Challenge, ChallengeType } from '@models/challenge.model';
import { ChallengeDrill } from '@models/challenge-drill.model';
import { ChallengeProgress, DrillAttempt, AttemptSummary } from '@models/challenge-progress.model';

@Injectable({
  providedIn: 'root',
})
export class ChallengeService {
  private firestore = inject(Firestore);

  /**
   * Get all challenges by type
   */
  async getChallengesByType(type: ChallengeType): Promise<Challenge[]> {
    try {
      const challengesCol = collection(this.firestore, 'challenges');
      const q = query(
        challengesCol,
        where('type', '==', type),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const challenges = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data()['createdAt'] as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data()['updatedAt'] as Timestamp)?.toDate() || new Date(),
      })) as Challenge[];

      // Sort by createdAt in memory to avoid composite index requirement
      return challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  }

  /**
   * Get single challenge by ID
   */
  async getChallenge(challengeId: string): Promise<Challenge | null> {
    try {
      const docRef = doc(this.firestore, `challenges/${challengeId}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data()['createdAt'] as Timestamp)?.toDate() || new Date(),
        updatedAt: (docSnap.data()['updatedAt'] as Timestamp)?.toDate() || new Date(),
      } as Challenge;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      throw error;
    }
  }

  /**
   * Get all drills for a challenge
   */
  async getChallengeDrills(challengeId: string): Promise<ChallengeDrill[]> {
    try {
      const drillsCol = collection(this.firestore, `challenges/${challengeId}/drills`);
      const q = query(drillsCol, orderBy('order', 'asc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChallengeDrill[];
    } catch (error) {
      console.error('Error fetching challenge drills:', error);
      throw error;
    }
  }

  /**
   * Get user's challenge progress
   */
  async getUserChallengeProgress(userId: string, challengeId: string): Promise<ChallengeProgress | null> {
    try {
      const docRef = doc(this.firestore, `users/${userId}/challengeProgress/${challengeId}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return {
        id: docSnap.id,
        ...docSnap.data(),
        startedAt: (docSnap.data()['startedAt'] as Timestamp)?.toDate() || new Date(),
        completedAt: docSnap.data()['completedAt']
          ? (docSnap.data()['completedAt'] as Timestamp).toDate()
          : undefined,
        lastActivityAt: (docSnap.data()['lastActivityAt'] as Timestamp)?.toDate() || new Date(),
      } as ChallengeProgress;
    } catch (error) {
      console.error('Error fetching user challenge progress:', error);
      throw error;
    }
  }

  /**
   * Get all challenges user has started
   */
  async getUserActiveChallenges(userId: string): Promise<ChallengeProgress[]> {
    try {
      const progressCol = collection(this.firestore, `users/${userId}/challengeProgress`);
      const q = query(progressCol, orderBy('lastActivityAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startedAt: (doc.data()['startedAt'] as Timestamp)?.toDate() || new Date(),
        completedAt: doc.data()['completedAt']
          ? (doc.data()['completedAt'] as Timestamp).toDate()
          : undefined,
        lastActivityAt: (doc.data()['lastActivityAt'] as Timestamp)?.toDate() || new Date(),
      })) as ChallengeProgress[];
    } catch (error) {
      console.error('Error fetching user active challenges:', error);
      throw error;
    }
  }

  /**
   * Start a challenge (create progress record)
   */
  async startChallenge(userId: string, challenge: Challenge): Promise<void> {
    try {
      const progressRef = doc(this.firestore, `users/${userId}/challengeProgress/${challenge.id}`);

      const progress = {
        challengeId: challenge.id,
        userId,
        status: 'started',
        startedAt: serverTimestamp(),
        completedDrills: 0,
        totalDrills: challenge.drillsCount,
        progress: 0,
        lastActivityAt: serverTimestamp(),
      };

      await setDoc(progressRef, progress);
      console.log('Challenge started:', challenge.id);
    } catch (error) {
      console.error('Error starting challenge:', error);
      throw error;
    }
  }

  /**
   * Get drill attempt data
   */
  async getDrillAttempt(
    userId: string,
    challengeId: string,
    drillId: string
  ): Promise<DrillAttempt | null> {
    try {
      const docRef = doc(
        this.firestore,
        `users/${userId}/challengeProgress/${challengeId}/drillAttempts/${drillId}`
      );
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return {
        id: docSnap.id,
        ...docSnap.data(),
        firstCompletedAt: docSnap.data()['firstCompletedAt']
          ? (docSnap.data()['firstCompletedAt'] as Timestamp).toDate()
          : undefined,
        lastAttemptAt: (docSnap.data()['lastAttemptAt'] as Timestamp)?.toDate() || new Date(),
        attempts: docSnap.data()['attempts'].map((a: any) => ({
          ...a,
          completedAt: (a.completedAt as Timestamp).toDate(),
        })),
      } as DrillAttempt;
    } catch (error) {
      console.error('Error fetching drill attempt:', error);
      throw error;
    }
  }

  /**
   * Get all drill attempts for a challenge
   */
  async getChallengeDrillAttempts(userId: string, challengeId: string): Promise<DrillAttempt[]> {
    try {
      const attemptsCol = collection(
        this.firestore,
        `users/${userId}/challengeProgress/${challengeId}/drillAttempts`
      );
      const q = query(attemptsCol, orderBy('lastAttemptAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        firstCompletedAt: doc.data()['firstCompletedAt']
          ? (doc.data()['firstCompletedAt'] as Timestamp).toDate()
          : undefined,
        lastAttemptAt: (doc.data()['lastAttemptAt'] as Timestamp)?.toDate() || new Date(),
        attempts: doc.data()['attempts'].map((a: any) => ({
          ...a,
          completedAt: (a.completedAt as Timestamp).toDate(),
        })),
      })) as DrillAttempt[];
    } catch (error) {
      console.error('Error fetching challenge drill attempts:', error);
      throw error;
    }
  }

  /**
   * Update drill attempt after completion
   */
  async updateDrillAttempt(
    userId: string,
    challengeId: string,
    drillId: string,
    sessionId: string,
    score: number,
    stars: number
  ): Promise<void> {
    try {
      const attemptRef = doc(
        this.firestore,
        `users/${userId}/challengeProgress/${challengeId}/drillAttempts/${drillId}`
      );
      const attemptSnap = await getDoc(attemptRef);

      const now = serverTimestamp();
      const nowDate = new Date(); // Use regular Date for arrays

      const attemptSummary = {
        sessionId,
        score,
        stars,
        completedAt: nowDate, // ✅ Use Date instead of serverTimestamp in array
      };

      if (!attemptSnap.exists()) {
        // First attempt
        const newAttempt = {
          drillId,
          challengeId,
          userId,
          status: 'completed',
          attemptCount: 1,
          bestScore: score,
          bestStars: stars,
          bestSessionId: sessionId,
          attempts: [attemptSummary],
          firstCompletedAt: now, // ✅ serverTimestamp OK at root level
          lastAttemptAt: now,
        };
        await setDoc(attemptRef, newAttempt);
      } else {
        // Subsequent attempt
        const existing = attemptSnap.data() as DrillAttempt;
        const updateData: any = {
          attemptCount: increment(1),
          attempts: [...existing.attempts, attemptSummary],
          lastAttemptAt: now, // ✅ serverTimestamp OK at root level
        };

        // Update best score if this is better
        if (score > existing.bestScore) {
          updateData.bestScore = score;
          updateData.bestStars = stars;
          updateData.bestSessionId = sessionId;
        }

        await updateDoc(attemptRef, updateData);
      }

      // Update challenge progress
      await this.updateChallengeProgress(userId, challengeId);
    } catch (error) {
      console.error('Error updating drill attempt:', error);
      throw error;
    }
  }

  /**
   * Update overall challenge progress
   */
  private async updateChallengeProgress(userId: string, challengeId: string): Promise<void> {
    try {
      const attemptsCol = collection(
        this.firestore,
        `users/${userId}/challengeProgress/${challengeId}/drillAttempts`
      );
      const snapshot = await getDocs(attemptsCol);

      const completedDrills = snapshot.size;
      const progressRef = doc(this.firestore, `users/${userId}/challengeProgress/${challengeId}`);
      const progressSnap = await getDoc(progressRef);

      if (!progressSnap.exists()) return;

      const totalDrills = progressSnap.data()['totalDrills'];
      const progress = Math.round((completedDrills / totalDrills) * 100);
      const status = progress === 100 ? 'completed' : 'in_progress';

      const updateData: any = {
        completedDrills,
        progress,
        status,
        lastActivityAt: serverTimestamp(),
      };

      if (status === 'completed' && !progressSnap.data()['completedAt']) {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(progressRef, updateData);
      console.log('Challenge progress updated:', challengeId, `${progress}%`);
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  /**
   * Check if next drill is unlocked (sequential unlocking)
   */
  async isNextDrillUnlocked(
    userId: string,
    challengeId: string,
    currentDrillOrder: number
  ): Promise<boolean> {
    try {
      if (currentDrillOrder === 1) return true; // First drill is always unlocked

      // Check if previous drill is completed
      const drills = await this.getChallengeDrills(challengeId);
      const previousDrill = drills.find((d) => d.order === currentDrillOrder - 1);

      if (!previousDrill) return false;

      const previousAttempt = await this.getDrillAttempt(userId, challengeId, previousDrill.id);

      return previousAttempt !== null && previousAttempt.status === 'completed';
    } catch (error) {
      console.error('Error checking drill unlock status:', error);
      return false;
    }
  }
}
