# RevenueCat Implementation Guide for Targo App

## ✅ Implementation Complete!

Your Targo app now has a fully integrated RevenueCat subscription system with:
- ✅ Modern RevenueCat SDK (v11.2.15)
- ✅ RevenueCat Paywall UI
- ✅ Customer Center for subscription management
- ✅ "Targo Pro" entitlement checking
- ✅ Product configuration (Monthly, Yearly, Lifetime)
- ✅ Full error handling and best practices

---

## 📦 What Was Installed

```bash
npm install @revenuecat/purchases-capacitor @revenuecat/purchases-capacitor-ui
```

**Packages:**
- `@revenuecat/purchases-capacitor@11.2.15` - Core RevenueCat SDK
- `@revenuecat/purchases-capacitor-ui@11.2.15` - Paywall & Customer Center UI

---

## 🔑 Configuration

### API Key
Your test API key is configured in `src/environments/environment.ts`:

```typescript
revenueCatApiKey: 'test_yYKQILmMdGKlYwWugLwyegRdQzd'
```

### Products Configured
The following product IDs are configured in the service:

| Product ID | Type | Description |
|------------|------|-------------|
| `monthly` | Subscription | Monthly Targo Pro subscription |
| `yearly` | Subscription | Yearly Targo Pro subscription |
| `lifetime` | One-time | Lifetime Targo Pro access |

### Entitlement
- **Entitlement ID**: `Targo Pro`
- This unlocks all premium features in your app

---

## 🏗️ Implementation Details

### 1. In-App Purchase Service

**Location**: `src/app/core/services/in-app-purchase.service.ts`

**Key Methods:**

#### Initialization
```typescript
// Initialize when app starts or user logs in
await purchaseService.initialize(userId);
```

#### Show Paywall (Recommended)
```typescript
// Present RevenueCat's beautiful paywall UI
const result = await purchaseService.presentPaywall();

if (!result.userCancelled) {
  // User completed purchase!
}
```

#### Show Customer Center
```typescript
// Let users manage their subscription
await purchaseService.presentCustomerCenter();
```

#### Check Entitlement
```typescript
// Check if user has Targo Pro
const hasPro = purchaseService.hasTargoProEntitlement();

// Or check any entitlement
const hasAccess = purchaseService.hasActiveEntitlement('Targo Pro');
```

#### Restore Purchases
```typescript
// Restore purchases (for reinstalls or device switches)
await purchaseService.restorePurchases();
```

#### Manual Purchase (Custom UI)
```typescript
// If you build custom UI instead of using paywall
const monthlyPackage = purchaseService.getMonthlyPackage();
if (monthlyPackage) {
  await purchaseService.purchasePackage(monthlyPackage);
}
```

#### User Management
```typescript
// When user logs in
await purchaseService.identifyUser(userId);

// When user logs out
await purchaseService.logoutUser();

// Set user attributes for analytics
await purchaseService.setEmail('user@example.com');
await purchaseService.setDisplayName('John Doe');
```

#### Subscription Info
```typescript
// Get subscription details
const expirationDate = purchaseService.getSubscriptionExpirationDate();
const willRenew = purchaseService.willSubscriptionRenew();
const productId = purchaseService.getActiveSubscriptionProductId();
```

---

### 2. Store Page

**Location**: `src/app/features/store/pages/store/store.page.ts`

**Features:**
- Shows premium status for subscribed users
- Displays subscription details (plan, expiration, renewal status)
- "View Plans & Pricing" button to show paywall
- "Manage Subscription" button to open Customer Center
- Restore purchases functionality
- Real-time subscription updates via observables

**Navigation:**
```typescript
// Navigate to store page
this.router.navigate(['/store']);
```

---

### 3. Reactive Subscription Updates

The service provides Observable streams for real-time updates:

```typescript
// Subscribe to customer info changes
purchaseService.customerInfo$.subscribe(info => {
  const hasPro = purchaseService.hasTargoProEntitlement();
  // Update UI based on subscription status
});

// Subscribe to offerings changes
purchaseService.offerings$.subscribe(offerings => {
  const currentOffering = offerings?.current;
  // Display available products
});
```

---

## 🎯 RevenueCat Dashboard Setup

### Step 1: Create Products

1. Go to RevenueCat Dashboard: https://app.revenuecat.com
2. Navigate to **Products**
3. Create the following products:

#### Product 1: Monthly
- Product ID: `monthly`
- Type: Subscription
- Store: Google Play Store
- Google Play Product ID: `com.adl.targo.monthly` (or your bundle ID + .monthly)

#### Product 2: Yearly
- Product ID: `yearly`
- Type: Subscription
- Store: Google Play Store
- Google Play Product ID: `com.adl.targo.yearly`

#### Product 3: Lifetime
- Product ID: `lifetime`
- Type: Non-Subscription
- Store: Google Play Store
- Google Play Product ID: `com.adl.targo.lifetime`

### Step 2: Create Entitlement

1. Navigate to **Entitlements**
2. Click **New Entitlement**
3. Name: `Targo Pro`
4. Attach products: `monthly`, `yearly`, `lifetime`

### Step 3: Create Offering

1. Navigate to **Offerings**
2. Click **New Offering**
3. Name: `default` (or any name)
4. Add packages:
   - Monthly Package → Product: `monthly`
   - Yearly Package → Product: `yearly`
   - Lifetime Package → Product: `lifetime`
5. Set as **Current Offering**

### Step 4: Configure Paywall (Optional)

1. Navigate to **Paywalls**
2. Create a new paywall or use a template
3. Customize the design, copy, and layout
4. Link to your offering

---

## 🧪 Testing

### Test Mode
You're currently using a **test API key**, which means:
- ✅ No real money will be charged
- ✅ Sandbox purchases only
- ✅ Can test unlimited times
- ✅ Purchases can be easily reset

### Testing Steps

1. **Install app on test device**
   ```bash
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```

2. **Navigate to Store page**
   - From Profile or anywhere in app: `/store`

3. **Tap "View Plans & Pricing"**
   - RevenueCat Paywall will appear
   - Shows your configured products

4. **Make a test purchase**
   - Select a plan
   - Google Play will show test purchase dialog
   - Complete purchase (sandbox, no real money)

5. **Verify entitlement**
   - App should recognize Targo Pro status
   - UI should update to show premium status

6. **Test Customer Center**
   - Tap "Manage Subscription"
   - View purchase history
   - Test cancel/reactivate flows

7. **Test Restore Purchases**
   - Uninstall and reinstall app
   - Tap "Restore Purchases"
   - Subscription should be restored

### Add Test Users

In Google Play Console:
1. Go to **Setup → License Testing**
2. Add test Gmail accounts
3. Set response to **RESPOND_NORMALLY**

---

## 🔒 Gating Premium Features

### Example: Gate a feature behind Targo Pro

```typescript
import { InAppPurchaseService } from '@core/services/in-app-purchase.service';

export class SomeFeaturePage {
  private purchaseService = inject(InAppPurchaseService);

  async accessPremiumFeature() {
    // Check if user has Targo Pro
    if (!this.purchaseService.hasTargoProEntitlement()) {
      // Show paywall or error
      await this.purchaseService.presentPaywall();
      return;
    }

    // User has access, proceed with feature
    this.showPremiumContent();
  }
}
```

### Example: Show premium badge in UI

```html
<div class="feature-card">
  <h3>Advanced Statistics</h3>

  <!-- Show premium badge if user doesn't have Targo Pro -->
  <span class="premium-badge" *ngIf="!hasTargo Pro">
    PRO
  </span>

  <button (click)="openFeature()">
    {{ hasTargoPro ? 'Open' : 'Upgrade to Pro' }}
  </button>
</div>
```

```typescript
export class Component {
  hasTargoPro = false;

  ngOnInit() {
    this.purchaseService.customerInfo$.subscribe(() => {
      this.hasTargoPro = this.purchaseService.hasTargoProEntitlement();
    });
  }

  async openFeature() {
    if (!this.hasTargoPro) {
      await this.purchaseService.presentPaywall();
    } else {
      // Open feature
    }
  }
}
```

---

## 🚀 Production Deployment

### Before Releasing

1. **Switch to Production API Key**
   - Get production key from RevenueCat dashboard
   - Update `environment.prod.ts`:
   ```typescript
   revenueCatApiKey: 'goog_YOUR_PRODUCTION_KEY_HERE'
   ```

2. **Create Products in Google Play Console**
   - Create real products (not test products)
   - Use same product IDs: `com.adl.targo.monthly`, etc.
   - Set real pricing

3. **Link Google Play to RevenueCat**
   - Service account JSON
   - Configure in RevenueCat dashboard

4. **Test in Production Mode**
   - Use Internal Testing track
   - Test with real accounts (not test accounts)
   - Small real purchases to verify

5. **Remove Test UI Elements**
   - Remove "Test Mode" notices from store page

---

## 📊 Analytics & Webhooks

### User Attributes
Set attributes for better analytics:

```typescript
await purchaseService.setUserAttributes({
  'skill_level': 'advanced',
  'favorite_drill': 'precision_shot',
  'training_days_per_week': '5'
});
```

### RevenueCat Integrations
Connect RevenueCat to:
- Firebase Analytics
- Amplitude
- Mixpanel
- Slack (for purchase notifications)
- Webhooks (for your backend)

---

## 🐛 Troubleshooting

### "No offerings available"
- Check that you created an offering in RevenueCat dashboard
- Verify offering is set as "Current Offering"
- Ensure products are properly configured

### "Entitlement not unlocking"
- Verify entitlement ID is exactly `Targo Pro` (case-sensitive)
- Check that products are attached to the entitlement
- Try refreshing customer info: `await purchaseService.refreshCustomerInfo()`

### "Purchase fails immediately"
- Ensure products exist in Google Play Console
- Product IDs must match between Google Play and RevenueCat
- Check that app is signed with correct keystore

### "Paywall shows no products"
- Products must be configured in RevenueCat dashboard
- Offering must have packages with products attached
- Check console logs for API errors

### "Customer Center doesn't open"
- Ensure you have active entitlements
- Customer Center requires at least one purchase
- Check that RevenueCat UI plugin is properly synced

---

## 📚 Additional Resources

- **RevenueCat Docs**: https://docs.revenuecat.com/
- **Capacitor SDK Docs**: https://docs.revenuecat.com/docs/capacitor
- **Paywall Documentation**: https://docs.revenuecat.com/docs/paywalls
- **Customer Center Docs**: https://docs.revenuecat.com/docs/customer-center
- **Testing Guide**: https://docs.revenuecat.com/docs/sandbox
- **Google Play Setup**: https://docs.revenuecat.com/docs/google-play-store

---

## 🎉 Quick Start Commands

```bash
# Sync Capacitor plugins
npx cap sync android

# Build Android app
cd android && ./gradlew assembleDebug

# Run on device
npx cap run android

# Open store page in browser (for testing)
# Navigate to: http://localhost:8100/store
```

---

## ✨ Features Summary

### Implemented Features
- ✅ RevenueCat SDK initialization with user ID
- ✅ Paywall UI (configured in RevenueCat dashboard)
- ✅ Customer Center for subscription management
- ✅ "Targo Pro" entitlement checking
- ✅ Real-time subscription status updates
- ✅ Restore purchases functionality
- ✅ User attribute tracking (email, display name)
- ✅ Subscription info display (expiration, renewal status)
- ✅ Error handling and user cancellation
- ✅ Observable streams for reactive UI
- ✅ Helper methods for common operations
- ✅ Production-ready architecture

### Ready to Add
- Premium feature gating examples (shown above)
- Custom paywall UI (if needed instead of RevenueCat UI)
- Promotional offers
- Introductory pricing
- Free trials

---

## 💡 Best Practices

1. **Always use Paywall UI** - RevenueCat's paywall is optimized for conversions
2. **Check entitlements, not products** - Use `hasTargoProEntitlement()` not product IDs
3. **Handle errors gracefully** - Show user-friendly messages
4. **Test restore purchases** - Important for user experience
5. **Use Customer Center** - Let users manage subscriptions themselves
6. **Set user attributes** - Better analytics and targeting
7. **Monitor RevenueCat dashboard** - Track revenue, churn, conversions

---

## 🎯 Next Steps

1. ✅ Configure products in RevenueCat dashboard (Monthly, Yearly, Lifetime)
2. ✅ Create "Targo Pro" entitlement
3. ✅ Create offering and set as current
4. ✅ (Optional) Customize paywall design
5. ✅ Test purchase flow on device
6. ✅ Add premium feature gating throughout app
7. ✅ Test Customer Center flows
8. ✅ Set up analytics integrations
9. ✅ Prepare for production deployment

---

Happy monetizing! 🚀
