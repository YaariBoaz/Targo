import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { DrillSession, DrillSetup, DrillResult, DrillStatus } from '@models/drill-session.model';
import { DrillSessionRecord } from '@models/drill-session-record.model';
import { LeaderboardService } from './leaderboard.service';

@Injectable({
  providedIn: 'root',
})
export class DrillService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private leaderboardService = inject(LeaderboardService);
  private currentDrillSession: DrillSession | null = null;
  private currentDrillSetup: DrillSetup | null = null;
  private currentUserId: string | null = null;

  constructor() {}

  /**
   * Store drill setup in memory (not saved to Firestore yet)
   * This is used when starting a drill - we save the setup but don't persist until completion
   */
  setCurrentDrillSetup(userId: string, setup: DrillSetup): void {
    this.currentUserId = userId;
    this.currentDrillSetup = setup;
    console.log('Drill setup stored in memory:', setup);
  }

  /**
   * Get current drill setup from memory
   */
  getCurrentDrillSetup(): DrillSetup | null {
    return this.currentDrillSetup;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Save completed drill session to Firestore
   * This should be called when the user finishes the drill with results
   */
  async saveCompletedDrill(result: DrillResult): Promise<DrillSession> {
    try {
      if (!this.currentUserId || !this.currentDrillSetup) {
        throw new Error('No drill setup found. Please start a drill first.');
      }

      const drillSession: Omit<DrillSession, 'id'> = {
        userId: this.currentUserId,
        setup: this.currentDrillSetup,
        result,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const drillsCollection = collection(this.firestore, 'drillSessions');
      const docRef = await addDoc(drillsCollection, {
        ...drillSession,
        startedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const savedSession: DrillSession = {
        ...drillSession,
        id: docRef.id,
      };

      console.log('Completed drill session saved to Firestore:', docRef.id);

      // Clear memory after saving
      this.clearCurrentDrillSetup();

      return savedSession;
    } catch (error) {
      console.error('Error saving completed drill:', error);
      throw error;
    }
  }

  /**
   * Clear current drill setup from memory
   */
  clearCurrentDrillSetup(): void {
    this.currentDrillSetup = null;
    this.currentUserId = null;
    console.log('Drill setup cleared from memory');
  }

  /**
   * Create a new drill session with setup data (for legacy/admin use)
   * DEPRECATED: Use setCurrentDrillSetup() and saveCompletedDrill() instead
   */
  async createDrillSession(userId: string, setup: DrillSetup): Promise<DrillSession> {
    try {
      const drillSession: Omit<DrillSession, 'id'> = {
        userId,
        setup,
        status: 'setup',
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const drillsCollection = collection(this.firestore, 'drillSessions');
      const docRef = await addDoc(drillsCollection, {
        ...drillSession,
        startedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const createdSession: DrillSession = {
        ...drillSession,
        id: docRef.id,
      };

      // Store in memory for current session
      this.currentDrillSession = createdSession;

      console.log('Drill session created:', docRef.id);
      return createdSession;
    } catch (error) {
      console.error('Error creating drill session:', error);
      throw error;
    }
  }

  /**
   * Start the drill (change status to in_progress)
   */
  async startDrill(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(this.firestore, `drillSessions/${sessionId}`);
      await updateDoc(sessionRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (this.currentDrillSession) {
        this.currentDrillSession.status = 'in_progress';
        this.currentDrillSession.startedAt = new Date();
      }

      console.log('Drill started:', sessionId);
    } catch (error) {
      console.error('Error starting drill:', error);
      throw error;
    }
  }

  /**
   * Complete the drill with results
   */
  async completeDrill(sessionId: string, result: DrillResult): Promise<void> {
    try {
      const sessionRef = doc(this.firestore, `drillSessions/${sessionId}`);
      await updateDoc(sessionRef, {
        result,
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (this.currentDrillSession) {
        this.currentDrillSession.result = result;
        this.currentDrillSession.status = 'completed';
        this.currentDrillSession.completedAt = new Date();
      }

      console.log('Drill completed:', sessionId);
    } catch (error) {
      console.error('Error completing drill:', error);
      throw error;
    }
  }

  /**
   * Abandon the drill (user quit before finishing)
   */
  async abandonDrill(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(this.firestore, `drillSessions/${sessionId}`);
      await updateDoc(sessionRef, {
        status: 'abandoned',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (this.currentDrillSession) {
        this.currentDrillSession.status = 'abandoned';
        this.currentDrillSession.completedAt = new Date();
      }

      console.log('Drill abandoned:', sessionId);
    } catch (error) {
      console.error('Error abandoning drill:', error);
      throw error;
    }
  }

  /**
   * Get drill session by ID
   */
  async getDrillSession(sessionId: string): Promise<DrillSession | null> {
    try {
      const sessionRef = doc(this.firestore, `drillSessions/${sessionId}`);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        return {
          id: sessionDoc.id,
          ...data,
          startedAt: (data['startedAt'] as Timestamp)?.toDate() || new Date(),
          completedAt: data['completedAt'] ? (data['completedAt'] as Timestamp).toDate() : undefined,
          createdAt: (data['createdAt'] as Timestamp)?.toDate() || new Date(),
          updatedAt: (data['updatedAt'] as Timestamp)?.toDate() || new Date(),
        } as DrillSession;
      }

      return null;
    } catch (error) {
      console.error('Error fetching drill session:', error);
      throw error;
    }
  }

  /**
   * Get user's recent drill sessions
   */
  async getUserDrillSessions(userId: string, limitCount: number = 10): Promise<DrillSession[]> {
    try {
      const drillsCollection = collection(this.firestore, 'drillSessions');
      const q = query(
        drillsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions: DrillSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          startedAt: (data['startedAt'] as Timestamp)?.toDate() || new Date(),
          completedAt: data['completedAt'] ? (data['completedAt'] as Timestamp).toDate() : undefined,
          createdAt: (data['createdAt'] as Timestamp)?.toDate() || new Date(),
          updatedAt: (data['updatedAt'] as Timestamp)?.toDate() || new Date(),
        } as DrillSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching user drill sessions:', error);
      throw error;
    }
  }

  /**
   * Get user's completed drill sessions
   */
  async getUserCompletedDrills(userId: string, limitCount: number = 10): Promise<DrillSession[]> {
    try {
      const drillsCollection = collection(this.firestore, 'drillSessions');
      const q = query(
        drillsCollection,
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions: DrillSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          startedAt: (data['startedAt'] as Timestamp)?.toDate() || new Date(),
          completedAt: data['completedAt'] ? (data['completedAt'] as Timestamp).toDate() : undefined,
          createdAt: (data['createdAt'] as Timestamp)?.toDate() || new Date(),
          updatedAt: (data['updatedAt'] as Timestamp)?.toDate() || new Date(),
        } as DrillSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching completed drill sessions:', error);
      throw error;
    }
  }

  /**
   * Get current drill session (stored in memory)
   */
  getCurrentDrillSession(): DrillSession | null {
    return this.currentDrillSession;
  }

  /**
   * Clear current drill session from memory
   */
  clearCurrentDrillSession(): void {
    this.currentDrillSession = null;
  }

  /**
   * Save drill session with shot data to user's drills subcollection
   */
  async saveDrillSession(uid: string, sessionData: DrillSessionRecord): Promise<string> {
    try {
      console.log('[DrillService] Starting save operation...');
      console.log('[DrillService] UID:', uid);
      console.log('[DrillService] Collection path:', `users/${uid}/drills`);
      console.log('[DrillService] Session data:', JSON.stringify(sessionData, null, 2));

      const drillsCollection = collection(this.firestore, `users/${uid}/drills`);
      console.log('[DrillService] Collection reference created');

      const dataToSave = {
        ...sessionData,
        completedAt: serverTimestamp(),
      };
      console.log('[DrillService] Data prepared for save:', JSON.stringify(dataToSave, null, 2));

      console.log('[DrillService] Calling addDoc...');
      const docRef = await addDoc(drillsCollection, dataToSave);
      console.log('[DrillService] addDoc completed successfully');
      console.log('[DrillService] Drill session saved with ID:', docRef.id);

      // Update leaderboard with the score from this session
      try {
        const user = this.auth.currentUser;
        if (user) {
          // Use score if available, otherwise calculate from statistics
          let scoreToUse = sessionData.score;
          if (!scoreToUse && sessionData.statistics) {
            // Calculate score from accuracy - lower distance = higher score
            const avgDistance = sessionData.statistics.avgDistance || 50;
            scoreToUse = Math.max(100, Math.round(1000 - avgDistance * 10));
          }

          if (scoreToUse) {
            console.log('[DrillService] Updating leaderboard with score:', scoreToUse);
            await this.leaderboardService.updateUserScore(
              uid,
              user.displayName || 'Anonymous',
              scoreToUse,
              user.photoURL || undefined
            );
            console.log('[DrillService] Leaderboard updated successfully');
          } else {
            console.warn('[DrillService] No score available to update leaderboard');
          }
        }
      } catch (leaderboardError) {
        // Don't fail the drill save if leaderboard update fails
        console.error('[DrillService] Error updating leaderboard (non-critical):', leaderboardError);
      }

      return docRef.id;
    } catch (error: any) {
      console.error('[DrillService] Error saving drill session:', error);
      console.error('[DrillService] Error message:', error?.message);
      console.error('[DrillService] Error code:', error?.code);
      console.error('[DrillService] Error stack:', error?.stack);
      throw error;
    }
  }

  /**
   * Get drill history for a user
   */
  async getDrillHistory(uid: string, limitCount: number = 10): Promise<DrillSessionRecord[]> {
    try {
      const drillsCollection = collection(this.firestore, `users/${uid}/drills`);
      const q = query(
        drillsCollection,
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          completedAt: (data['completedAt'] as Timestamp)?.toDate() || new Date(),
        } as DrillSessionRecord;
      });
    } catch (error) {
      console.error('Error fetching drill history:', error);
      throw error;
    }
  }
}
