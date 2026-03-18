import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-multiplayer-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multiplayer-panel.component.html',
  styleUrls: ['./multiplayer-panel.component.scss'],
})
export class MultiplayerPanelComponent {
  private router = inject(Router);

  navigateToInvitePlayers() {
    this.router.navigate(['/invite-players']);
  }
}
