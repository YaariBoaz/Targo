import { Injectable, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const ONBOARDING_KEY = 'hasSeenOnboarding';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  /**
   * Check if user has completed onboarding
   */
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: ONBOARDING_KEY });
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  async markOnboardingComplete(): Promise<void> {
    try {
      await Preferences.set({ key: ONBOARDING_KEY, value: 'true' });
      console.log('Onboarding marked as complete');
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  }

  /**
   * Reset onboarding (useful for testing or user preference)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await Preferences.remove({ key: ONBOARDING_KEY });
      console.log('Onboarding reset');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }
}
