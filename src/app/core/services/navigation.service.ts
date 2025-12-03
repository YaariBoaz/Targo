import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';

/**
 * Navigation Service
 *
 * Provides centralized navigation control for the app.
 * Handles both:
 * - Tab-level navigation (using Angular Router)
 * - Stack-based navigation within tabs (using IonNav)
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(
    private router: Router,
    private navController: NavController
  ) {}

  /**
   * Navigate to a tab (top-level navigation)
   * Uses Angular Router
   */
  navigateToTab(tab: 'home' | 'training' | 'challenges' | 'statistics') {
    return this.router.navigate(['/tabs', tab]);
  }

  /**
   * Navigate to auth screens
   */
  navigateToLogin() {
    return this.router.navigate(['/auth/login']);
  }

  navigateToRegister() {
    return this.router.navigate(['/auth/register']);
  }

  /**
   * Navigate to home after successful login
   */
  navigateToHome() {
    return this.router.navigate(['/tabs/home']);
  }

  /**
   * Navigate back using Ionic's NavController
   * This provides native-like back animation
   */
  goBack(defaultUrl?: string) {
    if (defaultUrl) {
      return this.navController.navigateBack(defaultUrl);
    }
    return this.navController.back();
  }

  /**
   * Navigate forward with animation
   */
  navigateForward(url: string | string[]) {
    const path = Array.isArray(url) ? url : [url];
    return this.navController.navigateForward(path);
  }

  /**
   * Navigate root (replaces entire stack)
   */
  navigateRoot(url: string | string[]) {
    const path = Array.isArray(url) ? url : [url];
    return this.navController.navigateRoot(path);
  }

  /**
   * Get current route
   */
  getCurrentRoute(): string {
    return this.router.url;
  }
}
