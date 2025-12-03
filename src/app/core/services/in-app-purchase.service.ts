import { Injectable } from '@angular/core';
import {
  Purchases,
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesOffering,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
  MakePurchaseResult,
  PurchasesStoreProduct,
} from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PaywallResult, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

/**
 * Modern RevenueCat service with full feature support:
 * - Paywalls
 * - Customer Center
 * - Entitlement checking
 * - Subscription management
 * - Product offerings
 */
@Injectable({
  providedIn: 'root',
})
export class InAppPurchaseService {
  private isInitialized = false;
  private customerInfoSubject = new BehaviorSubject<CustomerInfo | null>(null);
  private offeringsSubject = new BehaviorSubject<PurchasesOfferings | null>(null);

  // Observable streams for reactive UI
  public customerInfo$: Observable<CustomerInfo | null> = this.customerInfoSubject.asObservable();
  public offerings$: Observable<PurchasesOfferings | null> = this.offeringsSubject.asObservable();

  // Product identifiers - these should match your RevenueCat dashboard
  private readonly PRODUCT_IDS = {
    MONTHLY: 'monthly', // $50.99 - 500 bullets per month
    YEARLY: 'yearly',   // $99.99 - Unlimited bullets + unlock everything
    BULLETS: 'bullets', // $0.99 per bullet - Purchase custom amount
  };

  // Entitlement identifier - this is what unlocks premium features
  private readonly ENTITLEMENT_ID = 'Targo Pro';

  constructor() {}

  /**
   * Initialize RevenueCat SDK with modern configuration
   * Call this when the app starts or user logs in
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    try {
      console.log('Initializing RevenueCat...');

      // Configure RevenueCat with your API key
      await Purchases.configure({
        apiKey: environment.revenueCatApiKey,
        appUserID: userId, // Optional: pass user ID for cross-device sync
      });

      // Enable debug logs in development
      if (!environment.production) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      }

      console.log('RevenueCat configured successfully');

      // Set up customer info listener for real-time updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        console.log('Customer info updated:', info);
        this.customerInfoSubject.next(info);
      });

      // Get initial customer info
      await this.refreshCustomerInfo();

      // Load available offerings
      await this.loadOfferings();

      this.isInitialized = true;
      console.log('RevenueCat initialization complete');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Load available offerings (products) from RevenueCat
   */
  async loadOfferings(): Promise<PurchasesOfferings> {
    try {
      const offerings = await Purchases.getOfferings();
      console.log('Offerings loaded:', offerings);
      this.offeringsSubject.next(offerings);
      return offerings;
    } catch (error) {
      console.error('Failed to load offerings:', error);
      throw error;
    }
  }

  /**
   * Get current offerings synchronously
   */
  getCurrentOfferings(): PurchasesOfferings | null {
    return this.offeringsSubject.value;
  }

  /**
   * Get the current offering (main product offering)
   */
  getCurrentOffering(): PurchasesOffering | null {
    const offerings = this.getCurrentOfferings();
    return offerings?.current || null;
  }

  /**
   * Present the RevenueCat Paywall UI
   * This is the modern, recommended way to show subscription options
   * The paywall is configured in RevenueCat dashboard
   */
  async presentPaywall(): Promise<PaywallResult> {
    try {
      console.log('Presenting RevenueCat Paywall...');

      const result = await RevenueCatUI.presentPaywall();

      console.log('Paywall result:', result);

      // Check if user completed purchase (not cancelled or error)
      if (result.result === PAYWALL_RESULT.PURCHASED || result.result === PAYWALL_RESULT.RESTORED) {
        // User made a purchase, refresh customer info
        await this.refreshCustomerInfo();
      }

      return result;
    } catch (error) {
      console.error('Failed to present paywall:', error);
      throw error;
    }
  }

  /**
   * Present the RevenueCat Paywall for a specific offering
   * Useful if you have multiple paywalls configured
   */
  async presentPaywallForOffering(offering: PurchasesOffering): Promise<PaywallResult> {
    try {
      console.log('Presenting paywall for offering:', offering.identifier);

      const result = await RevenueCatUI.presentPaywall({
        offering: offering,
      });

      // Check if user completed purchase
      if (result.result === PAYWALL_RESULT.PURCHASED || result.result === PAYWALL_RESULT.RESTORED) {
        await this.refreshCustomerInfo();
      }

      return result;
    } catch (error) {
      console.error('Failed to present paywall:', error);
      throw error;
    }
  }

  /**
   * Present Customer Center
   * This allows users to manage their subscription, see purchase history, etc.
   * RevenueCat handles all the UI and logic
   */
  async presentCustomerCenter(): Promise<void> {
    try {
      console.log('Presenting Customer Center...');
      await RevenueCatUI.presentCustomerCenter();

      // Refresh customer info after customer center is dismissed
      await this.refreshCustomerInfo();
    } catch (error) {
      console.error('Failed to present customer center:', error);
      throw error;
    }
  }

  /**
   * Purchase a specific package (manual purchase without paywall)
   * Use this if you want to build your own custom UI
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<MakePurchaseResult> {
    try {
      console.log('Purchasing package:', pkg.identifier);

      const result = await Purchases.purchasePackage({
        aPackage: pkg,
      });

      console.log('Purchase successful:', result);
      this.customerInfoSubject.next(result.customerInfo);

      return result;
    } catch (error: any) {
      console.error('Purchase failed:', error);

      // Handle specific error codes
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        console.log('Purchase was cancelled by user');
      }

      throw error;
    }
  }

  /**
   * Purchase a product by store product object (alternative method)
   * First, you need to get the product using getProducts()
   */
  async purchaseStoreProduct(product: PurchasesStoreProduct): Promise<MakePurchaseResult> {
    try {
      console.log('Purchasing product:', product.identifier);

      const result = await Purchases.purchaseStoreProduct({
        product: product,
      });

      console.log('Purchase successful:', result);
      this.customerInfoSubject.next(result.customerInfo);

      return result;
    } catch (error: any) {
      console.error('Purchase failed:', error);

      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        console.log('Purchase was cancelled by user');
      }

      throw error;
    }
  }

  /**
   * Restore previous purchases
   * Important for users who reinstall the app or switch devices
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      console.log('Restoring purchases...');
      const result = await Purchases.restorePurchases();
      console.log('Purchases restored:', result);

      this.customerInfoSubject.next(result.customerInfo);
      return result.customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Refresh customer info from RevenueCat servers
   */
  async refreshCustomerInfo(): Promise<CustomerInfo> {
    try {
      const result = await Purchases.getCustomerInfo();
      this.customerInfoSubject.next(result.customerInfo);
      return result.customerInfo;
    } catch (error) {
      console.error('Failed to refresh customer info:', error);
      throw error;
    }
  }

  /**
   * Get current customer info synchronously
   */
  getCurrentCustomerInfo(): CustomerInfo | null {
    return this.customerInfoSubject.value;
  }

  /**
   * Check if user has the "Targo Pro" entitlement
   * This is the main way to check if a user has premium access
   */
  hasTargoProEntitlement(): boolean {
    const customerInfo = this.customerInfoSubject.value;
    if (!customerInfo) return false;

    const entitlements = customerInfo.entitlements.active;
    const hasEntitlement = this.ENTITLEMENT_ID in entitlements;

    console.log('Targo Pro entitlement check:', hasEntitlement);
    return hasEntitlement;
  }

  /**
   * Check if user has any active entitlement by ID
   */
  hasActiveEntitlement(entitlementId: string): boolean {
    const customerInfo = this.customerInfoSubject.value;
    if (!customerInfo) return false;

    return entitlementId in customerInfo.entitlements.active;
  }

  /**
   * Check if user has an active subscription
   */
  hasActiveSubscription(): boolean {
    const customerInfo = this.customerInfoSubject.value;
    if (!customerInfo) return false;

    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  /**
   * Get subscription expiration date
   */
  getSubscriptionExpirationDate(): Date | null {
    const customerInfo = this.customerInfoSubject.value;
    if (!customerInfo) return null;

    const entitlement = customerInfo.entitlements.active[this.ENTITLEMENT_ID];
    if (!entitlement) return null;

    return entitlement.expirationDate ? new Date(entitlement.expirationDate) : null;
  }

  /**
   * Check if subscription is set to renew
   */
  willSubscriptionRenew(): boolean {
    const customerInfo = this.customerInfoSubject.value;
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[this.ENTITLEMENT_ID];
    return entitlement?.willRenew || false;
  }

  /**
   * Get the product identifier of the active subscription
   */
  getActiveSubscriptionProductId(): string | null {
    const customerInfo = this.customerInfoSubject.value;
    if (!customerInfo) return null;

    const entitlement = customerInfo.entitlements.active[this.ENTITLEMENT_ID];
    return entitlement?.productIdentifier || null;
  }

  /**
   * Check if user purchased a specific product
   */
  hasPurchasedProduct(productId: string): boolean {
    const customerInfo = this.customerInfoSubject.value;
    if (!customerInfo) return false;

    return productId in customerInfo.allPurchasedProductIdentifiers;
  }

  /**
   * Identify user (call when user logs in)
   */
  async identifyUser(userId: string): Promise<{ customerInfo: CustomerInfo; created: boolean }> {
    try {
      console.log('Identifying user:', userId);
      const result = await Purchases.logIn({ appUserID: userId });

      this.customerInfoSubject.next(result.customerInfo);
      console.log('User identified. New user:', result.created);

      return result;
    } catch (error) {
      console.error('Failed to identify user:', error);
      throw error;
    }
  }

  /**
   * Log out user (call when user logs out)
   */
  async logoutUser(): Promise<CustomerInfo> {
    try {
      console.log('Logging out user...');
      const result = await Purchases.logOut();

      this.customerInfoSubject.next(result.customerInfo);
      console.log('User logged out');

      return result.customerInfo;
    } catch (error) {
      console.error('Failed to logout user:', error);
      throw error;
    }
  }

  /**
   * Check if user is anonymous
   */
  async isAnonymous(): Promise<boolean> {
    try {
      const result = await Purchases.isAnonymous();
      return result.isAnonymous;
    } catch (error) {
      console.error('Failed to check anonymous status:', error);
      return true;
    }
  }

  /**
   * Get app user ID
   */
  async getAppUserId(): Promise<string> {
    try {
      const result = await Purchases.getAppUserID();
      return result.appUserID;
    } catch (error) {
      console.error('Failed to get app user ID:', error);
      throw error;
    }
  }

  /**
   * Set custom user attributes for analytics and targeting
   */
  async setUserAttributes(attributes: Record<string, string | null>): Promise<void> {
    try {
      await Purchases.setAttributes(attributes);
      console.log('User attributes set:', attributes);
    } catch (error) {
      console.error('Failed to set user attributes:', error);
    }
  }

  /**
   * Set user email for customer support
   */
  async setEmail(email: string): Promise<void> {
    try {
      await Purchases.setEmail({ email });
      console.log('Email set:', email);
    } catch (error) {
      console.error('Failed to set email:', error);
    }
  }

  /**
   * Set display name for customer support
   */
  async setDisplayName(displayName: string): Promise<void> {
    try {
      await Purchases.setDisplayName({ displayName });
      console.log('Display name set:', displayName);
    } catch (error) {
      console.error('Failed to set display name:', error);
    }
  }

  /**
   * Get product IDs (useful for custom UI)
   */
  getProductIds() {
    return this.PRODUCT_IDS;
  }

  /**
   * Get entitlement ID
   */
  getEntitlementId() {
    return this.ENTITLEMENT_ID;
  }

  /**
   * Helper: Get package by identifier from current offering
   */
  getPackageByIdentifier(identifier: string): PurchasesPackage | null {
    const currentOffering = this.getCurrentOffering();
    if (!currentOffering) return null;

    return currentOffering.availablePackages.find(
      (pkg) => pkg.identifier === identifier
    ) || null;
  }

  /**
   * Helper: Get monthly package
   */
  getMonthlyPackage(): PurchasesPackage | null {
    return this.getPackageByIdentifier(this.PRODUCT_IDS.MONTHLY);
  }

  /**
   * Helper: Get yearly package
   */
  getYearlyPackage(): PurchasesPackage | null {
    return this.getPackageByIdentifier(this.PRODUCT_IDS.YEARLY);
  }

  /**
   * Helper: Get bullets package (for purchasing individual bullets)
   */
  getBulletsPackage(): PurchasesPackage | null {
    return this.getPackageByIdentifier(this.PRODUCT_IDS.BULLETS);
  }

  /**
   * Check if user has monthly subscription (500 bullets/month)
   */
  hasMonthlySubscription(): boolean {
    return this.hasPurchasedProduct(this.PRODUCT_IDS.MONTHLY);
  }

  /**
   * Check if user has yearly subscription (unlimited bullets)
   */
  hasYearlySubscription(): boolean {
    return this.hasPurchasedProduct(this.PRODUCT_IDS.YEARLY);
  }

  /**
   * Check if user has any active subscription
   */
  hasAnySubscription(): boolean {
    return this.hasMonthlySubscription() || this.hasYearlySubscription();
  }

  /**
   * Get subscription type display name
   */
  getSubscriptionType(): 'monthly' | 'yearly' | 'none' {
    if (this.hasYearlySubscription()) return 'yearly';
    if (this.hasMonthlySubscription()) return 'monthly';
    return 'none';
  }

  /**
   * Check if RevenueCat is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Wait for initialization (useful in guards)
   */
  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;

    // Wait for customer info to be available
    await firstValueFrom(
      this.customerInfo$.pipe(
        // Filter out null values until we get actual customer info
      )
    );
  }
}
