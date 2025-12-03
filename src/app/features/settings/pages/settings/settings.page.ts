import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  private router = inject(Router);

  constructor() {
    addIcons({ close, 'chevron-forward': chevronForward });
  }

  close() {
    this.router.navigate(['/tabs/home']);
  }

  onUpgradeClick() {
    this.router.navigate(['/store']);
  }

  onSettingsClick() {
    this.router.navigate(['/settings-detail']);
  }

  onHelpClick() {
    // Navigate to help & support page
    console.log('Help & Support clicked');
  }
}
