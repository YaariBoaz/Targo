import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '@core/services/auth';
import { FirestoreService } from '@core/services/firestore';
import { addIcons } from 'ionicons';
import { close, create } from 'ionicons/icons';

export type ShooterLevel = 'recruit' | 'marksman' | 'pro';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  tier: number;
  unlocked: boolean;
}

export interface ChallengeProgress {
  id: string;
  name: string;
  current: number;
  total: number;
  rank: number;
  color: string;
}

export interface LeaderboardEntry {
  rank: number | string;
  playerName: string;
  score: string;
  isTopThree: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  activeTab: 'profile' | 'rank' | 'achievements' = 'profile';

  // Profile data - will be populated from Firebase Auth
  avatarUrl: string | null = null;
  nickname: string = '';
  name: string = '';
  email: string = '';
  shooterLevel: ShooterLevel = 'recruit';

  // Rank Progress data
  challengeProgress: ChallengeProgress[] = [
    { id: '1', name: 'Headshots Elite', current: 92, total: 110, rank: 94, color: '#f6ba16' },
    { id: '2', name: 'Reflex Drills Pro', current: 145, total: 180, rank: 150, color: '#4a9eff' },
    { id: '3', name: 'Tactical Master', current: 280, total: 300, rank: 12, color: '#00d9ff' },
  ];

  leagueRank = 8;
  leagueTotal = 150;
  leaguePosition = 'Silver position - Weekly';
  nextRewardRank = 5;

  leaderboard: LeaderboardEntry[] = [
    { rank: '1ST', playerName: 'John M.', score: '3,506 XP', isTopThree: true },
    { rank: '2ST', playerName: 'David Foster', score: '3,506 XP', isTopThree: true },
    { rank: '3ST', playerName: 'Robert Wallace', score: '3,506 XP', isTopThree: true },
    { rank: 4, playerName: 'Sammy Ofer', score: '3,506 XP', isTopThree: false },
    { rank: 5, playerName: 'Bob Segal', score: '3,506 XP', isTopThree: false },
    { rank: 6, playerName: 'Jeffery Sanders', score: '3,506 XP', isTopThree: false },
    { rank: 7, playerName: 'Sammy Ofer', score: '3,506 XP', isTopThree: false },
    { rank: 8, playerName: 'Bob Segal', score: '3,506 XP', isTopThree: false },
    { rank: 9, playerName: 'Jeffery Sanders', score: '3,506 XP', isTopThree: false },
  ];

  // Achievements data
  achievements: Achievement[] = [
    { id: '1', name: 'EAGLE SIGHT', icon: '/assets/badges/eagle-sight-1.png', tier: 1, unlocked: true },
    { id: '2', name: 'LONG RANGE', icon: '/assets/badges/long-range-1.png', tier: 1, unlocked: false },
    { id: '3', name: 'FAST RELOAD', icon: '/assets/badges/fast-reload-1.png', tier: 1, unlocked: false },
    { id: '4', name: 'DEADEYE', icon: '/assets/badges/deadeye-1.png', tier: 1, unlocked: false },
    { id: '5', name: 'STEADY AIM', icon: '/assets/badges/steady-aim-1.png', tier: 1, unlocked: false },
    { id: '6', name: 'GET OFF MY PROPERTY', icon: '/assets/badges/get-off-my-property-1.png', tier: 1, unlocked: false },
    { id: '7', name: 'EAGLE SIGHT', icon: '/assets/badges/eagle-sight-2.png', tier: 2, unlocked: true },
    { id: '8', name: 'LONG RANGE', icon: '/assets/badges/long-range-2.png', tier: 2, unlocked: false },
    { id: '9', name: 'FAST RELOAD', icon: '/assets/badges/fast-reload-2.png', tier: 2, unlocked: false },
    { id: '10', name: 'DEADEYE', icon: '/assets/badges/deadeye-2.png', tier: 2, unlocked: false },
    { id: '11', name: 'STEADY AIM', icon: '/assets/badges/steady-aim-2.png', tier: 2, unlocked: false },
    { id: '12', name: 'GET OFF MY PROPERTY', icon: '/assets/badges/get-off-my-property-2.png', tier: 2, unlocked: false },
    { id: '13', name: 'EAGLE SIGHT', icon: '/assets/badges/eagle-sight-3.png', tier: 3, unlocked: false },
    { id: '14', name: 'LONG RANGE', icon: '/assets/badges/long-range-3.png', tier: 3, unlocked: false },
    { id: '15', name: 'FAST RELOAD', icon: '/assets/badges/fast-reload-3.png', tier: 3, unlocked: true },
    { id: '16', name: 'DEADEYE', icon: '/assets/badges/deadeye-3.png', tier: 3, unlocked: true },
    { id: '17', name: 'STEADY AIM', icon: '/assets/badges/steady-aim-3.png', tier: 3, unlocked: false },
    { id: '18', name: 'GET OFF MY PROPERTY', icon: '/assets/badges/get-off-my-property-3.png', tier: 3, unlocked: false },
  ];

  constructor(private router: Router) {
    addIcons({
      'close': close,
      'create': create,
    });
  }

  ngOnInit() {
    // Subscribe to auth state changes to get user data
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('User data received:', user);
        this.loadUserProfile(user);
      }
    });
  }

  private async loadUserProfile(user: any) {
    console.log('Loading profile for user:', user.uid);
    console.log('Display name:', user.displayName);
    console.log('Email:', user.email);
    console.log('Photo URL:', user.photoURL);

    // Set data from Firebase Auth
    this.email = user.email || '';
    this.name = user.displayName || '';
    this.avatarUrl = user.photoURL || null;

    // Use displayName as nickname if no custom nickname is set
    this.nickname = user.displayName || 'Shooter';

    // Try to load additional profile data from Firestore
    try {
      const firestoreUser = await this.firestoreService.getUser(user.uid);
      console.log('Firestore user data:', firestoreUser);

      if (firestoreUser) {
        // Override with Firestore data if available
        if (firestoreUser.displayName) {
          this.name = firestoreUser.displayName;
          this.nickname = firestoreUser.displayName;
        }
        if (firestoreUser.photoURL) {
          this.avatarUrl = firestoreUser.photoURL;
        }
      }
    } catch (error) {
      console.error('Error loading Firestore profile:', error);
      // Continue with Firebase Auth data only
    }

    console.log('Final profile data:', {
      name: this.name,
      email: this.email,
      nickname: this.nickname,
      avatarUrl: this.avatarUrl
    });
  }

  switchTab(tab: 'profile' | 'rank' | 'achievements') {
    this.activeTab = tab;
  }

  getProgressPercentage(current: number, total: number): number {
    return (current / total) * 100;
  }

  getLeagueProgressPercentage(): number {
    return (this.leagueRank / this.leagueTotal) * 100;
  }

  selectShooterLevel(level: ShooterLevel) {
    this.shooterLevel = level;
  }

  onUploadPhoto() {
    console.log('Upload photo clicked');
    // TODO: Implement photo upload
  }

  onEditField(field: string) {
    console.log('Edit field:', field);
    // TODO: Implement field editing
  }

  onSave() {
    console.log('Save profile:', {
      nickname: this.nickname,
      name: this.name,
      email: this.email,
      shooterLevel: this.shooterLevel,
    });
    // TODO: Implement save functionality
  }

  close() {
    this.router.navigate(['/tabs/home']);
  }
}
