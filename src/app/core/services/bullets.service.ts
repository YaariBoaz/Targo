import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  DocumentReference,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { InAppPurchaseService } from './in-app-purchase.service';

/**
 * User bullets data structure in Firestore
 */
export interface UserBullets {
  userId: string;
  bulletCount: number;
  hasUnlimitedBullets: boolean; // True if user has yearly subscription
  lastUpdated: Date;
}

/**
 * Bullets management service
 * Handles bullet count tracking, purchases, and subscription-based unlimited bullets
 */
@Injectable({
  providedIn: 'root',
})
export class BulletsService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private purchaseService = inject(InAppPurchaseService);

  // Observable for reactive UI updates
  private bulletCountSubject = new BehaviorSubject<number>(0);
  private hasUnlimitedBulletsSubject = new BehaviorSubject<boolean>(false);

  public bulletCount$: Observable<number> = this.bulletCountSubject.asObservable();
  public hasUnlimitedBullets$: Observable<boolean> = this.hasUnlimitedBulletsSubject.asObservable();

  constructor() {
    // Subscribe to customer info changes to update unlimited bullets status
    this.purchaseService.customerInfo$.subscribe(() => {
      this.updateUnlimitedBulletsStatus();
    });
  }

  /**
   * Initialize bullets service for current user
   * Call this when user logs in
   */
  async initialize(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('Cannot initialize bullets service: No user logged in');
      return;
    }

    try {
      await this.loadBulletCount(user.uid);
      await this.updateUnlimitedBulletsStatus();
    } catch (error) {
      console.error('Failed to initialize bullets service:', error);
    }
  }

  /**
   * Load bullet count from Firestore
   */
  private async loadBulletCount(userId: string): Promise<void> {
    try {
      const bulletsRef = this.getBulletsDocRef(userId);
      const bulletsDoc = await getDoc(bulletsRef);

      if (bulletsDoc.exists()) {
        const data = bulletsDoc.data() as UserBullets;
        this.bulletCountSubject.next(data.bulletCount || 0);
        this.hasUnlimitedBulletsSubject.next(data.hasUnlimitedBullets || false);
        console.log('Loaded bullet count from Firestore:', data.bulletCount);
      } else {
        // Initialize with starter bullets for new users
        console.log('Creating new bullets document for user with 50 starter bullets');
        await this.createBulletsDocument(userId);
        this.bulletCountSubject.next(50); // Give new users 50 starter bullets
        this.hasUnlimitedBulletsSubject.next(false);
      }
    } catch (error) {
      console.error('Failed to load bullet count:', error);
      // Don't throw - set to 0 and let user purchase bullets
      this.bulletCountSubject.next(0);
      this.hasUnlimitedBulletsSubject.next(false);
    }
  }

  /**
   * Create initial bullets document for new user
   */
  private async createBulletsDocument(userId: string): Promise<void> {
    const bulletsRef = this.getBulletsDocRef(userId);
    const bulletsData: UserBullets = {
      userId,
      bulletCount: 50, // Give new users 50 starter bullets
      hasUnlimitedBullets: false,
      lastUpdated: new Date(),
    };

    try {
      // Use merge to avoid overwriting if document somehow exists
      await setDoc(bulletsRef, bulletsData, { merge: true });
      console.log('Created bullets document with 50 starter bullets');
    } catch (error) {
      console.error('Failed to create bullets document:', error);
      throw error;
    }
  }

  /**
   * Update unlimited bullets status based on subscription
   */
  private async updateUnlimitedBulletsStatus(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      // Check if user has yearly subscription (unlimited bullets)
      const hasYearly = this.purchaseService.hasPurchasedProduct('yearly');
      this.hasUnlimitedBulletsSubject.next(hasYearly);

      // Update Firestore
      const bulletsRef = this.getBulletsDocRef(user.uid);
      await updateDoc(bulletsRef, {
        hasUnlimitedBullets: hasYearly,
        lastUpdated: new Date(),
      });

      console.log('Unlimited bullets status updated:', hasYearly);
    } catch (error) {
      console.error('Failed to update unlimited bullets status:', error);
    }
  }

  /**
   * Get current bullet count (synchronous)
   */
  getCurrentBulletCount(): number {
    return this.bulletCountSubject.value;
  }

  /**
   * Check if user has unlimited bullets (synchronous)
   */
  hasUnlimitedBullets(): boolean {
    return this.hasUnlimitedBulletsSubject.value;
  }

  /**
   * Check if user has enough bullets for an activity
   */
  hasEnoughBullets(requiredBullets: number): boolean {
    if (this.hasUnlimitedBullets()) {
      return true; // Unlimited bullets from yearly subscription
    }

    return this.getCurrentBulletCount() >= requiredBullets;
  }

  /**
   * Deduct bullets when user starts training/challenge
   * Returns true if successful, false if insufficient bullets
   */
  async deductBullets(count: number): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('Cannot deduct bullets: No user logged in');
      return false;
    }

    // Check if user has unlimited bullets
    if (this.hasUnlimitedBullets()) {
      console.log('User has unlimited bullets, no deduction needed');
      return true;
    }

    try {
      // Read current count from Firestore to ensure we have the latest value
      const bulletsRef = this.getBulletsDocRef(user.uid);
      const bulletsDoc = await getDoc(bulletsRef);

      if (!bulletsDoc.exists()) {
        // Document doesn't exist - create it with starter bullets first
        console.log('Bullets document not found, creating with 50 starter bullets');
        await this.createBulletsDocument(user.uid);

        // Check if user has enough starter bullets
        if (50 < count) {
          console.warn(`Insufficient bullets: has 50 starter bullets, needs ${count}`);
          return false;
        }

        // Deduct from starter bullets
        const newCount = 50 - count;
        await updateDoc(bulletsRef, {
          bulletCount: newCount,
          lastUpdated: new Date(),
        });

        this.bulletCountSubject.next(newCount);
        console.log(`Deducted ${count} bullets from starter amount. New count: ${newCount}`);
        return true;
      }

      const data = bulletsDoc.data() as UserBullets;
      const currentCount = data.bulletCount || 0;

      // Check if user has enough bullets
      if (currentCount < count) {
        console.warn(`Insufficient bullets: has ${currentCount}, needs ${count}`);
        return false;
      }

      // Deduct bullets
      const newCount = currentCount - count;

      await updateDoc(bulletsRef, {
        bulletCount: newCount,
        lastUpdated: new Date(),
      });

      // Update local state
      this.bulletCountSubject.next(newCount);
      console.log(`Deducted ${count} bullets. New count: ${newCount}`);
      return true;
    } catch (error) {
      console.error('Failed to deduct bullets:', error);
      return false;
    }
  }

  /**
   * Add bullets to user's account (after purchase)
   */
  async addBullets(count: number): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('Cannot add bullets: No user logged in');
      return;
    }

    try {
      // Read current count from Firestore to ensure we have the latest value
      const bulletsRef = this.getBulletsDocRef(user.uid);
      const bulletsDoc = await getDoc(bulletsRef);

      if (!bulletsDoc.exists()) {
        // Document doesn't exist - create it with starter bullets first, then add purchased bullets
        console.log('Bullets document not found, creating with 50 starter bullets');
        await this.createBulletsDocument(user.uid);
        const newCount = 50 + count;

        await updateDoc(bulletsRef, {
          bulletCount: newCount,
          lastUpdated: new Date(),
        });

        this.bulletCountSubject.next(newCount);
        console.log(`Added ${count} bullets to starter amount. New count: ${newCount}`);
        return;
      }

      const data = bulletsDoc.data() as UserBullets;
      const currentCount = data.bulletCount || 0;
      const newCount = currentCount + count;

      await updateDoc(bulletsRef, {
        bulletCount: newCount,
        lastUpdated: new Date(),
      });

      // Update local state
      this.bulletCountSubject.next(newCount);
      console.log(`Added ${count} bullets. New count: ${newCount}`);
    } catch (error) {
      console.error('Failed to add bullets:', error);
      throw error;
    }
  }

  /**
   * Set bullet count to a specific value
   * Use for monthly subscription reset (500 bullets)
   */
  async setBulletCount(count: number): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('Cannot set bullets: No user logged in');
      return;
    }

    try {
      const bulletsRef = this.getBulletsDocRef(user.uid);

      await updateDoc(bulletsRef, {
        bulletCount: count,
        lastUpdated: new Date(),
      });

      this.bulletCountSubject.next(count);
      console.log(`Bullet count set to: ${count}`);
    } catch (error) {
      console.error('Failed to set bullet count:', error);
      throw error;
    }
  }

  /**
   * Grant monthly subscription bullets (500 bullets)
   * Call this when user subscribes to monthly plan or on monthly renewal
   */
  async grantMonthlyBullets(): Promise<void> {
    const MONTHLY_BULLETS = 500;
    await this.setBulletCount(MONTHLY_BULLETS);
    console.log('Granted 500 bullets for monthly subscription');
  }

  /**
   * Refresh bullet count from Firestore
   */
  async refreshBulletCount(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    await this.loadBulletCount(user.uid);
  }

  /**
   * Get Firestore document reference for user's bullets
   */
  private getBulletsDocRef(userId: string): DocumentReference<UserBullets> {
    return doc(this.firestore, 'userBullets', userId) as DocumentReference<UserBullets>;
  }

  /**
   * Reset service state (call on logout)
   */
  reset(): void {
    this.bulletCountSubject.next(0);
    this.hasUnlimitedBulletsSubject.next(false);
  }
}
