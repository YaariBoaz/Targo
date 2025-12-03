import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { BulletsService } from '@core/services/bullets.service';

@Component({
  selector: 'app-insufficient-bullets-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insufficient-bullets-modal.component.html',
  styleUrls: ['./insufficient-bullets-modal.component.scss'],
})
export class InsufficientBulletsModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private router = inject(Router);
  private bulletsService = inject(BulletsService);

  currentBullets = 0;
  requiredBullets = 0;
  bulletsNeeded = 0;

  ngOnInit() {
    this.currentBullets = this.bulletsService.getCurrentBulletCount();
    this.bulletsNeeded = this.requiredBullets - this.currentBullets;
  }

  /**
   * Close modal and navigate to Targo Shop
   */
  async goToShop() {
    await this.modalCtrl.dismiss();
    this.router.navigate(['/store']);
  }

  /**
   * Close modal without action
   */
  async dismiss() {
    await this.modalCtrl.dismiss();
  }
}
