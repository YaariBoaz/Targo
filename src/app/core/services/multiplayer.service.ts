import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MultiplayerSession {
  isMultiplayer: boolean;
  isSpectator: boolean;
  currentShooter?: string;
  players?: string[];
  sessionId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MultiplayerService {
  private multiplayerSessionSubject = new BehaviorSubject<MultiplayerSession>({
    isMultiplayer: false,
    isSpectator: false,
  });

  multiplayerSession$ = this.multiplayerSessionSubject.asObservable();

  /**
   * Start a multiplayer session
   */
  startMultiplayerSession(
    players: string[],
    currentShooter: string,
    sessionId: string
  ) {
    const session: MultiplayerSession = {
      isMultiplayer: true,
      isSpectator: false, // Will be determined per user
      currentShooter,
      players,
      sessionId,
    };

    this.multiplayerSessionSubject.next(session);
  }

  /**
   * Set whether the current user is a spectator
   */
  setSpectatorMode(isSpectator: boolean) {
    const currentSession = this.multiplayerSessionSubject.value;
    this.multiplayerSessionSubject.next({
      ...currentSession,
      isSpectator,
    });
  }

  /**
   * Update the current shooter
   */
  updateCurrentShooter(shooterName: string) {
    const currentSession = this.multiplayerSessionSubject.value;
    if (currentSession.isMultiplayer) {
      this.multiplayerSessionSubject.next({
        ...currentSession,
        currentShooter: shooterName,
      });
    }
  }

  /**
   * End the multiplayer session
   */
  endMultiplayerSession() {
    this.multiplayerSessionSubject.next({
      isMultiplayer: false,
      isSpectator: false,
    });
  }

  /**
   * Get current session state
   */
  getCurrentSession(): MultiplayerSession {
    return this.multiplayerSessionSubject.value;
  }

  /**
   * Check if currently in multiplayer mode
   */
  isMultiplayerMode(): boolean {
    return this.multiplayerSessionSubject.value.isMultiplayer;
  }

  /**
   * Check if current user is spectator
   */
  isSpectatorMode(): boolean {
    return (
      this.multiplayerSessionSubject.value.isMultiplayer &&
      this.multiplayerSessionSubject.value.isSpectator
    );
  }
}
