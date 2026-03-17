import { Injectable, inject } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  DocumentReference,
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from '@shared/services/firebase.service';
import { InAppPurchaseService } from './in-app-purchase.service';

export interface UserBullets {
  userId: string;
  bulletCount: number;
  hasUnlimitedBullets: boolean;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root',
})
export class BulletsService {
  private firebase = inject(FirebaseService);
  private purchaseService = inject(InAppPurchaseService);

  private bulletCountSubject = new BehaviorSubject<number>(0);
  private hasUnlimitedBulletsSubject = new BehaviorSubject<boolean>(false);

  public bulletCount$: Observable<number> = this.bulletCountSubject.asObservable();
  public hasUnlimitedBullets$: Observable<boolean> = this.hasUnlimitedBulletsSubject.asObservable();

  constructor() {
    this.purchaseService.customerInfo$.subscribe(() => {
      this.updateUnlimitedBulletsStatus();
    });
  }

  async initialize(uid: string): Promise<void> {
    try {
      await this.loadBulletCount(uid);
      await this.updateUnlimitedBulletsStatus(uid);
    } catch (error) {
      console.error('Failed to initialize bullets service:', error);
    }
  }

  private async loadBulletCount(userId: string): Promise<void> {
    try {
      const bulletsRef = this.getBulletsDocRef(userId);
      const bulletsDoc = await getDoc(bulletsRef);

      if (bulletsDoc.exists()) {
        const data = bulletsDoc.data() as UserBullets;
        this.bulletCountSubject.next(data.bulletCount || 0);
        this.hasUnlimitedBulletsSubject.next(data.hasUnlimitedBullets || false);
        console.log('Loaded bullet count:', data.bulletCount);
      } else {
        console.log('Creating bullets document with 50 starter bullets');
        await this.createBulletsDocument(userId);
        this.bulletCountSubject.next(50);
        this.hasUnlimitedBulletsSubject.next(false);
      }
    } catch (error) {
      console.error('Failed to load bullet count:', error);
      this.bulletCountSubject.next(0);
      this.hasUnlimitedBulletsSubject.next(false);
    }
  }

  private async createBulletsDocument(userId: string): Promise<void> {
    const bulletsRef = this.getBulletsDocRef(userId);
    const bulletsData: UserBullets = {
      userId,
      bulletCount: 50,
      hasUnlimitedBullets: false,
      lastUpdated: new Date(),
    };
    await setDoc(bulletsRef, bulletsData, { merge: true });
  }

  private async updateUnlimitedBulletsStatus(uid?: string): Promise<void> {
    const resolvedUid = uid ?? this.firebase.auth.currentUser?.uid;
    if (!resolvedUid) return;

    try {
      const hasYearly = this.purchaseService.hasPurchasedProduct('yearly');
      this.hasUnlimitedBulletsSubject.next(hasYearly);

      const bulletsRef = this.getBulletsDocRef(resolvedUid);
      await updateDoc(bulletsRef, {
        hasUnlimitedBullets: hasYearly,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to update unlimited bullets status:', error);
    }
  }

  getCurrentBulletCount(): number {
    return this.bulletCountSubject.value;
  }

  hasUnlimitedBullets(): boolean {
    return this.hasUnlimitedBulletsSubject.value;
  }

  hasEnoughBullets(requiredBullets: number): boolean {
    if (this.hasUnlimitedBullets()) return true;
    return this.getCurrentBulletCount() >= requiredBullets;
  }

  async deductBullets(count: number): Promise<boolean> {
    const user = this.firebase.auth.currentUser;
    if (!user) {
      console.warn('deductBullets: no auth user — skipping deduction');
      return true; // Don't block the drill if auth state is temporarily unavailable
    }

    if (this.hasUnlimitedBullets()) return true;

    try {
      const bulletsRef = this.getBulletsDocRef(user.uid);
      const bulletsDoc = await getDoc(bulletsRef);

      if (!bulletsDoc.exists()) {
        await this.createBulletsDocument(user.uid);
        if (50 < count) return false;
        const newCount = 50 - count;
        await updateDoc(bulletsRef, { bulletCount: newCount, lastUpdated: new Date() });
        this.bulletCountSubject.next(newCount);
        return true;
      }

      const data = bulletsDoc.data() as UserBullets;
      const currentCount = data.bulletCount || 0;

      if (currentCount < count) return false;

      const newCount = currentCount - count;
      await updateDoc(bulletsRef, { bulletCount: newCount, lastUpdated: new Date() });
      this.bulletCountSubject.next(newCount);
      console.log(`Deducted ${count} bullets. New count: ${newCount}`);
      return true;
    } catch (error) {
      console.error('Failed to deduct bullets:', error);
      return false;
    }
  }

  async addBullets(count: number): Promise<void> {
    const user = this.firebase.auth.currentUser;
    if (!user) return;

    try {
      const bulletsRef = this.getBulletsDocRef(user.uid);
      const bulletsDoc = await getDoc(bulletsRef);

      if (!bulletsDoc.exists()) {
        await this.createBulletsDocument(user.uid);
        const newCount = 50 + count;
        await updateDoc(bulletsRef, { bulletCount: newCount, lastUpdated: new Date() });
        this.bulletCountSubject.next(newCount);
        return;
      }

      const data = bulletsDoc.data() as UserBullets;
      const newCount = (data.bulletCount || 0) + count;
      await updateDoc(bulletsRef, { bulletCount: newCount, lastUpdated: new Date() });
      this.bulletCountSubject.next(newCount);
      console.log(`Added ${count} bullets. New count: ${newCount}`);
    } catch (error) {
      console.error('Failed to add bullets:', error);
      throw error;
    }
  }

  async setBulletCount(count: number): Promise<void> {
    const user = this.firebase.auth.currentUser;
    if (!user) return;

    const bulletsRef = this.getBulletsDocRef(user.uid);
    await updateDoc(bulletsRef, { bulletCount: count, lastUpdated: new Date() });
    this.bulletCountSubject.next(count);
  }

  async grantMonthlyBullets(): Promise<void> {
    await this.setBulletCount(500);
  }

  async refreshBulletCount(): Promise<void> {
    const user = this.firebase.auth.currentUser;
    if (!user) return;
    await this.loadBulletCount(user.uid);
  }

  private getBulletsDocRef(userId: string): DocumentReference {
    return doc(this.firebase.db, 'userBullets', userId);
  }

  reset(): void {
    this.bulletCountSubject.next(0);
    this.hasUnlimitedBulletsSubject.next(false);
  }
}
