import { Injectable, Injector } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { FirebaseService } from './firebase.service';
import {
  ShootingSession,
  ShootingSessionResult,
  ShootingConfig,
  HitPoint,
  ShotStat,
} from '../models/shot-stat';

@Injectable({
  providedIn: 'root',
})
export class ShootingSessionService {
  constructor(private firebase: FirebaseService, private injector: Injector) {}

  /**
   * Creates a new shooting session in Firebase
   */
  async createSession(
    session: Omit<ShootingSession, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const sessionsRef = collection(
        this.firebase.db,
        `users/${session.userId}/shooting-sessions`
      );

      const sessionData = {
        ...session,
        createdAt: Date.now(),
      };

      const docRef = await addDoc(sessionsRef, sessionData);
      console.log('Shooting session created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating shooting session:', error);
      throw error;
    }
  }

  /**
   * Updates an existing shooting session
   */
  async updateSession(
    userId: string,
    sessionId: string,
    updates: Partial<ShootingSession>
  ): Promise<void> {
    try {
      const sessionRef = doc(
        this.firebase.db,
        `users/${userId}/shooting-sessions/${sessionId}`
      );

      await updateDoc(sessionRef, updates);
      console.log('Shooting session updated:', sessionId);
    } catch (error) {
      console.error('Error updating shooting session:', error);
      throw error;
    }
  }

  /**
   * Completes a shooting session by calculating results and updating end time
   */
  async completeSession(
    userId: string,
    sessionId: string,
    hitPoints: HitPoint[],
    shotStats: ShotStat[],
    username?: string,
    avatar?: string
  ): Promise<void> {
    try {
      const results = this.calculateResults(hitPoints, shotStats);
      const updates: Partial<ShootingSession> = {
        endTime: Date.now(),
        hitPoints,
        shotStats,
        totalShots: shotStats.length,
        results,
      };

      await this.updateSession(userId, sessionId, updates);
      console.log('Shooting session completed:', sessionId);

      // 🔥 UPDATE: Re-enabled automatic ranking score update after session completion
      try {
        // Use injector to avoid circular dependency
        const rankingService = this.injector.get(
          await import('./ranking.service').then((m) => m.RankingService)
        );
        await rankingService.updateUserScore(
          userId,
          username || userId,
          avatar
        );
        console.log('User ranking score updated after session completion');
      } catch (rankingError) {
        console.warn(
          'Failed to update ranking score (non-critical):',
          rankingError
        );
        // Don't throw - ranking update failure shouldn't prevent session completion
      }
    } catch (error) {
      console.error('Error completing shooting session:', error);
      throw error;
    }
  }

  /**
   * Gets a specific shooting session
   */
  async getSession(
    userId: string,
    sessionId: string
  ): Promise<ShootingSession | null> {
    try {
      const sessionRef = doc(
        this.firebase.db,
        `users/${userId}/shooting-sessions/${sessionId}`
      );

      const docSnap = await getDoc(sessionRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ShootingSession;
      }

      return null;
    } catch (error) {
      console.error('Error getting shooting session:', error);
      throw error;
    }
  }

  /**
   * Gets all shooting sessions for a user
   */
  getUserSessions(
    userId: string,
    limitCount: number = 50
  ): Observable<ShootingSession[]> {
    // Note: This method has session path issues - used for stats only, not rankings

    // Query the correct subcollection path: users/{userId}/shooting-sessions
    const sessionsRef = collection(
      this.firebase.db,
      `users/${userId}/shooting-sessions`
    );

    return from(
      getDocs(
        query(sessionsRef, orderBy('createdAt', 'desc'), limit(limitCount))
      )
    ).pipe(
      map((snapshot) => {
        console.log('Query completed successfully');
        console.log(
          'Documents in users/' + userId + '/shooting-sessions:',
          snapshot.size
        );

        if (snapshot.size > 0) {
          console.log('FOUND SESSIONS in subcollection!');
          snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`Session ${index + 1}:`, {
              id: doc.id,
              endTime: data['endTime'],
              results: data['results'],
              hitPoints: data['hitPoints']
                ? `${data['hitPoints'].length} points`
                : 'none',
              config: data['config'],
              fullData: data,
            });
          });

          const userSessions = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ShootingSession)
          );
          console.log('Total sessions for user:', userSessions.length);
          return userSessions;
        }

        console.log('No sessions found in subcollection');
        return [];
      }),
      catchError((error) => {
        console.error('ERROR querying sessions:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return of([]);
      })
    );
  }

  /**
   * Gets recent sessions for a specific mode
   */
  getSessionsByMode(
    userId: string,
    mode: 'training' | 'challenge' | 'league',
    limitCount: number = 20
  ): Observable<ShootingSession[]> {
    const sessionsRef = collection(
      this.firebase.db,
      `users/${userId}/shooting-sessions`
    );

    const q = query(
      sessionsRef,
      where('mode', '==', mode),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as ShootingSession)
        )
      )
    );
  }

  /**
   * Deletes a shooting session
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(
        this.firebase.db,
        `users/${userId}/shooting-sessions/${sessionId}`
      );

      await deleteDoc(sessionRef);
      console.log('Shooting session deleted:', sessionId);
    } catch (error) {
      console.error('Error deleting shooting session:', error);
      throw error;
    }
  }

  /**
   * Gets user statistics based on all completed sessions
   */
  async getUserStats(userId: string): Promise<{
    totalSessions: number;
    totalShots: number;
    totalBullseyes: number;
    averageAccuracy: number;
    bestSplitTime: number;
    averageSessionTime: number;
  }> {
    try {
      const sessions =
        (await this.getUserSessions(userId, 1000).toPromise()) || [];
      const completedSessions = sessions.filter((s) => s.results);

      if (!completedSessions.length) {
        return {
          totalSessions: 0,
          totalShots: 0,
          totalBullseyes: 0,
          averageAccuracy: 0,
          bestSplitTime: 0,
          averageSessionTime: 0,
        };
      }

      const totalShots = completedSessions.reduce(
        (sum, s) => sum + (s.results?.totalShots || 0),
        0
      );
      const totalBullseyes = completedSessions.reduce(
        (sum, s) => sum + (s.results?.bullseyes || 0),
        0
      );
      const totalAccuracy = completedSessions.reduce(
        (sum, s) => sum + (s.results?.hitRate || 0),
        0
      );
      const bestSplitTime = Math.min(
        ...completedSessions.map((s) => s.results?.bestSplitTime || Infinity)
      );
      const totalSessionTime = completedSessions.reduce(
        (sum, s) => sum + s.elapsedTime,
        0
      );

      return {
        totalSessions: completedSessions.length,
        totalShots,
        totalBullseyes,
        averageAccuracy: totalAccuracy / completedSessions.length,
        bestSplitTime: bestSplitTime === Infinity ? 0 : bestSplitTime,
        averageSessionTime: totalSessionTime / completedSessions.length,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Private helper to calculate session results
   */
  private calculateResults(
    hitPoints: HitPoint[],
    shotStats: ShotStat[]
  ): ShootingSessionResult {
    if (!hitPoints.length || !shotStats.length) {
      return {
        totalShots: 0,
        bullseyes: 0,
        hitRate: 0,
        bestSplitTime: 0,
        avgDistance: 0,
        avgSplitTime: 0,
      };
    }

    const bullseyes = hitPoints.filter(
      (hit) => hit.distanceFromCenter <= 10
    ).length;
    const hitRate = this.calculateAccuracy(hitPoints);
    const avgDistance =
      hitPoints.reduce((sum, hit) => sum + hit.distanceFromCenter, 0) /
      hitPoints.length;
    const splitTimes = shotStats.slice(1).map((stat) => stat.splitTime);
    const bestSplitTime = splitTimes.length ? Math.min(...splitTimes) : 0;
    const avgSplitTime = splitTimes.length
      ? splitTimes.reduce((sum, time) => sum + time, 0) / splitTimes.length
      : 0;

    return {
      totalShots: shotStats.length,
      bullseyes,
      hitRate: +hitRate.toFixed(2),
      bestSplitTime: +bestSplitTime.toFixed(2),
      avgDistance: +avgDistance.toFixed(2),
      avgSplitTime: +avgSplitTime.toFixed(2),
    };
  }

  /**
   * Private helper to calculate accuracy percentage
   */
  private calculateAccuracy(hitPoints: HitPoint[]): number {
    if (!hitPoints.length) return 0;
    const maxDistance = 100;
    const totalAccuracy = hitPoints.reduce((sum, shot) => {
      const acc = Math.max(0, 1 - shot.distanceFromCenter / maxDistance);
      return sum + acc;
    }, 0);
    return (totalAccuracy / hitPoints.length) * 100;
  }
}
