import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { ShootingSessionService } from '../../../shared/services/shooting-session.service';
import { AuthService } from '../../../shared/services/authentication/auth.service';
import { UserStoreService } from '../../../shared/services/authentication/user-store.service';
import { UserService } from '../../../shared/services/user.service';
import { FirebaseService } from '../../../shared/services/firebase.service';
import { ShootingSession } from '../../../shared/models/shot-stat';

interface HistoryItem {
  id: string;
  date: string;
  type: 'training' | 'challenge' | 'league';
  distance: string;
  weapon: string;
  bullets: number;
  hits: number;
  hitLocations: { x: number; y: number; distanceFromCenter?: number }[];
  accuracy: number;
  avgSplitTime: number;
}

@Component({
  selector: 'app-stats-history',
  templateUrl: './stats-history.component.html',
  styleUrls: ['./stats-history.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class StatsHistoryComponent implements OnInit, OnDestroy {
  expandedSessionId: string | null = null;
  selectedType: 'training' | 'challenge' | 'league' = 'training';
  history: HistoryItem[] = [];
  loading = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private shootingSessionService: ShootingSessionService,
    private authService: AuthService,
    private userStoreService: UserStoreService,
    private userService: UserService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadHistory() {
    const user = this.userStoreService.user;
    console.log('Current user from store:', user);
    
    // Check Firebase auth state
    const firebaseUser = this.authService.getUser();
    console.log('Firebase auth user:', firebaseUser);
    
    // Check current Firebase auth state directly
    const currentUser = await new Promise((resolve) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        onAuthStateChanged(this.firebaseService.auth, (user) => {
          console.log('Firebase auth state changed:', user);
          resolve(user);
        });
      });
    });
    console.log('Current Firebase user:', currentUser);
    
    if (!user) {
      console.warn('No user found, cannot load shooting history');
      this.loading = false;
      return;
    }

    // Use Firebase UID - this is what Firebase security rules expect
    const firebaseUid = (currentUser as any)?.uid;
    console.log('Firebase auth currentUser uid:', firebaseUid);
    console.log('User store data has uid:', user.uid);
    console.log('User store data has email:', user.email);
    
    if (!firebaseUid) {
      console.warn('No Firebase UID found - user not properly authenticated');
      this.loading = false;
      return;
    }
    
    const userId = firebaseUid; // Use Firebase UID for all queries
    console.log('Using userId for Firebase query:', userId);

    // Test Firebase connection by trying to get user document first
    console.log('Testing Firebase connection...');
    try {
      const testDoc = await this.userService.getUser(userId);
      console.log('User document exists:', testDoc.exists());
      if (testDoc.exists()) {
        console.log('User data:', testDoc.data());
      }
    } catch (testError) {
      console.error('Error accessing user document:', testError);
    }

    // Try Firebase UID first, then fallback to email if no data found
    console.log('Trying to get sessions with UID:', userId);
    this.shootingSessionService.getUserSessions(userId, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions) => {
          console.log('Raw sessions from Firebase (UID):', sessions);
          if (sessions.length === 0 && user.email) {
            console.log('No sessions found with UID, trying email:', user.email);
            // Fallback to email if no sessions found with UID
            this.shootingSessionService.getUserSessions(user.email, 50)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (emailSessions) => {
                  console.log('Raw sessions from Firebase (email):', emailSessions);
                  this.history = this.mapSessionsToHistory(emailSessions);
                  console.log('Mapped history:', this.history);
                  console.log('Filtered history for training:', this.history.filter(h => h.type === 'training'));
                  this.loading = false;
                },
                error: (emailError) => {
                  console.error('Error loading shooting history with email:', emailError);
                  this.loading = false;
                }
              });
          } else {
            this.history = this.mapSessionsToHistory(sessions);
            console.log('Mapped history:', this.history);
            console.log('Filtered history for training:', this.history.filter(h => h.type === 'training'));
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading shooting history with UID:', error);
          console.log('Trying with email as fallback:', user.email);
          if (user.email) {
            this.shootingSessionService.getUserSessions(user.email, 50)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (emailSessions) => {
                  console.log('Raw sessions from Firebase (email fallback):', emailSessions);
                  this.history = this.mapSessionsToHistory(emailSessions);
                  console.log('Mapped history:', this.history);
                  console.log('Filtered history for training:', this.history.filter(h => h.type === 'training'));
                  this.loading = false;
                },
                error: (emailError) => {
                  console.error('Error loading shooting history with email fallback:', emailError);
                  this.loading = false;
                }
              });
          } else {
            this.loading = false;
          }
        }
      });
  }

  private mapSessionsToHistory(sessions: ShootingSession[]): HistoryItem[] {
    return sessions.map(session => {
      // Calculate avgSplitTime manually if not in results
      let avgSplitTime = session.results?.avgSplitTime;
      
      if ((!avgSplitTime || avgSplitTime === 0) && session.shotStats?.length > 1) {
        const splitTimes = session.shotStats.slice(1).map(shot => shot.splitTime).filter(time => time > 0);
        if (splitTimes.length > 0) {
          avgSplitTime = splitTimes.reduce((sum, time) => sum + time, 0) / splitTimes.length;
        } else {
          avgSplitTime = 0;
        }
      } else if (!avgSplitTime) {
        avgSplitTime = 0;
      }
      
      // Calculate accuracy manually if needed
      let accuracy = session.results?.hitRate || 0;
      if (accuracy === 0 && session.hitPoints && session.config?.bullets) {
        // Calculate simple hit rate: hits / total shots * 100
        accuracy = (session.hitPoints.length / session.config.bullets) * 100;
      }
      
      return {
        id: session.id!,
        date: new Date(session.createdAt).toLocaleDateString('en-US'),
        type: session.mode,
        distance: `${session.config?.distance || 'Unknown'}m`,
        weapon: session.config?.weapon || 'Unknown',
        bullets: session.config?.bullets || 0,
        hits: session.hitPoints?.length || 0,
        hitLocations: this.convertHitPoints(session.hitPoints || []),
        accuracy: accuracy,
        avgSplitTime: avgSplitTime || 0
      };
    });
  }

  private convertHitPoints(hitPoints: any[]): { x: number; y: number; distanceFromCenter?: number }[] {
    return hitPoints.map(hit => ({
      x: hit.x,
      y: hit.y,
      distanceFromCenter: hit.distanceFromCenter
    }));
  }

  toggleRow(sessionId: string) {
    this.expandedSessionId =
      this.expandedSessionId === sessionId ? null : sessionId;
  }

  get filteredHistory() {
    return this.history.filter((h) => h.type === this.selectedType);
  }

  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 80) return '#10b981'; // green
    if (accuracy >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }
}
