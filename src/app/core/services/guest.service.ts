import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GuestService {
  private isGuestModeSubject = new BehaviorSubject<boolean>(false);
  public isGuestMode$: Observable<boolean> =
    this.isGuestModeSubject.asObservable();

  private readonly GUEST_MODE_KEY = 'targo_guest_mode';

  constructor() {
    // Check if guest mode was previously enabled
    this.loadGuestMode();
  }

  /**
   * Check if currently in guest mode
   */
  get isGuestMode(): boolean {
    return this.isGuestModeSubject.value;
  }

  /**
   * Enable guest mode
   */
  enableGuestMode(): void {
    this.isGuestModeSubject.next(true);
    localStorage.setItem(this.GUEST_MODE_KEY, 'true');
  }

  /**
   * Disable guest mode (when user logs in or registers)
   */
  disableGuestMode(): void {
    this.isGuestModeSubject.next(false);
    localStorage.removeItem(this.GUEST_MODE_KEY);
  }

  /**
   * Load guest mode state from storage
   */
  private loadGuestMode(): void {
    const isGuest = localStorage.getItem(this.GUEST_MODE_KEY) === 'true';
    this.isGuestModeSubject.next(isGuest);
  }

  /**
   * Get guest user display name
   */
  getGuestDisplayName(): string {
    return 'Guest';
  }

  /**
   * Check if feature is available in guest mode
   */
  isFeatureAvailable(feature: 'statistics' | 'purchase' | 'leaderboard'): boolean {
    // In guest mode, statistics, purchases, and leaderboard are disabled
    return !this.isGuestMode;
  }
}
