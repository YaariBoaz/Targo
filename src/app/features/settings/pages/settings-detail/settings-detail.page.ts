import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';
import { Auth } from '@angular/fire/auth';
import { FirestoreService } from '@core/services/firestore';

@Component({
  selector: 'app-settings-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  templateUrl: './settings-detail.page.html',
  styleUrls: ['./settings-detail.page.scss'],
})
export class SettingsDetailPage implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private firestoreService = inject(FirestoreService);

  // User profile fields
  nickname: string = '';
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  email: string = '';

  // Weapon settings
  weaponType: string = 'pistol';
  preferredDistance: number = 0;
  targetType: string = 'static';

  loading = false;
  saveSuccess = false;

  constructor() {
    addIcons({ 'chevron-back': chevronBack });
  }

  async ngOnInit() {
    await this.loadUserData();
  }

  private async loadUserData() {
    const user = this.auth.currentUser;
    if (!user) return;

    this.loading = true;
    try {
      // Get user data from Firestore
      const userData = await this.firestoreService.getUser(user.uid);

      if (userData) {
        const userProfile = userData as any; // Cast to access UserProfile fields
        this.nickname = userProfile.nickname || '';
        this.firstName = userProfile.firstName || '';
        this.lastName = userProfile.lastName || '';
        this.username = userData.displayName || user.displayName || '';
        this.email = user.email || '';

        // Load weapon settings
        if (userProfile.weaponSettings) {
          this.weaponType = userProfile.weaponSettings.weaponType || 'pistol';
          this.preferredDistance = userProfile.weaponSettings.preferredDistance || 0;
          this.targetType = userProfile.weaponSettings.targetType || 'static';
        }
      } else {
        // Use Firebase Auth data as fallback
        this.email = user.email || '';
        this.username = user.displayName || '';
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/settings']);
  }

  async onSave() {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      return;
    }

    this.loading = true;
    this.saveSuccess = false;

    try {
      // Update user profile in Firestore
      await this.firestoreService.updateUserProfile(user.uid, {
        nickname: this.nickname,
        firstName: this.firstName,
        lastName: this.lastName,
        displayName: this.username,
        // Weapon settings can be added to user preferences
        weaponSettings: {
          weaponType: this.weaponType,
          preferredDistance: this.preferredDistance,
          targetType: this.targetType,
        },
      });

      this.saveSuccess = true;

      // Show success feedback
      setTimeout(() => {
        this.saveSuccess = false;
      }, 3000);

      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      this.loading = false;
    }
  }
}
