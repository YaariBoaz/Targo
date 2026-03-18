import { Component, OnInit, OnDestroy, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { NavigationService } from '@core/services/navigation.service';
import { InAppPurchaseService } from '@core/services/in-app-purchase.service';
import { BulletsService } from '@core/services/bullets.service';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { CustomerInfo } from '@revenuecat/purchases-capacitor';
import { PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './store.page.html',
  styleUrls: ['./store.page.scss'],
})
export class StorePage implements OnInit, OnDestroy {
  @Input() isModal = false;
  @Input() bullets: number | null = null;
  @Input() required: number | null = null;
  @Input() bonus: number | null = null;

  private purchaseService = inject(InAppPurchaseService);
  private bulletsService = inject(BulletsService);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private navigationService = inject(NavigationService);
  private modalCtrl = inject(ModalController);
  private subscription?: Subscription;
  private bulletsSubscription?: Subscription;

  customerInfo: CustomerInfo | null = null;
  loading = true;
  hasTargoPro = false;
  errorMessage = '';
  subscriptionInfo: {
    productId: string | null;
    expirationDate: Date | null;
    willRenew: boolean;
  } | null = null;

  // Bullets-related properties
  bulletCount = 0;
  hasUnlimitedBullets = false;
  bulletsToPurchase = 10; // Default amount
  bonusBullets = 0; // Bonus bullets from special offer
  requiredBullets = 0; // Bullets required for activity (from query params)
  showInsufficientMessage = false; // Show message when user came from insufficient bullets

  async ngOnInit() {
    this.checkAuthentication();
    this.subscribeToCustomerInfo();
    this.subscribeToBullets();
    this.checkQueryParams();
  }

  /**
   * Check for query parameters from special offers or insufficient bullets
   * Prioritizes @Input() properties if they exist (when used as a modal)
   */
  private checkQueryParams() {
    // Check for @Input properties first
    if (this.bullets) {
      this.bulletsToPurchase = this.bullets;
    }
    if (this.bonus) {
      this.bonusBullets = this.bonus;
    }
    if (this.required) {
      this.requiredBullets = this.required;
      this.showInsufficientMessage = true;
    }

    // If not a modal, check route query params as a fallback
    if (!this.isModal) {
      this.route.queryParams.subscribe((params) => {
        if (params['bullets']) {
          this.bulletsToPurchase = parseInt(params['bullets'], 10) || 10;
        }
        if (params['bonus']) {
          this.bonusBullets = parseInt(params['bonus'], 10) || 0;
        }
        if (params['required']) {
          this.requiredBullets = parseInt(params['required'], 10) || 0;
          this.showInsufficientMessage = true;
        }
      });
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.bulletsSubscription?.unsubscribe();
  }

  private checkAuthentication() {
    const user = this.auth.currentUser;

    if (!user) {
      this.errorMessage = 'Please log in to view premium features';
      this.loading = false;
      return;
    }

    // RevenueCat is already initialized in app.component.ts
    // Just wait for it to be ready
    if (!this.purchaseService.isReady()) {
      console.log('Waiting for RevenueCat to initialize...');
      this.loading = true;
      // Wait a moment for initialization to complete
      setTimeout(() => {
        this.loading = false;
      }, 1000);
    } else {
      this.loading = false;
    }
  }

  private subscribeToCustomerInfo() {
    this.subscription = this.purchaseService.customerInfo$.subscribe(
      (info) => {
        this.customerInfo = info;
        this.hasTargoPro = this.purchaseService.hasTargoProEntitlement();

        // Check subscription type
        const subscriptionType = this.purchaseService.getSubscriptionType();
        if (subscriptionType !== 'none') {
          this.subscriptionInfo = {
            productId: this.purchaseService.getActiveSubscriptionProductId(),
            expirationDate: this.purchaseService.getSubscriptionExpirationDate(),
            willRenew: this.purchaseService.willSubscriptionRenew(),
          };
        } else {
          this.subscriptionInfo = null;
        }

        console.log('Customer info updated:', {
          hasTargoPro: this.hasTargoPro,
          subscriptionInfo: this.subscriptionInfo,
        });
      }
    );
  }

  /**
   * Subscribe to bullet count updates
   */
  private subscribeToBullets() {
    this.bulletsSubscription = this.bulletsService.bulletCount$.subscribe(
      (count) => {
        this.bulletCount = count;
      }
    );

    // Subscribe to unlimited bullets status
    this.bulletsService.hasUnlimitedBullets$.subscribe((unlimited) => {
      this.hasUnlimitedBullets = unlimited;
    });
  }

  /**
   * Present the RevenueCat Paywall
   * This is the modern, recommended approach
   * The paywall UI is configured in RevenueCat dashboard
   */
  async showPaywall() {
    try {
      this.loading = true;
      this.errorMessage = '';

      const result = await this.purchaseService.presentPaywall();

      if (result.result === PAYWALL_RESULT.CANCELLED) {
        console.log('User cancelled paywall');
      } else if (result.result === PAYWALL_RESULT.PURCHASED || result.result === PAYWALL_RESULT.RESTORED) {
        console.log('Purchase completed from paywall!');
        // Customer info will be automatically updated via subscription
      } else if (result.result === PAYWALL_RESULT.ERROR) {
        console.log('Error occurred in paywall');
        this.errorMessage = 'An error occurred. Please try again.';
      }
    } catch (error: any) {
      console.error('Paywall error:', error);
      this.errorMessage = 'Failed to show paywall. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Present Customer Center for subscription management
   * Users can:
   * - View purchase history
   * - Manage subscriptions
   * - Cancel/reactivate
   * - Contact support
   */
  async showCustomerCenter() {
    try {
      this.loading = true;
      this.errorMessage = '';

      await this.purchaseService.presentCustomerCenter();

      console.log('Customer center dismissed');
      // Customer info will be automatically refreshed
    } catch (error: any) {
      console.error('Customer center error:', error);
      this.errorMessage = 'Failed to show customer center. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Restore previous purchases
   * Important for users who reinstalled the app
   */
  async restorePurchases() {
    try {
      this.loading = true;
      this.errorMessage = '';

      await this.purchaseService.restorePurchases();

      if (this.hasTargoPro) {
        this.showSuccessMessage('Purchases restored successfully! You have Targo Pro.');
      } else {
        this.showInfoMessage('No purchases to restore.');
      }
    } catch (error: any) {
      console.error('Restore failed:', error);
      this.errorMessage = 'Failed to restore purchases. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Format expiration date for display
   */
  formatExpirationDate(date: Date | null): string {
    if (!date) return 'N/A';

    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else if (diffDays < 30) {
      return `Expires in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Get subscription type display name
   */
  getSubscriptionTypeName(productId: string | null): string {
    if (!productId) return 'Unknown';

    if (productId.includes('monthly')) return 'Monthly';
    if (productId.includes('yearly')) return 'Yearly';
    if (productId.includes('lifetime')) return 'Lifetime';

    return productId;
  }

  /**
   * Purchase yearly subscription ($99.99 - Unlimited bullets)
   */
  async purchaseYearly() {
    try {
      this.loading = true;
      this.errorMessage = '';

      const yearlyPackage = this.purchaseService.getYearlyPackage();
      if (!yearlyPackage) {
        this.errorMessage = 'Yearly subscription not available. Please try again later.';
        return;
      }

      const result = await this.purchaseService.purchasePackage(yearlyPackage);
      console.log('Yearly subscription purchased:', result);

      // Grant unlimited bullets
      await this.bulletsService.grantMonthlyBullets(); // Reset to clean state
      this.showSuccessMessage('Yearly subscription activated! You now have unlimited bullets!');
    } catch (error: any) {
      console.error('Yearly purchase failed:', error);
      if (error.code !== 'PURCHASE_CANCELLED_ERROR') {
        this.errorMessage = 'Failed to purchase yearly subscription. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }

  /**
   * Purchase monthly subscription ($50.99 - 500 bullets/month)
   */
  async purchaseMonthly() {
    try {
      this.loading = true;
      this.errorMessage = '';

      const monthlyPackage = this.purchaseService.getMonthlyPackage();
      if (!monthlyPackage) {
        this.errorMessage = 'Monthly subscription not available. Please try again later.';
        return;
      }

      const result = await this.purchaseService.purchasePackage(monthlyPackage);
      console.log('Monthly subscription purchased:', result);

      // Grant 500 bullets
      await this.bulletsService.grantMonthlyBullets();
      this.showSuccessMessage('Monthly subscription activated! You received 500 bullets!');
    } catch (error: any) {
      console.error('Monthly purchase failed:', error);
      if (error.code !== 'PURCHASE_CANCELLED_ERROR') {
        this.errorMessage = 'Failed to purchase monthly subscription. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }

  /**
   * Purchase bullets ($0.99 per bullet)
   */
  async purchaseBullets() {
    if (!this.bulletsToPurchase || this.bulletsToPurchase < 1) {
      this.errorMessage = 'Please enter a valid number of bullets';
      return;
    }

    try {
      this.loading = true;
      this.errorMessage = '';

      // For now, we'll use a simple purchase flow
      // In production, you'd implement a consumable product purchase
      const totalCost = (this.bulletsToPurchase * 0.99).toFixed(2);
      const totalBullets = this.bulletsToPurchase + this.bonusBullets;

      // Build confirmation message
      let confirmMessage = `Purchase ${this.bulletsToPurchase} bullets for $${totalCost}?`;
      if (this.bonusBullets > 0) {
        confirmMessage = `Purchase ${this.bulletsToPurchase} bullets + ${this.bonusBullets} bonus (${totalBullets} total) for $${totalCost}?`;
      }

      // Simulate purchase confirmation
      const confirmed = confirm(confirmMessage);

      if (!confirmed) {
        this.loading = false;
        return;
      }

      // TODO: Implement actual RevenueCat consumable product purchase
      // For now, just add bullets directly (this would be done after successful purchase)
      // Add purchased bullets + bonus bullets
      await this.bulletsService.addBullets(totalBullets);

      // Build success message
      let successMessage = `Successfully purchased ${totalBullets} bullets!`;
      if (this.bonusBullets > 0) {
        successMessage = `Successfully purchased ${this.bulletsToPurchase} bullets + ${this.bonusBullets} bonus = ${totalBullets} bullets!`;
      }

      this.showSuccessMessage(successMessage);

      // Reset to defaults
      this.bulletsToPurchase = 10;
      this.bonusBullets = 0;
    } catch (error: any) {
      console.error('Bullets purchase failed:', error);
      this.errorMessage = 'Failed to purchase bullets. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private showSuccessMessage(message: string) {
    // You can replace this with a toast notification
    alert(message);
  }

  private showInfoMessage(message: string) {
    // You can replace this with a toast notification
    alert(message);
  }

  goBack() {
    if (this.isModal) {
      this.modalCtrl.dismiss();
    } else {
      this.navigationService.goBack('/tabs/home');
    }
  }
}
