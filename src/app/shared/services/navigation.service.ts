import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ScreenComponentMap, ScreenState } from '../models/screen-state';

export type TransitionState = 'entering' | 'entered' | 'exiting';

export interface StackEntry {
  component: Type<any>;
  transitionState: TransitionState;
  key: number;
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private stack: StackEntry[] = [];
  private componentKey = 0;

  private stack$ = new BehaviorSubject<StackEntry[]>([]);
  public stackChanges$ = this.stack$.asObservable();

  constructor() {}

  /**
   * Pushes a new screen onto the stack and animates it in
   */
  push(component: Type<any>): void {
    const entry: StackEntry = {
      component,
      transitionState: 'entering',
      key: ++this.componentKey,
    };

    this.stack.push(entry);
    this.stack$.next([...this.stack]);

    // trigger transition to 'entered' state on next tick
    setTimeout(() => {
      entry.transitionState = 'entered';
      this.stack$.next([...this.stack]);
    });
  }

  /**
   * Pops the top screen with an exit animation
   */
  pop(): void {
    if (this.stack.length <= 1) {
      console.warn('Cannot pop — only one screen in the stack');
      return;
    }

    const topEntry = this.stack[this.stack.length - 1];
    topEntry.transitionState = 'exiting';
    this.stack$.next([...this.stack]);

    setTimeout(() => {
      this.stack.pop();
      this.stack$.next([...this.stack]);
    }, 300); // match your transition duration
  }

  /**
   * Replaces the entire stack with a single screen (no animation)
   */
  reset(component: Type<any>, animate = false): void {
    const entry: StackEntry = {
      component,
      transitionState: animate ? 'entering' : 'entered',
      key: ++this.componentKey,
    };

    this.stack = [entry];
    this.stack$.next([...this.stack]);

    if (animate) {
      setTimeout(() => {
        entry.transitionState = 'entered';
        this.stack$.next([...this.stack]);
      });
    }
  }

  /**
   * Utility: is there more than one screen in the stack?
   */
  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  /**
   * Debug log
   */
  logStack(label = 'NAV'): void {
    console.log(
      `${label}:`,
      this.stack.map((s) => `[${s.key}] ${s.component.name}`)
    );
  }

  popTo(target: ScreenState) {
    const index = this.stack.findIndex(
      (entry) => entry.component === ScreenComponentMap[target]
    );

    if (index === -1) {
      console.warn(
        `[Navigation] Tried to pop to ${target}, but it’s not in the stack`
      );
      return;
    }

    // Remove all entries above the target screen
    this.stack = this.stack.slice(0, index + 1);
    this.stack$.next(this.stack);
  }
}
