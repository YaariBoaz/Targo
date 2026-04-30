import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { FirebaseService } from '@shared/services/firebase.service';
import { DrillService } from './drill.service';
import { GuestService } from './guest.service';
import { LahavSession, LahavShooter, LahavDrillType } from '@models/lahav.model';

@Injectable({ providedIn: 'root' })
export class LahavSessionService {
  private firebase = inject(FirebaseService);
  private drillService = inject(DrillService);
  private guestService = inject(GuestService);
  private router = inject(Router);

  readonly sessions = signal<LahavSession[]>([]);
  readonly activeSession = signal<LahavSession | null>(null);
  readonly activeShooter = signal<LahavShooter | null>(null);
  readonly activeDrillType = signal<LahavDrillType | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly currentStep = signal<number>(1);

  incrementStep(): void { this.currentStep.update(s => s + 1); }
  resetStep(): void { this.currentStep.set(1); }

  get totalSteps(): number {
    return this.activeDrillType()?.drills.length ?? this.activeSession()?.totalSteps ?? 1;
  }

  private async loadDrillType(trainingType: string): Promise<void> {
    const q = query(
      collection(this.firebase.lahavDb, 'drill_type'),
      where('training_type', '==', trainingType)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      this.activeDrillType.set(snapshot.docs[0].data() as LahavDrillType);
    } else {
      this.activeDrillType.set(null);
    }
  }

  private unsubscribeSessions?: Unsubscribe;
  private unsubscribeSession?: Unsubscribe;

  /** Start real-time listener for all 'waiting' sessions */
  watchSessions(): void {
    this.unsubscribeSessions?.();
    this.isLoading.set(true);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);


    const q = query(
      collection(this.firebase.lahavDb, 'sessions'),
      where('scheduledTime', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledTime', '<=', Timestamp.fromDate(endOfDay))
    );

    this.unsubscribeSessions = onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map((d) => ({
          completedTurns: [],
          ...d.data(),
          sessionId: d.id,
        })) as unknown as LahavSession[];
        this.sessions.set(sessions);
        this.isLoading.set(false);
      },
      (error) => {
        this.isLoading.set(false);
      }
    );
  }

  stopWatchingSessions(): void {
    this.unsubscribeSessions?.();
    this.unsubscribeSessions = undefined;
  }

  /** Real-time listener on a single session document (for completedTurns updates) */
  watchActiveSession(sessionId: string): void {
    this.unsubscribeSession?.();

    this.unsubscribeSession = onSnapshot(
      doc(this.firebase.lahavDb, 'sessions', sessionId),
      (snap) => {
        if (snap.exists()) {
          this.activeSession.set({
            completedTurns: [],
            ...snap.data(),
            sessionId: snap.id,
          } as unknown as LahavSession);
        }
      },
      (error) => {
      }
    );
  }

  stopWatchingActiveSession(): void {
    this.unsubscribeSession?.();
    this.unsubscribeSession = undefined;
  }

  selectSession(session: LahavSession): void {
    this.activeSession.set(session);
    this.router.navigate(['/lahav/shooter-select']);
  }

  async getShootersByIds(shooters: any[]): Promise<LahavShooter[]> {
    return (shooters ?? []).map(s => ({
      shooterId: s.id,
      name: s.name,
      email: s.email ?? '',
    }));
  }

  getShooterById(shooterId: string, shooters: any[]): LahavShooter | null {
    const s = shooters?.find(s => s.id === shooterId);
    if (!s) return null;
    return { shooterId: s.id, name: s.name, email: s.email ?? '' };
  }

  /** Save shooter to state and start the drill flow */
  async selectShooter(shooter: LahavShooter): Promise<void> {
    const session = this.activeSession();
    if (!session) return;

    this.activeShooter.set(shooter);
    this.guestService.enableGuestMode();
    this.resetStep();

    try {
      await this.loadDrillType(session.drillType);
      const completedSteps = await this.loadShooterProgress(session.sessionId, shooter.shooterId);
      const startStep = completedSteps >= this.totalSteps ? 1 : completedSteps + 1;
      this.currentStep.set(startStep);
      this.setupDrillForStep(startStep);
      this.router.navigate(['/drill/prepare']);
    } catch (e) {
      this.setupDrillForStep(1);
      this.router.navigate(['/drill/prepare']);
    }
  }

  /** Set up DrillService for a given step index (1-based) */
  setupDrillForStep(step: number): void {
    const session = this.activeSession();
    const drillType = this.activeDrillType();
    if (!session) return;

    const stepData = drillType?.drills[step - 1];
    const bullets = stepData?.bullets ?? session.totalSteps;
    const distance = drillType?.range_meter ?? 10;
    const uid = this.firebase.auth.currentUser?.uid ?? 'lahav-instructor';

    this.drillService.setCurrentDrillSetup(uid, {
      distance,
      weaponCategory: 'pistol',
      weaponType: 'pistol',
      weaponName: stepData?.name ?? session.drillType,
      numberOfBullets: bullets,
      source: 'lahav',
    });
  }

  /** Append shooterId to completedTurns in Firestore */
  async markShooterComplete(sessionId: string, shooterId: string): Promise<void> {
    await updateDoc(doc(this.firebase.lahavDb, 'sessions', sessionId), {
      completedTurns: arrayUnion(shooterId),
    });
  }

  /**
   * If all shooters are done, mark session as 'completed'.
   * Returns true if the session was completed.
   */
  async completeSessionIfDone(session: LahavSession): Promise<boolean> {
    const completedCount = (session.completedTurns?.length ?? 0) + 1; // +1 for the shooter just marked
    if (completedCount >= session.shooters.length) {
      await updateDoc(doc(this.firebase.lahavDb, 'sessions', session.sessionId), {
        status: 'completed',
      });
      return true;
    }
    return false;
  }

  /** Save how many steps a shooter has completed in a session */
  async saveShooterProgress(sessionId: string, shooterId: string, completedSteps: number): Promise<void> {
    const path = `sessions/${sessionId}/shooterProgress/${shooterId}`;
    try {
      const ref = doc(this.firebase.lahavDb, 'sessions', sessionId, 'shooterProgress', shooterId);
      await setDoc(ref, { shooterId, completedSteps, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
    }
  }

  /** Load how many steps a shooter has completed (returns 0 if none) */
  async loadShooterProgress(sessionId: string, shooterId: string): Promise<number> {
    const path = `sessions/${sessionId}/shooterProgress/${shooterId}`;
    try {
      const ref = doc(this.firebase.lahavDb, 'sessions', sessionId, 'shooterProgress', shooterId);
      const snap = await getDoc(ref);
      const result = snap.exists() ? (snap.data()['completedSteps'] ?? 0) : 0;
      return result;
    } catch (e) {
      return 0;
    }
  }
}
