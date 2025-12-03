import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-bullets-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bullets-panel.component.html',
  styleUrls: ['./bullets-panel.component.scss'],
})
export class BulletsPanelComponent {
  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss();
  }

  // Placeholder methods for future functionality
  onPurchaseBullets(amount: number) {
    console.log('Purchase bullets:', amount);
    // TODO: Implement purchase logic
  }

  onReloadBullets() {
    console.log('Reload bullets');
    // TODO: Implement reload logic
  }
}
