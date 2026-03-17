import { Router } from '@angular/router';
import { BulletsService } from '@core/services/bullets.service';
import { FEATURE_FLAGS } from '@core/feature-flags';

/**
 * Check if user has enough bullets and navigate to store if not.
 * Skipped entirely when FEATURE_FLAGS.bulletSystemEnabled is false.
 */
export async function checkAndDeductBullets(
  requiredBullets: number,
  router: Router,
  bulletsService: BulletsService
): Promise<boolean> {
  // Bullet system disabled — let the user proceed without any check
  if (!FEATURE_FLAGS.bulletSystemEnabled) {
    return true;
  }

  const hasEnough = bulletsService.hasEnoughBullets(requiredBullets);

  if (!hasEnough) {
    const bulletsNeeded = requiredBullets - bulletsService.getCurrentBulletCount();
    router.navigate(['/store'], {
      queryParams: { bullets: bulletsNeeded, required: requiredBullets }
    });
    return false;
  }

  const success = await bulletsService.deductBullets(requiredBullets);
  return success;
}

export async function navigateToStoreForBullets(
  requiredBullets: number,
  router: Router,
  bulletsService: BulletsService
): Promise<void> {
  const bulletsNeeded = requiredBullets - bulletsService.getCurrentBulletCount();
  router.navigate(['/store'], {
    queryParams: { bullets: bulletsNeeded, required: requiredBullets }
  });
}
