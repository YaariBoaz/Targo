import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Tab Refresh Service
 *
 * Broadcasts tab change events so components can refresh their data
 */
@Injectable({
  providedIn: 'root',
})
export class TabRefreshService {
  private tabChangeSubject = new Subject<string>();

  // Observable that components can subscribe to
  public tabChange$ = this.tabChangeSubject.asObservable();

  /**
   * Notify all subscribers that a tab has been activated
   */
  notifyTabChange(tabName: string) {
    console.log(`[TabRefreshService] Broadcasting tab change: ${tabName}`);
    this.tabChangeSubject.next(tabName);
  }
}
