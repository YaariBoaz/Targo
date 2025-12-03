import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { BulletsService } from '@core/services/bullets.service';
import { InsufficientBulletsModalComponent } from '../modals/insufficient-bullets-modal/insufficient-bullets-modal.component';

/**
 * Utility functions for bullet management
 */

/**
 * Check if user has enough bullets and show modal if not
 * @param requiredBullets Number of bullets required
 * @param modalCtrl ModalController instance
 * @param bulletsService BulletsService instance
 * @returns Promise<boolean> - true if user has enough bullets or purchased, false if cancelled
 */
export async function checkAndDeductBullets(
  requiredBullets: number,
  modalCtrl: ModalController,
  bulletsService: BulletsService
): Promise<boolean> {
  // Check if user has enough bullets
  const hasEnough = bulletsService.hasEnoughBullets(requiredBullets);

  if (!hasEnough) {
    // Show insufficient bullets modal
    const modal = await modalCtrl.create({
      component: InsufficientBulletsModalComponent,
      componentProps: {
        requiredBullets: requiredBullets,
      },
      cssClass: 'insufficient-bullets-modal-class',
    });

    await modal.present();
    await modal.onDidDismiss();

    // After modal is dismissed, check again if user has enough bullets
    // (they might have purchased in the store)
    return bulletsService.hasEnoughBullets(requiredBullets);
  }

  // User has enough bullets, deduct them
  const success = await bulletsService.deductBullets(requiredBullets);
  return success;
}

/**
 * Show insufficient bullets modal
 * @param requiredBullets Number of bullets required
 * @param modalCtrl ModalController instance
 */
export async function showInsufficientBulletsModal(
  requiredBullets: number,
  modalCtrl: ModalController
): Promise<void> {
  const modal = await modalCtrl.create({
    component: InsufficientBulletsModalComponent,
    componentProps: {
      requiredBullets: requiredBullets,
    },
    cssClass: 'insufficient-bullets-modal-class',
  });

  await modal.present();
}
