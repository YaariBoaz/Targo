import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { Subject } from 'rxjs';

import { NavigationService } from 'src/app/shared/services/navigation.service';
import { ScreenState } from 'src/app/shared/models/screen-state';
import { ShootingStatsTableComponent } from './shooting-stats-table/shooting-stats-table.component';
import {
  PostDrillDialogComponent,
  DrillMode,
} from 'src/app/shared/dialogs/post-drill-dialog/post-drill-dialog.component';
import { ShootingService } from './shooting.service';
import { ShootingState } from './shooting.state';
import { CHALLENGE_TEXT } from './shooting.content';
import { ShootingSessionService } from 'src/app/shared/services/shooting-session.service';
import { AuthService } from 'src/app/shared/services/authentication/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

/**
 * The **ShootingComponent** is the main UI shell for a live‑shooting session.
 * It deliberately contains **zero business logic** – all calculations,
 * simulations and timers live inside {@link ShootingService} & {@link ShootingState}.
 *
 * ### High‑level flow
 * 1. User lands on the intro overlay and taps **Start** → `startCountdown()`
 * 2. A 3‑second countdown runs, shows a "GO!" flash, then `startDrill()`:
 *    - resets state
 *    - kicks off a timer via service
 *    - (demo) starts `simulateFakeShots()` to generate events
 * 3. Each hit fires `fireHit()` which updates reactive **signals** on the state.
 * 4. When bullets run out or user taps *Finish*, `endDrill()` opens a post‑drill
 *    dialog; user can *retry*, *view stats*, or *exit* back to Dashboard.
 *
 * ### Why signals?
 * Signals give us synchronous change detection & fine‑grained reactivity without
 * manual *unsubscribe* boilerplate. The template just calls `state.*()` getters.
 */
@Component({
  selector: 'app-shooting',
  standalone: true,
  imports: [CommonModule, FormsModule, PostDrillDialogComponent],
  templateUrl: './shooting.component.html',
  styleUrls: ['./shooting.component.scss'],
})
export class ShootingComponent implements OnInit, OnDestroy {
  blockDrill = false; // Flag to block further actions after drill ends
  currentSessionId?: string; // Track current session for Firebase

  /* ----------------------------------------------------------------------- */
  /* 🎯 Exposed constants / state                                            */
  /* ----------------------------------------------------------------------- */

  /** Static copy for headings & button labels (i18n‑ready). */
  readonly challenge = CHALLENGE_TEXT;

  /** Reactive container for all drill metrics & config. */
  readonly state = new ShootingState();

  // --- Local UI flags -----------------------------------------------------
  showIntro = signal(true);
  countdown = signal(3);
  countdownActive = signal(false);
  showGo = signal(false);
  showPostOverlay = signal(false);
  bottomRef?: MatBottomSheetRef;

  /** Emits once on component destroy to clean up subscriptions. */
  private destroy$ = new Subject<void>();

  /* ----------------------------------------------------------------------- */
  /* 🛠️  DI & ctor                                                           */
  /* ----------------------------------------------------------------------- */
  constructor(
    private readonly nav: NavigationService,
    private readonly shootingService: ShootingService,
    private readonly bottomSheet: MatBottomSheet,
    private readonly shootingSessionService: ShootingSessionService,
    private readonly authService: AuthService,
    private readonly firebase: FirebaseService
  ) {
    // Flag used by our custom NavigationService so it can lock back gestures
    // or hide unrelated UI while in shooting flow.
    this.nav.isInShooting = true;
  }

  /* ----------------------------------------------------------------------- */
  /* 🔄️ Lifecycle hooks                                                     */
  /* ----------------------------------------------------------------------- */
  /** Initialise fresh drill state. */
  ngOnInit(): void {
    this.state.reset();
  }

  /** Ensure timers/subscriptions are torn down when user navigates away. */
  ngOnDestroy(): void {
    this.shootingService.stopTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ----------------------------------------------------------------------- */
  /* 🚀 User actions & flow helpers                                          */
  /* ----------------------------------------------------------------------- */
  /**
   * Starts a visible 3→2→1 countdown before the drill begins.
   * When it reaches 0 we flash "GO!" for 1 s then enter `startDrill()`.
   */
  startCountdown(): void {
    this.showIntro.set(false);
    this.countdownActive.set(true);

    const tick = setInterval(() => {
      const current = this.countdown();
      this.countdown.set(current - 1);

      if (current <= 1) {
        clearInterval(tick);
        this.countdownActive.set(false);
        this.showGo.set(true);

        // Give player a visual GO! cue for 1 second.
        setTimeout(() => {
          this.showGo.set(false);
          this.startDrill();
        }, 1000);
      }
    }, 1000);
  }

  /**
   * Resets state & kicks off a new drill.
   * @param mode DrillMode – defaults to `training` but can be challenge/league.
   */
  startDrill(mode: DrillMode = DrillMode.training): void {
    this.state.currentMode.set(mode);
    this.state.reset();

    // Timer updates `state.elapsedTime()` every second via ShootingService
    this.shootingService.startTimer(
      this.state.startTime,
      this.state.elapsedTime
    );

    // Demo only – replace with real BLE events
    this.simulateFakeShots();
  }

  /**
   * Handle a single shot event. In production this will be called from
   * a BLE stream but here we simulate via `simulateFakeShots()`.
   */
  fireHit(): void {
    const hit = this.shootingService.generateHit(
      this.state.bulletsLeft(),
      this.state.startTime()
    );
    if (!hit) return;

    // Update reactive collections
    this.state.hitPoints.update((arr) => [...arr, hit]);
    this.state.totalShots.update((t) => t + 1);
    this.state.bulletsLeft.update((b) => b - 1);

    // Build a new ShotStat entry
    this.state.shotStats.update((stats) => [
      ...stats,
      {
        shotNumber: this.state.totalShots(),
        splitTime: stats.length
          ? +(hit.timestamp - stats[stats.length - 1].totalElapsed).toFixed(2)
          : 0,
        distanceFromCenter: hit.distanceFromCenter,
        totalElapsed: hit.timestamp,
      },
    ]);

    if (this.state.bulletsLeft() === 0) {
      this.showDrillIsFinished();
    }
  }

  showDrillIsFinished() {
    this.blockDrill = true;
    // Automatically end drill when bullets run out
    this.endDrill();
  }

  /** Finish the drill early or when bullets end. */
  async endDrill(): Promise<void> {
    this.shootingService.stopTimer();
    this.state.isDrillComplete.set(true);

    // Save the completed session to Firebase
    await this.saveSessionToFirebase();

    this.showPostOverlay.set(true);
  }

  /** Reset UI to intro screen for a clean retry. */
  resetDrill(): void {
    this.state.reset();
    this.showIntro.set(true);
    this.countdown.set(3);
    this.countdownActive.set(false);
    this.showGo.set(false);
    this.blockDrill;
  }

  /** Retry button handler. */
  retry(): void {
    this.resetDrill();
  }

  /** Exit button handler → pops back to main dashboard. */
  exit(): void {
    this.nav.popTo(ScreenState.Dashboard);
  }

  /** Opens stats in a Material bottom‑sheet. */
  openStats(): void {
    if (this.bottomRef) {
      return;
    } // already open
    this.bottomRef = this.bottomSheet.open(ShootingStatsTableComponent, {
      data: this.state.shotStats(),
    });

    // reset when closed
    this.bottomRef
      .afterDismissed()
      .subscribe(() => (this.bottomRef = undefined));
  }

  /**
   * Demo helper that recursively fires random shots every 1–4 s.
   * Replace with real BLE subscription when hardware is ready.
   */
  private simulateFakeShots(): void {
    const simulate = () => {
      if (this.state.isDrillComplete()) return;
      this.fireHit();
      const delay = Math.random() * 3000 + 1000; // 1‑4 s
      setTimeout(simulate, delay);
    };
    simulate();
  }

  /**
   * Callback from the post‑drill dialog.
   * @param action The CTA the user chose: `'start' | 'retry' | 'exit'`.
   */
  onOverlayResult(action: 'start' | 'retry' | 'exit'): void {
    this.showPostOverlay.set(false);
    if (action === 'start') {
      this.resetDrill();
      this.startCountdown();
    } else if (action === 'retry') {
      this.retry();
    } else {
      this.exit();
    }
  }

  /**
   * Saves the completed shooting session to Firebase
   */
  private async saveSessionToFirebase(): Promise<void> {
    try {
      const currentUser = this.firebase.auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user found, skipping session save');
        return;
      }

      const config = this.state.trainingConfig();
      const modeMap = {
        [DrillMode.training]: 'training' as const,
        [DrillMode.challenge]: 'challenge' as const,
      };

      const session = {
        userId: currentUser.uid,
        startTime: this.state.startTime(),
        endTime: Date.now(),
        mode: modeMap[this.state.currentMode()],
        config: {
          bullets: config.bullets,
          distance: config.distance,
          weapon: config.weapon,
        },
        totalShots: this.state.totalShots(),
        elapsedTime: this.state.elapsedTime(),
        hitPoints: this.state.hitPoints(),
        shotStats: this.state.shotStats(),
      };

      const sessionId = await this.shootingSessionService.createSession(
        session
      );
      console.log('Shooting session saved successfully:', sessionId);
    } catch (error) {
      console.error('Failed to save shooting session:', error);
      // Don't throw the error to avoid breaking the UI flow
    }
  }
}
