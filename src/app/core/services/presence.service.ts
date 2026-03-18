import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Database,
  ref,
  onValue,
  set,
  onDisconnect,
  serverTimestamp,
  get,
} from '@angular/fire/database';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { PresenceStatus, UserPresence } from '@models/presence.model';

/**
 * PresenceService manages user online/offline status using Firebase Realtime Database
 *
 * Setup Instructions:
 * 1. Enable Firebase Realtime Database in Firebase Console
 * 2. Add database import to app.config.ts:
 *    import { provideDatabase, getDatabase } from '@angular/fire/database';
 *    provideDatabase(() => getDatabase())
 * 3. Deploy security rules from firestore.rules to Realtime Database
 */
@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  private database!: Database;
  private auth = inject(Auth);
  private isInitialized = false;

  // Store presence observables to avoid multiple subscriptions
  private presenceCache = new Map<string, Observable<PresenceStatus>>();

  constructor() {
    // Inject Database - will be undefined if not configured
    try {
      this.database = inject(Database);
    } catch (e) {
      console.warn('Firebase Realtime Database not configured. Presence features disabled.');
      console.warn('To enable: Add provideDatabase() to app.config.ts');
    }
  }

  /**
   * Initialize presence system for current user
   * Should be called after user logs in
   */
  initializePresence(userId: string): void {
    if (!this.database) {
      console.warn('Cannot initialize presence: Realtime Database not configured');
      return;
    }

    if (this.isInitialized) {
      return;
    }

    const userStatusRef = ref(this.database, `presence/${userId}`);

    // Set user as online
    const onlineStatus: PresenceStatus = {
      online: true,
      lastSeen: Date.now(),
      status: 'online',
    };

    // Set user as offline when they disconnect
    const offlineStatus: PresenceStatus = {
      online: false,
      lastSeen: Date.now(),
      status: 'offline',
    };

    // Setup onDisconnect handler
    onDisconnect(userStatusRef).set(offlineStatus);

    // Set initial online status
    set(userStatusRef, onlineStatus);

    this.isInitialized = true;

    console.log('Presence initialized for user:', userId);
  }

  /**
   * Get real-time presence status for a user
   */
  getUserPresence(userId: string): Observable<PresenceStatus> {
    if (!this.database) {
      // Return offline status if database not configured
      return new Observable((observer) => {
        observer.next({
          online: false,
          lastSeen: Date.now(),
          status: 'offline',
        });
      });
    }

    // Check cache first
    if (this.presenceCache.has(userId)) {
      return this.presenceCache.get(userId)!;
    }

    const userStatusRef = ref(this.database, `presence/${userId}`);

    const presence$ = new Observable<PresenceStatus>((observer) => {
      const unsubscribe = onValue(
        userStatusRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            observer.next(data as PresenceStatus);
          } else {
            // No data = user has never been online or data deleted
            observer.next({
              online: false,
              lastSeen: Date.now(),
              status: 'offline',
            });
          }
        },
        (error) => {
          console.error('Error listening to presence:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });

    // Cache the observable
    this.presenceCache.set(userId, presence$);

    return presence$;
  }

  /**
   * Get presence for multiple users
   * Returns a Map of userId -> PresenceStatus
   */
  getMultiplePresences(userIds: string[]): Observable<Map<string, PresenceStatus>> {
    if (!this.database || userIds.length === 0) {
      return new Observable((observer) => {
        observer.next(new Map());
      });
    }

    // Get all presence refs
    const presenceRefs = userIds.map(id => ref(this.database, `presence/${id}`));

    return new Observable((observer) => {
      const presenceMap = new Map<string, PresenceStatus>();
      let loadedCount = 0;

      presenceRefs.forEach((presenceRef, index) => {
        const userId = userIds[index];

        onValue(presenceRef, (snapshot) => {
          const data = snapshot.val();
          presenceMap.set(userId, data || {
            online: false,
            lastSeen: Date.now(),
            status: 'offline',
          });

          loadedCount++;
          if (loadedCount === userIds.length) {
            observer.next(presenceMap);
          }
        });
      });
    });
  }

  /**
   * Update user status (online, away, in-game)
   */
  async setStatus(userId: string, status: 'online' | 'away' | 'in-game'): Promise<void> {
    if (!this.database) {
      return;
    }

    const userStatusRef = ref(this.database, `presence/${userId}`);
    const statusUpdate: PresenceStatus = {
      online: true,
      lastSeen: Date.now(),
      status,
    };

    await set(userStatusRef, statusUpdate);
  }

  /**
   * Manually set user as offline
   * Called on logout
   */
  async setOffline(userId: string): Promise<void> {
    if (!this.database) {
      return;
    }

    const userStatusRef = ref(this.database, `presence/${userId}`);
    const offlineStatus: PresenceStatus = {
      online: false,
      lastSeen: Date.now(),
      status: 'offline',
    };

    await set(userStatusRef, offlineStatus);
    this.isInitialized = false;
  }

  /**
   * Clean up presence cache
   */
  clearCache(): void {
    this.presenceCache.clear();
  }
}
