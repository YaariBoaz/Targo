import { Injectable } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';

/**
 * Stack Navigation Service
 *
 * Manages IonNav stack navigation within tabs.
 * Each tab has its own navigation stack.
 *
 * Usage Example:
 *
 * // In a component within a tab
 * constructor(private stackNav: StackNavigationService) {}
 *
 * // Push a new page onto the stack
 * this.stackNav.push(DetailPage, { id: 123 });
 *
 * // Go back
 * this.stackNav.pop();
 */
@Injectable({
  providedIn: 'root',
})
export class StackNavigationService {
  // Store references to each tab's nav controller
  private navStacks = new Map<string, IonNav>();

  /**
   * Register a tab's IonNav controller
   * Called by each tab container on init
   */
  registerNav(tabName: string, nav: IonNav) {
    this.navStacks.set(tabName, nav);
  }

  /**
   * Get the nav controller for a specific tab
   */
  getNav(tabName: string): IonNav | undefined {
    return this.navStacks.get(tabName);
  }

  /**
   * Push a page onto the stack
   * If no tabName is provided, uses the current active nav
   */
  async push(
    component: any,
    params?: any,
    tabName?: string
  ): Promise<boolean> {
    const nav = tabName ? this.getNav(tabName) : this.getActiveNav();
    if (!nav) {
      console.error('No nav controller found');
      return false;
    }
    return nav.push(component, params);
  }

  /**
   * Pop the current page from the stack
   */
  async pop(tabName?: string): Promise<boolean> {
    const nav = tabName ? this.getNav(tabName) : this.getActiveNav();
    if (!nav) {
      console.error('No nav controller found');
      return false;
    }
    return nav.pop();
  }

  /**
   * Pop to root (clear stack except root)
   */
  async popToRoot(tabName?: string): Promise<boolean> {
    const nav = tabName ? this.getNav(tabName) : this.getActiveNav();
    if (!nav) {
      console.error('No nav controller found');
      return false;
    }
    return nav.popToRoot();
  }

  /**
   * Set a new root page (clears entire stack)
   */
  async setRoot(
    component: any,
    params?: any,
    tabName?: string
  ): Promise<boolean> {
    const nav = tabName ? this.getNav(tabName) : this.getActiveNav();
    if (!nav) {
      console.error('No nav controller found');
      return false;
    }
    return nav.setRoot(component, params);
  }

  /**
   * Get the currently active nav (last registered)
   * This is a simple implementation - you might want to track active tab
   */
  private getActiveNav(): IonNav | undefined {
    const navs = Array.from(this.navStacks.values());
    return navs[navs.length - 1];
  }

  /**
   * Check if we can go back
   */
  async canGoBack(tabName?: string): Promise<boolean> {
    const nav = tabName ? this.getNav(tabName) : this.getActiveNav();
    if (!nav) return false;
    return nav.canGoBack();
  }

  /**
   * Get the stack length
   */
  getStackLength(tabName?: string): number {
    const nav = tabName ? this.getNav(tabName) : this.getActiveNav();
    if (!nav) return 0;
    // IonNav doesn't expose length, so we track it
    // For now, return 0 (we'll enhance this later if needed)
    return 0;
  }
}
