import { UserStoreService } from './../../shared/services/authentication/user-store.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/shared/models/shot-stat';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  user: User;
  settings = {
    weapon: '',
    distance: 0,
    target: '',
  };
  constructor(private userStoreService: UserStoreService) {
    this.user = this.userStoreService.user;
  }
  /* ───────── Mode ───────── */
  isEditMode = false;
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  onAvatarChange(evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (this.user.imgUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  logout() {
    console.log('> Logging out…');
    /* TODO: Hook into auth service */
  }
}
