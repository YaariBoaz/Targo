import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, checkmarkCircle, timeOutline } from 'ionicons/icons';
import { interval, Subscription } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { MultiplayerService } from '@core/services/multiplayer.service';
import { DrillService } from '@core/services/drill.service';
import { DrillSetup } from '@models/drill-session.model';

interface Player {
  id: string;
  name: string;
  isYou: boolean;
  status: 'ready' | 'pending';
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
})
export class LobbyPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(Auth);
  private multiplayerService = inject(MultiplayerService);
  private drillService = inject(DrillService);
  private timerSubscription?: Subscription;

  players: Player[] = [];
  shootingOrder: Player[] = [];
  currentPlayers = 3;
  maxPlayers = 4;
  autoStartTime = 263; // seconds (4:23)
  autoStartDisplay = '4:23';

  constructor() {
    addIcons({ arrowBack, checkmarkCircle, timeOutline });
  }

  ngOnInit() {
    // Initialize players - replace with actual data from your service
    // Only include ready players (those who accepted the invitation)
    this.players = [
      { id: '1', name: 'John M. (You)', isYou: true, status: 'ready' },
      { id: '2', name: 'David Klein', isYou: false, status: 'ready' },
      { id: '3', name: 'Sarah Miller', isYou: false, status: 'ready' },
    ];

    // Update current players count
    this.currentPlayers = this.players.length;

    // Initialize shooting order
    this.shootingOrder = [
      { id: '2', name: 'David Klein', isYou: false, status: 'ready' },
      { id: '1', name: 'John M. (You)', isYou: true, status: 'ready' },
      { id: '3', name: 'Sarah Miller', isYou: false, status: 'ready' },
    ];

    // Start countdown timer
    this.startTimer();
  }

  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
  }

  private startTimer() {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.autoStartTime > 0) {
        this.autoStartTime--;
        this.updateAutoStartDisplay();
      } else {
        // Auto-start the game
        this.startGame();
      }
    });
  }

  private updateAutoStartDisplay() {
    const minutes = Math.floor(this.autoStartTime / 60);
    const seconds = this.autoStartTime % 60;
    this.autoStartDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  leaveLobby() {
    this.router.navigate(['/tabs/home']);
  }

  startGame() {
    this.timerSubscription?.unsubscribe();

    // Get ready players
    const readyPlayers = this.players
      .filter(p => p.status === 'ready')
      .map(p => p.name);

    // Get first shooter from shooting order
    const firstShooter = this.shootingOrder[0]?.name || readyPlayers[0];

    // Generate session ID
    const sessionId = `mp_${Date.now()}`;

    // Start multiplayer session
    this.multiplayerService.startMultiplayerSession(
      readyPlayers,
      firstShooter,
      sessionId
    );

    // Determine if current user is spectator (not the first shooter)
    const currentPlayer = this.players.find(p => p.isYou);
    const isSpectator = currentPlayer?.name !== firstShooter;
    this.multiplayerService.setSpectatorMode(isSpectator);

    // Create a default drill setup for multiplayer
    // TODO: Replace with actual multiplayer drill configuration
    const drillSetup: DrillSetup = {
      numberOfBullets: 15,
      distance: 10,
      weaponName: 'Glock 19',
      weaponType: 'handgun',
      weaponCategory: 'pistol',
      source: 'training', // or 'multiplayer'
    };

    // Set the drill setup with current user ID
    const userId = this.auth.currentUser?.uid || 'guest';
    this.drillService.setCurrentDrillSetup(userId, drillSetup);

    // Navigate to drill prepare
    this.router.navigate(['/drill/prepare']);
  }

  getPlayerInitials(name: string): string {
    // Remove "(You)" if present
    const cleanName = name.replace('(You)', '').trim();
    const words = cleanName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  }

  get canStart(): boolean {
    // Can start if all players are ready
    return this.players.every((p) => p.status === 'ready');
  }

  get readyCount(): number {
    return this.players.filter((p) => p.status === 'ready').length;
  }
}
