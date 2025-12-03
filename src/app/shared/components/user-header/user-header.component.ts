import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { AuthService } from '@core/services/auth';
import { FirestoreService } from '@core/services/firestore';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss'],
})
export class UserHeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  @Input() userName: string = 'John M.';
  @Input() avatarUrl: string | null = null;
  @Input() score: number = 64;
  @Input() rank: number = 4;

  constructor(private router: Router) {
    addIcons({ 'settings-outline': settingsOutline });
  }

  ngOnInit() {
    // Subscribe to auth state changes to get user data
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('User header - User data received:', user);
        this.loadUserProfile(user);
      } else {
        console.log('User header - No user authenticated');
        this.userName = 'Guest';
        this.avatarUrl = null;
      }
    });
  }

  private async loadUserProfile(user: any) {
    console.log('User header - Loading profile for user:', user.uid);
    console.log('Display name:', user.displayName);
    console.log('Photo URL:', user.photoURL);

    // Set data from Firebase Auth
    this.userName = user.displayName || 'Shooter';
    this.avatarUrl = user.photoURL || null;

    // Try to load additional profile data from Firestore
    try {
      const firestoreUser = await this.firestoreService.getUser(user.uid);
      console.log('User header - Firestore user data:', firestoreUser);

      if (firestoreUser) {
        // Override with Firestore data if available
        if (firestoreUser.displayName) {
          this.userName = firestoreUser.displayName;
        }
        if (firestoreUser.photoURL) {
          this.avatarUrl = firestoreUser.photoURL;
        }
      }
    } catch (error) {
      console.error('User header - Error loading Firestore profile:', error);
      // Continue with Firebase Auth data only
    }

    console.log('User header - Final profile data:', {
      userName: this.userName,
      avatarUrl: this.avatarUrl
    });
  }

  onAvatarClick() {
    this.router.navigate(['/profile']);
  }

  onSettingsClick() {
    this.router.navigate(['/settings']);
  }
}

