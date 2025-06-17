import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  /* ───────── Mode ───────── */
  isEditMode = false;
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  /* ───────── User Data ───────── */
  defaultAvatar = 'assets/avatar-default.png';
  user = {
    avatarUrl: '',
    firstName: 'John',
    lastName: 'Doe',
    username: 'shooterX',
    email: 'shooter@example.com',
    notifications: true,
  };

  /* ───────── Shooting Setup ───────── */
  settings = {
    weapon: 'Pistol',
    distance: '25 m',
    target: 'Standard Bullseye',
  };

  onAvatarChange(evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (this.user.avatarUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  logout() {
    console.log('> Logging out…');
    /* TODO: Hook into auth service */
  }
}
