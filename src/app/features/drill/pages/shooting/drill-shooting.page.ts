import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, ModalController } from '@ionic/angular/standalone';
import { DrillService } from '@core/services/drill.service';
import { ChallengeService } from '@core/services/challenge.service';
import { BLEConnectionState } from '@core/services/ble.service';
import { DeviceService } from '@core/services/device.service';
import { MultiplayerService, MultiplayerSession } from '@core/services/multiplayer.service';
import { DrillSetup } from '@models/drill-session.model';
import {
  Shot,
  SessionStats,
  DrillSessionRecord,
} from '@models/drill-session-record.model';
import { FirebaseService } from '@shared/services/firebase.service';
import { calculateADLScore } from '@utils/adl-score.util';
import { DrillCompletionModalComponent } from '../../components/drill-completion-modal/drill-completion-modal.component';
import { BleDisconnectModalComponent } from '@modals/ble-disconnect-modal/ble-disconnect-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-drill-shooting',
  standalone: true,
  imports: [CommonModule, FormsModule, DrillCompletionModalComponent],
  templateUrl: './drill-shooting.page.html',
  styleUrls: ['./drill-shooting.page.scss'],
})
export class DrillShootingPage implements OnInit, OnDestroy {
  private drillService = inject(DrillService);
  private challengeService = inject(ChallengeService);
  private deviceService = inject(DeviceService);
  private multiplayerService = inject(MultiplayerService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);
  private firebase = inject(FirebaseService);

  drillSetup: DrillSetup | null = null;
  shots: Shot[] = [];
  totalShots: number = 0;
  totalTime: number = 0;
  grouping: number = 0;
  isStatsExpanded: boolean = false;
  isConnected: boolean = false;

  // Session statistics
  sessionStats: SessionStats[] = [];

  // Completion modal
  showCompletionModal: boolean = false;
  completionStats: any = null;
  currentDrillOrder: number | undefined;

  // Stop/Finish button state
  confirmingFinish: boolean = false;
  drillStopped: boolean = false;

  // BLE subscriptions
  private shotDataSubscription?: Subscription;
  private connectionStateSubscription?: Subscription;
  private multiplayerSubscription?: Subscription;

  private timerInterval: any;
  private shootingInterval: any;
  private startTime: number = 0;
  private targetSize: number = 340; // pixels (matches CSS min(340px, 80vw))
  private isDemoMode: boolean = false;

  // Multiplayer properties
  multiplayerSession: MultiplayerSession | null = null;
  isSpectatorMode: boolean = false;
  chatMessage: string = '';
  chatMessages: Array<{ user: string; message: string; timestamp: Date }> = [];
  isChatExpanded: boolean = false;
  isBettingExpanded: boolean = false;

  // Physical target dimensions (in cm) - adjust based on actual target
  private readonly PHYSICAL_TARGET_WIDTH_CM = 50;
  private readonly PHYSICAL_TARGET_HEIGHT_CM = 80;

  // PNG image dimensions (actual file is 3150x4725, but we scale it proportionally)
  private readonly PNG_ASPECT_RATIO = 2 / 3; // width / height

  async ngOnInit() {
    this.drillSetup = this.drillService.getCurrentDrillSetup();

    if (!this.drillSetup) {
      this.router.navigate(['/tabs/training']);
      return;
    }

    // Check for multiplayer mode
    this.multiplayerSubscription = this.multiplayerService.multiplayerSession$.subscribe(
      (session) => {
        this.multiplayerSession = session;
        this.isSpectatorMode = session.isSpectator;
        console.log('[DrillShooting] Multiplayer session:', session);
        console.log('[DrillShooting] Is spectator mode:', this.isSpectatorMode);
      }
    );

    // Fetch drill order for challenge drills
    if (
      this.drillSetup.source === 'challenge' &&
      this.drillSetup.challengeId &&
      this.drillSetup.challengeDrillId
    ) {
      try {
        const drills = await this.challengeService.getChallengeDrills(
          this.drillSetup.challengeId
        );
        const currentDrill = drills.find(
          (d) => d.id === this.drillSetup!.challengeDrillId
        );
        if (currentDrill) {
          this.currentDrillOrder = currentDrill.order;
        }
      } catch (error) {
        console.error('Error fetching drill order:', error);
      }
    }

    this.totalShots = this.drillSetup.numberOfBullets;
    this.startTimer();

    // Check if we're connected to a real device or using demo mode
    this.isDemoMode = !this.deviceService.isConnected();
    this.isConnected = this.deviceService.isConnected();

    if (this.isDemoMode) {
      console.log('Demo mode: Starting simulator');
      this.startAutoShooting();
    } else {
      console.log('Real device mode: Listening for BLE shot data');
      this.subscribeToShotData();
      this.subscribeToConnectionState();
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.shootingInterval) {
      clearTimeout(this.shootingInterval);
    }
    // Unsubscribe from BLE data
    if (this.shotDataSubscription) {
      this.shotDataSubscription.unsubscribe();
    }
    if (this.connectionStateSubscription) {
      this.connectionStateSubscription.unsubscribe();
    }
    if (this.multiplayerSubscription) {
      this.multiplayerSubscription.unsubscribe();
    }
  }

  /**
   * Subscribe to BLE connection state changes
   */
  private subscribeToConnectionState() {
    this.connectionStateSubscription =
      this.deviceService.connectionState$.subscribe(async (state) => {
        // Update connection status
        this.isConnected = state === BLEConnectionState.CONNECTED;

        // If device disconnects unexpectedly during drill
        if (
          state === BLEConnectionState.DISCONNECTED &&
          !this.showCompletionModal
        ) {
          console.log('BLE device disconnected during drill');
          await this.handleDisconnect();
        }
      });
  }

  /**
   * Handle unexpected disconnect during drill
   */
  private async handleDisconnect() {
    // Show disconnect modal
    const modal = await this.modalController.create({
      component: BleDisconnectModalComponent,
      backdropDismiss: false,
      cssClass: 'disconnect-modal',
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    // Handle modal result
    if (data?.action === 'reconnected') {
      // Reconnected successfully, resume drill
      console.log('Reconnected, resuming drill');
      this.subscribeToShotData();
    }
    // For 'dashboard' and 'scan' actions, navigation is handled by the modal
  }

  /**
   * Subscribe to real BLE shot data from the device
   */
  private subscribeToShotData() {
    this.shotDataSubscription = this.deviceService.shotData$.subscribe(
      (shotData) => {
        console.log('Received shot from BLE device:', shotData);

        // Check if drill has been stopped by user
        if (this.drillStopped) {
          console.log('Drill stopped, ignoring shot');
          return;
        }

        // Check if drill is already complete (reached total shots)
        if (this.shots.length >= this.totalShots) {
          console.log('Drill already complete, ignoring additional shots');
          return;
        }

        // Convert BLE coordinates to display coordinates
        const { x, y } = this.convertBLECoordinatesToDisplay(
          shotData.x,
          shotData.y
        );

        // Record the shot
        this.recordShot(x, y);

        // Check if this was the final shot
        if (this.shots.length >= this.totalShots) {
          console.log('Drill complete after shot', this.shots.length);
          this.completeDrill();
        }
      }
    );
  }

  /**
   * Convert BLE device coordinates to display pixel coordinates
   *
   * IMPORTANT: Adjust this method based on your BLE device's coordinate system
   *
   * Current assumption: BLE sends normalized coordinates (0.0 to 1.0)
   * where (0,0) = top-left corner, (1,1) = bottom-right corner
   *
   * @param bleX - X coordinate from BLE device
   * @param bleY - Y coordinate from BLE device
   * @returns Display coordinates in pixels
   */
  private convertBLECoordinatesToDisplay(
    bleX: number,
    bleY: number
  ): { x: number; y: number } {
    // Get the actual display dimensions of the target
    const displayWidth = this.targetSize;
    const displayHeight = this.targetSize / this.PNG_ASPECT_RATIO; // Maintain aspect ratio

    // OPTION 1: If BLE sends normalized coordinates (0.0 to 1.0)
    // Origin at top-left, x increases right, y increases down
    let x = bleX * displayWidth;
    let y = bleY * displayHeight;

    // OPTION 2: If BLE sends coordinates in cm from top-left
    // Uncomment and adjust if needed:
    // x = (bleX / this.PHYSICAL_TARGET_WIDTH_CM) * displayWidth;
    // y = (bleY / this.PHYSICAL_TARGET_HEIGHT_CM) * displayHeight;

    // OPTION 3: If BLE sends coordinates in cm from center
    // Uncomment and adjust if needed:
    // const centerX = displayWidth / 2;
    // const centerY = displayHeight / 2;
    // x = centerX + (bleX / (this.PHYSICAL_TARGET_WIDTH_CM / 2)) * centerX;
    // y = centerY + (bleY / (this.PHYSICAL_TARGET_HEIGHT_CM / 2)) * centerY;

    // OPTION 4: If BLE y-axis is inverted (0 at bottom instead of top)
    // Uncomment if needed:
    // y = displayHeight - y;

    console.log(`BLE coordinates: (${bleX}, ${bleY}) -> Display: (${x}, ${y})`);

    return { x, y };
  }

  private startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.totalTime = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }

  private startAutoShooting() {
    const fireShot = () => {
      // Check if drill has been stopped
      if (this.drillStopped) {
        console.log('Simulator stopped, no more shots');
        return;
      }

      if (this.shots.length >= this.totalShots) {
        this.completeDrill();
        return;
      }

      // Generate random position within target circle
      const position = this.generateRandomPosition();

      // Record the shot
      this.recordShot(position.x, position.y);

      // Schedule next shot (1-2 seconds)
      const nextDelay = Math.random() * 1000 + 1000;
      this.shootingInterval = setTimeout(fireShot, nextDelay);
    };

    // Start first shot after 500ms
    setTimeout(fireShot, 500);
  }

  private generateRandomPosition(): { x: number; y: number } {
    // Generate random position within a circle
    const radius = this.targetSize / 2;
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * radius * 0.75; // 0.75 to stay well within the visible target circle

    const x = radius + r * Math.cos(angle);
    const y = radius + r * Math.sin(angle);

    return { x, y };
  }

  private recordShot(x: number, y: number) {
    const shotNumber = this.shots.length + 1;
    const currentTime = this.totalTime;
    const previousShotTime =
      this.shots.length > 0 ? this.shots[this.shots.length - 1].timestamp : 0;
    const splitTime = currentTime - previousShotTime;
    const distanceFromCenter = this.calculateDistanceFromCenter(x, y);

    const shot: Shot = {
      id: shotNumber,
      x,
      y,
      timestamp: currentTime,
      splitTime,
      distanceFromCenter,
    };

    this.shots.push(shot);

    // Update session stats
    this.updateSessionStats();

    // Update grouping
    this.grouping = this.calculateGrouping();
  }

  private calculateDistanceFromCenter(x: number, y: number): number {
    const centerX = this.targetSize / 2;
    const centerY = this.targetSize / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distanceInPixels = Math.sqrt(dx * dx + dy * dy);

    // Convert pixels to cm (simplified - assuming 1 pixel = 0.5cm for demonstration)
    const distanceInCm = distanceInPixels * 0.5;

    return Math.round(distanceInCm * 10) / 10; // Round to 1 decimal
  }

  private calculateGrouping(): number {
    if (this.shots.length < 2) return 0;

    let maxDistance = 0;

    for (let i = 0; i < this.shots.length; i++) {
      for (let j = i + 1; j < this.shots.length; j++) {
        const dx = this.shots[i].x - this.shots[j].x;
        const dy = this.shots[i].y - this.shots[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy) * 0.5; // Convert to cm
        maxDistance = Math.max(maxDistance, distance);
      }
    }

    return Math.round(maxDistance * 10) / 10; // Round to 1 decimal
  }

  private updateSessionStats() {
    const avgSplitTime = this.calculateAverageSplitTime();
    const avgDistance = this.calculateAverageDistance();

    const stat: SessionStats = {
      shotNumber: this.shots.length,
      avgSplitTime,
      avgDistance,
      totalTime: this.totalTime,
    };

    this.sessionStats.push(stat);
  }

  private calculateAverageSplitTime(): number {
    if (this.shots.length === 0) return 0;

    const totalSplitTime = this.shots.reduce(
      (sum, shot) => sum + shot.splitTime,
      0
    );
    return Math.round((totalSplitTime / this.shots.length) * 100) / 100; // Round to 2 decimals
  }

  private calculateAverageDistance(): number {
    if (this.shots.length === 0) return 0;

    const totalDistance = this.shots.reduce(
      (sum, shot) => sum + shot.distanceFromCenter,
      0
    );
    return Math.round((totalDistance / this.shots.length) * 10) / 10; // Round to 1 decimal
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.totalTime / 60);
    const seconds = this.totalTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  get stopButtonText(): string {
    // If all bullets have been shot OR user has clicked once to confirm
    if (this.shots.length >= this.totalShots || this.confirmingFinish) {
      return 'FINISH DRILL';
    }
    return 'STOP';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  toggleStats() {
    this.isStatsExpanded = !this.isStatsExpanded;

    // Reset scroll position when closing
    if (!this.isStatsExpanded) {
      setTimeout(() => {
        const sheetContent = document.querySelector('.sheet-content');
        if (sheetContent) {
          sheetContent.scrollTop = 0;
        }
      }, 300); // Wait for transition to complete
    }
  }

  async exitDrill() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.shootingInterval) {
      clearTimeout(this.shootingInterval);
    }

    // Optionally save partial drill if shots were fired
    if (this.shots.length > 0) {
      // For now, just navigate back without saving partial
      // TODO: Add confirmation dialog to save partial drill
    }

    this.router.navigate(['/tabs/training']);
  }

  /**
   * Handle STOP/FINISH DRILL button click
   * First click: Stops the drill (timer and shot registration), changes button text to "FINISH DRILL"
   * Second click: Saves drill and shows completion modal
   * If all bullets are shot: Auto-changes to "FINISH DRILL" and saves on first click
   */
  handleStopFinish() {
    // If all bullets are shot OR user has already clicked once (confirming)
    if (this.shots.length >= this.totalShots || this.confirmingFinish) {
      // Save the drill and show completion modal
      this.completeDrill();
    } else {
      // First click - stop the drill and change button to "FINISH DRILL"
      this.stopDrill();
      this.confirmingFinish = true;
    }
  }

  /**
   * Stop the drill: stop timer, stop simulator, and prevent new shots from being registered
   */
  private stopDrill() {
    // Stop the timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Stop simulator mode if active
    if (this.shootingInterval) {
      clearTimeout(this.shootingInterval);
    }

    // Mark drill as stopped to prevent BLE shots from being registered
    this.drillStopped = true;

    console.log('Drill stopped by user');
  }

  private async completeDrill() {
    // Stop all timers
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.shootingInterval) clearTimeout(this.shootingInterval);

    // Calculate final statistics
    const finalStats = {
      totalShots: this.shots.length,
      totalTime: this.totalTime,
      avgSplitTime: this.calculateAverageSplitTime(),
      avgDistance: this.calculateAverageDistance(),
      grouping: this.grouping,
    };

    const isChallengeDrill = this.drillSetup?.source === 'challenge';

    // Prepare base session record
    const sessionRecord: DrillSessionRecord = {
      drillSetup: {
        numberOfBullets: this.drillSetup!.numberOfBullets,
        distance: this.drillSetup!.distance,
        weaponName: this.drillSetup!.weaponName,
        weaponType: this.drillSetup!.weaponType,
        weaponCategory: this.drillSetup!.weaponCategory,
      },
      shots: this.shots,
      statistics: finalStats,
      completedAt: new Date(),
      uid: this.firebase.auth.currentUser?.uid || '',
      source: isChallengeDrill ? 'challenge' : 'training',
    };

    // Add challenge metadata if this is a challenge drill
    if (isChallengeDrill) {
      sessionRecord.challengeId = this.drillSetup!.challengeId;
      sessionRecord.challengeDrillId = this.drillSetup!.challengeDrillId;

      // Calculate ADL score and stars for challenge drills
      try {
        const challengeDrill = await this.challengeService.getChallengeDrills(
          this.drillSetup!.challengeId!
        );
        const drill = challengeDrill.find(
          (d) => d.id === this.drillSetup!.challengeDrillId
        );

        if (drill) {
          const adlResult = calculateADLScore(
            sessionRecord,
            drill.scoringCriteria
          );
          sessionRecord.score = adlResult.totalScore;
          sessionRecord.stars = adlResult.stars;

          console.log('ADL Score calculated:', adlResult);
        }
      } catch (error) {
        console.error('Error calculating ADL score:', error);
      }
    }

    // Save to Firestore
    try {
      console.log('Attempting to save drill session...', sessionRecord);

      if (!this.firebase.auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      const drillId = await this.drillService.saveDrillSession(
        this.firebase.auth.currentUser.uid,
        sessionRecord
      );

      console.log('Drill saved successfully with ID:', drillId);

      // If challenge drill, update challenge progress
      if (
        isChallengeDrill &&
        sessionRecord.score !== undefined &&
        sessionRecord.stars !== undefined
      ) {
        await this.challengeService.updateDrillAttempt(
          this.firebase.auth.currentUser.uid,
          this.drillSetup!.challengeId!,
          this.drillSetup!.challengeDrillId!,
          drillId,
          sessionRecord.score,
          sessionRecord.stars
        );
        console.log('Challenge progress updated');
      }

      // For multiplayer, navigate back to lobby
      if (this.multiplayerSession?.isMultiplayer) {
        // Clear multiplayer session
        this.multiplayerService.endMultiplayerSession();
        // Navigate back to lobby
        this.router.navigate(['/multiplayer-lobby']);
      } else {
        // Show completion modal for regular drills
        this.completionStats = {
          score: sessionRecord.score || 0,
          shots: this.shots.length,
          totalTime: this.totalTime,
          avgDistance: this.calculateAverageDistance(),
          stars: sessionRecord.stars || 0,
        };

        this.showCompletionModal = true;
      }
    } catch (error: any) {
      console.error('Error saving drill:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      await this.showError(
        `Failed to save drill session: ${error?.message || 'Unknown error'}`
      );
    }
  }

  private async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    await toast.present();
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }

  getCurrentDrillOrder(): number | undefined {
    return this.currentDrillOrder;
  }

  onModalClose() {
    this.showCompletionModal = false;
    // Modal handles navigation
  }

  onStartNextDrill() {
    this.showCompletionModal = false;

    // Reset for next drill
    this.shots = [];
    this.sessionStats = [];
    this.totalTime = 0;
    this.grouping = 0;

    // Restart the drill flow
    this.startTimer();
    this.startAutoShooting();
  }

  // Multiplayer methods
  sendEmoji(emoji: string) {
    console.log('sendEmoji called:', emoji);

    // Create flying emoji animation
    this.createFlyingEmoji(emoji);
  }

  private createFlyingEmoji(emoji: string) {
    // Create emoji element
    const emojiEl = document.createElement('div');
    emojiEl.textContent = emoji;

    // Inline styles for flying animation
    emojiEl.style.position = 'fixed';
    emojiEl.style.left = '20px';
    emojiEl.style.bottom = '100px';
    emojiEl.style.fontSize = '25px';
    emojiEl.style.zIndex = '99999';
    emojiEl.style.transition = 'all 2s ease-out';
    emojiEl.style.opacity = '1';

    // Add to body
    document.body.appendChild(emojiEl);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      emojiEl.style.bottom = '100vh';
      emojiEl.style.transform = 'scale(1.5)';
    });

    // Remove after animation
    setTimeout(() => {
      emojiEl.remove();
    }, 2000);
  }

  toggleBetting() {
    this.isBettingExpanded = !this.isBettingExpanded;
  }

  placeBet(betType: string) {
    if (!this.isSpectatorMode) return;

    // TODO: Implement real-time betting logic
    console.log('Placing bet:', betType);

    // Show toast for demo purposes
    const betNames: { [key: string]: string } = {
      'bullseye': 'BULLSEYE (50 pts)',
      'inner': 'INNER RING (30 pts)',
      'outer': 'OUTER RING (10 pts)',
      'miss': 'MISS (5 pts)'
    };

    this.showSuccess(`Bet placed: ${betNames[betType]}`);
    this.toggleBetting();
  }

  toggleChat() {
    this.isChatExpanded = !this.isChatExpanded;
  }

  sendChatMessage() {
    if (!this.chatMessage.trim() || !this.isSpectatorMode) return;

    const message = {
      user: 'You',
      message: this.chatMessage.trim(),
      timestamp: new Date(),
    };

    this.chatMessages.push(message);
    this.chatMessage = '';

    // TODO: Implement real-time chat broadcast to other players
    console.log('Sending chat message:', message);

    // Scroll to bottom of chat
    setTimeout(() => {
      const chatContent = document.querySelector('.chat-messages');
      if (chatContent) {
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    }, 100);
  }

  formatChatTime(timestamp: Date): string {
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  calculateShotScore(avgDistance: number): number {
    // Calculate score based on average distance from center
    // Lower distance = higher score
    // Bullseye (0cm) = 100, outer edge (50cm+) = 0
    const maxDistance = 50; // cm
    const score = Math.max(0, Math.round(100 - (avgDistance / maxDistance) * 100));
    return score;
  }
}
